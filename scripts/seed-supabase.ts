/**
 * Idempotent seed script — creates demo users and workspace data in Supabase.
 * Run with: npx tsx scripts/seed-supabase.ts
 *
 * Safe to re-run: uses upsert / skip-if-exists for all operations.
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const sb = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DEMO_PASSWORD = 'Demo2026!';

// Demo users to seed
const DEMO_USERS = [
  { name: 'Alex Mercer (Platform Ops)',   email: 'operations@showtimepoolmechanics.com', role: 'SUPER_ADMIN',      workspace: 'ws_showtime' },
  { name: 'Marcus Sterling (Owner)',       email: 'owner@showtime.com',                   role: 'WORKSPACE_OWNER', workspace: 'ws_showtime' },
  { name: 'Sarah Chen (Admin)',            email: 'admin@showtime.com',                   role: 'ADMIN',           workspace: 'ws_showtime' },
  { name: 'Bobby Sales (Sales Rep)',       email: 'sales@showtime.com',                   role: 'SALES_REP',       workspace: 'ws_showtime' },
  { name: 'Tyler Member (Team Member)',    email: 'member@showtime.com',                  role: 'TEAM_MEMBER',     workspace: 'ws_showtime' },
  { name: 'Rachel Read (Read-Only)',       email: 'readonly@showtime.com',                role: 'READ_ONLY',       workspace: 'ws_showtime' },
  { name: 'Vance Refrigeration (Owner)',   email: 'owner@vancepools.com',                 role: 'WORKSPACE_OWNER', workspace: 'ws_apex' },
  { name: 'Pam Beasley (Read-Only)',       email: 'pam@vancepools.com',                   role: 'READ_ONLY',       workspace: 'ws_apex' },
];

// Workspaces
const WORKSPACES = [
  { id: 'ws_showtime',  name: 'Showtime Pool Mechanics', slug: 'showtime-pools', ghl_location_id: 'E4ii6h4R7wnvKtaBaA1l', suspended: false },
  { id: 'ws_apex',      name: 'Apex Blue Pools',          slug: 'apex-blue',      ghl_location_id: 'loc_apex_demo',         suspended: false },
  { id: 'ws_pro_clean', name: 'Pro Clean Builders',       slug: 'pro-clean',      ghl_location_id: 'loc_pro_demo',          suspended: true  },
];

async function getOrCreateUser(name: string, email: string): Promise<string> {
  // Check if exists
  const { data: existing } = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const found = existing?.users?.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());
  if (found) {
    console.log(`  → User exists: ${email} (${found.id})`);
    return found.id;
  }

  const { data, error } = await sb.auth.admin.createUser({
    email,
    password: DEMO_PASSWORD,
    email_confirm: true,
    user_metadata: { name }
  });

  if (error) throw new Error(`Failed to create user ${email}: ${error.message}`);
  console.log(`  ✓ Created user: ${email} (${data.user.id})`);
  return data.user.id;
}

async function main() {
  console.log('\n🌱 Seeding Supabase for Reporting Command Center...\n');

  // 1. Upsert workspaces
  console.log('📦 Upserting workspaces...');
  const { error: wsErr } = await sb.from('workspaces').upsert(
    WORKSPACES.map(w => ({ id: w.id, name: w.name, slug: w.slug, ghl_location_id: w.ghl_location_id, suspended: w.suspended, created_at: '2026-02-15T09:30:00Z' })),
    { onConflict: 'id' }
  );
  if (wsErr) throw new Error(`Workspace upsert failed: ${wsErr.message}`);
  console.log(`  ✓ ${WORKSPACES.length} workspaces upserted\n`);

  // 2. Create/get demo auth users + profiles
  console.log('👤 Creating demo users...');
  const userIdMap: Record<string, string> = {};
  for (const u of DEMO_USERS) {
    const id = await getOrCreateUser(u.name, u.email);
    userIdMap[u.email] = id;
    // Upsert profile
    await sb.from('profiles').upsert({ id, name: u.name, onboarded: true }, { onConflict: 'id' });
    // Set active_workspace_id in user metadata
    await sb.auth.admin.updateUserById(id, {
      user_metadata: { name: u.name, active_workspace_id: u.workspace }
    });
  }
  console.log('');

  // 3. Upsert workspace members
  console.log('🔗 Upserting workspace members...');
  const memberRows = DEMO_USERS.map((u, i) => ({
    id: `mem_seed_${i + 1}`,
    workspace_id: u.workspace,
    user_id: userIdMap[u.email],
    role: u.role,
    joined_at: '2026-02-15T09:35:00Z'
  }));
  const { error: memErr } = await sb.from('workspace_members').upsert(memberRows, { onConflict: 'id' });
  if (memErr) throw new Error(`Member upsert failed: ${memErr.message}`);
  console.log(`  ✓ ${memberRows.length} members upserted\n`);

  // 4. Upsert GHL connections
  console.log('🔌 Upserting GHL connections...');
  const ghlConns = [
    { id: 'gn_seed_1', workspace_id: 'ws_showtime', location_id: 'E4ii6h4R7wnvKtaBaA1l', api_key: process.env.GHL_PRIVATE_INTEGRATION_TOKEN || '', connected_at: '2026-02-16T10:00:00Z', status: 'CONNECTED' },
    { id: 'gn_seed_2', workspace_id: 'ws_apex',     location_id: 'loc_apex_demo',         api_key: '',                                                                                  connected_at: '2026-05-02T11:00:00Z', status: 'STALE' },
  ];
  const { error: connErr } = await sb.from('ghl_connections').upsert(ghlConns, { onConflict: 'id' });
  if (connErr) throw new Error(`GHL connection upsert failed: ${connErr.message}`);
  console.log(`  ✓ ${ghlConns.length} GHL connections upserted\n`);

  // 5. Upsert reporting settings
  console.log('⚙️  Upserting reporting settings...');
  const reportingSettings = [
    { workspace_id: 'ws_showtime', default_timeframe: 'last_30_days', allowed_dashboards: ['overview','opportunity','sales','owner','marketing'], mode: 'LIVE', allow_admin_manage_ghl: true, cache_ttl_minutes: 15 },
    { workspace_id: 'ws_apex',     default_timeframe: 'this_week',    allowed_dashboards: ['overview','opportunity','sales'],                       mode: 'MOCK', allow_admin_manage_ghl: true, cache_ttl_minutes: 15 },
  ];
  const { error: rsErr } = await sb.from('reporting_settings').upsert(reportingSettings, { onConflict: 'workspace_id' });
  if (rsErr) throw new Error(`Reporting settings upsert failed: ${rsErr.message}`);
  console.log(`  ✓ ${reportingSettings.length} reporting settings upserted\n`);

  // 6. Upsert subscriptions
  console.log('💳 Upserting subscriptions...');
  const subs = [
    { workspace_id: 'ws_showtime',  plan: 'UNLIMITED', status: 'ACTIVE',   amount: 297, next_billing_date: '2026-06-15T00:00:00Z' },
    { workspace_id: 'ws_apex',      plan: 'GROWTH',     status: 'ACTIVE',   amount: 147, next_billing_date: '2026-06-20T00:00:00Z' },
    { workspace_id: 'ws_pro_clean', plan: 'STARTER',    status: 'PAST_DUE', amount: 97,  next_billing_date: '2026-05-25T00:00:00Z' },
  ];
  const { error: subErr } = await sb.from('subscriptions').upsert(subs, { onConflict: 'workspace_id' });
  if (subErr) throw new Error(`Subscription upsert failed: ${subErr.message}`);
  console.log(`  ✓ ${subs.length} subscriptions upserted\n`);

  // 7. Seed audit log entry
  await sb.from('audit_logs').upsert({
    id: 'log_seed_001',
    workspace_id: 'ws_showtime',
    user_id: userIdMap['operations@showtimepoolmechanics.com'],
    user_email: 'operations@showtimepoolmechanics.com',
    action: 'INIT_SYSTEM',
    details: 'SaaS Platform seeded with Supabase-backed tenants.',
    ip_address: '127.0.0.1',
    timestamp: '2026-05-01T08:00:00Z'
  }, { onConflict: 'id' });
  console.log('📋 Audit log entry seeded\n');

  console.log('✅ Seed complete!\n');
  console.log('Demo login credentials:');
  console.log('─────────────────────────────────────────────────');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(16)} │ ${u.email.padEnd(42)} │ ${DEMO_PASSWORD}`);
  }
  console.log('─────────────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('\n❌ Seed failed:', err.message);
  process.exit(1);
});
