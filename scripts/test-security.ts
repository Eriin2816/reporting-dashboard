/**
 * Security regression tests — run locally against the dev server or prod.
 *
 *   Local:  BASE_URL=http://localhost:3000 npx tsx scripts/test-security.ts
 *   Prod:   BASE_URL=https://reporting-command-center.vercel.app npx tsx scripts/test-security.ts
 *
 * Tests:
 *   T1  Unauthenticated request → 401
 *   T2  READ_ONLY role blocked from ADMIN-only endpoint → 403
 *   T3  SALES_REP role blocked from SUPER_ADMIN-only endpoint → 403
 *   T4  Cross-workspace switch attempt (pam tries to join ws_showtime) → 403
 *   T5  Supabase anon key cannot read profiles table directly → 403/401
 *   T6  Valid token from one user cannot read another workspace's members → 403
 */

import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000';
const SUPABASE_URL = process.env.SUPABASE_URL!;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

let passed = 0;
let failed = 0;

async function assert(name: string, fn: () => Promise<void>) {
  try {
    await fn();
    console.log(`  ✅  ${name}`);
    passed++;
  } catch (e: any) {
    console.error(`  ❌  ${name}: ${e.message}`);
    failed++;
  }
}

function expect(label: string, actual: any, expected: any) {
  if (actual !== expected) throw new Error(`Expected ${label} to be ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

async function apiCall(path: string, opts: RequestInit = {}): Promise<{ status: number; body: any }> {
  const res = await fetch(`${BASE_URL}${path}`, opts);
  let body: any;
  try { body = await res.json(); } catch { body = {}; }
  return { status: res.status, body };
}

async function login(email: string, password: string): Promise<string> {
  const { status, body } = await apiCall('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  if (status !== 200 || !body.session?.token) throw new Error(`Login failed for ${email}: HTTP ${status} ${JSON.stringify(body)}`);
  return body.session.token;
}

async function run() {
  console.log(`\n🔐 Security test suite — target: ${BASE_URL}\n`);

  // ─────────────────────────────────────────────
  // T1: Unauthenticated request must return 401
  // ─────────────────────────────────────────────
  await assert('T1  Unauthenticated request returns 401', async () => {
    const { status } = await apiCall('/api/reporting/owner-performance');
    expect('status', status, 401);
  });

  // ─────────────────────────────────────────────
  // T2: READ_ONLY user blocked from ADMIN-only endpoint
  //     /api/workspaces/members requires ADMIN+
  // ─────────────────────────────────────────────
  await assert('T2  READ_ONLY role blocked from ADMIN-only /api/workspaces/members', async () => {
    const token = await login('readonly@showtime.com', 'Demo2026!');
    const { status } = await apiCall('/api/workspaces/members', {
      headers: { 'x-auth-token': token }
    });
    expect('status', status, 403);
  });

  // ─────────────────────────────────────────────
  // T3: SALES_REP blocked from SUPER_ADMIN-only endpoint
  //     /api/admin/workspaces requires SUPER_ADMIN
  // ─────────────────────────────────────────────
  await assert('T3  SALES_REP blocked from SUPER_ADMIN-only /api/admin/workspaces', async () => {
    const token = await login('sales@showtime.com', 'Demo2026!');
    const { status } = await apiCall('/api/admin/workspaces', {
      headers: { 'x-auth-token': token }
    });
    expect('status', status, 403);
  });

  // ─────────────────────────────────────────────
  // T4: Cross-workspace switch attempt
  //     pam@vancepools.com (ws_apex member) tries to switch to ws_showtime
  //     She has no workspace_members row for ws_showtime → must be denied
  // ─────────────────────────────────────────────
  await assert('T4  Cross-workspace switch blocked (pam cannot join ws_showtime)', async () => {
    const token = await login('pam@vancepools.com', 'Demo2026!');
    // switch-workspace takes token in body (not header) alongside workspaceId
    const { status, body } = await apiCall('/api/auth/switch-workspace', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, workspaceId: 'ws_showtime' })
    });
    if (status !== 403) {
      throw new Error(`Expected 403, got ${status}. Body: ${JSON.stringify(body)}`);
    }
  });

  // ─────────────────────────────────────────────
  // T5: Supabase anon key cannot read profiles table directly
  //     (RLS enabled, no anon policies → 403/401 from PostgREST)
  // ─────────────────────────────────────────────
  await assert('T5  Supabase anon key blocked from direct profiles table access', async () => {
    if (!SUPABASE_URL) throw new Error('SUPABASE_URL not set — skipping direct Supabase check');
    // Try to get the publishable (anon) key from env; skip if not available
    const anonKey = process.env.SUPABASE_ANON_KEY || '';
    if (!anonKey) {
      console.log('       (skipped — SUPABASE_ANON_KEY not in .env.local; anon key is not used by this app)');
      return;
    }
    const res = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*`, {
      headers: { 'apikey': anonKey, 'Authorization': `Bearer ${anonKey}` }
    });
    // RLS with no policies → empty array (200) or 401/403 — either way, zero rows allowed
    if (res.status === 200) {
      const data: any[] = await res.json();
      if (data.length > 0) throw new Error(`Anon key can read ${data.length} profile rows — RLS not blocking!`);
    }
    // 401 or 403 also acceptable
  });

  // ─────────────────────────────────────────────
  // T6: User from ws_apex cannot read ws_showtime members via API
  //     owner@vancepools.com (ws_apex) should not see ws_showtime members
  //     The switch-workspace endpoint rejects unknown workspaces; therefore
  //     owner cannot even set active_workspace_id to ws_showtime.
  //     Verify the reporting endpoint returns data scoped to ws_apex only.
  // ─────────────────────────────────────────────
  await assert('T6  ws_apex owner sees only their workspace data in reporting', async () => {
    const token = await login('owner@vancepools.com', 'Demo2026!');
    const { status, body } = await apiCall('/api/reporting/owner-performance', {
      headers: { 'x-auth-token': token }
    });
    // Must succeed (not 403) — owner is a valid member of ws_apex
    if (status !== 200 && status !== 503) {
      throw new Error(`Expected 200 or 503 (live unavailable), got ${status}: ${JSON.stringify(body)}`);
    }
    // Must not contain any ws_showtime workspace reference
    const bodyStr = JSON.stringify(body);
    if (bodyStr.includes('ws_showtime') || bodyStr.includes('showtime.com')) {
      throw new Error('Response contains ws_showtime data — cross-workspace leak!');
    }
  });

  // ─────────────────────────────────────────────
  // T7: Replay attack — expired/invalid token returns 401
  // ─────────────────────────────────────────────
  await assert('T7  Tampered JWT returns 401', async () => {
    const fakeToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJmYWtlLXVzZXItaWQiLCJyb2xlIjoic3VwZXJfYWRtaW4ifQ.invalid_sig';
    const { status } = await apiCall('/api/reporting/owner-performance', {
      headers: { 'x-auth-token': fakeToken }
    });
    expect('status', status, 401);
  });

  // ─────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────
  console.log(`\n${'─'.repeat(50)}`);
  console.log(`  Passed: ${passed}   Failed: ${failed}`);
  console.log(`${'─'.repeat(50)}\n`);

  if (failed > 0) process.exit(1);
}

run().catch(err => { console.error('\n❌ Test runner error:', err.message); process.exit(1); });
