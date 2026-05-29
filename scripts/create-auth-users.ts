/**
 * Creates the 8 demo auth users in Supabase, then inserts profiles,
 * workspace_members, and GHL connections via direct REST (bypasses PostgREST cache).
 *
 * Run: npx tsx scripts/create-auth-users.ts
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Safety guard: prevent accidental prod wipes without explicit confirmation flag
if (!process.argv.includes('--confirm')) {
  console.error('\n⛔  Seed scripts require explicit confirmation.');
  console.error('    Run with --confirm flag:\n');
  console.error('    npx tsx scripts/create-auth-users.ts --confirm\n');
  process.exit(1);
}

const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const DEMO_PW      = 'Demo2026!';

const DEMO_USERS = [
  { name: 'Alex Mercer (Platform Ops)',  email: 'operations@showtimepoolmechanics.com', role: 'SUPER_ADMIN',      workspace: 'ws_showtime' },
  { name: 'Marcus Sterling (Owner)',      email: 'owner@showtime.com',                   role: 'WORKSPACE_OWNER', workspace: 'ws_showtime' },
  { name: 'Sarah Chen (Admin)',           email: 'admin@showtime.com',                   role: 'ADMIN',           workspace: 'ws_showtime' },
  { name: 'Bobby Sales (Sales Rep)',      email: 'sales@showtime.com',                   role: 'SALES_REP',       workspace: 'ws_showtime' },
  { name: 'Tyler Member (Team Member)',   email: 'member@showtime.com',                  role: 'TEAM_MEMBER',     workspace: 'ws_showtime' },
  { name: 'Rachel Read (Read-Only)',      email: 'readonly@showtime.com',                role: 'READ_ONLY',       workspace: 'ws_showtime' },
  { name: 'Vance Refrigeration (Owner)', email: 'owner@vancepools.com',                 role: 'WORKSPACE_OWNER', workspace: 'ws_apex' },
  { name: 'Pam Beasley (Read-Only)',      email: 'pam@vancepools.com',                   role: 'READ_ONLY',       workspace: 'ws_apex' },
];

async function authPost(path: string, body: any) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`
    },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function authGet(path: string) {
  const res = await fetch(`${SUPABASE_URL}/auth/v1${path}`, {
    headers: { 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` }
  });
  return res.json();
}

async function restUpsert(table: string, rows: any[], onConflict: string) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SERVICE_KEY,
      'Authorization': `Bearer ${SERVICE_KEY}`,
      'Prefer': `resolution=merge-duplicates,return=minimal`
    },
    body: JSON.stringify(rows)
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`REST upsert to ${table} failed (${res.status}): ${text}`);
  }
}

async function main() {
  console.log('\n🌱 Creating demo auth users...\n');

  // Fetch existing users
  const existing: any = await authGet('/admin/users?page=1&per_page=1000');
  const existingMap = new Map<string, string>();
  for (const u of existing?.users || []) {
    existingMap.set(u.email.toLowerCase(), u.id);
  }

  const userIdMap: Record<string, string> = {};

  for (const u of DEMO_USERS) {
    if (existingMap.has(u.email.toLowerCase())) {
      const id = existingMap.get(u.email.toLowerCase())!;
      userIdMap[u.email] = id;
      console.log(`  → Exists: ${u.email} (${id})`);
      // Update metadata in case it changed
      await fetch(`${SUPABASE_URL}/auth/v1/admin/users/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'apikey': SERVICE_KEY, 'Authorization': `Bearer ${SERVICE_KEY}` },
        body: JSON.stringify({ user_metadata: { name: u.name, active_workspace_id: u.workspace } })
      });
    } else {
      const result: any = await authPost('/admin/users', {
        email: u.email,
        password: DEMO_PW,
        email_confirm: true,
        user_metadata: { name: u.name, active_workspace_id: u.workspace }
      });
      if (result.error || !result.id) {
        throw new Error(`Failed to create ${u.email}: ${JSON.stringify(result)}`);
      }
      userIdMap[u.email] = result.id;
      console.log(`  ✓ Created: ${u.email} (${result.id})`);
    }
  }

  console.log('\n📦 Inserting workspaces...');
  await restUpsert('workspaces', [
    { id: 'ws_showtime',  name: 'Showtime Pool Mechanics', slug: 'showtime-pools', ghl_location_id: 'E4ii6h4R7wnvKtaBaA1l', created_at: '2026-02-15T09:30:00Z', suspended: false },
    { id: 'ws_apex',      name: 'Apex Blue Pools',          slug: 'apex-blue',      ghl_location_id: 'loc_apex_demo',         created_at: '2026-05-01T12:00:00Z', suspended: false },
    { id: 'ws_pro_clean', name: 'Pro Clean Builders',       slug: 'pro-clean',      ghl_location_id: 'loc_pro_demo',          created_at: '2026-05-05T09:00:00Z', suspended: true  },
  ], 'id');
  console.log('  ✓ Workspaces upserted');

  console.log('\n⚙️  Inserting reporting settings...');
  await restUpsert('reporting_settings', [
    { workspace_id: 'ws_showtime', default_timeframe: 'last_30_days', allowed_dashboards: ['overview','opportunity','sales','owner','marketing'], mode: 'LIVE', allow_admin_manage_ghl: true, cache_ttl_minutes: 15 },
    { workspace_id: 'ws_apex',     default_timeframe: 'this_week',    allowed_dashboards: ['overview','opportunity','sales'],                      mode: 'MOCK', allow_admin_manage_ghl: true, cache_ttl_minutes: 15 },
  ], 'workspace_id');
  console.log('  ✓ Reporting settings upserted');

  console.log('\n💳 Inserting subscriptions...');
  await restUpsert('subscriptions', [
    { workspace_id: 'ws_showtime',  plan: 'UNLIMITED', status: 'ACTIVE',   amount: 297, next_billing_date: '2026-06-15T00:00:00Z' },
    { workspace_id: 'ws_apex',      plan: 'GROWTH',    status: 'ACTIVE',   amount: 147, next_billing_date: '2026-06-20T00:00:00Z' },
    { workspace_id: 'ws_pro_clean', plan: 'STARTER',   status: 'PAST_DUE', amount: 97,  next_billing_date: '2026-05-25T00:00:00Z' },
  ], 'workspace_id');
  console.log('  ✓ Subscriptions upserted');

  console.log('\n📋 Inserting profiles...');
  await restUpsert('profiles', DEMO_USERS.map(u => ({
    id: userIdMap[u.email],
    name: u.name,
    onboarded: true,
    created_at: new Date().toISOString()
  })), 'id');
  console.log('  ✓ Profiles upserted');

  console.log('\n🔗 Inserting workspace members...');
  await restUpsert('workspace_members', DEMO_USERS.map((u, i) => ({
    id: `mem_seed_${i + 1}`,
    workspace_id: u.workspace,
    user_id: userIdMap[u.email],
    role: u.role,
    joined_at: '2026-02-15T09:35:00Z'
  })), 'id');
  console.log('  ✓ Members upserted');

  console.log('\n🔌 Inserting GHL connections...');
  await restUpsert('ghl_connections', [
    { id: 'gn_seed_1', workspace_id: 'ws_showtime', location_id: 'E4ii6h4R7wnvKtaBaA1l', api_key: process.env.GHL_PRIVATE_INTEGRATION_TOKEN || '', connected_at: '2026-02-16T10:00:00Z', status: 'CONNECTED' },
    { id: 'gn_seed_2', workspace_id: 'ws_apex',     location_id: 'loc_apex_demo',         api_key: '',                                                                                  connected_at: '2026-05-02T11:00:00Z', status: 'STALE' }
  ], 'id');
  console.log('  ✓ GHL connections upserted');

  console.log('\n✅ Done! Demo credentials:\n');
  console.log('─────────────────────────────────────────────────────────────────');
  for (const u of DEMO_USERS) {
    console.log(`  ${u.role.padEnd(16)} │ ${u.email.padEnd(44)} │ ${DEMO_PW}`);
  }
  console.log('─────────────────────────────────────────────────────────────────\n');
}

main().catch(err => {
  console.error('\n❌ Failed:', err.message);
  process.exit(1);
});
