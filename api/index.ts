/**
 * Vercel serverless entry point — Express API routes backed by Supabase.
 * Sessions are stateless Supabase JWTs verified per-request (cold-start safe).
 */

import express from 'express';
import { UserRole, WorkspaceMember, SaaSUser, Workspace, GHLConnection, ReportingSettings } from '../src/types.js';
import {
  getOwnerPerformanceReport,
  getVAPerformanceReport,
  getMarketingPerformanceReport
} from '../src/mockReportingData.js';
import { LiveReportingService, invalidateWorkspaceCacheStore } from '../src/ghlService.js';
import { supabaseAdmin } from '../src/supabase.js';

import dotenv from 'dotenv';
dotenv.config();

// ==========================================
// TYPE ADAPTERS — Supabase rows → app types
// ==========================================

function toSaaSUser(authUser: any, profile: any): SaaSUser {
  return {
    id: authUser.id,
    name: profile?.name || (authUser.email?.split('@')[0] ?? 'Unknown'),
    email: authUser.email || '',
    onboarded: profile?.onboarded ?? false,
    createdAt: authUser.created_at || new Date().toISOString()
  };
}

function toWorkspace(row: any): Workspace {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ghlLocationId: row.ghl_location_id,
    createdAt: row.created_at,
    suspended: row.suspended
  };
}

function toMember(row: any): WorkspaceMember {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role as UserRole,
    joinedAt: row.joined_at
  };
}

function toGHLConnection(row: any): GHLConnection {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    locationId: row.location_id,
    apiKey: row.api_key,
    connectedAt: row.connected_at,
    status: row.status as 'CONNECTED' | 'DISCONNECTED' | 'STALE'
  };
}

function toReportingSettings(row: any): ReportingSettings {
  return {
    workspaceId: row.workspace_id,
    defaultTimeframe: row.default_timeframe,
    allowedDashboards: row.allowed_dashboards,
    lastSyncAt: row.last_sync_at,
    mode: row.mode as 'MOCK' | 'LIVE',
    allowAdminManageGHL: row.allow_admin_manage_ghl,
    cacheTtlMinutes: row.cache_ttl_minutes
  };
}

// ==========================================
// SUPABASE DB HELPERS
// ==========================================

async function getProfile(userId: string) {
  const { data } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();
  return data;
}

async function getWorkspaceById(id: string): Promise<Workspace | null> {
  const { data } = await supabaseAdmin.from('workspaces').select('*').eq('id', id).single();
  return data ? toWorkspace(data) : null;
}

async function getWorkspacesForUser(userId: string): Promise<Workspace[]> {
  const { data } = await supabaseAdmin
    .from('workspace_members')
    .select('role, workspaces(*)')
    .eq('user_id', userId);
  if (!data) return [];
  const isSuperAdmin = data.some((m: any) => m.role === 'SUPER_ADMIN');
  if (isSuperAdmin) {
    const { data: all } = await supabaseAdmin.from('workspaces').select('*');
    return (all || []).map(toWorkspace);
  }
  return data.map((m: any) => toWorkspace(m.workspaces)).filter(Boolean);
}

async function getWorkspaceMember(workspaceId: string, userId: string): Promise<WorkspaceMember | null> {
  const { data } = await supabaseAdmin
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)
    .single();
  return data ? toMember(data) : null;
}

async function getMembersByWorkspace(workspaceId: string): Promise<WorkspaceMember[]> {
  const { data } = await supabaseAdmin
    .from('workspace_members')
    .select('*')
    .eq('workspace_id', workspaceId);
  return (data || []).map(toMember);
}

async function getGHLConnection(workspaceId: string): Promise<GHLConnection | null> {
  const { data } = await supabaseAdmin
    .from('ghl_connections')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();
  return data ? toGHLConnection(data) : null;
}

async function getOrCreateReportingSettings(workspaceId: string): Promise<ReportingSettings> {
  const { data } = await supabaseAdmin
    .from('reporting_settings')
    .select('*')
    .eq('workspace_id', workspaceId)
    .single();
  if (data) return toReportingSettings(data);
  // Default to LIVE when REPORTING_DATA_SOURCE=live; MOCK is an explicit per-workspace opt-in
  const defaultMode = process.env.REPORTING_DATA_SOURCE === 'live' ? 'LIVE' : 'MOCK';
  const defaults = {
    workspace_id: workspaceId,
    default_timeframe: 'last_30_days',
    allowed_dashboards: ['overview', 'opportunity', 'sales'],
    last_sync_at: null,
    mode: defaultMode,
    allow_admin_manage_ghl: true,
    cache_ttl_minutes: 15
  };
  await supabaseAdmin.from('reporting_settings').insert(defaults);
  return toReportingSettings(defaults);
}

async function logAction(
  workspaceId: string | null,
  userId: string,
  userEmail: string,
  action: string,
  details: string
) {
  await supabaseAdmin.from('audit_logs').insert({
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    workspace_id: workspaceId,
    user_id: userId,
    user_email: userEmail,
    action,
    details,
    ip_address: '127.0.0.1',
    timestamp: new Date().toISOString()
  });
}

// Sync Supabase GHL data into the in-memory mock db so LiveReportingService sees current settings
async function syncGhlToMockDb(workspaceId: string) {
  const { db } = await import('../src/mockSaaSStore.js');
  const settings = await getOrCreateReportingSettings(workspaceId);
  const mockSettings = db.getReportingSettings(workspaceId);
  mockSettings.mode = settings.mode;
  mockSettings.allowAdminManageGHL = settings.allowAdminManageGHL;
  mockSettings.cacheTtlMinutes = settings.cacheTtlMinutes ?? 15;

  const conn = await getGHLConnection(workspaceId);
  if (conn) {
    const existing = db.getGHLConnection(workspaceId);
    if (!existing) {
      db.connections.push({
        id: conn.id,
        workspaceId: conn.workspaceId,
        locationId: conn.locationId,
        apiKey: conn.apiKey,
        connectedAt: conn.connectedAt,
        status: conn.status
      });
    } else {
      existing.apiKey = conn.apiKey;
      existing.locationId = conn.locationId;
      existing.status = conn.status;
    }
  }
}

// ==========================================
// GHL HELPERS
// ==========================================

const webhookLogs: { timestamp: string; source: string; event: string; payload: any }[] = [
  { timestamp: new Date(Date.now() - 3600000).toISOString(), source: 'GoHighLevel Webhook', event: 'contact.create', payload: { id: 'con_web_1', contactName: 'Sally Jenkins' } },
  { timestamp: new Date(Date.now() - 17200000).toISOString(), source: 'GoHighLevel Webhook', event: 'opportunity.update', payload: { id: 'opp_web_1', status: 'won', value: 12500 } }
];

const tenantMetricsCache = new Map<string, { data: any; timestamp: number }>();
const tenantOwnerPerfCache = new Map<string, { data: any; timestamp: number }>();
const tenantMarketingCache = new Map<string, { data: any; timestamp: number }>();

function invalidateTenantCache(workspaceId: string) {
  tenantMetricsCache.delete(workspaceId);
  tenantOwnerPerfCache.delete(workspaceId);
  tenantMarketingCache.delete(workspaceId);
  invalidateWorkspaceCacheStore(workspaceId);
}

async function getWorkspaceGhlConfig(workspaceId: string) {
  const connection = await getGHLConnection(workspaceId);
  const settings = await getOrCreateReportingSettings(workspaceId);

  let dataSourceMode: 'MOCK' | 'LIVE' = 'MOCK';
  if (settings.mode) {
    dataSourceMode = settings.mode;
  } else if (process.env.GHL_DATA_SOURCE === 'LIVE' || process.env.REPORTING_DATA_SOURCE === 'live') {
    dataSourceMode = 'LIVE';
  }

  let apiKey = '';
  if (connection?.apiKey) {
    apiKey = connection.apiKey;
  } else {
    apiKey = process.env.GHL_PRIVATE_INTEGRATION_TOKEN || process.env.GHL_API_KEY || '';
  }

  let locationId = '';
  if (connection?.locationId) {
    locationId = connection.locationId;
  } else {
    const ws = await getWorkspaceById(workspaceId);
    locationId = process.env.GHL_LOCATION_ID || ws?.ghlLocationId || '';
  }

  const companyId = process.env.GHL_COMPANY_ID || 'co_ghl_company_9a2b';
  const maskToken = (t: string) => (!t ? '' : t.length <= 8 ? 'ghl_••••••••' : `${t.slice(0, 4)}••••••••${t.slice(-5)}`);

  return {
    dataSourceMode,
    apiKey,
    apiKeyMasked: maskToken(apiKey),
    locationId,
    companyId,
    allowAdminManageGHL: settings.allowAdminManageGHL !== false,
    cacheTtlMinutes: settings.cacheTtlMinutes || 15,
    status: connection?.status || (apiKey && locationId ? 'CONNECTED' : 'DISCONNECTED'),
    connectedAt: connection?.connectedAt || (apiKey && locationId ? new Date().toISOString() : null)
  };
}

function canUserManageGhl(role: UserRole, allowAdminManageGHL: boolean): boolean {
  if (role === UserRole.SUPER_ADMIN || role === UserRole.WORKSPACE_OWNER) return true;
  if (role === UserRole.ADMIN) return allowAdminManageGHL;
  return false;
}

const isValidDateString = (d: string) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));

// Demo playground token → Supabase credentials mapping
const DEMO_CREDENTIALS: Record<string, { email: string; password: string }> = {
  'token_super_admin': { email: 'operations@showtimepoolmechanics.com', password: 'Demo2026!' },
  'token_marcus':      { email: 'owner@showtime.com',                   password: 'Demo2026!' },
  'token_sarah':       { email: 'admin@showtime.com',                   password: 'Demo2026!' },
  'token_bobby':       { email: 'sales@showtime.com',                   password: 'Demo2026!' },
  'token_rachel':      { email: 'readonly@showtime.com',                password: 'Demo2026!' },
  'token_bob':         { email: 'owner@vancepools.com',                 password: 'Demo2026!' }
};

// ==========================================
// AUTH MIDDLEWARE
// ==========================================

export const requireAuth = (allowedRoles?: UserRole[]) => {
  return async (req: any, res: any, next: any) => {
    const authHeader = req.headers['x-auth-token'] || req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ status: 'error', error: 'Authentication required. No session token provided.' });
    }
    const token = authHeader.toString().replace('Bearer ', '');

    // Verify JWT — stateless, cold-start safe
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ status: 'error', error: 'Invalid or expired session token. Please log in again.' });
    }

    const profile = await getProfile(authUser.id);
    const user = toSaaSUser(authUser, profile);

    // Active workspace from user metadata
    let activeWorkspaceId: string = authUser.user_metadata?.active_workspace_id || '';
    let workspace: Workspace | null = null;
    let member: WorkspaceMember | null = null;

    if (activeWorkspaceId) {
      workspace = await getWorkspaceById(activeWorkspaceId);
      if (workspace) member = await getWorkspaceMember(activeWorkspaceId, authUser.id);
    }

    // Fallback: use first membership
    if (!workspace) {
      const { data: memRows } = await supabaseAdmin
        .from('workspace_members')
        .select('*, workspaces(*)')
        .eq('user_id', authUser.id)
        .order('joined_at')
        .limit(1);

      if (memRows && memRows.length > 0) {
        workspace = toWorkspace(memRows[0].workspaces);
        member = toMember(memRows[0]);
        activeWorkspaceId = workspace.id;
        await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
          user_metadata: { ...authUser.user_metadata, active_workspace_id: workspace.id }
        });
      }
    }

    if (!workspace) {
      // Not yet onboarded — let route decide how to handle
      req.user = user;
      req.workspace = null;
      req.member = null;
      req.role = UserRole.READ_ONLY;
      req.token = token;
      req.supabaseUserId = authUser.id;
      return next();
    }

    const isSuperAdmin = member?.role === UserRole.SUPER_ADMIN;

    if (workspace.suspended && !isSuperAdmin) {
      return res.status(403).json({ status: 'error', error: `Access Denied: The workspace "${workspace.name}" has been suspended.`, suspended: true });
    }

    if (!member && !isSuperAdmin) {
      return res.status(403).json({ status: 'error', error: 'Access Denied: You are not an authenticated member of this workspace.' });
    }

    const role: UserRole = isSuperAdmin ? UserRole.SUPER_ADMIN : (member?.role as UserRole || UserRole.READ_ONLY);

    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return res.status(403).json({ status: 'error', error: `Access Denied: Role "${role}" does not have sufficient permissions.` });
    }

    req.user = user;
    req.workspace = workspace;
    req.member = member;
    req.role = role;
    req.token = token;
    req.supabaseUserId = authUser.id;
    next();
  };
};

// ==========================================
// EXPRESS APP
// ==========================================

const app = express();
app.use(express.json());

// ---- AUTH ROUTES ----

app.post('/api/auth/login', async (req, res) => {
  const { email, password, impersonateToken } = req.body;

  let loginEmail: string;
  let loginPassword: string;

  if (impersonateToken) {
    const demo = DEMO_CREDENTIALS[impersonateToken];
    if (!demo) return res.status(401).json({ status: 'error', error: 'Unknown playground token.' });
    loginEmail = demo.email;
    loginPassword = demo.password;
  } else {
    if (!email) return res.status(400).json({ status: 'error', error: 'Email is required.' });
    loginEmail = email;
    loginPassword = password || '';
  }

  const { data, error } = await supabaseAdmin.auth.signInWithPassword({ email: loginEmail, password: loginPassword });
  if (error || !data.session) {
    return res.status(401).json({ status: 'error', error: 'Invalid credentials. Check your email and password.' });
  }

  const authUser = data.user;
  const sessionToken = data.session.access_token;

  const profile = await getProfile(authUser.id);
  const user = toSaaSUser(authUser, profile);
  const workspaces = await getWorkspacesForUser(authUser.id);

  let activeWorkspaceId = authUser.user_metadata?.active_workspace_id;
  if (!activeWorkspaceId && workspaces.length > 0) {
    activeWorkspaceId = workspaces[0].id;
    await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      user_metadata: { ...authUser.user_metadata, active_workspace_id: activeWorkspaceId }
    });
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || null;
  const member = activeWorkspace ? await getWorkspaceMember(activeWorkspace.id, authUser.id) : null;
  const role: UserRole = member?.role === UserRole.SUPER_ADMIN ? UserRole.SUPER_ADMIN : (member?.role as UserRole || UserRole.READ_ONLY);

  await logAction(activeWorkspace?.id || null, authUser.id, authUser.email || '', 'USER_LOGIN',
    impersonateToken ? `Authenticated via Playground as ${role}` : 'Authenticated via email+password');

  res.json({ status: 'success', session: { user, activeWorkspace, memberRecord: member, role, token: sessionToken }, workspaces });
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ status: 'error', error: 'Name, email, and password are required.' });
  }

  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });

  if (createError) {
    const msg = createError.message.toLowerCase().includes('already') || createError.message.toLowerCase().includes('exists')
      ? 'An account with this email already exists.'
      : createError.message;
    return res.status(400).json({ status: 'error', error: msg });
  }

  await supabaseAdmin.from('profiles').insert({ id: newUser.user.id, name, onboarded: false });

  const { data: signInData, error: signInError } = await supabaseAdmin.auth.signInWithPassword({ email, password });
  if (signInError || !signInData.session) {
    return res.status(500).json({ status: 'error', error: 'Account created but auto sign-in failed. Please log in manually.' });
  }

  const token = signInData.session.access_token;
  const user = toSaaSUser(newUser.user, { name, onboarded: false });
  res.json({ status: 'success', user, token });
});

app.post('/api/auth/onboarding', async (req, res) => {
  const { token, companyName, ghlMode, apiKey } = req.body;
  if (!token) return res.status(401).json({ status: 'error', error: 'Authentication token is required.' });
  if (!companyName || !ghlMode) return res.status(400).json({ status: 'error', error: 'Company name and mode are required.' });

  const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authUser) return res.status(401).json({ status: 'error', error: 'Invalid or expired session token.' });

  const slug = companyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-');
  const workspaceId = `ws_${Date.now()}`;

  await supabaseAdmin.from('workspaces').insert({
    id: workspaceId,
    name: companyName,
    slug,
    ghl_location_id: ghlMode === 'LIVE' ? `loc_live_${slug.slice(0, 8)}` : `loc_mock_${slug.slice(0, 8)}`,
    suspended: false
  });

  await supabaseAdmin.from('workspace_members').insert({
    id: `mem_${Date.now()}`,
    workspace_id: workspaceId,
    user_id: authUser.id,
    role: 'WORKSPACE_OWNER',
    joined_at: new Date().toISOString()
  });

  await supabaseAdmin.from('reporting_settings').insert({
    workspace_id: workspaceId,
    default_timeframe: 'last_30_days',
    allowed_dashboards: ['overview', 'opportunity', 'sales', 'owner', 'marketing'],
    mode: ghlMode,
    allow_admin_manage_ghl: true,
    cache_ttl_minutes: 15
  });

  await supabaseAdmin.from('subscriptions').insert({
    workspace_id: workspaceId,
    plan: 'GROWTH',
    status: 'TRIALING',
    amount: 147,
    next_billing_date: new Date(Date.now() + 14 * 24 * 3600 * 1000).toISOString()
  });

  if (ghlMode === 'LIVE' && apiKey) {
    await supabaseAdmin.from('ghl_connections').insert({
      id: `gn_${Date.now()}`,
      workspace_id: workspaceId,
      location_id: `loc_live_${slug.slice(0, 8)}`,
      api_key: apiKey,
      status: 'CONNECTED'
    });
  }

  await supabaseAdmin.from('profiles').update({ onboarded: true }).eq('id', authUser.id);
  await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
    user_metadata: { ...authUser.user_metadata, active_workspace_id: workspaceId }
  });

  const profile = await getProfile(authUser.id);
  const user = toSaaSUser(authUser, profile);
  const workspace = await getWorkspaceById(workspaceId);
  const member = await getWorkspaceMember(workspaceId, authUser.id);

  await logAction(workspaceId, authUser.id, authUser.email || '', 'ONBOARD_WORKSPACE', `Workspace "${companyName}" onboarded`);

  res.json({ status: 'success', session: { user, activeWorkspace: workspace, memberRecord: member, role: UserRole.WORKSPACE_OWNER, token }, workspaces: [workspace] });
});

app.get('/api/auth/me', async (req: any, res) => {
  const authHeader = req.headers['x-auth-token'] || req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ status: 'unauthorized', error: 'No token' });
  const token = authHeader.toString().replace('Bearer ', '');

  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !authUser) return res.status(401).json({ status: 'unauthorized', error: 'Session expired' });

  const profile = await getProfile(authUser.id);
  const user = toSaaSUser(authUser, profile);
  const workspaces = await getWorkspacesForUser(authUser.id);

  let activeWorkspaceId = authUser.user_metadata?.active_workspace_id;
  if (!activeWorkspaceId && workspaces.length > 0) {
    activeWorkspaceId = workspaces[0].id;
    await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
      user_metadata: { ...authUser.user_metadata, active_workspace_id: activeWorkspaceId }
    });
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0] || null;
  const member = activeWorkspace ? await getWorkspaceMember(activeWorkspace.id, authUser.id) : null;
  const role: UserRole = member?.role === UserRole.SUPER_ADMIN ? UserRole.SUPER_ADMIN : (member?.role as UserRole || UserRole.READ_ONLY);

  res.json({ status: 'success', session: { user, activeWorkspace, memberRecord: member, role, token }, workspaces });
});

app.post('/api/auth/switch-workspace', async (req, res) => {
  const { token, workspaceId } = req.body;
  if (!token || !workspaceId) return res.status(400).json({ status: 'error', error: 'Token and workspaceId are required.' });

  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !authUser) return res.status(401).json({ status: 'error', error: 'Invalid token.' });

  const workspaces = await getWorkspacesForUser(authUser.id);
  const isSuperAdmin = (await supabaseAdmin.from('workspace_members').select('role').eq('user_id', authUser.id)).data?.some((m: any) => m.role === 'SUPER_ADMIN');
  const hasMembership = workspaces.some(w => w.id === workspaceId) || isSuperAdmin;
  if (!hasMembership) return res.status(403).json({ status: 'error', error: 'Access Denied: You do not have membership in this workspace.' });

  await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
    user_metadata: { ...authUser.user_metadata, active_workspace_id: workspaceId }
  });

  const profile = await getProfile(authUser.id);
  const user = toSaaSUser(authUser, profile);
  const activeWorkspace = await getWorkspaceById(workspaceId);
  const member = await getWorkspaceMember(workspaceId, authUser.id);
  const role: UserRole = member?.role === UserRole.SUPER_ADMIN ? UserRole.SUPER_ADMIN : (member?.role as UserRole || UserRole.READ_ONLY);

  await logAction(workspaceId, authUser.id, authUser.email || '', 'SWITCH_WORKSPACE', `Switched to: ${activeWorkspace?.name}`);
  res.json({ status: 'success', session: { user, activeWorkspace, memberRecord: member, role, token }, workspaces });
});

// ---- WORKSPACE ROUTES ----

app.get('/api/workspaces/settings', requireAuth(), async (req: any, res) => {
  const settings = await getOrCreateReportingSettings(req.workspace.id);
  const { data: sub } = await supabaseAdmin.from('subscriptions').select('*').eq('workspace_id', req.workspace.id).single();
  const conn = await getGHLConnection(req.workspace.id);
  res.json({ status: 'success', settings, subscription: sub, connection: conn ? { locationId: conn.locationId, status: conn.status, connectedAt: conn.connectedAt } : null });
});

app.post('/api/workspaces/settings', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER, UserRole.ADMIN]), async (req: any, res) => {
  const { defaultTimeframe, allowedDashboards, ghlApiKey, removeConnection } = req.body;

  const updates: any = {};
  if (defaultTimeframe !== undefined) updates.default_timeframe = defaultTimeframe;
  if (allowedDashboards !== undefined) updates.allowed_dashboards = allowedDashboards;

  if (ghlApiKey !== undefined && ghlApiKey !== '') {
    const existing = await getGHLConnection(req.workspace.id);
    if (!existing) {
      await supabaseAdmin.from('ghl_connections').insert({ id: `gn_${Date.now()}`, workspace_id: req.workspace.id, location_id: req.workspace.ghlLocationId, api_key: ghlApiKey, status: 'CONNECTED' });
    } else {
      await supabaseAdmin.from('ghl_connections').update({ api_key: ghlApiKey, status: 'CONNECTED', connected_at: new Date().toISOString() }).eq('workspace_id', req.workspace.id);
    }
    updates.mode = 'LIVE';
    await logAction(req.workspace.id, req.user.id, req.user.email, 'UPDATE_INTEGRATION_KEY', 'Updated GHL integration key.');
  }

  if (removeConnection) {
    await supabaseAdmin.from('ghl_connections').delete().eq('workspace_id', req.workspace.id);
    updates.mode = 'MOCK';
    await logAction(req.workspace.id, req.user.id, req.user.email, 'REMOVE_INTEGRATION', 'Removed GHL connector.');
  }

  if (Object.keys(updates).length > 0) {
    await supabaseAdmin.from('reporting_settings').update(updates).eq('workspace_id', req.workspace.id);
  }

  const settings = await getOrCreateReportingSettings(req.workspace.id);
  res.json({ status: 'success', settings, message: 'Workspace configurations updated successfully.' });
});

app.get('/api/workspaces/members', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER, UserRole.ADMIN]), async (req: any, res) => {
  const members = await getMembersByWorkspace(req.workspace.id);
  const list = await Promise.all(members.map(async m => {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(m.userId);
    const profile = await getProfile(m.userId);
    return { id: m.id, userId: m.userId, userName: profile?.name || authUser?.user?.email?.split('@')[0] || 'Unknown', userEmail: authUser?.user?.email || 'unknown@company.com', role: m.role, joinedAt: m.joinedAt };
  }));
  res.json({ status: 'success', members: list });
});

app.post('/api/workspaces/invite', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER]), async (req: any, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role) return res.status(400).json({ status: 'error', error: 'Name, email, and role are required.' });

  // Find or create user
  let userId: string;
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u: any) => u.email?.toLowerCase() === email.toLowerCase());

  if (existing) {
    userId = existing.id;
  } else {
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { name }, password: 'ChangeMe2026!' });
    if (error) return res.status(400).json({ status: 'error', error: error.message });
    await supabaseAdmin.from('profiles').insert({ id: newUser.user.id, name, onboarded: true });
    userId = newUser.user.id;
  }

  const alreadyMember = await getWorkspaceMember(req.workspace.id, userId);
  if (alreadyMember) return res.status(400).json({ status: 'error', error: 'User is already a member of this workspace.' });

  await supabaseAdmin.from('workspace_members').insert({ id: `mem_${Date.now()}`, workspace_id: req.workspace.id, user_id: userId, role, joined_at: new Date().toISOString() });
  await logAction(req.workspace.id, req.user.id, req.user.email, 'INVITE_USER', `Invited ${email} as ${role}`);
  res.json({ status: 'success', message: `Invited ${email} successfully.` });
});

// ---- ADMIN ROUTES ----

app.get('/api/admin/workspaces', requireAuth([UserRole.SUPER_ADMIN]), async (req, res) => {
  const { data: allWs } = await supabaseAdmin.from('workspaces').select('*');
  const list = await Promise.all((allWs || []).map(async (ws: any) => {
    const members = await getMembersByWorkspace(ws.id);
    const conn = await getGHLConnection(ws.id);
    const { data: sub } = await supabaseAdmin.from('subscriptions').select('*').eq('workspace_id', ws.id).single();
    return { ...toWorkspace(ws), membersCount: members.length, connectionStatus: conn?.status || 'DISCONNECTED', plan: sub?.plan || 'N/A', amount: sub?.amount || 0 };
  }));
  res.json({ status: 'success', workspaces: list });
});

app.post('/api/admin/suspend', requireAuth([UserRole.SUPER_ADMIN]), async (req: any, res) => {
  const { workspaceId, suspend } = req.body;
  if (!workspaceId) return res.status(400).json({ status: 'error', error: 'workspaceId is required.' });
  const ws = await getWorkspaceById(workspaceId);
  if (!ws) return res.status(404).json({ status: 'error', error: 'Workspace not found.' });
  await supabaseAdmin.from('workspaces').update({ suspended: !!suspend }).eq('id', workspaceId);
  await logAction(workspaceId, req.user.id, req.user.email, 'TOGGLE_SUSPEND_WORKSPACE', `Workspace suspension set to: ${!!suspend}`);
  res.json({ status: 'success', message: `Workspace "${ws.name}" has been ${suspend ? 'SUSPENDED' : 'ACTIVATED'}.` });
});

app.get('/api/admin/users', requireAuth([UserRole.SUPER_ADMIN]), async (req, res) => {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const list = await Promise.all((users?.users || []).map(async (u: any) => {
    const profile = await getProfile(u.id);
    const { data: mems } = await supabaseAdmin.from('workspace_members').select('workspace_id, role, workspaces(name)').eq('user_id', u.id);
    return {
      id: u.id,
      name: profile?.name || u.email?.split('@')[0] || 'Unknown',
      email: u.email,
      createdAt: u.created_at,
      onboarded: profile?.onboarded || false,
      memberships: (mems || []).map((m: any) => ({ workspaceId: m.workspace_id, workspaceName: m.workspaces?.name || 'Unknown', role: m.role }))
    };
  }));
  res.json({ status: 'success', users: list });
});

app.get('/api/admin/audit-logs', requireAuth(), async (req: any, res) => {
  if (req.role === UserRole.SUPER_ADMIN) {
    const { data } = await supabaseAdmin.from('audit_logs').select('*').order('timestamp', { ascending: false }).limit(500);
    res.json({ status: 'success', logs: data || [] });
  } else if (req.role === UserRole.WORKSPACE_OWNER || req.role === UserRole.ADMIN) {
    const { data } = await supabaseAdmin.from('audit_logs').select('*').eq('workspace_id', req.workspace.id).order('timestamp', { ascending: false }).limit(200);
    res.json({ status: 'success', logs: data || [] });
  } else {
    res.status(403).json({ status: 'error', error: 'Access Denied.' });
  }
});

// ---- GHL CONFIG ROUTES ----

app.get('/api/ghl/config', requireAuth(), async (req: any, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  const warnings: string[] = [];
  if (config.dataSourceMode === 'MOCK') warnings.push('Mock data is currently active.');
  if (config.dataSourceMode === 'LIVE' && (!config.apiKey || !config.locationId)) warnings.push('Live mode selected but credentials are missing. Falling back to mock.');

  let allWorkspaceConnections: any[] = [];
  if (req.role === UserRole.SUPER_ADMIN) {
    const { data: allWs } = await supabaseAdmin.from('workspaces').select('*');
    allWorkspaceConnections = await Promise.all((allWs || []).map(async (ws: any) => {
      const c = await getWorkspaceGhlConfig(ws.id);
      return { workspaceId: ws.id, workspaceName: ws.name, locationId: c.locationId, connectionStatus: c.status, connectedAt: c.connectedAt, mode: c.dataSourceMode };
    }));
  }

  res.json({ status: 'success', role: req.role, canManage: canUserManageGhl(req.role, config.allowAdminManageGHL),
    data: { dataSourceMode: config.dataSourceMode, apiKey: config.apiKeyMasked, apiKeyMasked: config.apiKeyMasked, authMode: process.env.GHL_AUTH_MODE || 'private_token', locationId: config.locationId, companyId: config.companyId, lastSyncTime: config.connectedAt || new Date().toISOString(), cacheTtlMinutes: config.cacheTtlMinutes, allowAdminManageGHL: config.allowAdminManageGHL, apiConnectedSince: config.connectedAt, connectionStatus: config.status, rateLimitStatus: { remaining: 98, limit: 100 }, webhookUrl: process.env.APP_URL ? `${process.env.APP_URL}/api/ghl/webhook` : 'https://example.com/api/ghl/webhook', healthCheckStatus: config.apiKey && config.locationId ? (config.status === 'CONNECTED' ? 'SUCCESS' : 'FAILED') : 'UNKNOWN', lastError: null, scopeChecks: { 'contacts.readonly': true, 'contacts.write': false, 'opportunities.readonly': true, 'opportunities.write': false, 'users.readonly': true }, warnings, allWorkspaceConnections },
    webhookLogs: webhookLogs.slice(0, 10) });
});

app.post('/api/ghl/config', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER, UserRole.ADMIN]), async (req: any, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  if (!canUserManageGhl(req.role, config.allowAdminManageGHL)) return res.status(403).json({ status: 'error', error: 'Access Denied.' });

  const { dataSourceMode, apiKey, locationId, cacheTtlMinutes, allowAdminManageGHL } = req.body;
  const settingsUpdate: any = {};
  if (dataSourceMode !== undefined) settingsUpdate.mode = dataSourceMode;
  if (cacheTtlMinutes !== undefined) settingsUpdate.cache_ttl_minutes = Number(cacheTtlMinutes) || 15;
  if (allowAdminManageGHL !== undefined) settingsUpdate.allow_admin_manage_ghl = !!allowAdminManageGHL;
  if (Object.keys(settingsUpdate).length > 0) {
    await supabaseAdmin.from('reporting_settings').update(settingsUpdate).eq('workspace_id', req.workspace.id);
  }

  let resolvedApiKey = apiKey;
  if (apiKey && apiKey.includes('••••••••')) resolvedApiKey = config.apiKey;
  if (locationId !== undefined || (resolvedApiKey !== undefined && resolvedApiKey !== '')) {
    const existing = await getGHLConnection(req.workspace.id);
    if (!existing) {
      await supabaseAdmin.from('ghl_connections').insert({ id: `gn_${Date.now()}`, workspace_id: req.workspace.id, location_id: locationId || req.workspace.ghlLocationId || '', api_key: resolvedApiKey || '', status: resolvedApiKey ? 'CONNECTED' : 'DISCONNECTED' });
    } else {
      const connUpdate: any = {};
      if (locationId !== undefined) connUpdate.location_id = locationId;
      if (resolvedApiKey !== undefined) { connUpdate.api_key = resolvedApiKey; connUpdate.status = resolvedApiKey ? 'CONNECTED' : 'DISCONNECTED'; connUpdate.connected_at = new Date().toISOString(); }
      await supabaseAdmin.from('ghl_connections').update(connUpdate).eq('workspace_id', req.workspace.id);
    }
  }

  await logAction(req.workspace.id, req.user.id, req.user.email, 'UPDATE_INTEGRATION_KEY', 'Updated GHL integration parameters.');
  invalidateTenantCache(req.workspace.id);
  const updated = await getWorkspaceGhlConfig(req.workspace.id);
  res.json({ status: 'success', message: 'Workspace configurations updated successfully.', data: { dataSourceMode: updated.dataSourceMode, apiKey: updated.apiKeyMasked, apiKeyMasked: updated.apiKeyMasked, locationId: updated.locationId, companyId: updated.companyId, cacheTtlMinutes: updated.cacheTtlMinutes, allowAdminManageGHL: updated.allowAdminManageGHL, connectionStatus: updated.status, apiConnectedSince: updated.connectedAt } });
});

app.post('/api/ghl/save-connection', requireAuth(), async (req: any, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  if (!canUserManageGhl(req.role, config.allowAdminManageGHL)) return res.status(403).json({ status: 'error', error: 'Access Denied.' });

  let { apiKey, locationId, allowAdminManageGHL } = req.body;
  if (apiKey && apiKey.includes('••••••••')) apiKey = config.apiKey;

  const existing = await getGHLConnection(req.workspace.id);
  if (!existing) {
    await supabaseAdmin.from('ghl_connections').insert({ id: `gn_${Date.now()}`, workspace_id: req.workspace.id, location_id: locationId || req.workspace.ghlLocationId || '', api_key: apiKey || '', status: apiKey ? 'CONNECTED' : 'DISCONNECTED' });
  } else {
    const upd: any = {};
    if (locationId !== undefined) upd.location_id = locationId;
    if (apiKey !== undefined) { upd.api_key = apiKey; upd.status = apiKey ? 'CONNECTED' : 'DISCONNECTED'; upd.connected_at = new Date().toISOString(); }
    await supabaseAdmin.from('ghl_connections').update(upd).eq('workspace_id', req.workspace.id);
  }

  if (allowAdminManageGHL !== undefined) {
    await supabaseAdmin.from('reporting_settings').update({ allow_admin_manage_ghl: !!allowAdminManageGHL }).eq('workspace_id', req.workspace.id);
  }

  await logAction(req.workspace.id, req.user.id, req.user.email, 'SAVE_GHL_CONNECTION', `Saved GHL connection. Location: ${locationId}`);
  invalidateTenantCache(req.workspace.id);
  res.json({ status: 'success', message: 'Connection settings saved successfully.' });
});

app.post('/api/ghl/test-connection', requireAuth(), async (req: any, res) => {
  const workspaceConfig = await getWorkspaceGhlConfig(req.workspace.id);
  let { apiKey, locationId } = req.body;
  if (!apiKey || apiKey.includes('••••••••')) apiKey = workspaceConfig.apiKey;
  if (!locationId) locationId = workspaceConfig.locationId;

  if (workspaceConfig.dataSourceMode === 'MOCK' && (!apiKey || !locationId)) {
    return res.json({ status: 'success', source: 'mock', message: 'Synthesized Sandbox Connection Test Passed.', details: { responseTimeMs: 38, authType: 'Private Integration Token', scopesActive: ['contacts.readonly', 'opportunities.readonly', 'users.readonly'], rateLimits: { remaining: 100, limit: 100 } } });
  }
  if (!apiKey || !locationId) return res.status(400).json({ status: 'error', error: 'GHL Private Token and Location ID are required.' });

  try {
    const baseUrl = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
    const version = process.env.GHL_API_VERSION || '2021-07-28';
    const testResponse = await fetch(`${baseUrl}/users/?locationId=${locationId}`, { method: 'GET', headers: { 'Authorization': `Bearer ${apiKey}`, 'Version': version, 'Content-Type': 'application/json' } });
    if (testResponse.ok) {
      await logAction(req.workspace.id, req.user.id, req.user.email, 'TEST_GHL_API_SUCCESS', 'Test connection succeeded.');
      return res.json({ status: 'success', source: 'live', message: 'Connection successful! HighLevel API V2 responded with HTTP 200 OK.', details: { responseTimeMs: 122, authType: 'Private Integration Token', scopesActive: ['contacts.readonly', 'opportunities.readonly', 'users.readonly'], rateLimits: { remaining: parseInt(testResponse.headers.get('x-ratelimit-remaining') || '98'), limit: parseInt(testResponse.headers.get('x-ratelimit-limit') || '100') } } });
    } else {
      const errText = await testResponse.text();
      let errorMsg = `Connection failed: HTTP ${testResponse.status}`;
      if (testResponse.status === 401) errorMsg = 'Unauthorized. Check your Private Integration Key.';
      else if (testResponse.status === 403) errorMsg = 'Forbidden. Validate your Location ID permissions.';
      return res.status(testResponse.status).json({ status: 'error', error: errorMsg });
    }
  } catch (err: any) {
    return res.status(500).json({ status: 'error', error: `API Gateway unreachable: ${err.message}` });
  }
});

app.post('/api/ghl/switch-mode', requireAuth(), async (req: any, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  if (!canUserManageGhl(req.role, config.allowAdminManageGHL)) return res.status(403).json({ status: 'error', error: 'Access Denied.' });
  const { mode } = req.body;
  if (mode !== 'MOCK' && mode !== 'LIVE') return res.status(400).json({ status: 'error', error: 'Invalid mode.' });
  await supabaseAdmin.from('reporting_settings').update({ mode }).eq('workspace_id', req.workspace.id);
  await logAction(req.workspace.id, req.user.id, req.user.email, 'TOGGLE_REPORTING_SOURCE_MODE', `Switched reporting source to ${mode}`);
  invalidateTenantCache(req.workspace.id);
  res.json({ status: 'success', message: `Data source changed to ${mode} mode.` });
});

app.post('/api/ghl/disconnect', requireAuth(), async (req: any, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  if (!canUserManageGhl(req.role, config.allowAdminManageGHL)) return res.status(403).json({ status: 'error', error: 'Access Denied.' });
  await supabaseAdmin.from('ghl_connections').delete().eq('workspace_id', req.workspace.id);
  await supabaseAdmin.from('reporting_settings').update({ mode: 'MOCK' }).eq('workspace_id', req.workspace.id);
  await logAction(req.workspace.id, req.user.id, req.user.email, 'DISCONNECT_GHL_CREDENTIALS', 'Severed GHL API credentials.');
  invalidateTenantCache(req.workspace.id);
  res.json({ status: 'success', message: 'GoHighLevel connection deleted. Mode fell back to Mock.' });
});

app.post('/api/ghl/update-cache-ttl', requireAuth(), async (req: any, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  if (!canUserManageGhl(req.role, config.allowAdminManageGHL)) return res.status(403).json({ status: 'error', error: 'Access Denied.' });
  const minutes = Number(req.body.cacheTtlMinutes);
  if (isNaN(minutes) || minutes < 1 || minutes > 1440) return res.status(400).json({ status: 'error', error: 'Cache TTL must be between 1 and 1440 minutes.' });
  await supabaseAdmin.from('reporting_settings').update({ cache_ttl_minutes: minutes }).eq('workspace_id', req.workspace.id);
  await logAction(req.workspace.id, req.user.id, req.user.email, 'CHANGE_CACHE_TTL', `Cache TTL set to ${minutes} minutes.`);
  invalidateTenantCache(req.workspace.id);
  res.json({ status: 'success', message: 'Cache TTL updated successfully.' });
});

app.post('/api/ghl/webhook', async (req, res) => {
  const payload = req.body;
  webhookLogs.unshift({ timestamp: new Date().toISOString(), source: 'GoHighLevel Webhook (Live Inflow)', event: payload.type || 'unknown_event', payload });
  const { data: conn } = await supabaseAdmin.from('ghl_connections').select('workspace_id').eq('location_id', payload.locationId || payload.location_id || '').single();
  if (conn) { invalidateTenantCache(conn.workspace_id); } else { tenantMetricsCache.clear(); tenantOwnerPerfCache.clear(); tenantMarketingCache.clear(); }
  res.status(200).json({ status: 'delivered', received: true });
});

// ---- METRICS / REPORTING ROUTES ----

app.get('/api/ghl/metrics', requireAuth(), async (req: any, res) => {
  try {
    await syncGhlToMockDb(req.workspace.id);
    const result = await LiveReportingService.getOverviewDashboardReport(req.workspace.id);
    if (!result.data) return res.status(503).json({ status: 'error', source: result.source, error: (result as any).error || 'Live data unavailable', warnings: result.warnings || [] });
    return res.json({ status: 'success', source: result.source, stale: !!result.stale, warnings: result.warnings || [], data: result.data });
  } catch (err: any) { return res.status(500).json({ status: 'error', error: err.message }); }
});

app.get('/api/ghl/owner-performance', requireAuth(), async (req: any, res) => {
  try {
    await syncGhlToMockDb(req.workspace.id);
    const result = await LiveReportingService.getOwnerDashboardReport(req.workspace.id);
    if (!result.data) return res.status(503).json({ status: 'error', source: result.source, error: (result as any).error || 'Live data unavailable', warnings: result.warnings || [] });
    return res.json({ status: 'success', source: result.source, data: result.data.ownerBreakdown });
  } catch (err: any) { return res.status(500).json({ status: 'error', error: err.message }); }
});

app.get('/api/ghl/marketing-performance', requireAuth(), async (req: any, res) => {
  try {
    await syncGhlToMockDb(req.workspace.id);
    const result = await LiveReportingService.getMarketingDashboardReport(req.workspace.id);
    if (!result.data) return res.status(503).json({ status: 'error', source: result.source, error: (result as any).error || 'Live data unavailable', warnings: result.warnings || [] });
    const rep = result.data;
    const formatted = Object.keys(rep.leadsBySource).map(src => {
      const leads = rep.leadsBySource[src] || 0;
      const bookings = rep.bookingsBySource[src] || 0;
      const wonVal = rep.wonRevenueBySource[src] || 0;
      const pip = rep.pipelineValueBySource[src] || 0;
      return { source: src, leadsCount: leads, conversionRate: leads > 0 ? Math.round((bookings / leads) * 100) : 0, pipelineValue: pip, closedWonValue: wonVal, costEstimate: 0, roi: 0, weeklyLeadsTrend: [{ date: 'Wk 1', count: Math.round(leads * 0.2) }, { date: 'Wk 2', count: Math.round(leads * 0.3) }, { date: 'Wk 3', count: Math.round(leads * 0.5) }, { date: 'Wk 4', count: leads }] };
    });
    return res.json({ status: 'success', source: result.source, data: formatted });
  } catch (err: any) { return res.status(500).json({ status: 'error', error: err.message }); }
});

app.get('/api/reporting/owner-performance', requireAuth(), async (req: any, res) => {
  try {
    await syncGhlToMockDb(req.workspace.id);
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const source = typeof req.query.source === 'string' ? req.query.source : undefined;
    const campaign = typeof req.query.campaign === 'string' ? req.query.campaign : undefined;
    const warnings: string[] = [];
    if (startDate && !isValidDateString(startDate)) return res.status(400).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: 'startDate must be YYYY-MM-DD.' });
    if (endDate && !isValidDateString(endDate)) return res.status(400).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: 'endDate must be YYYY-MM-DD.' });
    const result = await LiveReportingService.getOwnerDashboardReport(req.workspace.id, { startDate, endDate, userId, source, campaign });
    if (result.warnings) warnings.push(...result.warnings);
    if (!result.data) return res.status(503).json({ status: 'error', source: result.source, generatedAt: new Date().toISOString(), stale: false, warnings, unavailableMetrics: ['all'], error: (result as any).error || 'Live data unavailable' });
    return res.status(200).json({ status: 'success', source: result.source, generatedAt: new Date().toISOString(), stale: !!result.stale, warnings, unavailableMetrics: result.unavailableMetrics || [], data: result.data });
  } catch (err: any) { return res.status(500).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: err.message }); }
});

app.get('/api/reporting/va-performance', requireAuth(), (req: any, res) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const source = typeof req.query.source === 'string' ? req.query.source : undefined;
    const campaign = typeof req.query.campaign === 'string' ? req.query.campaign : undefined;
    const serviceCategory = typeof req.query.serviceCategory === 'string' ? req.query.serviceCategory : undefined;
    const data = getVAPerformanceReport({ startDate, endDate, userId, source, campaign, serviceCategory });
    return res.status(200).json({ status: 'success', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], data });
  } catch (err: any) { return res.status(500).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: err.message }); }
});

app.get('/api/reporting/marketing-performance', requireAuth(), async (req: any, res) => {
  try {
    await syncGhlToMockDb(req.workspace.id);
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const source = typeof req.query.source === 'string' ? req.query.source : undefined;
    const campaign = typeof req.query.campaign === 'string' ? req.query.campaign : undefined;
    const warnings: string[] = [];
    if (startDate && !isValidDateString(startDate)) return res.status(400).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: 'startDate must be YYYY-MM-DD.' });
    if (endDate && !isValidDateString(endDate)) return res.status(400).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: 'endDate must be YYYY-MM-DD.' });
    if (source && source.toLowerCase().includes('tiktok')) warnings.push('TikTok ad accounts are not synced. Cost metrics are estimated.');
    const result = await LiveReportingService.getMarketingDashboardReport(req.workspace.id, { startDate, endDate, userId, source, campaign });
    if (result.warnings) warnings.push(...result.warnings);
    if (!result.data) return res.status(503).json({ status: 'error', source: result.source, generatedAt: new Date().toISOString(), stale: false, warnings, unavailableMetrics: ['all'], error: (result as any).error || 'Live data unavailable' });
    return res.status(200).json({ status: 'success', source: result.source, generatedAt: new Date().toISOString(), stale: !!result.stale, warnings, unavailableMetrics: result.unavailableMetrics || [], data: result.data });
  } catch (err: any) { return res.status(500).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: err.message }); }
});

export default app;
