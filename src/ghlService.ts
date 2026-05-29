/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { db } from './mockSaaSStore.js';
import {
  GHLUser,
  GHLContact,
  GHLOpportunity,
  GHLAppointment,
  GHLConversation,
  OwnerPerformanceReport,
  MarketingPerformanceReport,
  TrendChartPoint,
  FunnelStage
} from './types.js';

import {
  getOwnerPerformanceReport as getMockOwnerReport,
  getMarketingPerformanceReport as getMockMarketingReport
} from './mockReportingData.js';

import {
  getDashboardMetrics as getMockDashboardMetrics
} from './mockData.js';

// ==========================================
// 1. RATE LIMIT TRACKER & CACHE STORE
// ==========================================

const globalRateLimits = { remaining: 100, limit: 100, resetTime: 0 };

interface CacheEntry { data: any; timestamp: number; ttlMs: number; }
const serverCacheMemory: Record<string, CacheEntry> = {};

// ==========================================
// 2. AUTH RESOLVER
// ==========================================

export function resolveGHLAuthentication(workspaceId: string): {
  authHeader: string;
  locationId: string;
  authType: 'OAuth' | 'PrivateToken';
} {
  const connection = db.getGHLConnection(workspaceId);
  if (!connection || !connection.apiKey) {
    // Use the correct Vercel env var name: GHL_PRIVATE_INTEGRATION_TOKEN
    const envApiKey = process.env.GHL_PRIVATE_INTEGRATION_TOKEN || process.env.GHL_API_KEY || '';
    const envLocId = process.env.GHL_LOCATION_ID || '';
    if (!envApiKey) {
      throw new Error('NO_CREDENTIALS: GoHighLevel API credentials are not configured for this workspace.');
    }
    return { authHeader: `Bearer ${envApiKey}`, locationId: envLocId, authType: 'PrivateToken' };
  }
  const isOAuth = connection.apiKey.startsWith('oauth_') || connection.apiKey.length > 100;
  return {
    authHeader: `Bearer ${connection.apiKey}`,
    locationId: connection.locationId,
    authType: isOAuth ? 'OAuth' : 'PrivateToken'
  };
}

// ==========================================
// 3. RATE-LIMIT-AWARE FETCH WRAPPER
// ==========================================

async function sleep(ms: number) {
  return new Promise<void>(resolve => setTimeout(resolve, ms));
}

export async function fetchFromGHLAPI<T>(
  endpoint: string,
  workspaceId: string,
  options: RequestInit = {}
): Promise<{ data: T | null; warnings: string[]; unavailableMetrics: string[] }> {
  const warnings: string[] = [];
  const unavailableMetrics: string[] = [];

  let authInfo: { authHeader: string; locationId: string };
  try {
    authInfo = resolveGHLAuthentication(workspaceId);
  } catch (err: any) {
    throw new Error(`AUTH_ERROR: ${err.message}`);
  }

  const { authHeader, locationId } = authInfo;
  const baseUrl = process.env.GHL_BASE_URL || 'https://services.leadconnectorhq.com';
  const apiVersion = process.env.GHL_API_VERSION || '2021-07-28';

  // Don't double-append locationId when the endpoint already carries it (e.g. opportunities uses location_id)
  const alreadyHasLocation = endpoint.includes('locationId=') || endpoint.includes('location_id=');
  const divider = endpoint.includes('?') ? '&' : '?';
  const fullUrl = `${baseUrl}/${endpoint}${(locationId && !alreadyHasLocation) ? `${divider}locationId=${locationId}` : ''}`;

  const headers = {
    'Authorization': authHeader,
    'Version': apiVersion,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };

  const maxRetries = 3;
  let attempt = 0;
  let delay = 1000;

  while (attempt < maxRetries) {
    attempt++;
    try {
      if (globalRateLimits.remaining <= 1 && Date.now() < globalRateLimits.resetTime) {
        const wait = globalRateLimits.resetTime - Date.now();
        console.warn(`[GHL] Rate-limit guard active — waiting ${wait}ms`);
        await sleep(wait + 100);
      }

      const response = await fetch(fullUrl, { ...options, headers });

      const rem = response.headers.get('x-ratelimit-remaining');
      const lim = response.headers.get('x-ratelimit-limit');
      const rst = response.headers.get('x-ratelimit-reset');
      if (rem) globalRateLimits.remaining = parseInt(rem, 10);
      if (lim) globalRateLimits.limit = parseInt(lim, 10);
      if (rst) {
        const s = parseInt(rst, 10);
        globalRateLimits.resetTime = Date.now() + (isNaN(s) ? 60 : s) * 1000;
      }

      if (response.status === 429) {
        console.warn(`[GHL] 429 rate limit — retry ${attempt} in ${delay}ms`);
        await sleep(delay);
        delay *= 2;
        continue;
      }
      if (response.status >= 502 && response.status <= 504) {
        console.warn(`[GHL] ${response.status} server error — retry ${attempt}`);
        await sleep(delay);
        delay *= 1.5;
        continue;
      }
      if (!response.ok) {
        const body = await response.text().catch(() => '');
        throw new Error(`GHL API HTTP ${response.status}: ${body.slice(0, 300)}`);
      }

      const payload = await response.json() as T;
      return { data: payload, warnings, unavailableMetrics };

    } catch (err: any) {
      if (attempt >= maxRetries) {
        console.error(`[GHL] Final failure on "${endpoint}" after ${maxRetries} attempts:`, err.message);
        throw err;
      }
      await sleep(delay);
      delay *= 2;
    }
  }

  return { data: null, warnings, unavailableMetrics };
}

// ==========================================
// 4. CACHE HELPERS
// ==========================================

export function getReportCache<T>(workspaceId: string, cacheKey: string): { data: T; stale: boolean } | null {
  const settings = db.getReportingSettings(workspaceId);
  const ttlMs = (settings.cacheTtlMinutes || 15) * 60 * 1000;
  const key = `${workspaceId}_${cacheKey}`;
  const cached = serverCacheMemory[key];
  if (!cached) return null;
  return { data: cached.data as T, stale: Date.now() - cached.timestamp > ttlMs };
}

export function setReportCache<T>(workspaceId: string, cacheKey: string, data: T) {
  serverCacheMemory[`${workspaceId}_${cacheKey}`] = { data, timestamp: Date.now(), ttlMs: 15 * 60 * 1000 };
}

export function invalidateWorkspaceCacheStore(workspaceId: string) {
  Object.keys(serverCacheMemory)
    .filter(k => k.startsWith(`${workspaceId}_`))
    .forEach(k => delete serverCacheMemory[k]);
  console.log(`[Cache] Flushed for workspace: ${workspaceId}`);
}

// ==========================================
// 5. DATE & BUCKETING HELPERS
// ==========================================

function isDateInFilterRange(itemDateStr: string, startDate?: string, endDate?: string): boolean {
  if (!startDate && !endDate) return true;
  const t = new Date(itemDateStr).getTime();
  if (isNaN(t)) return true;
  if (startDate && t < new Date(startDate).getTime()) return false;
  if (endDate && t > new Date(endDate + 'T23:59:59.999Z').getTime()) return false;
  return true;
}

// Bucket items into 4 equal segments; returns cumulative running count per segment
function bucketCountByWeek(items: any[], dateField: string, startMs: number, endMs: number): number[] {
  const seg = (endMs - startMs) / 4;
  const buckets = [0, 0, 0, 0];
  items.forEach(item => {
    const t = new Date(item[dateField]).getTime();
    if (isNaN(t)) return;
    const idx = Math.min(3, Math.floor((t - startMs) / seg));
    if (idx >= 0) buckets[idx]++;
  });
  let running = 0;
  return buckets.map(b => { running += b; return running; });
}

// Same but sums a numeric field instead of counting
function bucketValueByWeek(items: any[], dateField: string, valueField: string, startMs: number, endMs: number): number[] {
  const seg = (endMs - startMs) / 4;
  const buckets = [0, 0, 0, 0];
  items.forEach(item => {
    const t = new Date(item[dateField]).getTime();
    if (isNaN(t)) return;
    const idx = Math.min(3, Math.floor((t - startMs) / seg));
    if (idx >= 0) buckets[idx] += Number(item[valueField]) || 0;
  });
  let running = 0;
  return buckets.map(b => { running += b; return running; });
}

function mapAppointmentStatus(status: string): 'confirmed' | 'showed' | 'noshow' | 'cancelled' {
  const s = (status || '').toLowerCase();
  if (s === 'showed' || s === 'attended' || s === 'completed') return 'showed';
  if (s === 'noshow' || s === 'no-show' || s === 'no_show') return 'noshow';
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  return 'confirmed'; // 'new', 'confirmed', 'invalid' → confirmed for counting purposes
}

// ==========================================
// 6. PAGINATED DATA FETCHERS
// ==========================================

// Contacts: GHL v2 uses cursor-based pagination (startAfterId / startAfter)
async function fetchAllContacts(workspaceId: string): Promise<any[]> {
  const all: any[] = [];
  let startAfterId = '';
  let startAfter = '';
  for (let page = 0; page < 10; page++) {
    const params: Record<string, string> = { limit: '100' };
    if (startAfterId) { params.startAfterId = startAfterId; params.startAfter = startAfter; }
    const res = await fetchFromGHLAPI<{ contacts?: any[]; meta?: { startAfterId?: string; startAfter?: string } }>(
      `contacts/?${new URLSearchParams(params)}`, workspaceId
    );
    const batch = res.data?.contacts ?? [];
    all.push(...batch);
    if (batch.length < 100 || !res.data?.meta?.startAfterId) break;
    startAfterId = res.data.meta.startAfterId;
    startAfter = res.data.meta.startAfter || '';
  }
  return all;
}

// Opportunities: GHL v2 uses page-based pagination AND snake_case location_id param
async function fetchAllOpportunities(workspaceId: string, locationId: string): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; page <= 10; page++) {
    // location_id (snake_case) is required by this endpoint; alreadyHasLocation check prevents double-append
    const res = await fetchFromGHLAPI<{ opportunities?: any[]; meta?: { nextPage?: number } }>(
      `opportunities/search?location_id=${encodeURIComponent(locationId)}&limit=100&page=${page}`, workspaceId
    );
    const batch = res.data?.opportunities ?? [];
    all.push(...batch);
    if (batch.length < 100 || !res.data?.meta?.nextPage) break;
  }
  return all;
}

// Conversations: GHL v2 page-based, correct endpoint is conversations/search
async function fetchAllConversations(workspaceId: string): Promise<any[]> {
  const all: any[] = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetchFromGHLAPI<{ conversations?: any[]; meta?: any }>(
      `conversations/search?limit=100&page=${page}`, workspaceId
    );
    const batch = res.data?.conversations ?? [];
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}

// ==========================================
// 7. CORE CRM DATA FETCHER
// ==========================================

export async function getLiveCRMData(
  workspaceId: string,
  opts: { startDate?: string; endDate?: string } = {}
) {
  const warnings: string[] = [];
  const unavailableMetrics: string[] = [];

  // Resolve auth once — shared by all parallel sub-fetches
  let locationId = '';
  try {
    const auth = resolveGHLAuthentication(workspaceId);
    locationId = auth.locationId;
  } catch (err: any) {
    throw new Error(`AUTH_ERROR: ${err.message}`);
  }

  if (!locationId) {
    warnings.push('GHL Location ID is not configured — some data may be incomplete.');
  }

  // Calendar events require a bounded date range (GHL rejects open-ended queries)
  const now = Date.now();
  const defaultMs = 30 * 24 * 60 * 60 * 1000;
  const startMs = opts.startDate ? new Date(opts.startDate).getTime() : now - defaultMs;
  const endMs = opts.endDate ? new Date(opts.endDate + 'T23:59:59.999Z').getTime() : now;

  let contacts: (GHLContact & { id: string })[] = [];
  let opportunities: (GHLOpportunity & { contactId?: string })[] = [];
  let appointments: (GHLAppointment & { contactId?: string })[] = [];
  let users: GHLUser[] = [];
  let conversations: GHLConversation[] = [];

  await Promise.all([

    // Task 1: Contacts (cursor-paginated, up to 1 000 records)
    (async () => {
      try {
        const raw = await fetchAllContacts(workspaceId);
        contacts = raw.map(c => ({
          id: c.id,
          name: `${c.firstName || ''} ${c.lastName || ''}`.trim() || 'Anonymous Lead',
          email: c.email || '',
          phone: c.phone || '',
          source: c.source || 'Direct',
          tags: Array.isArray(c.tags) ? c.tags : [],
          dateAdded: c.dateAdded || c.createdAt || new Date().toISOString()
        }));
      } catch (err: any) {
        warnings.push(`Contacts unavailable: ${err.message}`);
        unavailableMetrics.push('leadsList', 'leadSourceBreakdowns', 'missedLeads');
      }
    })(),

    // Task 2: Opportunities (page-paginated; note: uses location_id not locationId)
    (async () => {
      try {
        const raw = await fetchAllOpportunities(workspaceId, locationId);
        opportunities = raw.map(o => ({
          id: o.id,
          name: o.name || 'Opportunity',
          pipelineId: o.pipelineId || '',
          stageId: o.pipelineStageId || o.stageId || '',
          // GHL v2 uses monetaryValue, not value
          value: Number(o.monetaryValue ?? o.value) || 0,
          status: (['open', 'won', 'lost', 'abandoned'].includes((o.status || '').toLowerCase())
            ? (o.status as string).toLowerCase()
            : 'open') as GHLOpportunity['status'],
          assignedTo: o.assignedTo || '',
          source: o.contact?.source || o.source || '',
          createdAt: o.createdAt || new Date().toISOString(),
          contactId: o.contactId || o.contact?.id || ''
        }));
      } catch (err: any) {
        warnings.push(`Opportunities unavailable: ${err.message}`);
        unavailableMetrics.push('pipelineBreakdown', 'wonRevenue', 'closeRates');
      }
    })(),

    // Task 3: Calendar Events
    // GHL v2 calendars/events requires calendarId, userId, or groupId — locationId alone is not accepted.
    // Fetch all calendars for the location first, then get events for each.
    (async () => {
      try {
        const calRes = await fetchFromGHLAPI<{ calendars?: { id: string }[] }>('calendars/', workspaceId);
        const calendarIds = (calRes.data?.calendars || []).map(c => c.id).slice(0, 5); // max 5 calendars
        if (calendarIds.length === 0) {
          warnings.push('No calendars found for this location — appointment data unavailable.');
          unavailableMetrics.push('bookedAppointments', 'showRate');
          return;
        }
        const allEvents: any[] = [];
        await Promise.all(calendarIds.map(async calId => {
          try {
            const evRes = await fetchFromGHLAPI<{ events?: any[] }>(
              `calendars/events?calendarId=${encodeURIComponent(calId)}&startTime=${startMs}&endTime=${endMs}`, workspaceId
            );
            if (evRes.data?.events) allEvents.push(...evRes.data.events);
          } catch { /* individual calendar failure is non-fatal */ }
        }));
        appointments = allEvents.map(e => ({
          id: e.id,
          title: e.title || 'Appointment',
          appointmentStatus: mapAppointmentStatus(e.status || e.appointmentStatus || ''),
          startTime: e.startTime || new Date().toISOString(),
          userId: e.userId || '',
          contactId: e.contactId || ''
        }));
      } catch (err: any) {
        warnings.push(`Calendar appointments unavailable: ${err.message}`);
        unavailableMetrics.push('bookedAppointments', 'showRate');
      }
    })(),

    // Task 4: Sub-account users
    // GHL v2 users/search requires companyId (set GHL_COMPANY_ID env var).
    (async () => {
      try {
        const companyId = process.env.GHL_COMPANY_ID || '';
        if (!companyId) {
          warnings.push('GHL_COMPANY_ID not configured — team roster unavailable.');
          unavailableMetrics.push('teamRoster', 'perRepBreakdown');
          return;
        }
        const res = await fetchFromGHLAPI<{ users?: any[] }>(
          `users/search?companyId=${encodeURIComponent(companyId)}`, workspaceId
        );
        if (res.data?.users) {
          users = res.data.users.map(u => ({
            id: u.id,
            name: `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Team Member',
            email: u.email || '',
            avatarUrl: u.avatarUrl || '',
            role: (['admin', 'user'].includes((u.role || '').toLowerCase()) ? (u.role as string).toLowerCase() : 'user') as GHLUser['role']
          }));
        }
      } catch (err: any) {
        warnings.push(`Team roster unavailable: ${err.message}`);
        unavailableMetrics.push('teamRoster', 'perRepBreakdown');
      }
    })(),

    // Task 5: Conversations (correct endpoint: conversations/search, page-paginated)
    // Note: GHL v2 conversations list does NOT include avgResponseTimeMin — marked unavailable
    (async () => {
      try {
        const raw = await fetchAllConversations(workspaceId);
        conversations = raw.map(c => ({
          id: c.id,
          userId: c.userId || c.assignedTo || '',
          smsCount: Number(c.smsCount || c.unreadCount) || 0,
          emailCount: Number(c.emailCount) || 0,
          callCount: Number(c.callCount) || 0,
          avgResponseTimeMin: 0 // not exposed by GHL v2 conversations list endpoint
        }));
      } catch (err: any) {
        warnings.push(`Conversations unavailable: ${err.message}`);
        unavailableMetrics.push('conversationCounts');
      }
    })()
  ]);

  return { contacts, opportunities, appointments, users, conversations, warnings, unavailableMetrics };
}

// ==========================================
// 8. REPORTING COMPUTE FUNCTIONS
// ==========================================

export async function computeLiveOverviewReport(
  workspaceId: string,
  filters: { startDate?: string; endDate?: string } = {}
) {
  const crm = await getLiveCRMData(workspaceId, filters);

  const now = Date.now();
  const defaultMs = 30 * 24 * 60 * 60 * 1000;
  const startMs = filters.startDate ? new Date(filters.startDate).getTime() : now - defaultMs;
  const endMs = filters.endDate ? new Date(filters.endDate + 'T23:59:59.999Z').getTime() : now;
  const periodMs = endMs - startMs;

  // Current period
  const curContacts = crm.contacts.filter(c => isDateInFilterRange(c.dateAdded, filters.startDate, filters.endDate));
  const curOpps = crm.opportunities.filter(o => isDateInFilterRange(o.createdAt, filters.startDate, filters.endDate));

  // Prior period (same duration, shifted back) — uses already-fetched data for efficiency
  const priorStart = new Date(startMs - periodMs).toISOString().slice(0, 10);
  const priorEnd = new Date(startMs - 1).toISOString().slice(0, 10);
  const priorContacts = crm.contacts.filter(c => isDateInFilterRange(c.dateAdded, priorStart, priorEnd));
  const priorOpps = crm.opportunities.filter(o => isDateInFilterRange(o.createdAt, priorStart, priorEnd));

  const leadsCount = curContacts.length;
  const priorLeads = priorContacts.length;
  const leadsDelta = priorLeads > 0 ? parseFloat(((leadsCount - priorLeads) / priorLeads * 100).toFixed(1)) : 0;

  const wonOpps = curOpps.filter(o => o.status === 'won');
  const closedWonRevenue = wonOpps.reduce((s, o) => s + o.value, 0);
  const priorWonRevenue = priorOpps.filter(o => o.status === 'won').reduce((s, o) => s + o.value, 0);
  const revenueDelta = priorWonRevenue > 0 ? parseFloat(((closedWonRevenue - priorWonRevenue) / priorWonRevenue * 100).toFixed(1)) : 0;

  const activeOpps = curOpps.filter(o => o.status === 'open' || o.status === 'won');
  const totalPipeline = activeOpps.reduce((s, o) => s + o.value, 0);
  const priorPipeline = priorOpps.filter(o => o.status === 'open' || o.status === 'won').reduce((s, o) => s + o.value, 0);
  const pipelineDelta = priorPipeline > 0 ? parseFloat(((totalPipeline - priorPipeline) / priorPipeline * 100).toFixed(1)) : 0;

  // Calendar events are already scoped by date from the GHL fetch
  const apts = crm.appointments;
  const showedApts = apts.filter(a => a.appointmentStatus === 'showed').length;
  const confirmedApts = apts.filter(a => a.appointmentStatus === 'confirmed' || a.appointmentStatus === 'showed').length;
  const showRate = confirmedApts > 0 ? Math.round((showedApts / confirmedApts) * 100) : 0;

  return {
    totalLeads: leadsCount,
    leadsDelta,
    pipelineValue: totalPipeline,
    pipelineDelta,
    closedWonRevenue,
    revenueDelta,
    appointmentShowRate: showRate,
    showRateDelta: 0, // would require prior-period calendar fetch; marked 0
    trends: {
      leads: bucketCountByWeek(curContacts, 'dateAdded', startMs, endMs),
      pipeline: bucketValueByWeek(activeOpps, 'createdAt', 'value', startMs, endMs),
      revenue: bucketValueByWeek(wonOpps, 'createdAt', 'value', startMs, endMs),
      appointments: bucketCountByWeek(apts, 'startTime', startMs, endMs)
    },
    warnings: crm.warnings,
    unavailableMetrics: crm.unavailableMetrics
  };
}

export async function computeLiveOpportunityReport(
  workspaceId: string,
  filters: { startDate?: string; endDate?: string } = {}
) {
  const crm = await getLiveCRMData(workspaceId, filters);
  const filteredOpps = crm.opportunities.filter(o => isDateInFilterRange(o.createdAt, filters.startDate, filters.endDate));

  const totalCount = filteredOpps.length;
  const wonCount = filteredOpps.filter(o => o.status === 'won').length;
  const lostCount = filteredOpps.filter(o => o.status === 'lost').length;
  const openCount = filteredOpps.filter(o => o.status === 'open' || o.status === 'abandoned').length;
  const totalValue = filteredOpps.reduce((s, o) => s + o.value, 0);
  const wonValue = filteredOpps.filter(o => o.status === 'won').reduce((s, o) => s + o.value, 0);
  const winRate = totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0;

  const totalLeads = crm.contacts.length;
  const funnel: FunnelStage[] = [
    { stage: 'Total Leads', count: totalLeads, percentageOfPrevious: 100, percentageOfTotal: 100 },
    { stage: 'Open Opportunities', count: totalCount, percentageOfPrevious: totalLeads > 0 ? Math.round((totalCount / totalLeads) * 100) : 0, percentageOfTotal: totalLeads > 0 ? Math.round((totalCount / totalLeads) * 100) : 0 },
    { stage: 'Closed-Won Deals', count: wonCount, percentageOfPrevious: totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0, percentageOfTotal: totalLeads > 0 ? Math.round((wonCount / totalLeads) * 100) : 0 }
  ];

  return {
    summary: { totalOpportunities: totalCount, openOpportunities: openCount, wonOpportunities: wonCount, lostOpportunities: lostCount, totalPipelineValue: totalValue, wonRevenue: wonValue, winRate },
    funnel,
    warnings: crm.warnings,
    unavailableMetrics: crm.unavailableMetrics
  };
}

export async function computeLiveSalesReport(
  workspaceId: string,
  filters: { startDate?: string; endDate?: string } = {}
) {
  const crm = await getLiveCRMData(workspaceId, filters);
  const filteredOpps = crm.opportunities.filter(o => isDateInFilterRange(o.createdAt, filters.startDate, filters.endDate));
  const wonOpps = filteredOpps.filter(o => o.status === 'won');
  const wonRevenue = wonOpps.reduce((s, o) => s + o.value, 0);
  const avgDeal = wonOpps.length > 0 ? Math.round(wonRevenue / wonOpps.length) : 0;
  const showedCount = crm.appointments.filter(a => a.appointmentStatus === 'showed').length;

  return {
    summary: {
      totalBookedAppointments: crm.appointments.length,
      showedAppointmentsCount: showedCount,
      closedWonDealsCount: wonOpps.length,
      wonRevenueAmount: wonRevenue,
      averageTicketSize: avgDeal
    },
    warnings: crm.warnings,
    unavailableMetrics: crm.unavailableMetrics
  };
}

export async function computeLiveOwnerReport(
  workspaceId: string,
  filters: { startDate?: string; endDate?: string; userId?: string; source?: string; campaign?: string; } = {}
): Promise<{ data: OwnerPerformanceReport; warnings: string[]; unavailableMetrics: string[] }> {
  const crm = await getLiveCRMData(workspaceId, filters);
  const unavailableMetrics = [...crm.unavailableMetrics, 'avgSpeedToLeadSec', 'revenueByServiceType'];

  const filteredContacts = crm.contacts.filter(c => {
    if (!isDateInFilterRange(c.dateAdded, filters.startDate, filters.endDate)) return false;
    if (filters.source && c.source !== filters.source) return false;
    return true;
  });

  const filteredOpps = crm.opportunities.filter(o => {
    if (!isDateInFilterRange(o.createdAt, filters.startDate, filters.endDate)) return false;
    if (filters.source && o.source !== filters.source) return false;
    return true;
  });

  const apts = crm.appointments; // already date-scoped from GHL fetch

  // Contacts linked to at least one opportunity (used for missedLeads)
  const contactsWithOpps = new Set(filteredOpps.map(o => o.contactId).filter(Boolean));
  const missedLeadsTotal = filteredContacts.filter(c => !contactsWithOpps.has(c.id)).length;

  const usersToReport = filters.userId
    ? crm.users.filter(u => u.id === filters.userId)
    : (crm.users.length > 0 ? crm.users : [{ id: 'live_default', name: 'Sales Rep', email: '', avatarUrl: '', role: 'user' as const }]);

  const ownerBreakdown = usersToReport.map(user => {
    const repOpps = filteredOpps.filter(o => o.assignedTo === user.id);
    const repContactIds = new Set(repOpps.map(o => o.contactId).filter(Boolean));
    const repContacts = filteredContacts.filter(c => repContactIds.has(c.id));
    const repApts = apts.filter(a => a.userId === user.id);

    const wonRepOpps = repOpps.filter(o => o.status === 'won');
    const wonRevenue = wonRepOpps.reduce((s, o) => s + o.value, 0);
    const pipelineValue = repOpps.reduce((s, o) => s + o.value, 0);
    const showedApts = repApts.filter(a => a.appointmentStatus === 'showed').length;
    const confirmedApts = repApts.filter(a => a.appointmentStatus === 'confirmed' || a.appointmentStatus === 'showed').length;

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      totalLeads: repContacts.length || repOpps.length,
      newLeads: repContacts.length,
      bookedAppointments: repApts.length,
      showRate: confirmedApts > 0 ? Math.round((showedApts / confirmedApts) * 100) : 0,
      closeRate: repOpps.length > 0 ? Math.round((wonRepOpps.length / repOpps.length) * 100) : 0,
      pipelineValue,
      wonRevenue,
      lostOpportunities: repOpps.filter(o => o.status === 'lost').length,
      missedLeads: filteredContacts.filter(c => repContactIds.has(c.id) && !contactsWithOpps.has(c.id)).length,
      avgSpeedToLeadSec: 0 // not available from GHL v2 conversations list
    };
  });

  const totalOpps = filteredOpps.length;
  const totalWon = filteredOpps.filter(o => o.status === 'won').length;
  const wonOppsAll = filteredOpps.filter(o => o.status === 'won');
  const showedTotal = apts.filter(a => a.appointmentStatus === 'showed').length;
  const confirmedTotal = apts.filter(a => a.appointmentStatus === 'confirmed' || a.appointmentStatus === 'showed').length;

  const now = Date.now();
  const defaultMs = 30 * 24 * 60 * 60 * 1000;
  const startMs = filters.startDate ? new Date(filters.startDate).getTime() : now - defaultMs;
  const endMs = filters.endDate ? new Date(filters.endDate + 'T23:59:59.999Z').getTime() : now;

  const wkLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
  const leadsWeekly = bucketCountByWeek(filteredContacts, 'dateAdded', startMs, endMs);
  const revenueWeekly = bucketValueByWeek(wonOppsAll, 'createdAt', 'value', startMs, endMs);
  const trends: TrendChartPoint[] = wkLabels.map((date, i) => ({ date, totalLeads: leadsWeekly[i], wonRevenue: revenueWeekly[i] }));

  // Revenue by source from won opportunities (real GHL data)
  const revenueBySource: Record<string, number> = {};
  wonOppsAll.forEach(o => {
    const src = o.source || 'Direct';
    revenueBySource[src] = (revenueBySource[src] || 0) + o.value;
  });

  const funnel: FunnelStage[] = [
    { stage: 'Leads', count: filteredContacts.length, percentageOfPrevious: 100, percentageOfTotal: 100 },
    { stage: 'Booked', count: apts.length, percentageOfPrevious: filteredContacts.length > 0 ? Math.round((apts.length / filteredContacts.length) * 100) : 0, percentageOfTotal: filteredContacts.length > 0 ? Math.round((apts.length / filteredContacts.length) * 100) : 0 },
    { stage: 'Won', count: totalWon, percentageOfPrevious: apts.length > 0 ? Math.round((totalWon / apts.length) * 100) : 0, percentageOfTotal: filteredContacts.length > 0 ? Math.round((totalWon / filteredContacts.length) * 100) : 0 }
  ];

  const report: OwnerPerformanceReport = {
    summary: {
      totalLeads: filteredContacts.length,
      newLeads: filteredContacts.length,
      bookedAppointments: apts.length,
      showRate: confirmedTotal > 0 ? Math.round((showedTotal / confirmedTotal) * 100) : 0,
      closeRate: totalOpps > 0 ? Math.round((totalWon / totalOpps) * 100) : 0,
      pipelineValue: filteredOpps.reduce((s, o) => s + o.value, 0),
      wonRevenue: wonOppsAll.reduce((s, o) => s + o.value, 0),
      lostOpportunities: filteredOpps.filter(o => o.status === 'lost').length,
      missedLeadsOrCalls: missedLeadsTotal,
      avgSpeedToLeadSec: 0,
      leadToBookingConvRate: filteredContacts.length > 0 ? Math.round((apts.length / filteredContacts.length) * 100) : 0,
      bookingToWonConvRate: apts.length > 0 ? Math.round((totalWon / apts.length) * 100) : 0
    },
    revenueBySource,
    revenueByServiceType: {}, // no service type field in GHL opportunities
    ownerBreakdown,
    trends,
    funnel
  };

  return { data: report, warnings: crm.warnings, unavailableMetrics };
}

export async function computeLiveMarketingReport(
  workspaceId: string,
  filters: { startDate?: string; endDate?: string; userId?: string; source?: string; campaign?: string; } = {}
): Promise<{ data: MarketingPerformanceReport; warnings: string[]; unavailableMetrics: string[] }> {
  const crm = await getLiveCRMData(workspaceId, filters);
  const unavailableMetrics = [...crm.unavailableMetrics, 'campaignBreakdown', 'costPerLead', 'roas', 'adsCost'];

  const validContacts = crm.contacts.filter(c => isDateInFilterRange(c.dateAdded, filters.startDate, filters.endDate));
  const validOpps = crm.opportunities.filter(o => isDateInFilterRange(o.createdAt, filters.startDate, filters.endDate));
  const validApts = crm.appointments; // date-scoped from GHL

  // Build contact → source lookup for booking attribution
  const contactSourceMap = new Map<string, string>(crm.contacts.map(c => [c.id, c.source || 'Direct']));

  const leadsBySource: Record<string, number> = {};
  validContacts.forEach(c => {
    const src = c.source || 'Direct';
    leadsBySource[src] = (leadsBySource[src] || 0) + 1;
  });

  const pipelineValueBySource: Record<string, number> = {};
  const wonRevenueBySource: Record<string, number> = {};
  validOpps.forEach(o => {
    const src = o.source || 'Direct';
    pipelineValueBySource[src] = (pipelineValueBySource[src] || 0) + o.value;
    if (o.status === 'won') wonRevenueBySource[src] = (wonRevenueBySource[src] || 0) + o.value;
  });

  // Bookings attributed by linking appointment contactId → contact.source
  const bookingsBySource: Record<string, number> = {};
  validApts.forEach(a => {
    const src = a.contactId ? (contactSourceMap.get(a.contactId) || 'Direct') : 'Direct';
    bookingsBySource[src] = (bookingsBySource[src] || 0) + 1;
  });

  const totalLeads = Object.values(leadsBySource).reduce((s, c) => s + c, 0);
  const totalBookings = Object.values(bookingsBySource).reduce((s, c) => s + c, 0);
  const totalPipeline = Object.values(pipelineValueBySource).reduce((s, c) => s + c, 0);
  const totalWonRevenue = Object.values(wonRevenueBySource).reduce((s, c) => s + c, 0);

  const now = Date.now();
  const defaultMs = 30 * 24 * 60 * 60 * 1000;
  const startMs = filters.startDate ? new Date(filters.startDate).getTime() : now - defaultMs;
  const endMs = filters.endDate ? new Date(filters.endDate + 'T23:59:59.999Z').getTime() : now;

  const wkLabels = ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'];
  const leadsWeekly = bucketCountByWeek(validContacts, 'dateAdded', startMs, endMs);
  const revenueWeekly = bucketValueByWeek(validOpps.filter(o => o.status === 'won'), 'createdAt', 'value', startMs, endMs);
  const trends: TrendChartPoint[] = wkLabels.map((date, i) => ({
    date,
    adsCost: 0,             // not available from GHL API
    returnRevenue: revenueWeekly[i],
    bookingsCount: 0
  }));

  const report: MarketingPerformanceReport = {
    summary: {
      totalLeads,
      totalBookings,
      totalPipelineValue: totalPipeline,
      totalWonRevenue,
      avgLeadToAppointmentRate: totalLeads > 0 ? Math.round((totalBookings / totalLeads) * 100) : 0,
      avgAppointmentToWonRate: totalBookings > 0 ? Math.round(((totalWon(validOpps)) / totalBookings) * 100) : 0,
      costPerLeadPlaceholder: 0, // not available from GHL API
      roasPlaceholder: 0         // not available from GHL API
    },
    leadsBySource,
    leadsByCampaign: {}, // GHL has no campaign reporting endpoint
    bookingsBySource,
    pipelineValueBySource,
    wonRevenueBySource,
    campaignBreakdown: [], // GHL has no campaign breakdown endpoint
    trends
  };

  return { data: report, warnings: crm.warnings, unavailableMetrics };
}

function totalWon(opps: GHLOpportunity[]): number {
  return opps.filter(o => o.status === 'won').length;
}

// ==========================================
// 9. LIVE REPORTING SERVICE DISPATCHER
// ==========================================

export class LiveReportingService {

  static async getOverviewDashboardReport(workspaceId: string, filters: { startDate?: string; endDate?: string } = {}) {
    const isProd = process.env.NODE_ENV === 'production';
    const settings = db.getReportingSettings(workspaceId);

    if (settings.mode === 'MOCK') {
      return { source: 'mock' as const, data: getMockDashboardMetrics(), warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    const cached = getReportCache<any>(workspaceId, 'overview');
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    try {
      const computed = await computeLiveOverviewReport(workspaceId, filters);
      setReportCache(workspaceId, 'overview', computed);
      return { source: 'live' as const, data: computed, warnings: computed.warnings, unavailableMetrics: computed.unavailableMetrics, stale: false };
    } catch (err: any) {
      console.error('[LiveReportingService] Overview failed:', err.message);
      if (isProd) {
        return { source: 'live' as const, data: null as any, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ['all'] as string[], stale: false };
      }
      return { source: 'mock' as const, data: getMockDashboardMetrics(), warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [] as string[], stale: false };
    }
  }

  static async getOpportunityDashboardReport(workspaceId: string, filters: { startDate?: string; endDate?: string } = {}) {
    const isProd = process.env.NODE_ENV === 'production';
    const settings = db.getReportingSettings(workspaceId);

    if (settings.mode === 'MOCK') {
      return { source: 'mock' as const, data: getMockDashboardMetrics(), warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    const cached = getReportCache<any>(workspaceId, 'opportunity');
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    try {
      const computed = await computeLiveOpportunityReport(workspaceId, filters);
      setReportCache(workspaceId, 'opportunity', computed);
      return { source: 'live' as const, data: computed, warnings: computed.warnings, unavailableMetrics: computed.unavailableMetrics, stale: false };
    } catch (err: any) {
      console.error('[LiveReportingService] Opportunity failed:', err.message);
      if (isProd) {
        return { source: 'live' as const, data: null as any, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ['all'] as string[], stale: false };
      }
      return { source: 'mock' as const, data: getMockDashboardMetrics(), warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [] as string[], stale: false };
    }
  }

  static async getSalesDashboardReport(workspaceId: string, filters: { startDate?: string; endDate?: string } = {}) {
    const isProd = process.env.NODE_ENV === 'production';
    const settings = db.getReportingSettings(workspaceId);

    if (settings.mode === 'MOCK') {
      return { source: 'mock' as const, data: getMockDashboardMetrics(), warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    const cached = getReportCache<any>(workspaceId, 'sales');
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    try {
      const computed = await computeLiveSalesReport(workspaceId, filters);
      setReportCache(workspaceId, 'sales', computed);
      return { source: 'live' as const, data: computed, warnings: computed.warnings, unavailableMetrics: computed.unavailableMetrics, stale: false };
    } catch (err: any) {
      console.error('[LiveReportingService] Sales failed:', err.message);
      if (isProd) {
        return { source: 'live' as const, data: null as any, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ['all'] as string[], stale: false };
      }
      return { source: 'mock' as const, data: getMockDashboardMetrics(), warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [] as string[], stale: false };
    }
  }

  static async getOwnerDashboardReport(
    workspaceId: string,
    filters: { startDate?: string; endDate?: string; userId?: string; source?: string; campaign?: string; } = {}
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const settings = db.getReportingSettings(workspaceId);

    if (settings.mode === 'MOCK') {
      return { source: 'mock' as const, data: getMockOwnerReport(filters), warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    const cacheKey = `owner_${filters.userId || 'all'}_${filters.source || 'all'}`;
    const cached = getReportCache<any>(workspaceId, cacheKey);
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    try {
      const result = await computeLiveOwnerReport(workspaceId, filters);
      setReportCache(workspaceId, cacheKey, result.data);
      return { source: 'live' as const, data: result.data, warnings: result.warnings, unavailableMetrics: result.unavailableMetrics, stale: false };
    } catch (err: any) {
      console.error('[LiveReportingService] Owner failed:', err.message);
      if (isProd) {
        return { source: 'live' as const, data: null as any, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ['all'] as string[], stale: false };
      }
      return { source: 'mock' as const, data: getMockOwnerReport(filters), warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [] as string[], stale: false };
    }
  }

  static async getMarketingDashboardReport(
    workspaceId: string,
    filters: { startDate?: string; endDate?: string; userId?: string; source?: string; campaign?: string; } = {}
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const settings = db.getReportingSettings(workspaceId);

    if (settings.mode === 'MOCK') {
      return { source: 'mock' as const, data: getMockMarketingReport(filters), warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    const cacheKey = `marketing_${filters.source || 'all'}_${filters.campaign || 'all'}`;
    const cached = getReportCache<any>(workspaceId, cacheKey);
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    try {
      const result = await computeLiveMarketingReport(workspaceId, filters);
      setReportCache(workspaceId, cacheKey, result.data);
      return { source: 'live' as const, data: result.data, warnings: result.warnings, unavailableMetrics: result.unavailableMetrics, stale: false };
    } catch (err: any) {
      console.error('[LiveReportingService] Marketing failed:', err.message);
      if (isProd) {
        return { source: 'live' as const, data: null as any, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ['all'] as string[], stale: false };
      }
      return { source: 'mock' as const, data: getMockMarketingReport(filters), warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [] as string[], stale: false };
    }
  }
}
