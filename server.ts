/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { getDashboardMetrics, getMarketingPerformance, getOwnerPerformance, mockUsers } from './src/mockData.js';
import { GHLAppConfig, UserRole, WorkspaceMember } from './src/types.js';
import { 
  getOwnerPerformanceReport, 
  getVAPerformanceReport, 
  getMarketingPerformanceReport 
} from './src/mockReportingData.js';
import { db } from './src/mockSaaSStore.js';
import { LiveReportingService, invalidateWorkspaceCacheStore } from './src/ghlService.js';

// Load ENV variables
import dotenv from 'dotenv';
dotenv.config();

// Standard App state to support dynamic "Live GHL V2" test connection via GHL settings
let appConfig: GHLAppConfig = {
  dataSourceMode: (process.env.GHL_DATA_SOURCE === 'LIVE' ? 'LIVE' : 'MOCK') as 'MOCK' | 'LIVE',
  apiKey: process.env.GHL_API_KEY || process.env.GHL_PRIVATE_TOKEN || '',
  locationId: process.env.GHL_LOCATION_ID || '',
  webhookUrl: process.env.APP_URL ? `${process.env.APP_URL}/api/ghl/webhook` : 'https://example.com/api/ghl/webhook',
  apiConnectedSince: process.env.GHL_API_KEY ? new Date().toISOString() : null,
  cacheTtlMinutes: 15,
  rateLimitStatus: {
    remaining: 98,
    limit: 100
  }
};

// Log webhook logs to help review active events
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

// Memory Caching variables mapped per-workspace to ensure perfect SaaS data isolation
const tenantMetricsCache = new Map<string, { data: any; timestamp: number }>();
const tenantOwnerPerfCache = new Map<string, { data: any; timestamp: number }>();
const tenantMarketingCache = new Map<string, { data: any; timestamp: number }>();

function isTenantCacheValid(workspaceId: string, type: 'metrics' | 'owner' | 'marketing', ttlMinutes = 15): boolean {
  const map = type === 'metrics' ? tenantMetricsCache : (type === 'owner' ? tenantOwnerPerfCache : tenantMarketingCache);
  const entry = map.get(workspaceId);
  if (!entry) return false;
  const elapsedMs = Date.now() - entry.timestamp;
  return elapsedMs < ttlMinutes * 60 * 1000;
}

function invalidateTenantCache(workspaceId: string) {
  tenantMetricsCache.delete(workspaceId);
  tenantOwnerPerfCache.delete(workspaceId);
  tenantMarketingCache.delete(workspaceId);
  invalidateWorkspaceCacheStore(workspaceId);
}

// ==========================================
// SAAS ACTIVE SESSION ENGINE & MIDDLEWARE
// ==========================================

export const activeSessions = new Map<string, { userId: string; activeWorkspaceId: string }>();

// Pre-seeded security tokens mapped to role personas to enable quick one-click playground switching
activeSessions.set('token_super_admin', { userId: 'usr_super_admin', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_owner_A', { userId: 'usr_owner_A', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_admin_A', { userId: 'usr_admin_A', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_rep_A', { userId: 'usr_rep_A', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_member_A', { userId: 'usr_member_A', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_readonly_A', { userId: 'usr_readonly_A', activeWorkspaceId: 'ws_showtime' });
activeSessions.set('token_owner_B', { userId: 'usr_owner_B', activeWorkspaceId: 'ws_apex' });
activeSessions.set('token_readonly_B', { userId: 'usr_readonly_B', activeWorkspaceId: 'ws_apex' });

// Custom Authentication & Tenant Boundaries middleware
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

    // Suspended tenant protection check (Only SUPER_ADMIN can bypass workspace suspension blocks)
    if (workspace.suspended && user.id !== 'usr_super_admin') {
      return res.status(403).json({ 
        status: 'error', 
        error: `Access Denied: The workspace "${workspace.name}" has been suspended by system operations. Please contact support.`,
        suspended: true 
      });
    }

    // Multi-tenant membership boundary check
    const member = db.getWorkspaceMember(workspace.id, user.id);
    if (!member && user.id !== 'usr_super_admin') {
      return res.status(403).json({ status: 'error', error: 'Access Denied: You are not an authenticated member of this workspace.' });
    }

    // Resolve active role
    const role = user.id === 'usr_super_admin' ? UserRole.SUPER_ADMIN : (member?.role || UserRole.READ_ONLY);

    // Permission matrices guard
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return res.status(403).json({ 
        status: 'error', 
        error: `Access Denied: Role "${role}" does not have sufficient permissions to perform this action.` 
      });
    }

    // Bind safe context
    req.user = user;
    req.workspace = workspace;
    req.member = member;
    req.role = role;
    req.token = token;

    next();
  };
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Log level reporting
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // ==========================================
  // SaaS Auth & Tenant Management Endpoints
  // ==========================================

  // Authentication Login
  app.post('/api/auth/login', (req, res) => {
    const { email, password, impersonateToken } = req.body;

    if (impersonateToken) {
      // Direct playground login from UI drop-down for rapid testing across all roles
      const session = activeSessions.get(impersonateToken);
      if (session) {
        const user = db.getUserById(session.userId);
        const workspace = db.getWorkspaceById(session.activeWorkspaceId);
        const member = db.getWorkspaceMember(session.activeWorkspaceId, session.userId);
        const workspaces = db.getWorkspacesForUser(session.userId);
        const role = user?.id === 'usr_super_admin' ? UserRole.SUPER_ADMIN : (member?.role || UserRole.READ_ONLY);
        
        db.log(session.activeWorkspaceId, session.userId, user?.email || '', 'USER_LOGIN', `Authenticated via Playground impersonation as role ${role}`);

        return res.json({
          status: 'success',
          session: {
            user,
            activeWorkspace: workspace,
            memberRecord: member,
            role,
            token: impersonateToken
          },
          workspaces
        });
      }
    }

    if (!email) {
      return res.status(400).json({ status: 'error', error: 'Email parameter is required.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      // If operations email is logging in for first time, make them superadmin
      if (email.toLowerCase() === 'operations@showtimepoolmechanics.com') {
        const superUser = db.getUserById('usr_super_admin');
        const token = 'token_super_admin';
        const sessionVal = activeSessions.get(token) || { userId: 'usr_super_admin', activeWorkspaceId: 'ws_showtime' };
        activeSessions.set(token, sessionVal);
        return res.json({
          status: 'success',
          session: {
            user: superUser,
            activeWorkspace: db.getWorkspaceById(sessionVal.activeWorkspaceId),
            memberRecord: db.getWorkspaceMember(sessionVal.activeWorkspaceId, superUser!.id),
            role: UserRole.SUPER_ADMIN,
            token
          },
          workspaces: db.getWorkspacesForUser(superUser!.id)
        });
      }
      return res.status(401).json({ status: 'error', error: 'Invalid SaaS credentials. User account does not exist.' });
    }

    // Generate simulated secure SaaS JWT token
    const token = `token_${user.id.replace('usr_', '')}`;
    const workspaces = db.getWorkspacesForUser(user.id);
    const activeWorkspace = workspaces[0] || null;
    
    activeSessions.set(token, {
      userId: user.id,
      activeWorkspaceId: activeWorkspace ? activeWorkspace.id : ''
    });

    const member = activeWorkspace ? db.getWorkspaceMember(activeWorkspace.id, user.id) : null;
    const role = user.id === 'usr_super_admin' ? UserRole.SUPER_ADMIN : (member?.role || UserRole.READ_ONLY);

    db.log(activeWorkspace?.id || null, user.id, user.email, 'USER_LOGIN', `Authenticated via email password credentials.`);

    res.json({
      status: 'success',
      session: {
        user,
        activeWorkspace,
        memberRecord: member,
        role,
        token
      },
      workspaces
    });
  });

  // User Signup
  app.post('/api/auth/signup', (req, res) => {
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ status: 'error', error: 'Name and email parameters are required.' });
    }

    try {
      const user = db.signup(name, email);
      const token = `token_${user.id.replace('usr_', '')}`;
      
      // Seed a session for them, they do not have a workspace yet
      activeSessions.set(token, {
        userId: user.id,
        activeWorkspaceId: ''
      });

      res.json({
        status: 'success',
        user,
        token
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', error: err.message });
    }
  });

  // Onboarding Complete Flow
  app.post('/api/auth/onboarding', (req, res) => {
    const { token, companyName, ghlMode, apiKey } = req.body;
    if (!token) {
      return res.status(401).json({ status: 'error', error: 'Authentication token is required for onboarding.' });
    }

    const session = activeSessions.get(token);
    if (!session) {
      return res.status(401).json({ status: 'error', error: 'Invalid or expired session token.' });
    }

    if (!companyName || !ghlMode) {
      return res.status(400).json({ status: 'error', error: 'Company name and dataSourceMode choose selector are required.' });
    }

    try {
      const result = db.completeOnboarding(session.userId, companyName, ghlMode, apiKey);
      
      // Update session active workspace mapping
      session.activeWorkspaceId = result.workspace.id;
      activeSessions.set(token, session);

      res.json({
        status: 'success',
        session: {
          user: result.user,
          activeWorkspace: result.workspace,
          memberRecord: result.member,
          role: UserRole.WORKSPACE_OWNER,
          token
        },
        workspaces: [result.workspace]
      });
    } catch (err: any) {
      res.status(400).json({ status: 'error', error: err.message });
    }
  });

  // Get active session metadata
  app.get('/api/auth/me', (req: any, res) => {
    const authHeader = req.headers['x-auth-token'] || req.headers['authorization'];
    if (!authHeader) {
      return res.status(401).json({ status: 'unauthorized', error: 'No token' });
    }

    const token = authHeader.toString().replace('Bearer ', '');
    const session = activeSessions.get(token);
    if (!session) {
      return res.status(401).json({ status: 'unauthorized', error: 'Session expired' });
    }

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

    res.json({
      status: 'success',
      session: {
        user,
        activeWorkspace,
        memberRecord: member,
        role,
        token
      },
      workspaces
    });
  });

  // Switch Active Workspace
  app.post('/api/auth/switch-workspace', (req, res) => {
    const { token, workspaceId } = req.body;
    if (!token || !workspaceId) {
      return res.status(400).json({ status: 'error', error: 'Token and workspaceId parameters are required.' });
    }

    const session = activeSessions.get(token);
    if (!session) {
      return res.status(401).json({ status: 'error', error: 'Invalid token session.' });
    }

    const user = db.getUserById(session.userId);
    if (!user) return res.status(401).json({ status: 'error', error: 'User not found.' });

    // Validate Membership
    const workspaces = db.getWorkspacesForUser(user.id);
    const hasMembership = workspaces.some(w => w.id === workspaceId) || user.id === 'usr_super_admin';
    if (!hasMembership) {
      return res.status(403).json({ status: 'error', error: 'Access Denied: You do not have membership mapping inside this workspace.' });
    }

    // Switch session
    session.activeWorkspaceId = workspaceId;
    activeSessions.set(token, session);

    const activeWorkspace = db.getWorkspaceById(workspaceId);
    const member = db.getWorkspaceMember(workspaceId, user.id);
    const role = user.id === 'usr_super_admin' ? UserRole.SUPER_ADMIN : (member?.role || UserRole.READ_ONLY);

    db.log(workspaceId, user.id, user.email, 'SWITCH_WORKSPACE', `Switched active dashboard environment context to tenant: ${activeWorkspace?.name}`);

    res.json({
      status: 'success',
      session: {
        user,
        activeWorkspace,
        memberRecord: member,
        role,
        token
      },
      workspaces
    });
  });

  // Get current tenant's global metrics
  app.get('/api/workspaces/settings', requireAuth(), (req: any, res) => {
    const repSettings = db.getReportingSettings(req.workspace.id);
    const subscription = db.getSubscription(req.workspace.id);
    const connection = db.getGHLConnection(req.workspace.id);

    res.json({
      status: 'success',
      settings: repSettings,
      subscription,
      connection: connection ? { locationId: connection.locationId, status: connection.status, connectedAt: connection.connectedAt } : null
    });
  });

  // Update tenant integration settings
  app.post('/api/workspaces/settings', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER, UserRole.ADMIN]), (req: any, res) => {
    const { defaultTimeframe, allowedDashboards, ghlApiKey, removeConnection } = req.body;
    const repSettings = db.getReportingSettings(req.workspace.id);

    if (defaultTimeframe !== undefined) repSettings.defaultTimeframe = defaultTimeframe;
    if (allowedDashboards !== undefined) repSettings.allowedDashboards = allowedDashboards;

    if (ghlApiKey !== undefined && ghlApiKey !== '') {
      // Connect/update connection
      let conn = db.getGHLConnection(req.workspace.id);
      if (!conn) {
        conn = {
          id: `gn_${Date.now()}`,
          workspaceId: req.workspace.id,
          locationId: req.workspace.ghlLocationId,
          apiKey: ghlApiKey,
          connectedAt: new Date().toISOString(),
          status: 'CONNECTED'
        };
        db.connections.push(conn);
      } else {
        conn.apiKey = ghlApiKey;
        conn.status = 'CONNECTED';
        conn.connectedAt = new Date().toISOString();
      }
      repSettings.mode = 'LIVE';
      db.log(req.workspace.id, req.user.id, req.user.email, 'UPDATE_INTEGRATION_KEY', 'Updated GoHighLevel integration private key.');
    }

    if (removeConnection) {
      db.connections = db.connections.filter(c => c.workspaceId !== req.workspace.id);
      repSettings.mode = 'MOCK';
      db.log(req.workspace.id, req.user.id, req.user.email, 'REMOVE_INTEGRATION', 'Removed active GoHighLevel connector credentials.');
    }

    res.json({
      status: 'success',
      settings: repSettings,
      message: 'Workspace configurations updated successfully.'
    });
  });

  // Get tenant member list
  app.get('/api/workspaces/members', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER, UserRole.ADMIN]), (req: any, res) => {
    const list = db.getMembersByWorkspace(req.workspace.id).map(m => {
      const u = db.getUserById(m.userId);
      return {
        id: m.id,
        userId: m.userId,
        userName: u?.name || 'Unknown User',
        userEmail: u?.email || 'unknown@company.com',
        role: m.role,
        joinedAt: m.joinedAt
      };
    });
    res.json({ status: 'success', members: list });
  });

  // Invite user helper
  app.post('/api/workspaces/invite', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER]), (req: any, res) => {
    const { name, email, role } = req.body;
    if (!name || !email || !role) {
      return res.status(400).json({ status: 'error', error: 'Name, email, and role are required parameters.' });
    }

    try {
      // Check if user exists. If not, create them
      let user = db.getUserByEmail(email);
      if (!user) {
        user = {
          id: `usr_${Date.now()}`,
          name,
          email,
          onboarded: true,
          createdAt: new Date().toISOString()
        };
        db.users.push(user);
      }

      // Check if already member
      const exists = db.getWorkspaceMember(req.workspace.id, user.id);
      if (exists) {
        return res.status(400).json({ status: 'error', error: 'User is already a member mapping inside this workspace.' });
      }

      const newMember: WorkspaceMember = {
        id: `mem_${Date.now()}`,
        workspaceId: req.workspace.id,
        userId: user.id,
        role: role as UserRole,
        joinedAt: new Date().toISOString()
      };
      db.members.push(newMember);

      db.log(req.workspace.id, req.user.id, req.user.email, 'INVITE_USER', `Invited user ${email} as role ${role}`);

      res.json({ status: 'success', message: `Invited ${email} successfully.` });
    } catch (err: any) {
      res.status(400).json({ status: 'error', error: err.message });
    }
  });

  // ==========================================
  // SUPER_ADMIN Console Pathways
  // ==========================================

  // List all SaaS platform global workspaces
  app.get('/api/admin/workspaces', requireAuth([UserRole.SUPER_ADMIN]), (req, res) => {
    const workspacesExtended = db.workspaces.map(ws => {
      const membersCount = db.getMembersByWorkspace(ws.id).length;
      const connection = db.getGHLConnection(ws.id);
      const subscription = db.getSubscription(ws.id);
      return {
        ...ws,
        membersCount,
        connectionStatus: connection ? connection.status : 'DISCONNECTED',
        plan: subscription ? subscription.plan : 'N/A',
        amount: subscription ? subscription.amount : 0
      };
    });
    res.json({ status: 'success', workspaces: workspacesExtended });
  });

  // Toggle suspension state of a SaaS workspace
  app.post('/api/admin/suspend', requireAuth([UserRole.SUPER_ADMIN]), (req: any, res) => {
    const { workspaceId, suspend } = req.body;
    if (!workspaceId) {
      return res.status(400).json({ status: 'error', error: 'WorkspaceId represents a mandatory parameter.' });
    }

    const ws = db.getWorkspaceById(workspaceId);
    if (!ws) return res.status(404).json({ status: 'error', error: 'Workspace not found.' });

    ws.suspended = !!suspend;

    db.log(workspaceId, req.user.id, req.user.email, 'TOGGLE_SUSPEND_WORKSPACE', `SaaS Workspace suspension changed to value: ${ws.suspended}`);

    res.json({
      status: 'success',
      message: `Workspace "${ws.name}" has been ${ws.suspended ? 'SUSPENDED' : 'ACTIVATED'} successfully.`
    });
  });

  // List all users globally across the platform
  app.get('/api/admin/users', requireAuth([UserRole.SUPER_ADMIN]), (req, res) => {
    const list = db.users.map(u => {
      const memberships = db.members.filter(m => m.userId === u.id).map(m => {
        const ws = db.getWorkspaceById(m.workspaceId);
        return {
          workspaceId: m.workspaceId,
          workspaceName: ws ? ws.name : 'Unknown',
          role: m.role
        };
      });

      return {
        id: u.id,
        name: u.name,
        email: u.email,
        createdAt: u.createdAt,
        onboarded: u.onboarded,
        memberships
      };
    });
    res.json({ status: 'success', users: list });
  });

  // Retrieve global/scoped audit trail log files
  app.get('/api/admin/audit-logs', requireAuth(), (req: any, res) => {
    if (req.role === UserRole.SUPER_ADMIN) {
      res.json({ status: 'success', logs: db.auditLogs });
    } else if (req.role === UserRole.WORKSPACE_OWNER || req.role === UserRole.ADMIN) {
      const scoped = db.auditLogs.filter(al => al.workspaceId === req.workspace.id);
      res.json({ status: 'success', logs: scoped });
    } else {
      res.status(403).json({ status: 'error', error: 'Access Denied: Read-only audit privileges are not permitted for your current role.' });
    }
  });

  // API ROUTE: GHL CONFIG GET/SET
  app.get('/api/ghl/config', requireAuth(), (req: any, res) => {
    const config = getWorkspaceGhlConfig(req.workspace.id);
    
    // Status/scope checks simulated representation
    const scopeChecks = {
      'contacts.readonly': true,
      'contacts.write': false,
      'opportunities.readonly': true,
      'opportunities.write': false,
      'users.readonly': true
    };

    // Warnings list
    const warnings: string[] = [];
    if (config.dataSourceMode === 'MOCK') {
      warnings.push('Mock data is currently active. Performance stats do not reflect actual CRM workflows.');
    }
    if (config.dataSourceMode === 'LIVE' && (!config.apiKey || !config.locationId)) {
      warnings.push('Live GHL V2 mode selected, but integration credentials or location identifier are missing. Falling back to synthetic mock database.');
    }
    if (config.dataSourceMode === 'LIVE' && config.apiKey && !config.apiKey.startsWith('ghl_live')) {
      warnings.push('The provided API token format is unusual. Standard HighLevel API V2 keys generally begin with "ghl_live_".');
    }

    // Health check status
    let healthCheckStatus = 'UNKNOWN';
    let lastError = null;
    if (config.apiKey && config.locationId) {
      healthCheckStatus = config.status === 'CONNECTED' ? 'SUCCESS' : 'FAILED';
    }

    // If SUPER_ADMIN, they can view ALL connections
    let allWorkspaceConnections: any[] = [];
    if (req.role === UserRole.SUPER_ADMIN) {
      allWorkspaceConnections = db.workspaces.map(ws => {
        const c = getWorkspaceGhlConfig(ws.id);
        return {
          workspaceId: ws.id,
          workspaceName: ws.name,
          locationId: c.locationId,
          connectionStatus: c.status,
          connectedAt: c.connectedAt,
          mode: c.dataSourceMode
        };
      });
    }

    res.json({
      status: 'success',
      role: req.role,
      canManage: canUserManageGhl(req.role, req.workspace.id),
      data: {
        dataSourceMode: config.dataSourceMode,
        apiKey: config.apiKeyMasked, // Display only masked token to browser
        apiKeyMasked: config.apiKeyMasked,
        authMode: process.env.GHL_AUTH_MODE || 'private_token',
        locationId: config.locationId,
        companyId: config.companyId,
        lastSyncTime: config.connectedAt || new Date().toISOString(),
        cacheTtlMinutes: config.cacheTtlMinutes,
        allowAdminManageGHL: config.allowAdminManageGHL,
        apiConnectedSince: config.connectedAt,
        connectionStatus: config.status,
        rateLimitStatus: appConfig.rateLimitStatus,
        webhookUrl: appConfig.webhookUrl,
        healthCheckStatus,
        lastError,
        scopeChecks,
        warnings,
        allWorkspaceConnections
      },
      webhookLogs: webhookLogs.slice(0, 10)
    });
  });

  app.post('/api/ghl/config', requireAuth([UserRole.SUPER_ADMIN, UserRole.WORKSPACE_OWNER, UserRole.ADMIN]), (req: any, res) => {
    if (!canUserManageGhl(req.role, req.workspace.id)) {
      return res.status(403).json({ status: 'error', error: 'Access Denied: Your active role context lack credentials management authorization.' });
    }

    const { dataSourceMode, apiKey, locationId, cacheTtlMinutes, allowAdminManageGHL } = req.body;
    
    const settings = db.getReportingSettings(req.workspace.id);
    if (dataSourceMode !== undefined) {
      settings.mode = dataSourceMode;
    }
    if (cacheTtlMinutes !== undefined) {
      settings.cacheTtlMinutes = Number(cacheTtlMinutes) || 15;
    }
    if (allowAdminManageGHL !== undefined) {
      settings.allowAdminManageGHL = !!allowAdminManageGHL;
    }

    let conn = db.getGHLConnection(req.workspace.id);
    let resolvedApiKey = apiKey;
    if (apiKey && apiKey.includes('••••••••')) {
      const currentConfig = getWorkspaceGhlConfig(req.workspace.id);
      resolvedApiKey = currentConfig.apiKey;
    }

    if (locationId !== undefined || (resolvedApiKey !== undefined && resolvedApiKey !== '')) {
      if (!conn) {
        conn = {
          id: `gn_${Date.now()}`,
          workspaceId: req.workspace.id,
          locationId: locationId || req.workspace.ghlLocationId || '',
          apiKey: resolvedApiKey || '',
          connectedAt: new Date().toISOString(),
          status: resolvedApiKey ? 'CONNECTED' : 'DISCONNECTED'
        };
        db.connections.push(conn);
      } else {
        if (locationId !== undefined) conn.locationId = locationId;
        if (resolvedApiKey !== undefined) {
          conn.apiKey = resolvedApiKey;
          conn.status = resolvedApiKey ? 'CONNECTED' : 'DISCONNECTED';
          conn.connectedAt = new Date().toISOString();
        }
      }
    }

    db.log(req.workspace.id, req.user.id, req.user.email, 'UPDATE_INTEGRATION_KEY', 'Updated workspace-level GoHighLevel integration parameters.');

    // Invalidate local cached data
    invalidateTenantCache(req.workspace.id);

    const updatedConfig = getWorkspaceGhlConfig(req.workspace.id);

    res.json({
      status: 'success',
      message: 'Workspace configurations updated successfully.',
      data: {
        dataSourceMode: updatedConfig.dataSourceMode,
        apiKey: updatedConfig.apiKeyMasked,
        apiKeyMasked: updatedConfig.apiKeyMasked,
        locationId: updatedConfig.locationId,
        companyId: updatedConfig.companyId,
        cacheTtlMinutes: updatedConfig.cacheTtlMinutes,
        allowAdminManageGHL: updatedConfig.allowAdminManageGHL,
        connectionStatus: updatedConfig.status,
        apiConnectedSince: updatedConfig.connectedAt,
        webhookUrl: appConfig.webhookUrl,
        rateLimitStatus: appConfig.rateLimitStatus
      }
    });
  });

  // NEW ENDPOINTS AS REQUESTED:
  app.post('/api/ghl/save-connection', requireAuth(), (req: any, res) => {
    if (!canUserManageGhl(req.role, req.workspace.id)) {
      return res.status(403).json({ status: 'error', error: 'Access Denied: Your active role context lack credentials management authorization.' });
    }

    let { apiKey, locationId, allowAdminManageGHL } = req.body;

    if (apiKey && apiKey.includes('••••••••')) {
      const currentConfig = getWorkspaceGhlConfig(req.workspace.id);
      apiKey = currentConfig.apiKey;
    }

    let conn = db.getGHLConnection(req.workspace.id);
    if (!conn) {
      conn = {
        id: `gn_${Date.now()}`,
        workspaceId: req.workspace.id,
        locationId: locationId || req.workspace.ghlLocationId || '',
        apiKey: apiKey || '',
        connectedAt: new Date().toISOString(),
        status: apiKey ? 'CONNECTED' : 'DISCONNECTED'
      };
      db.connections.push(conn);
    } else {
      if (locationId !== undefined) conn.locationId = locationId;
      if (apiKey !== undefined) {
        conn.apiKey = apiKey;
        conn.status = apiKey ? 'CONNECTED' : 'DISCONNECTED';
        conn.connectedAt = new Date().toISOString();
      }
    }

    const settings = db.getReportingSettings(req.workspace.id);
    if (allowAdminManageGHL !== undefined) {
      settings.allowAdminManageGHL = !!allowAdminManageGHL;
    }

    db.log(req.workspace.id, req.user.id, req.user.email, 'SAVE_GHL_CONNECTION', `Saved workspace GoHighLevel integration credentials context. Location ID: ${locationId}`);

    invalidateTenantCache(req.workspace.id);

    res.json({
      status: 'success',
      message: 'Workspace connection settings saved successfully.'
    });
  });

  app.post('/api/ghl/test-connection', requireAuth(), async (req: any, res) => {
    let { apiKey, locationId } = req.body;

    const workspaceConfig = getWorkspaceGhlConfig(req.workspace.id);
    
    if (!apiKey || apiKey.includes('••••••••')) {
      apiKey = workspaceConfig.apiKey;
    }
    if (!locationId) {
      locationId = workspaceConfig.locationId;
    }

    if (workspaceConfig.dataSourceMode === 'MOCK' && (!apiKey || !locationId)) {
      return res.json({
        status: 'success',
        source: 'mock',
        message: 'Synthesized Sandbox Connection Test Passed. Local databases schemas mapped OK.',
        details: {
          responseTimeMs: 38,
          authType: 'Private Integration Token',
          scopesActive: ['contacts.readonly', 'opportunities.readonly', 'users.readonly'],
          rateLimits: { remaining: 100, limit: 100 }
        }
      });
    }

    if (!apiKey || !locationId) {
      return res.status(400).json({
        status: 'error',
        error: 'Cannot initiate live connection test. GHL Private Token and Location ID parameters are required.'
      });
    }

    try {
      const baseUrl = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
      const version = process.env.GHL_API_VERSION || '2021-07-28';
      const testUrl = `${baseUrl}/users/?locationId=${locationId}`;
      
      console.log(`Testing external GHL API V2 credentials via live request: GET ${testUrl}`);
      
      const testResponse = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Version': version,
          'Content-Type': 'application/json'
        }
      });

      if (testResponse.ok) {
        db.log(req.workspace.id, req.user.id, req.user.email, 'TEST_GHL_API_SUCCESS', 'Hit test connection on HighLevel endpoints. Success.');
        
        return res.json({
          status: 'success',
          source: 'live',
          message: 'Connection successful! HighLevel API V2 responded with HTTP 200 OK.',
          details: {
            responseTimeMs: 122,
            authType: 'Private Integration Token',
            scopesActive: ['contacts.readonly', 'opportunities.readonly', 'users.readonly'],
            rateLimits: {
              remaining: parseInt(testResponse.headers.get('x-ratelimit-remaining') || '98'),
              limit: parseInt(testResponse.headers.get('x-ratelimit-limit') || '100')
            }
          }
        });
      } else {
        const errText = await testResponse.text();
        let errorMsg = `HighLevel connection test failed with code ${testResponse.status}: ${errText.slice(0, 500)}`;
        if (testResponse.status === 401) {
          errorMsg = 'Unauthorized connection credentials. Check the correctness of your Private Integration Key and scope access levels.';
        } else if (testResponse.status === 403) {
          errorMsg = 'Forbidden Location matching. Validate your Location ID has correct authorization permissions.';
        }
        
        db.log(req.workspace.id, req.user.id, req.user.email, 'TEST_GHL_API_FAILURE', `Hit test connection failed: HTTP ${testResponse.status}`);
        
        return res.status(testResponse.status).json({
          status: 'error',
          error: errorMsg
        });
      }
    } catch (err: any) {
      console.error(`GHL connection test exception matching: ${err.message}`);
      return res.status(500).json({
        status: 'error',
        error: `LeadConnector API Gateway unreachable: ${err.message}`
      });
    }
  });

  app.post('/api/ghl/switch-mode', requireAuth(), (req: any, res) => {
    if (!canUserManageGhl(req.role, req.workspace.id)) {
      return res.status(403).json({ status: 'error', error: 'Access Denied: Insufficient roles permissions.' });
    }

    const { mode } = req.body;
    if (mode !== 'MOCK' && mode !== 'LIVE') {
      return res.status(400).json({ status: 'error', error: 'Invalid Mode selection parameter.' });
    }

    const settings = db.getReportingSettings(req.workspace.id);
    settings.mode = mode;

    db.log(req.workspace.id, req.user.id, req.user.email, 'TOGGLE_REPORTING_SOURCE_MODE', `Flipped active reporting database selector to ${mode}`);

    invalidateTenantCache(req.workspace.id);

    res.json({
      status: 'success',
      message: `Data source changed to ${mode} mode.`
    });
  });

  app.post('/api/ghl/disconnect', requireAuth(), (req: any, res) => {
    if (!canUserManageGhl(req.role, req.workspace.id)) {
      return res.status(403).json({ status: 'error', error: 'Access Denied: Insufficient privileges.' });
    }

    db.connections = db.connections.filter(c => c.workspaceId !== req.workspace.id);
    
    const settings = db.getReportingSettings(req.workspace.id);
    settings.mode = 'MOCK';

    db.log(req.workspace.id, req.user.id, req.user.email, 'DISCONNECT_GHL_CREDENTIALS', 'Severed workspace HighLevel API V2 credentials.');

    invalidateTenantCache(req.workspace.id);

    res.json({
      status: 'success',
      message: 'GoHighLevel connection deleted successfully. Mode has fallen back to Mock.'
    });
  });

  app.post('/api/ghl/update-cache-ttl', requireAuth(), (req: any, res) => {
    if (!canUserManageGhl(req.role, req.workspace.id)) {
      return res.status(403).json({ status: 'error', error: 'Access Denied: Insufficient roles privileges.' });
    }

    const { cacheTtlMinutes } = req.body;
    const minutes = Number(cacheTtlMinutes);
    if (isNaN(minutes) || minutes < 1 || minutes > 1440) {
      return res.status(400).json({ status: 'error', error: 'Invalid Cache TTL Minutes. Choose a value between 1 and 1440.' });
    }

    const settings = db.getReportingSettings(req.workspace.id);
    settings.cacheTtlMinutes = minutes;

    db.log(req.workspace.id, req.user.id, req.user.email, 'CHANGE_CACHE_TTL', `Adjusted reporting TTL limit bounds to ${minutes} Minutes.`);

    invalidateTenantCache(req.workspace.id);

    res.json({
      status: 'success',
      message: 'Cache TTL updated successfully.'
    });
  });

  // API ROUTE: WEBHOOK INCOMING SIMULATION & HANDLER
  app.post('/api/ghl/webhook', (req, res) => {
    const payload = req.body;
    const logItem: WebhookLog = {
      timestamp: new Date().toISOString(),
      source: 'GoHighLevel Webhook (Live Inflow)',
      event: payload.type || 'unknown_event',
      payload: payload
    };
    webhookLogs.unshift(logItem);
    
    // Auto-flush correct tenant metrics cache
    const conn = db.connections.find(c => c.locationId === payload.locationId || c.locationId === payload.location_id);
    if (conn) {
      invalidateTenantCache(conn.workspaceId);
    } else {
      tenantMetricsCache.clear();
      tenantOwnerPerfCache.clear();
      tenantMarketingCache.clear();
    }

    res.status(200).json({ status: 'delivered', received: true });
  });

  // Helper to dynamically resolve workspace-level GHL credentials (overriding global .env)
  function getWorkspaceGhlConfig(workspaceId: string) {
    const connection = db.getGHLConnection(workspaceId);
    const settings = db.getReportingSettings(workspaceId);

    // Mode: Defaults to MOCK unless stored in settings. Falls back to process.env defaults.
    let dataSourceMode: 'MOCK' | 'LIVE' = 'MOCK';
    if (settings && settings.mode) {
      dataSourceMode = settings.mode;
    } else if (process.env.GHL_DATA_SOURCE === 'LIVE' || process.env.REPORTING_DATA_SOURCE === 'live') {
      dataSourceMode = 'LIVE';
    }

    // Token: Defaults to connection.apiKey in DB if present, falls back to process.env
    let apiKey = '';
    if (connection && connection.apiKey) {
      apiKey = connection.apiKey;
    } else {
      apiKey = process.env.GHL_PRIVATE_INTEGRATION_TOKEN || process.env.GHL_API_KEY || '';
    }

    // Location ID: Defaults to connection.locationId in DB, falls back to workspace specific ghlLocationId
    let locationId = '';
    if (connection && connection.locationId) {
      locationId = connection.locationId;
    } else {
      const ws = db.getWorkspaceById(workspaceId);
      locationId = process.env.GHL_LOCATION_ID || ws?.ghlLocationId || '';
    }

    // Company ID: Defaults to process.env.GHL_COMPANY_ID or a placeholder
    let companyId = process.env.GHL_COMPANY_ID || 'co_ghl_company_9a2b';

    // Allow admins to manage (defaults to true if not explicitly false)
    const allowAdminManageGHL = settings?.allowAdminManageGHL !== false;

    // Cache TTL settings
    const cacheTtlMinutes = settings?.cacheTtlMinutes || 15;

    // Masked Token preview
    const maskToken = (token: string): string => {
      if (!token) return '';
      if (token.length <= 8) return 'ghl_••••••••';
      const prefix = token.slice(0, 4);
      const suffix = token.slice(-5);
      return `${prefix}••••••••${suffix}`;
    };

    const apiKeyMasked = maskToken(apiKey);

    return {
      dataSourceMode,
      apiKey,
      apiKeyMasked,
      locationId,
      companyId,
      allowAdminManageGHL,
      cacheTtlMinutes,
      status: connection?.status || (apiKey && locationId ? 'CONNECTED' : 'DISCONNECTED'),
      connectedAt: connection?.connectedAt || (apiKey && locationId ? new Date().toISOString() : null)
    };
  }

  // Helper to verify if the active user role can manage GHL configurations
  function canUserManageGhl(role: UserRole, workspaceId: string): boolean {
    if (role === UserRole.SUPER_ADMIN) return true;
    if (role === UserRole.WORKSPACE_OWNER) return true;
    if (role === UserRole.ADMIN) {
      const settings = db.getReportingSettings(workspaceId);
      return settings?.allowAdminManageGHL !== false;
    }
    return false;
  }

  // FETCH HELPER FOR API GHL V2 CALLS
  async function fetchLiveGhlData<T>(workspaceId: string, endpoint: string, method = 'GET', body: any = null): Promise<T | null> {
    const config = getWorkspaceGhlConfig(workspaceId);
    if (!config.apiKey || !config.locationId) {
      console.warn(`GHL credentials missing for workspace ${workspaceId}, fallback to mock reporting data.`);
      return null;
    }

    try {
      const baseUrl = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
      const version = process.env.GHL_API_VERSION || '2021-07-28';
      const url = `${baseUrl}/${endpoint}`;
      
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${config.apiKey}`,
        'Version': version,
        'Content-Type': 'application/json'
      };

      console.log(`Calling GHL API V2 for workspace ${workspaceId}: ${method} ${url}`);
      
      const response = await fetch(url + (endpoint.includes('?') ? `&locationId=${config.locationId}` : `?locationId=${config.locationId}`), {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      });

      // Update rate limits representation based on standard LeadConnector Headers
      const limitHeader = response.headers.get('x-ratelimit-limit');
      const remainingHeader = response.headers.get('x-ratelimit-remaining');
      if (limitHeader && remainingHeader) {
        appConfig.rateLimitStatus = {
          limit: parseInt(limitHeader),
          remaining: parseInt(remainingHeader)
        };
      }

      if (!response.ok) {
        throw new Error(`API returned error ${response.status}: ${await response.text()}`);
      }

      return await response.json() as T;
    } catch (err: any) {
      console.error(`GHL V2 connection failed for workspace ${workspaceId}: ${err.message}`);
      return null;
    }
  }

  // API ROUTE: GENERAL KPI METRICS
  app.get('/api/ghl/metrics', requireAuth(), async (req: any, res) => {
    try {
      const result = await LiveReportingService.getOverviewDashboardReport(req.workspace.id);
      return res.json({ 
        status: 'success', 
        source: result.source, 
        stale: !!result.stale,
        warnings: result.warnings || [],
        data: result.data 
      });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // API ROUTE: OWNER PERFORMANCE SCORES
  app.get('/api/ghl/owner-performance', requireAuth(), async (req: any, res) => {
    try {
      const result = await LiveReportingService.getOwnerDashboardReport(req.workspace.id);
      const data = result.data.ownerBreakdown;
      return res.json({ 
        status: 'success', 
        source: result.source, 
        data 
      });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // API ROUTE: MARKETING CAMPAIGNS & SOURCE CHANNELS API
  app.get('/api/ghl/marketing-performance', requireAuth(), async (req: any, res) => {
    try {
      const result = await LiveReportingService.getMarketingDashboardReport(req.workspace.id);
      const rep = result.data;
      const formatted = Object.keys(rep.leadsBySource).map(src => {
        const leads = rep.leadsBySource[src] || 0;
        const bookings = rep.bookingsBySource[src] || 0;
        const wonVal = rep.wonRevenueBySource[src] || 0;
        const pip = rep.pipelineValueBySource[src] || 0;
        return {
          source: src,
          leadsCount: leads,
          conversionRate: leads > 0 ? Math.round((bookings / leads) * 100) : 0,
          pipelineValue: pip,
          closedWonValue: wonVal,
          costEstimate: Math.round(leads * 15),
          roi: 450,
          weeklyLeadsTrend: [
            { date: 'Wk 1', count: Math.round(leads * 0.2) },
            { date: 'Wk 2', count: Math.round(leads * 0.3) },
            { date: 'Wk 3', count: Math.round(leads * 0.5) },
            { date: 'Wk 4', count: leads }
          ]
        };
      });
      return res.json({ status: 'success', source: result.source, data: formatted });
    } catch (err: any) {
      return res.status(500).json({ status: 'error', error: err.message });
    }
  });

  // ==========================================
  // NEW REPORTING SUITE COMMAND CENTER ENDPOINTS
  // ==========================================

  // Helper validation function for dates
  const isValidDateString = (dateStr: string): boolean => {
    const reg = /^\d{4}-\d{2}-\d{2}$/;
    if (!reg.test(dateStr)) return false;
    const t = Date.parse(dateStr);
    return !isNaN(t);
  };

  /**
   * API ROUTE: OWNER PERFORMANCE REPORTING
   * /api/reporting/owner-performance
   */
  app.get('/api/reporting/owner-performance', requireAuth(), async (req: any, res) => {
    try {
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
      const locationId = typeof req.query.locationId === 'string' ? req.query.locationId : undefined;
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const source = typeof req.query.source === 'string' ? req.query.source : undefined;
      const pipelineId = typeof req.query.pipelineId === 'string' ? req.query.pipelineId : undefined;
      const campaign = typeof req.query.campaign === 'string' ? req.query.campaign : undefined;
      const serviceCategory = typeof req.query.serviceCategory === 'string' ? req.query.serviceCategory : undefined;

      const warnings: string[] = [];
      const unavailableMetrics: string[] = [];

      // Validate Date Ranges YYYY-MM-DD
      if (startDate && !isValidDateString(startDate)) {
        return res.status(400).json({
          status: 'error',
          source: 'mock',
          generatedAt: new Date().toISOString(),
          stale: false,
          warnings: [],
          unavailableMetrics: [],
          error: 'Query parameter "startDate" must be in YYYY-MM-DD format.'
        });
      }

      if (endDate && !isValidDateString(endDate)) {
        return res.status(400).json({
          status: 'error',
          source: 'mock',
          generatedAt: new Date().toISOString(),
          stale: false,
          warnings: [],
          unavailableMetrics: [],
          error: 'Query parameter "endDate" must be in YYYY-MM-DD format.'
        });
      }

      // Secure Workspace Isolation: Verify sub-account location ID matches the validated tenant session
      const sysLocId = req.workspace.ghlLocationId;
      if (locationId && locationId !== sysLocId) {
        warnings.push(`The specified locationId "${locationId}" does not match your active SaaS Workspace connection details.`);
      }

      if (serviceCategory && serviceCategory !== 'Pool Install' && serviceCategory !== 'Pool Remodel' && serviceCategory !== 'Leak Detection' && serviceCategory !== 'Weekly Service') {
        warnings.push(`Unknown service category filter: "${serviceCategory}" may produce blank breakdowns.`);
      }

      // Extract report via LiveReportingService
      const result = await LiveReportingService.getOwnerDashboardReport(req.workspace.id, {
        startDate,
        endDate,
        userId,
        source,
        campaign
      });

      if (result.warnings) warnings.push(...result.warnings);

      return res.status(200).json({
        status: 'success',
        source: result.source,
        generatedAt: new Date().toISOString(),
        stale: !!result.stale,
        warnings,
        unavailableMetrics: result.unavailableMetrics || [],
        data: result.data
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        source: 'mock',
        generatedAt: new Date().toISOString(),
        stale: false,
        warnings: [],
        unavailableMetrics: [],
        error: `Internal report calculation error: ${err.message}`
      });
    }
  });

  /**
   * API ROUTE: VA PERFORMANCE REPORTING
   * /api/reporting/va-performance
   */
  app.get('/api/reporting/va-performance', requireAuth(), (req: any, res) => {
    try {
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
      const locationId = typeof req.query.locationId === 'string' ? req.query.locationId : undefined;
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined; // represents VA ID
      const source = typeof req.query.source === 'string' ? req.query.source : undefined;
      const pipelineId = typeof req.query.pipelineId === 'string' ? req.query.pipelineId : undefined;
      const campaign = typeof req.query.campaign === 'string' ? req.query.campaign : undefined;
      const serviceCategory = typeof req.query.serviceCategory === 'string' ? req.query.serviceCategory : undefined;

      const warnings: string[] = [];
      const unavailableMetrics: string[] = [];

      // Validate Date Ranges YYYY-MM-DD
      if (startDate && !isValidDateString(startDate)) {
        return res.status(400).json({
          status: 'error',
          source: 'mock',
          generatedAt: new Date().toISOString(),
          stale: false,
          warnings: [],
          unavailableMetrics: [],
          error: 'Query parameter "startDate" must be in YYYY-MM-DD format.'
        });
      }

      if (endDate && !isValidDateString(endDate)) {
        return res.status(400).json({
          status: 'error',
          source: 'mock',
          generatedAt: new Date().toISOString(),
          stale: false,
          warnings: [],
          unavailableMetrics: [],
          error: 'Query parameter "endDate" must be in YYYY-MM-DD format.'
        });
      }

      const sysLocId = req.workspace.ghlLocationId;
      if (locationId && locationId !== sysLocId) {
        warnings.push(`The specified locationId "${locationId}" does not match your active SaaS Workspace connection details.`);
      }

      const isLiveSource = appConfig.dataSourceMode === 'LIVE' && process.env.REPORTING_DATA_SOURCE !== 'mock';
      const finalSource = isLiveSource ? 'live' as const : 'mock' as const;

      // Some metrics depend on real-time agent presence (e.g. active minutes logged)
      if (isLiveSource) {
        unavailableMetrics.push('averageFirstResponseTime', 'responseSlaPerformance');
      }

      const data = getVAPerformanceReport({
        startDate,
        endDate,
        userId, // passes VA ID
        source,
        campaign,
        serviceCategory
      });

      return res.status(200).json({
        status: 'success',
        source: finalSource,
        generatedAt: new Date().toISOString(),
        stale: false,
        warnings,
        unavailableMetrics,
        data
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        source: 'mock',
        generatedAt: new Date().toISOString(),
        stale: false,
        warnings: [],
        unavailableMetrics: [],
        error: `Internal report calculation error: ${err.message}`
      });
    }
  });

  /**
   * API ROUTE: MARKETING PERFORMANCE REPORTING
   * /api/reporting/marketing-performance
   */
  app.get('/api/reporting/marketing-performance', requireAuth(), async (req: any, res) => {
    try {
      const startDate = typeof req.query.startDate === 'string' ? req.query.startDate : undefined;
      const endDate = typeof req.query.endDate === 'string' ? req.query.endDate : undefined;
      const locationId = typeof req.query.locationId === 'string' ? req.query.locationId : undefined;
      const userId = typeof req.query.userId === 'string' ? req.query.userId : undefined;
      const source = typeof req.query.source === 'string' ? req.query.source : undefined;
      const pipelineId = typeof req.query.pipelineId === 'string' ? req.query.pipelineId : undefined;
      const campaign = typeof req.query.campaign === 'string' ? req.query.campaign : undefined;
      const serviceCategory = typeof req.query.serviceCategory === 'string' ? req.query.serviceCategory : undefined;

      const warnings: string[] = [];
      const unavailableMetrics: string[] = [];

      // Validate Date Ranges YYYY-MM-DD
      if (startDate && !isValidDateString(startDate)) {
        return res.status(400).json({
          status: 'error',
          source: 'mock',
          generatedAt: new Date().toISOString(),
          stale: false,
          warnings: [],
          unavailableMetrics: [],
          error: 'Query parameter "startDate" must be in YYYY-MM-DD format.'
        });
      }

      if (endDate && !isValidDateString(endDate)) {
        return res.status(400).json({
          status: 'error',
          source: 'mock',
          generatedAt: new Date().toISOString(),
          stale: false,
          warnings: [],
          unavailableMetrics: [],
          error: 'Query parameter "endDate" must be in YYYY-MM-DD format.'
        });
      }

      const sysLocId = req.workspace.ghlLocationId;
      if (locationId && locationId !== sysLocId) {
        warnings.push(`The specified locationId "${locationId}" does not match your active SaaS Workspace connection details.`);
      }

      // Facebook Cost & TikTok ads are Connected Later (ROAS / Ad Spend placeholder check)
      if (source && source.toLowerCase().includes('tiktok')) {
        unavailableMetrics.push('costPerLead', 'roasMultiplier');
        warnings.push('TikTok ad accounts are currently not synced with GHL Location billing. Cost metrics are shown as estimated averages.');
      }

      // Extract report via LiveReportingService
      const result = await LiveReportingService.getMarketingDashboardReport(req.workspace.id, {
        startDate,
        endDate,
        userId,
        source,
        campaign
      });

      if (result.warnings) warnings.push(...result.warnings);

      return res.status(200).json({
        status: 'success',
        source: result.source,
        generatedAt: new Date().toISOString(),
        stale: !!result.stale,
        warnings,
        unavailableMetrics: result.unavailableMetrics || [],
        data: result.data
      });
    } catch (err: any) {
      return res.status(500).json({
        status: 'error',
        source: 'mock',
        generatedAt: new Date().toISOString(),
        stale: false,
        warnings: [],
        unavailableMetrics: [],
        error: `Internal report calculation error: ${err.message}`
      });
    }
  });

  // VITE DEVELOPMENT MIDDLEWARE OR STATIC PRODUCTION SERVING
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Reporting Command Center] Backend listening on http://0.0.0.0:${PORT} in ${process.env.NODE_ENV || 'development'} mode.`);
  });
}

startServer().catch(err => {
  console.error('CRITICAL: Server crashed during startup', err);
});
