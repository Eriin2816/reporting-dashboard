/**
 * Vercel serverless entry point — all Express API routes without Vite middleware or app.listen.
 */

import express from 'express';
import { UserRole, WorkspaceMember } from '../src/types.js';
import {
  getOwnerPerformanceReport,
  getVAPerformanceReport,
  getMarketingPerformanceReport
} from '../src/mockReportingData.js';
import { db } from '../src/mockSaaSStore.js';
import { LiveReportingService, invalidateWorkspaceCacheStore } from '../src/ghlService.js';

import dotenv from 'dotenv';
dotenv.config();

// ==========================================
// APP STATE
// ==========================================

interface GHLAppConfig {
  dataSourceMode: 'MOCK' | 'LIVE';
  apiKey: string;
  locationId: string;
  webhookUrl: string;
  apiConnectedSince: string | null;
  cacheTtlMinutes: number;
  rateLimitStatus: { remaining: number; limit: number };
}

let appConfig: GHLAppConfig = {
  dataSourceMode: (process.env.GHL_DATA_SOURCE === 'LIVE' ? 'LIVE' : 'MOCK') as 'MOCK' | 'LIVE',
  apiKey: process.env.GHL_API_KEY || process.env.GHL_PRIVATE_TOKEN || '',
  locationId: process.env.GHL_LOCATION_ID || '',
  webhookUrl: process.env.APP_URL ? `${process.env.APP_URL}/api/ghl/webhook` : 'https://example.com/api/ghl/webhook',
  apiConnectedSince: process.env.GHL_API_KEY ? new Date().toISOString() : null,
  cacheTtlMinutes: 15,
  rateLimitStatus: { remaining: 98, limit: 100 }
};

interface WebhookLog {
  timestamp: string;
  source: string;
  event: string;
  payload: any;
}
const webhookLogs: WebhookLog[] = [
  { timestamp: new Date(Date.now() - 3600000).toISOString(), source: 'GoHighLevel Webhook', event: 'contact.create', payload: { id: 'con_web_1', contactName: 'Sally Jenkins', email: 'sally.j@example.com' } },
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

// ==========================================
// SESSIONS & AUTH MIDDLEWARE
// ==========================================

export const activeSessions = new Map<string, { userId: string; activeWorkspaceId: string }>();

activeSessions.set('token_super_admin', { userId: 'usr_super_admin', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_owner_A', { userId: 'usr_owner_A', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_admin_A', { userId: 'usr_admin_A', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_rep_A', { userId: 'usr_rep_A', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_member_A', { userId: 'usr_member_A', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_readonly_A', { userId: 'usr_readonly_A', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_owner_B', { userId: 'usr_owner_B', activeWorkspaceId: 'ws_apex' });
activeSessions.set('token_readonly_B', { userId: 'usr_readonly_B', activeWorkspaceId: 'ws_apex' });

export const requireAuth = (allowedRoles?: UserRole[]) => {
  return (req: any, res: any, next: any) => {
    const authHeader = req.headers['x-auth-token'] || req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ status: 'error', error: 'Authentication required. No session token provided.' });
    }
    const token = authHeader.toString().replace('Bearer ', '');
    const session = activeSessions.get(token);
    if (!session) {
      return res.status(401).json({ status: 'error', error: 'Invalid or expired session token. Please log in again.' });
    }
    const user = db.getUserById(session.userId);
    if (!user) {
      return res.status(401).json({ status: 'error', error: 'User account not found.' });
    }
    const workspace = db.getWorkspaceById(session.activeWorkspaceId);
    if (!workspace) {
      return res.status(404).json({ status: 'error', error: 'Active SaaS workspace not found.' });
    }
    if (workspace.suspended && user.id !== 'usr_super_admin') {
      return res.status(403).json({ status: 'error', error: `Access Denied: The workspace "${workspace.name}" has been suspended.`, suspended: true });
    }
    const member = db.getWorkspaceMember(workspace.id, user.id);
    if (!member && user.id !== 'usr_super_admin') {
      return res.status(403).json({ status: 'error', error: 'Access Denied: You are not an authenticated member of this workspace.' });
    }
    const role = user.id === 'usr_super_admin' ? UserRole.SUPER_ADMIN : (member?.role || UserRole.READ_ONLY);
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return res.status(403).json({ status: 'error', error: `Access Denied: Role "${role}" does not have sufficient permissions.` });
    }
    req.user = user;
    req.workspace = workspace;
    req.member = member;
    req.role = role;
    req.token = token;
    next();
  };
};

// ==========================================
// GHL HELPERS
// ==========================================

function getWorkspaceGhlConfig(workspaceId: string) {
  const connection = db.getGHLConnection(workspaceId);
  const settings = db.getReportingSettings(workspaceId);
  let dataSourceMode: 'MOCK' | 'LIVE' = 'MOCK';
  if (settings && settings.mode) {
    dataSourceMode = settings.mode;
  } else if (process.env.GHL_DATA_SOURCE === 'LIVE' || process.env.REPORTING_DATA_SOURCE === 'live') {
    dataSourceMode = 'LIVE';
  }
  let apiKey = '';
  if (connection && connection.apiKey) {
    apiKey = connection.apiKey;
  } else {
    apiKey = process.env.GHL_PRIVATE_INTEGRATION_TOKEN || process.env.GHL_API_KEY || '';
  }
  let locationId = '';
  if (connection && connection.locationId) {
    locationId = connection.locationId;
  } else {
    const ws = db.getWorkspaceById(workspaceId);
    locationId = process.env.GHL_LOCATION_ID || ws?.ghlLocationId || '';
  }
  const companyId = process.env.GHL_COMPANY_ID || 'co_ghl_company_9a2b';
  const allowAdminManageGHL = settings?.allowAdminManageGHL !== false;
  const cacheTtlMinutes = settings?.cacheTtlMinutes || 15;
  const maskToken = (token: string): string => {
    if (!token) return '';
    if (token.length <= 8) return 'ghl_••••••••';
    return `${token.slice(0, 4)}••••••••${token.slice(-5)}`;
  };
  return {
    dataSourceMode, apiKey, apiKeyMasked: maskToken(apiKey), locationId, companyId,
    allowAdminManageGHL, cacheTtlMinutes,
    status: connection?.status || (apiKey && locationId ? 'CONNECTED' : 'DISCONNECTED'),
    connectedAt: connection?.connectedAt || (apiKey && locationId ? new Date().toISOString() : null)
  };
}

function canUserManageGhl(role: UserRole, workspaceId: string): boolean {
  if (role === UserRole.SUPER_ADMIN || role === UserRole.WORKSPACE_OWNER) return true;
  if (role === UserRole.ADMIN) {
    const settings = db.getReportingSettings(workspaceId);
    return settings?.allowAdminManageGHL !== false;
  }
  return false;
}

const isValidDateString = (dateStr: string): boolean => {
  const reg = /^\d{4}-\d{2}-\d{2}$/;
  if (!reg.test(dateStr)) return false;
  return !isNaN(Date.parse(dateStr));
};

// ==========================================
// EXPRESS APP
// ==========================================

const app = express();
app.use(express.json());

// Auth routes
app.post('/api/auth/login', (req, res) => {
  const { email, password, impersonateToken } = req.body;
  if (impersonateToken) {
    const session = activeSessions.get(impersonateToken);
    if (session) {
      const user = db.getUserById(session.userId);
      const workspace = db.getWorkspaceById(session.activeWorkspaceId);
      const member = db.getWorkspaceMember(session.activeWorkspaceId, session.userId);
      const workspaces = db.getWorkspacesForUser(session.userId);
      const role = user?.id === 'usr_super_admin' ? UserRole.SUPER_ADMIN : (member?.role || UserRole.READ_ONLY);
      db.log(session.activeWorkspaceId, session.userId, user?.email || '', 'USER_LOGIN', `Authenticated via Playground impersonation as role ${role}`);
      return res.json({ status: 'success', session: { user, activeWorkspace: workspace, memberRecord: member, role, token: impersonateToken }, workspaces });
    }
  }
  if (!email) return res.status(400).json({ status: 'error', error: 'Email parameter is required.' });
  const user = db.getUserByEmail(email);
  if (!user) {
    if (email.toLowerCase() === 'operations@showtimepoolmechanics.com') {
      const superUser = db.getUserById('usr_super_admin');
      const token = 'token_super_admin';
      const sessionVal = activeSessions.get(token) || { userId: 'usr_super_admin', activeWorkspaceId: 'ws_showtime' };
      activeSessions.set(token, sessionVal);
      return res.json({ status: 'success', session: { user: superUser, activeWorkspace: db.getWorkspaceById(sessionVal.activeWorkspaceId), memberRecord: db.getWorkspaceMember(sessionVal.activeWorkspaceId, superUser!.id), role: UserRole.SUPER_ADMIN, token }, workspaces: db.getWorkspacesForUser(superUser!.id) });
    }
    return res.status(401).json({ status: 'error', error: 'Invalid SaaS credentials. User account does not exist.' });
  }
  const token = `token_${user.id.replace('usr_', '')}`;
  const workspaces = db.getWorkspacesForUser(user.id);
  const activeWorkspace = workspaces[0] || null;
  activeSessions.set(token, { userId: user.id, activeWorkspaceId: activeWorkspace ? activeWorkspace.id : '' });
  const member = activeWorkspace ? db.getWorkspaceMember(activeWorkspace.id, user.id) : null;
  const role = user.id === 'usr_super_admin' ? UserRole.SUPER_ADMIN : (member?.role || UserRole.READ_ONLY);
  db.log(activeWorkspace?.id || null, user.id, user.email, 'USER_LOGIN', 'Authenticated via email password credentials.');
  res.json({ status: 'success', session: { user, activeWorkspace, memberRecord: member, role, token }, workspaces });
});

app.post('/api/auth/signup', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) return res.status(400).json({ status: 'error', error: 'Name and email parameters are required.' });
  try {
    const user = db.signup(name, email);
    const token = `token_${user.id.replace('usr_', '')}`;
    activeSessions.set(token, { userId: user.id, activeWorkspaceId: '' });
    res.json({ status: 'success', user, token });
  } catch (err: any) {
    res.status(400).json({ status: 'error', error: err.message });
  }
});

app.post('/api/auth/onboarding', (req, res) => {
  const { token, companyName, ghlMode, apiKey } = req.body;
  if (!token) return res.status(401).json({ status: 'error', error: 'Authentication token is required for onboarding.' });
  const session = activeSessions.get(token);
  if (!session) return res.status(401).json({ status: 'error', error: 'Invalid or expired session token.' });
  if (!companyName || !ghlMode) return res.status(400).json({ status: 'error', error: 'Company name and dataSourceMode are required.' });
  try {
    const result = db.completeOnboarding(session.userId, companyName, ghlMode, apiKey);
    session.activeWorkspaceId = result.workspace.id;
    activeSessions.set(token, session);
    res.json({ status: 'success', session: { user: result.user, activeWorkspace: result.workspace, memberRecord: result.member, role: UserRole.WORKSPACE_OWNER, token }, workspaces: [result.workspace] });
  } catch (err: any) {
    res.status(400).json({ status: 'error', error: err.message });
  }
});

app.get('/api/auth/me', (req: any, res) => {
  const authHeader = req.headers['x-auth-token'] || req.headers['authorization'];
  if (!authHeader) return res.status(401).json({ status: 'unauthorized', error: 'No token' });
  const token = authHeader.toString().replace('Bearer ', '');
  const session = activeSessions.get(token);
  if (!session) return res.status(401).json({ status: 'unauthorized', error: 'Session expired' });
  const user = db.getUserById(session.userId);
  if (!user) return res.status(401).json({ status: 'unauthorized' });
  let activeWorkspace = db.getWorkspaceById(session.activeWorkspaceId);
  let workspaces = db.getWorkspacesForUser(user.id);
  if (!activeWorkspace && workspaces.length > 0) {
    activeWorkspace = workspaces[0];
    session.activeWorkspaceId = activeWorkspace.id;
    activeSessions.set(token, session);
  }
  const member = activeWorkspace ? db.getWorkspaceMember(activeWorkspace.id, user.id) : null;
  const role = user.id === 'usr_super_admin' ? UserRole.SUPER_ADMIN : (member?.role || UserRole.READ_ONLY);
  res.json({ status: 'success', session: { user, activeWorkspace, memberRecord: member, role, token }, workspaces });
});

app.post('/api/auth/switch-workspace', (req, res) => {
  const { token, workspaceId } = req.body;
  if (!token || !workspaceId) return res.status(400).json({ status: 'error', error: 'Token and workspaceId are required.' });
  const session = activeSessions.get(token);
  if (!session) return res.status(401).json({ status: 'error', error: 'Invalid token session.' });
  const user = db.getUserById(session.userId);
  if (!user) return res.status(401).json({ status: 'error', error: 'User not found.' });
  const workspaces = db.getWorkspacesForUser(user.id);
  const hasMembership = workspaces.some(w => w.id === workspaceId) || user.id === 'usr_super_admin';
  if (!hasMembership) return res.status(403).json({ status: 'error', error: 'Access Denied: You do not have membership in this workspace.' });
  session.activeWorkspaceId = workspaceId;
  activeSessions.set(token, session);
  const activeWorkspace = db.getWorkspaceById(workspaceId);
  const member = db.getWorkspaceMember(workspaceId, user.id);
  const role = user.id === 'usr_super_admin' ? UserRole.SUPER_ADMIN : (member?.role || UserRole.READ_ONLY);
  db.log(workspaceId, user.id, user.email, 'SWITCH_WORKSPACE', `Switched to tenant: ${activeWorkspace?.name}`);
  res.json({ status: 'success', session: { user, activeWorkspace, memberRecord: member, role, token }, workspaces });
});

// Workspace routes
app.get('/api/workspaces/settings', requireAuth(), (req: any, res) => {
  const repSettings = db.getReportingSettings(req.workspace.id);
  const subscription = db.getSubscription(req.workspace.id);
  const connection = db.getGHLConnection(req.workspace.id);
  res.json({ status: 'success', settings: repSettings, subscription, connection: connection ? { locationId: connection.locationId, status: connection.status, connectedAt: connection.connectedAt } : null });
});

app.post('/api/workspaces/settings', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER, UserRole.ADMIN]), (req: any, res) => {
  const { defaultTimeframe, allowedDashboards, ghlApiKey, removeConnection } = req.body;
  const repSettings = db.getReportingSettings(req.workspace.id);
  if (defaultTimeframe !== undefined) repSettings.defaultTimeframe = defaultTimeframe;
  if (allowedDashboards !== undefined) repSettings.allowedDashboards = allowedDashboards;
  if (ghlApiKey !== undefined && ghlApiKey !== '') {
    let conn = db.getGHLConnection(req.workspace.id);
    if (!conn) {
      conn = { id: `gn_${Date.now()}`, workspaceId: req.workspace.id, locationId: req.workspace.ghlLocationId, apiKey: ghlApiKey, connectedAt: new Date().toISOString(), status: 'CONNECTED' };
      db.connections.push(conn);
    } else { conn.apiKey = ghlApiKey; conn.status = 'CONNECTED'; conn.connectedAt = new Date().toISOString(); }
    repSettings.mode = 'LIVE';
    db.log(req.workspace.id, req.user.id, req.user.email, 'UPDATE_INTEGRATION_KEY', 'Updated GHL integration key.');
  }
  if (removeConnection) {
    db.connections = db.connections.filter(c => c.workspaceId !== req.workspace.id);
    repSettings.mode = 'MOCK';
    db.log(req.workspace.id, req.user.id, req.user.email, 'REMOVE_INTEGRATION', 'Removed GHL connector.');
  }
  res.json({ status: 'success', settings: repSettings, message: 'Workspace configurations updated successfully.' });
});

app.get('/api/workspaces/members', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER, UserRole.ADMIN]), (req: any, res) => {
  const list = db.getMembersByWorkspace(req.workspace.id).map(m => {
    const u = db.getUserById(m.userId);
    return { id: m.id, userId: m.userId, userName: u?.name || 'Unknown User', userEmail: u?.email || 'unknown@company.com', role: m.role, joinedAt: m.joinedAt };
  });
  res.json({ status: 'success', members: list });
});

app.post('/api/workspaces/invite', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER]), (req: any, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role) return res.status(400).json({ status: 'error', error: 'Name, email, and role are required.' });
  try {
    let user = db.getUserByEmail(email);
    if (!user) { user = { id: `usr_${Date.now()}`, name, email, onboarded: true, createdAt: new Date().toISOString() }; db.users.push(user); }
    const exists = db.getWorkspaceMember(req.workspace.id, user.id);
    if (exists) return res.status(400).json({ status: 'error', error: 'User is already a member of this workspace.' });
    const newMember: WorkspaceMember = { id: `mem_${Date.now()}`, workspaceId: req.workspace.id, userId: user.id, role: role as UserRole, joinedAt: new Date().toISOString() };
    db.members.push(newMember);
    db.log(req.workspace.id, req.user.id, req.user.email, 'INVITE_USER', `Invited user ${email} as role ${role}`);
    res.json({ status: 'success', message: `Invited ${email} successfully.` });
  } catch (err: any) { res.status(400).json({ status: 'error', error: err.message }); }
});

// Admin routes
app.get('/api/admin/workspaces', requireAuth([UserRole.SUPER_ADMIN]), (req, res) => {
  const workspacesExtended = db.workspaces.map(ws => {
    const membersCount = db.getMembersByWorkspace(ws.id).length;
    const connection = db.getGHLConnection(ws.id);
    const subscription = db.getSubscription(ws.id);
    return { ...ws, membersCount, connectionStatus: connection ? connection.status : 'DISCONNECTED', plan: subscription ? subscription.plan : 'N/A', amount: subscription ? subscription.amount : 0 };
  });
  res.json({ status: 'success', workspaces: workspacesExtended });
});

app.post('/api/admin/suspend', requireAuth([UserRole.SUPER_ADMIN]), (req: any, res) => {
  const { workspaceId, suspend } = req.body;
  if (!workspaceId) return res.status(400).json({ status: 'error', error: 'WorkspaceId is required.' });
  const ws = db.getWorkspaceById(workspaceId);
  if (!ws) return res.status(404).json({ status: 'error', error: 'Workspace not found.' });
  ws.suspended = !!suspend;
  db.log(workspaceId, req.user.id, req.user.email, 'TOGGLE_SUSPEND_WORKSPACE', `Workspace suspension changed to: ${ws.suspended}`);
  res.json({ status: 'success', message: `Workspace "${ws.name}" has been ${ws.suspended ? 'SUSPENDED' : 'ACTIVATED'} successfully.` });
});

app.get('/api/admin/users', requireAuth([UserRole.SUPER_ADMIN]), (req, res) => {
  const list = db.users.map(u => {
    const memberships = db.members.filter(m => m.userId === u.id).map(m => {
      const ws = db.getWorkspaceById(m.workspaceId);
      return { workspaceId: m.workspaceId, workspaceName: ws ? ws.name : 'Unknown', role: m.role };
    });
    return { id: u.id, name: u.name, email: u.email, createdAt: u.createdAt, onboarded: u.onboarded, memberships };
  });
  res.json({ status: 'success', users: list });
});

app.get('/api/admin/audit-logs', requireAuth(), (req: any, res) => {
  if (req.role === UserRole.SUPER_ADMIN) {
    res.json({ status: 'success', logs: db.auditLogs });
  } else if (req.role === UserRole.WORKSPACE_OWNER || req.role === UserRole.ADMIN) {
    const scoped = db.auditLogs.filter((al: any) => al.workspaceId === req.workspace.id);
    res.json({ status: 'success', logs: scoped });
  } else {
    res.status(403).json({ status: 'error', error: 'Access Denied: Insufficient privileges.' });
  }
});

// GHL config routes
app.get('/api/ghl/config', requireAuth(), (req: any, res) => {
  const config = getWorkspaceGhlConfig(req.workspace.id);
  const scopeChecks = { 'contacts.readonly': true, 'contacts.write': false, 'opportunities.readonly': true, 'opportunities.write': false, 'users.readonly': true };
  const warnings: string[] = [];
  if (config.dataSourceMode === 'MOCK') warnings.push('Mock data is currently active.');
  if (config.dataSourceMode === 'LIVE' && (!config.apiKey || !config.locationId)) warnings.push('Live mode selected but credentials are missing. Falling back to mock.');
  let allWorkspaceConnections: any[] = [];
  if (req.role === UserRole.SUPER_ADMIN) {
    allWorkspaceConnections = db.workspaces.map(ws => {
      const c = getWorkspaceGhlConfig(ws.id);
      return { workspaceId: ws.id, workspaceName: ws.name, locationId: c.locationId, connectionStatus: c.status, connectedAt: c.connectedAt, mode: c.dataSourceMode };
    });
  }
  res.json({ status: 'success', role: req.role, canManage: canUserManageGhl(req.role, req.workspace.id), data: { dataSourceMode: config.dataSourceMode, apiKey: config.apiKeyMasked, apiKeyMasked: config.apiKeyMasked, authMode: process.env.GHL_AUTH_MODE || 'private_token', locationId: config.locationId, companyId: config.companyId, lastSyncTime: config.connectedAt || new Date().toISOString(), cacheTtlMinutes: config.cacheTtlMinutes, allowAdminManageGHL: config.allowAdminManageGHL, apiConnectedSince: config.connectedAt, connectionStatus: config.status, rateLimitStatus: appConfig.rateLimitStatus, webhookUrl: appConfig.webhookUrl, healthCheckStatus: config.apiKey && config.locationId ? (config.status === 'CONNECTED' ? 'SUCCESS' : 'FAILED') : 'UNKNOWN', lastError: null, scopeChecks, warnings, allWorkspaceConnections }, webhookLogs: webhookLogs.slice(0, 10) });
});

app.post('/api/ghl/config', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER, UserRole.ADMIN]), (req: any, res) => {
  if (!canUserManageGhl(req.role, req.workspace.id)) return res.status(403).json({ status: 'error', error: 'Access Denied.' });
  const { dataSourceMode, apiKey, locationId, cacheTtlMinutes, allowAdminManageGHL } = req.body;
  const settings = db.getReportingSettings(req.workspace.id);
  if (dataSourceMode !== undefined) settings.mode = dataSourceMode;
  if (cacheTtlMinutes !== undefined) settings.cacheTtlMinutes = Number(cacheTtlMinutes) || 15;
  if (allowAdminManageGHL !== undefined) settings.allowAdminManageGHL = !!allowAdminManageGHL;
  let conn = db.getGHLConnection(req.workspace.id);
  let resolvedApiKey = apiKey;
  if (apiKey && apiKey.includes('••••••••')) { const c = getWorkspaceGhlConfig(req.workspace.id); resolvedApiKey = c.apiKey; }
  if (locationId !== undefined || (resolvedApiKey !== undefined && resolvedApiKey !== '')) {
    if (!conn) { conn = { id: `gn_${Date.now()}`, workspaceId: req.workspace.id, locationId: locationId || req.workspace.ghlLocationId || '', apiKey: resolvedApiKey || '', connectedAt: new Date().toISOString(), status: resolvedApiKey ? 'CONNECTED' : 'DISCONNECTED' }; db.connections.push(conn); }
    else { if (locationId !== undefined) conn.locationId = locationId; if (resolvedApiKey !== undefined) { conn.apiKey = resolvedApiKey; conn.status = resolvedApiKey ? 'CONNECTED' : 'DISCONNECTED'; conn.connectedAt = new Date().toISOString(); } }
  }
  db.log(req.workspace.id, req.user.id, req.user.email, 'UPDATE_INTEGRATION_KEY', 'Updated GHL integration parameters.');
  invalidateTenantCache(req.workspace.id);
  const updatedConfig = getWorkspaceGhlConfig(req.workspace.id);
  res.json({ status: 'success', message: 'Workspace configurations updated successfully.', data: { dataSourceMode: updatedConfig.dataSourceMode, apiKey: updatedConfig.apiKeyMasked, apiKeyMasked: updatedConfig.apiKeyMasked, locationId: updatedConfig.locationId, companyId: updatedConfig.companyId, cacheTtlMinutes: updatedConfig.cacheTtlMinutes, allowAdminManageGHL: updatedConfig.allowAdminManageGHL, connectionStatus: updatedConfig.status, apiConnectedSince: updatedConfig.connectedAt, webhookUrl: appConfig.webhookUrl, rateLimitStatus: appConfig.rateLimitStatus } });
});

app.post('/api/ghl/save-connection', requireAuth(), (req: any, res) => {
  if (!canUserManageGhl(req.role, req.workspace.id)) return res.status(403).json({ status: 'error', error: 'Access Denied.' });
  let { apiKey, locationId, allowAdminManageGHL } = req.body;
  if (apiKey && apiKey.includes('••••••••')) { const c = getWorkspaceGhlConfig(req.workspace.id); apiKey = c.apiKey; }
  let conn = db.getGHLConnection(req.workspace.id);
  if (!conn) { conn = { id: `gn_${Date.now()}`, workspaceId: req.workspace.id, locationId: locationId || req.workspace.ghlLocationId || '', apiKey: apiKey || '', connectedAt: new Date().toISOString(), status: apiKey ? 'CONNECTED' : 'DISCONNECTED' }; db.connections.push(conn); }
  else { if (locationId !== undefined) conn.locationId = locationId; if (apiKey !== undefined) { conn.apiKey = apiKey; conn.status = apiKey ? 'CONNECTED' : 'DISCONNECTED'; conn.connectedAt = new Date().toISOString(); } }
  const settings = db.getReportingSettings(req.workspace.id);
  if (allowAdminManageGHL !== undefined) settings.allowAdminManageGHL = !!allowAdminManageGHL;
  db.log(req.workspace.id, req.user.id, req.user.email, 'SAVE_GHL_CONNECTION', `Saved GHL connection. Location ID: ${locationId}`);
  invalidateTenantCache(req.workspace.id);
  res.json({ status: 'success', message: 'Connection settings saved successfully.' });
});

app.post('/api/ghl/test-connection', requireAuth(), async (req: any, res) => {
  let { apiKey, locationId } = req.body;
  const workspaceConfig = getWorkspaceGhlConfig(req.workspace.id);
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
      db.log(req.workspace.id, req.user.id, req.user.email, 'TEST_GHL_API_SUCCESS', 'Test connection succeeded.');
      return res.json({ status: 'success', source: 'live', message: 'Connection successful! HighLevel API V2 responded with HTTP 200 OK.', details: { responseTimeMs: 122, authType: 'Private Integration Token', scopesActive: ['contacts.readonly', 'opportunities.readonly', 'users.readonly'], rateLimits: { remaining: parseInt(testResponse.headers.get('x-ratelimit-remaining') || '98'), limit: parseInt(testResponse.headers.get('x-ratelimit-limit') || '100') } } });
    } else {
      const errText = await testResponse.text();
      let errorMsg = `Connection test failed with code ${testResponse.status}: ${errText.slice(0, 500)}`;
      if (testResponse.status === 401) errorMsg = 'Unauthorized. Check your Private Integration Key.';
      else if (testResponse.status === 403) errorMsg = 'Forbidden. Validate your Location ID permissions.';
      db.log(req.workspace.id, req.user.id, req.user.email, 'TEST_GHL_API_FAILURE', `Test connection failed: HTTP ${testResponse.status}`);
      return res.status(testResponse.status).json({ status: 'error', error: errorMsg });
    }
  } catch (err: any) {
    return res.status(500).json({ status: 'error', error: `API Gateway unreachable: ${err.message}` });
  }
});

app.post('/api/ghl/switch-mode', requireAuth(), (req: any, res) => {
  if (!canUserManageGhl(req.role, req.workspace.id)) return res.status(403).json({ status: 'error', error: 'Access Denied.' });
  const { mode } = req.body;
  if (mode !== 'MOCK' && mode !== 'LIVE') return res.status(400).json({ status: 'error', error: 'Invalid mode.' });
  const settings = db.getReportingSettings(req.workspace.id);
  settings.mode = mode;
  db.log(req.workspace.id, req.user.id, req.user.email, 'TOGGLE_REPORTING_SOURCE_MODE', `Switched reporting source to ${mode}`);
  invalidateTenantCache(req.workspace.id);
  res.json({ status: 'success', message: `Data source changed to ${mode} mode.` });
});

app.post('/api/ghl/disconnect', requireAuth(), (req: any, res) => {
  if (!canUserManageGhl(req.role, req.workspace.id)) return res.status(403).json({ status: 'error', error: 'Access Denied.' });
  db.connections = db.connections.filter(c => c.workspaceId !== req.workspace.id);
  const settings = db.getReportingSettings(req.workspace.id);
  settings.mode = 'MOCK';
  db.log(req.workspace.id, req.user.id, req.user.email, 'DISCONNECT_GHL_CREDENTIALS', 'Severed GHL API credentials.');
  invalidateTenantCache(req.workspace.id);
  res.json({ status: 'success', message: 'GoHighLevel connection deleted. Mode fell back to Mock.' });
});

app.post('/api/ghl/update-cache-ttl', requireAuth(), (req: any, res) => {
  if (!canUserManageGhl(req.role, req.workspace.id)) return res.status(403).json({ status: 'error', error: 'Access Denied.' });
  const minutes = Number(req.body.cacheTtlMinutes);
  if (isNaN(minutes) || minutes < 1 || minutes > 1440) return res.status(400).json({ status: 'error', error: 'Cache TTL must be between 1 and 1440 minutes.' });
  const settings = db.getReportingSettings(req.workspace.id);
  settings.cacheTtlMinutes = minutes;
  db.log(req.workspace.id, req.user.id, req.user.email, 'CHANGE_CACHE_TTL', `Cache TTL set to ${minutes} minutes.`);
  invalidateTenantCache(req.workspace.id);
  res.json({ status: 'success', message: 'Cache TTL updated successfully.' });
});

app.post('/api/ghl/webhook', (req, res) => {
  const payload = req.body;
  webhookLogs.unshift({ timestamp: new Date().toISOString(), source: 'GoHighLevel Webhook (Live Inflow)', event: payload.type || 'unknown_event', payload });
  const conn = db.connections.find(c => c.locationId === payload.locationId || c.locationId === payload.location_id);
  if (conn) { invalidateTenantCache(conn.workspaceId); } else { tenantMetricsCache.clear(); tenantOwnerPerfCache.clear(); tenantMarketingCache.clear(); }
  res.status(200).json({ status: 'delivered', received: true });
});

// Metrics routes
app.get('/api/ghl/metrics', requireAuth(), async (req: any, res) => {
  try {
    const result = await LiveReportingService.getOverviewDashboardReport(req.workspace.id);
    return res.json({ status: 'success', source: result.source, stale: !!result.stale, warnings: result.warnings || [], data: result.data });
  } catch (err: any) { return res.status(500).json({ status: 'error', error: err.message }); }
});

app.get('/api/ghl/owner-performance', requireAuth(), async (req: any, res) => {
  try {
    const result = await LiveReportingService.getOwnerDashboardReport(req.workspace.id);
    return res.json({ status: 'success', source: result.source, data: result.data.ownerBreakdown });
  } catch (err: any) { return res.status(500).json({ status: 'error', error: err.message }); }
});

app.get('/api/ghl/marketing-performance', requireAuth(), async (req: any, res) => {
  try {
    const result = await LiveReportingService.getMarketingDashboardReport(req.workspace.id);
    const rep = result.data;
    const formatted = Object.keys(rep.leadsBySource).map(src => {
      const leads = rep.leadsBySource[src] || 0;
      const bookings = rep.bookingsBySource[src] || 0;
      const wonVal = rep.wonRevenueBySource[src] || 0;
      const pip = rep.pipelineValueBySource[src] || 0;
      return { source: src, leadsCount: leads, conversionRate: leads > 0 ? Math.round((bookings / leads) * 100) : 0, pipelineValue: pip, closedWonValue: wonVal, costEstimate: Math.round(leads * 15), roi: 450, weeklyLeadsTrend: [{ date: 'Wk 1', count: Math.round(leads * 0.2) }, { date: 'Wk 2', count: Math.round(leads * 0.3) }, { date: 'Wk 3', count: Math.round(leads * 0.5) }, { date: 'Wk 4', count: leads }] };
    });
    return res.json({ status: 'success', source: result.source, data: formatted });
  } catch (err: any) { return res.status(500).json({ status: 'error', error: err.message }); }
});

// Reporting routes
app.get('/api/reporting/owner-performance', requireAuth(), async (req: any, res) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const locationId = typeof req.query.locationId === 'string' ? req.query.locationId : undefined;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const source = typeof req.query.source === 'string' ? req.query.source : undefined;
    const campaign = typeof req.query.campaign === 'string' ? req.query.campaign : undefined;
    const warnings: string[] = [];
    if (startDate && !isValidDateString(startDate)) return res.status(400).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: 'startDate must be in YYYY-MM-DD format.' });
    if (endDate && !isValidDateString(endDate)) return res.status(400).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: 'endDate must be in YYYY-MM-DD format.' });
    if (locationId && locationId !== req.workspace.ghlLocationId) warnings.push(`LocationId "${locationId}" does not match your active workspace.`);
    const result = await LiveReportingService.getOwnerDashboardReport(req.workspace.id, { startDate, endDate, userId, source, campaign });
    if (result.warnings) warnings.push(...result.warnings);
    return res.status(200).json({ status: 'success', source: result.source, generatedAt: new Date().toISOString(), stale: !!result.stale, warnings, unavailableMetrics: result.unavailableMetrics || [], data: result.data });
  } catch (err: any) { return res.status(500).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: `Internal error: ${err.message}` }); }
});

app.get('/api/reporting/va-performance', requireAuth(), (req: any, res) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const source = typeof req.query.source === 'string' ? req.query.source : undefined;
    const campaign = typeof req.query.campaign === 'string' ? req.query.campaign : undefined;
    const serviceCategory = typeof req.query.serviceCategory === 'string' ? req.query.serviceCategory : undefined;
    if (startDate && !isValidDateString(startDate)) return res.status(400).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: 'startDate must be in YYYY-MM-DD format.' });
    if (endDate && !isValidDateString(endDate)) return res.status(400).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: 'endDate must be in YYYY-MM-DD format.' });
    const data = getVAPerformanceReport({ startDate, endDate, userId, source, campaign, serviceCategory });
    return res.status(200).json({ status: 'success', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], data });
  } catch (err: any) { return res.status(500).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: `Internal error: ${err.message}` }); }
});

app.get('/api/reporting/marketing-performance', requireAuth(), async (req: any, res) => {
  try {
    const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
    const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
    const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
    const source = typeof req.query.source === 'string' ? req.query.source : undefined;
    const campaign = typeof req.query.campaign === 'string' ? req.query.campaign : undefined;
    const warnings: string[] = [];
    if (startDate && !isValidDateString(startDate)) return res.status(400).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: 'startDate must be in YYYY-MM-DD format.' });
    if (endDate && !isValidDateString(endDate)) return res.status(400).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: 'endDate must be in YYYY-MM-DD format.' });
    if (source && source.toLowerCase().includes('tiktok')) { warnings.push('TikTok ad accounts are not synced. Cost metrics are estimated.'); }
    const result = await LiveReportingService.getMarketingDashboardReport(req.workspace.id, { startDate, endDate, userId, source, campaign });
    if (result.warnings) warnings.push(...result.warnings);
    return res.status(200).json({ status: 'success', source: result.source, generatedAt: new Date().toISOString(), stale: !!result.stale, warnings, unavailableMetrics: result.unavailableMetrics || [], data: result.data });
  } catch (err: any) { return res.status(500).json({ status: 'error', source: 'mock', generatedAt: new Date().toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: `Internal error: ${err.message}` }); }
});

export default app;
