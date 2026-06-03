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
  AppointmentDashboardReport,
  EstimatesInvoicesReport,
  OutstandingReport,
  OutstandingRecord,
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
    // Strip BOM (U+FEFF, decimal 65279) that Windows text editors can prepend to copied values
    const envApiKey = (process.env.GHL_PRIVATE_INTEGRATION_TOKEN || process.env.GHL_API_KEY || '').replace(/^﻿/, '');
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

  // Don't double-append locationId when the endpoint already carries it
  // altId= is used by estimates/invoices endpoints (different GHL param name)
  const alreadyHasLocation = endpoint.includes('locationId=') || endpoint.includes('location_id=') || endpoint.includes('altId=');
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
  for (let page = 0; page < 50; page++) {
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

export async function computeLiveAppointmentReport(
  workspaceId: string,
  filters: { startDate?: string; endDate?: string; userId?: string } = {}
): Promise<{ data: AppointmentDashboardReport; warnings: string[]; unavailableMetrics: string[] }> {
  const warnings: string[] = [];
  const unavailableMetrics: string[] = [];

  let locationId = '';
  try {
    const auth = resolveGHLAuthentication(workspaceId);
    locationId = auth.locationId;
  } catch (err: any) {
    throw new Error(`AUTH_ERROR: ${err.message}`);
  }

  const now = Date.now();
  const defaultMs = 30 * 24 * 60 * 60 * 1000;
  const startMs = filters.startDate ? new Date(filters.startDate).getTime() : now - defaultMs;
  const endMs = filters.endDate ? new Date(filters.endDate + 'T23:59:59.999Z').getTime() : now;

  interface CalendarMeta { id: string; name: string; }
  type RichAppointment = GHLAppointment & { calendarId: string; calendarName: string };
  let allAppointments: RichAppointment[] = [];
  let calendarMetas: CalendarMeta[] = [];

  // Step 1: fetch calendars (capture name alongside id)
  try {
    const calRes = await fetchFromGHLAPI<{ calendars?: { id: string; name?: string }[] }>('calendars/', workspaceId);
    calendarMetas = (calRes.data?.calendars || []).slice(0, 10).map(c => ({ id: c.id, name: c.name || c.id }));
    if (calendarMetas.length === 0) {
      warnings.push('No calendars found for this location — appointment data unavailable.');
      unavailableMetrics.push('appointments');
    } else {
      // Step 2: fetch events per calendar in parallel
      await Promise.all(calendarMetas.map(async cal => {
        try {
          const evRes = await fetchFromGHLAPI<{ events?: any[] }>(
            `calendars/events?calendarId=${encodeURIComponent(cal.id)}&startTime=${startMs}&endTime=${endMs}`,
            workspaceId
          );
          (evRes.data?.events || []).forEach(e => {
            allAppointments.push({
              id: e.id,
              title: e.title || 'Appointment',
              appointmentStatus: mapAppointmentStatus(e.appointmentStatus || e.status || ''),
              startTime: e.startTime || new Date().toISOString(),
              userId: e.userId || '',
              contactId: e.contactId || '',
              calendarId: cal.id,
              calendarName: cal.name
            });
          });
        } catch { /* individual calendar failure is non-fatal */ }
      }));
    }
  } catch (err: any) {
    warnings.push(`Calendar fetch failed: ${err.message}`);
    unavailableMetrics.push('appointments');
  }

  // Step 3: fetch users for name lookup (best-effort — requires GHL_COMPANY_ID)
  const userNameMap = new Map<string, string>();
  try {
    const companyId = process.env.GHL_COMPANY_ID || '';
    if (companyId) {
      const uRes = await fetchFromGHLAPI<{ users?: { id: string; firstName?: string; lastName?: string }[] }>(
        `users/search?companyId=${encodeURIComponent(companyId)}`, workspaceId
      );
      (uRes.data?.users || []).forEach(u => {
        userNameMap.set(u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.id);
      });
    }
  } catch { /* non-fatal */ }

  // Apply userId filter
  const filtered = filters.userId ? allAppointments.filter(a => a.userId === filters.userId) : allAppointments;

  const showed = filtered.filter(a => a.appointmentStatus === 'showed').length;
  const noshow = filtered.filter(a => a.appointmentStatus === 'noshow').length;
  const cancelled = filtered.filter(a => a.appointmentStatus === 'cancelled').length;
  const confirmed = filtered.filter(a => a.appointmentStatus === 'confirmed').length;
  const total = filtered.length;
  const upcoming = filtered.filter(a => new Date(a.startTime).getTime() > now).length;
  const showDenom = showed + noshow;

  // Calendar breakdown
  const calMap = new Map<string, { name: string; total: number; showed: number; noshow: number; cancelled: number; confirmed: number }>();
  filtered.forEach(a => {
    const cur = calMap.get(a.calendarId) || { name: a.calendarName, total: 0, showed: 0, noshow: 0, cancelled: 0, confirmed: 0 };
    cur.total++;
    if (a.appointmentStatus === 'showed') cur.showed++;
    else if (a.appointmentStatus === 'noshow') cur.noshow++;
    else if (a.appointmentStatus === 'cancelled') cur.cancelled++;
    else cur.confirmed++;
    calMap.set(a.calendarId, cur);
  });

  // Rep breakdown
  const repMap = new Map<string, { total: number; showed: number; noshow: number; cancelled: number }>();
  filtered.forEach(a => {
    const uid = a.userId || 'unknown';
    const cur = repMap.get(uid) || { total: 0, showed: 0, noshow: 0, cancelled: 0 };
    cur.total++;
    if (a.appointmentStatus === 'showed') cur.showed++;
    else if (a.appointmentStatus === 'noshow') cur.noshow++;
    else if (a.appointmentStatus === 'cancelled') cur.cancelled++;
    repMap.set(uid, cur);
  });

  // Trend bucketing
  const seg = (endMs - startMs) / 4;
  const tBuckets = [{ booked: 0, showed: 0, noshow: 0 }, { booked: 0, showed: 0, noshow: 0 }, { booked: 0, showed: 0, noshow: 0 }, { booked: 0, showed: 0, noshow: 0 }];
  filtered.forEach(a => {
    const t = new Date(a.startTime).getTime();
    const idx = Math.min(3, Math.floor((t - startMs) / seg));
    if (idx >= 0) {
      tBuckets[idx].booked++;
      if (a.appointmentStatus === 'showed') tBuckets[idx].showed++;
      else if (a.appointmentStatus === 'noshow') tBuckets[idx].noshow++;
    }
  });

  const report: AppointmentDashboardReport = {
    summary: {
      totalBooked: total,
      totalShowed: showed,
      totalNoShow: noshow,
      totalCancelled: cancelled,
      totalConfirmed: confirmed,
      showRate: showDenom > 0 ? Math.round((showed / showDenom) * 100) : 0,
      noShowRate: showDenom > 0 ? Math.round((noshow / showDenom) * 100) : 0,
      cancellationRate: total > 0 ? Math.round((cancelled / total) * 100) : 0,
      upcomingCount: upcoming
    },
    statusDistribution: [
      { status: 'Showed', count: showed },
      { status: 'No-Show', count: noshow },
      { status: 'Cancelled', count: cancelled },
      { status: 'Confirmed', count: confirmed }
    ].filter(s => s.count > 0),
    calendarBreakdown: Array.from(calMap.entries()).map(([calId, d]) => ({
      calendarId: calId,
      calendarName: d.name,
      total: d.total,
      showed: d.showed,
      noshow: d.noshow,
      cancelled: d.cancelled,
      confirmed: d.confirmed,
      showRate: (d.showed + d.noshow) > 0 ? Math.round((d.showed / (d.showed + d.noshow)) * 100) : 0
    })),
    repBreakdown: Array.from(repMap.entries()).map(([userId, d]) => ({
      userId,
      userName: userNameMap.get(userId) || userId,
      booked: d.total,
      showed: d.showed,
      noshow: d.noshow,
      cancelled: d.cancelled,
      showRate: (d.showed + d.noshow) > 0 ? Math.round((d.showed / (d.showed + d.noshow)) * 100) : 0
    })),
    upcomingAppointments: filtered
      .filter(a => new Date(a.startTime).getTime() > now)
      .sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime())
      .slice(0, 15)
      .map(a => ({
        id: a.id,
        title: a.title,
        startTime: a.startTime,
        status: a.appointmentStatus,
        userId: a.userId,
        userName: userNameMap.get(a.userId) || undefined,
        calendarId: a.calendarId,
        calendarName: a.calendarName
      })),
    trends: ['Wk 1', 'Wk 2', 'Wk 3', 'Wk 4'].map((date, i) => ({
      date,
      booked: tBuckets[i].booked,
      showed: tBuckets[i].showed,
      noshow: tBuckets[i].noshow
    }))
  };

  return { data: report, warnings, unavailableMetrics };
}

// ==========================================
// 8b. ESTIMATES & INVOICES FETCHERS + COMPUTE
// ==========================================

// Strip "undefined"/"null" tokens that GHL produces when a contact has no last name
function sanitizeContactName(raw: string | null | undefined): string {
  if (!raw) return '';
  return raw.split(/\s+/)
    .filter(p => p && p.toLowerCase() !== 'undefined' && p.toLowerCase() !== 'null')
    .join(' ')
    .trim();
}

// GHL returns lowercase/underscore statuses — normalize to our uppercase display values
function normalizeEstimateStatus(raw: string): string {
  const s = (raw || '').toLowerCase();
  if (s === 'declined')  return 'REJECTED';   // GHL: declined  → our: REJECTED
  if (s === 'invoiced')  return 'CONVERTED';  // GHL: invoiced  → our: CONVERTED
  return s.toUpperCase();
}

function normalizeInvoiceStatus(raw: string): string {
  const s = (raw || '').toLowerCase();
  if (s === 'partially_paid') return 'PARTIAL'; // GHL: partially_paid → our: PARTIAL
  return s.toUpperCase();
}

// Estimates: path is /invoices/estimate/list (singular + /list), offset-based pagination
// Response: { estimates: [...], total: N }
async function fetchAllEstimates(workspaceId: string, locationId: string, opts: { startDate?: string; endDate?: string } = {}): Promise<any[]> {
  const all: any[] = [];
  for (let offset = 0; offset < 10000; offset += 100) {
    const p = new URLSearchParams({ altId: locationId, altType: 'location', limit: '100', offset: String(offset) });
    if (opts.startDate) p.set('startDate', opts.startDate);
    if (opts.endDate) p.set('endDate', opts.endDate);
    const res = await fetchFromGHLAPI<{ estimates?: any[]; total?: number }>(
      `invoices/estimate/list?${p}`, workspaceId
    );
    const batch = res.data?.estimates ?? [];
    const total = Number(res.data?.total) || 0;
    all.push(...batch);
    if (batch.length < 100 || (total > 0 && offset + 100 >= total)) break;
  }
  return all;
}

// Invoices: offset-based pagination, response: { invoices: [...], total: N }
async function fetchAllInvoices(workspaceId: string, locationId: string, opts: { startDate?: string; endDate?: string } = {}): Promise<any[]> {
  const all: any[] = [];
  for (let offset = 0; offset < 10000; offset += 100) {
    const p = new URLSearchParams({ altId: locationId, altType: 'location', limit: '100', offset: String(offset) });
    if (opts.startDate) p.set('startDate', opts.startDate);
    if (opts.endDate) p.set('endDate', opts.endDate);
    const res = await fetchFromGHLAPI<{ invoices?: any[]; total?: number }>(
      `invoices/?${p}`, workspaceId
    );
    const batch = res.data?.invoices ?? [];
    const total = Number(res.data?.total) || 0;
    all.push(...batch);
    if (batch.length < 100 || (total > 0 && offset + 100 >= total)) break;
  }
  return all;
}

export async function computeLiveEstimatesInvoicesReport(
  workspaceId: string,
  filters: { startDate?: string; endDate?: string } = {}
): Promise<{ data: EstimatesInvoicesReport; warnings: string[]; unavailableMetrics: string[] }> {
  const warnings: string[] = [];
  const unavailableMetrics: string[] = ['avgDaysToPayment']; // GHL does not expose paidAt timestamp

  // Resolve locationId once — estimates/invoices need altId=locationId&altType=location
  let locationId = '';
  try {
    locationId = resolveGHLAuthentication(workspaceId).locationId;
  } catch (err: any) {
    throw new Error(`AUTH_ERROR: ${err.message}`);
  }
  if (!locationId) {
    warnings.push('GHL Location ID not configured — estimates/invoices unavailable.');
    unavailableMetrics.push('estimates', 'invoices');
  }

  let rawEstimates: any[] = [];
  let rawInvoices: any[] = [];

  if (locationId) {
    await Promise.all([
      (async () => {
        try { rawEstimates = await fetchAllEstimates(workspaceId, locationId, filters); }
        catch (err: any) { warnings.push(`Estimates unavailable: ${err.message}`); unavailableMetrics.push('estimates'); }
      })(),
      (async () => {
        try { rawInvoices = await fetchAllInvoices(workspaceId, locationId, filters); }
        catch (err: any) { warnings.push(`Invoices unavailable: ${err.message}`); unavailableMetrics.push('invoices'); }
      })()
    ]);
  }

  // ── ESTIMATES — use normalized status + correct GHL field names ──────────
  const estByStatus: Record<string, { count: number; value: number }> = {};
  for (const e of rawEstimates) {
    const s = normalizeEstimateStatus(e.estimateStatus || e.status || 'UNKNOWN');
    if (!estByStatus[s]) estByStatus[s] = { count: 0, value: 0 };
    estByStatus[s].count++;
    estByStatus[s].value += Number(e.total) || 0;
  }

  const estNorm = (e: any) => normalizeEstimateStatus(e.estimateStatus || e.status || '');
  const estSent = rawEstimates.filter(e => estNorm(e) !== 'DRAFT');
  const estSentCount = estSent.length;
  const estSentValue = estSent.reduce((s, e) => s + (Number(e.total) || 0), 0);
  const estViewed   = rawEstimates.filter(e => ['VIEWED','ACCEPTED','REJECTED','CONVERTED'].includes(estNorm(e))).length;
  const estAccepted = rawEstimates.filter(e => estNorm(e) === 'ACCEPTED').length;
  const estRejected = rawEstimates.filter(e => estNorm(e) === 'REJECTED').length;
  const estConverted = rawEstimates.filter(e => estNorm(e) === 'CONVERTED').length;
  const estExpired  = rawEstimates.filter(e => estNorm(e) === 'EXPIRED').length;

  // ── INVOICES — use normalized status + correct GHL field names ────────────
  const invByStatus: Record<string, { count: number; value: number; amountPaid: number; amountDue: number }> = {};
  for (const inv of rawInvoices) {
    const s = normalizeInvoiceStatus(inv.status || 'UNKNOWN');
    if (!invByStatus[s]) invByStatus[s] = { count: 0, value: 0, amountPaid: 0, amountDue: 0 };
    invByStatus[s].count++;
    invByStatus[s].value += Number(inv.total) || 0;
    invByStatus[s].amountPaid += Number(inv.amountPaid) || 0;
    invByStatus[s].amountDue += Number(inv.amountDue) || 0;
  }

  const invNorm = (i: any) => normalizeInvoiceStatus(i.status || '');
  const invBillable = rawInvoices.filter(i => !['DRAFT', 'CANCELLED'].includes(invNorm(i)));
  const invTotalValue = invBillable.reduce((s, i) => s + (Number(i.total) || 0), 0);
  const invTotalPaid = rawInvoices.reduce((s, i) => s + (Number(i.amountPaid) || 0), 0);
  const invTotalOutstanding = rawInvoices.reduce((s, i) => s + (Number(i.amountDue) || 0), 0);

  // ── AGING + UNPAID LIST ────────────────────────────────────
  const now = Date.now();
  const aging = {
    current:    { count: 0, value: 0 },
    days1to30:  { count: 0, value: 0 },
    days31to60: { count: 0, value: 0 },
    days61plus: { count: 0, value: 0 }
  };
  const unpaidList: EstimatesInvoicesReport['invoices']['unpaidList'] = [];

  for (const inv of rawInvoices) {
    const amtDue = Number(inv.amountDue) || 0;
    if (amtDue <= 0) continue;

    const dueMs = inv.dueDate ? new Date(inv.dueDate).getTime() : null;
    const daysOverdue = dueMs ? Math.max(0, Math.floor((now - dueMs) / 86400000)) : 0;
    const notYetDue = !dueMs || dueMs > now;

    if (notYetDue)            { aging.current.count++;    aging.current.value    += amtDue; }
    else if (daysOverdue <= 30){ aging.days1to30.count++;  aging.days1to30.value  += amtDue; }
    else if (daysOverdue <= 60){ aging.days31to60.count++; aging.days31to60.value += amtDue; }
    else                       { aging.days61plus.count++; aging.days61plus.value += amtDue; }

    // contactDetails.name is a full name string; contactDetails.email is the email
    const contactName = sanitizeContactName(inv.contactDetails?.name || inv.contact?.name ||
      `${inv.contact?.firstName || ''} ${inv.contact?.lastName || ''}`) || 'Unknown';

    unpaidList.push({
      id: inv._id || inv.id || '',
      invoiceNumber: inv.invoiceNumber || inv.number || '',
      name: inv.name || inv.description || '',
      contactName,
      contactEmail: inv.contactDetails?.email || inv.contact?.email || '',
      amountDue: amtDue,
      total: Number(inv.total) || 0,
      dueDate: inv.dueDate || '',
      issueDate: inv.issueDate || '',
      daysOverdue,
      status: invNorm(inv)
    });
  }
  unpaidList.sort((a, b) => b.daysOverdue - a.daysOverdue || b.amountDue - a.amountDue);

  const report: EstimatesInvoicesReport = {
    estimates: {
      totalCount: rawEstimates.length,
      totalValue: rawEstimates.reduce((s, e) => s + (Number(e.total) || 0), 0),
      byStatus: estByStatus,
      funnel: {
        sent: estSentCount,
        sentValue: estSentValue,
        viewed: estViewed,
        viewRate: estSentCount > 0 ? Math.round((estViewed / estSentCount) * 100) : 0,
        accepted: estAccepted,
        acceptanceRate: estSentCount > 0 ? Math.round((estAccepted / estSentCount) * 100) : 0,
        rejected: estRejected,
        rejectionRate: estSentCount > 0 ? Math.round((estRejected / estSentCount) * 100) : 0,
        converted: estConverted,
        conversionRate: estSentCount > 0 ? Math.round((estConverted / estSentCount) * 100) : 0,
        expired: estExpired
      }
    },
    invoices: {
      totalCount: rawInvoices.length,
      totalValue: invTotalValue,
      totalPaid: invTotalPaid,
      totalOutstanding: invTotalOutstanding,
      collectionRate: invTotalValue > 0 ? Math.round((invTotalPaid / invTotalValue) * 100) : 0,
      avgInvoiceValue: invBillable.length > 0 ? Math.round(invTotalValue / invBillable.length) : 0,
      byStatus: invByStatus,
      aging,
      unpaidList
    },
    crossMetrics: {
      estimateToInvoiceRate: estSentCount > 0 ? Math.round((estConverted / estSentCount) * 100) : 0
    },
    warnings,
    unavailableMetrics
  };

  return { data: report, warnings, unavailableMetrics };
}

// ==========================================
// 8c. OUTSTANDING REPORT (ALL-TIME, NO DATE FILTER)
// ==========================================

// Normalized status sets — normalizeEstimateStatus/normalizeInvoiceStatus applied before checking
const PENDING_ESTIMATE_STATUSES = new Set(['SENT', 'VIEWED']);
const UNPAID_INVOICE_STATUSES   = new Set(['SENT', 'PARTIAL', 'OVERDUE']);

export async function computeLiveOutstandingReport(workspaceId: string): Promise<{ data: OutstandingReport; warnings: string[] }> {
  const warnings: string[] = [];
  const now = Date.now();

  let locationId = '';
  try {
    locationId = resolveGHLAuthentication(workspaceId).locationId;
  } catch (err: any) {
    throw new Error(`AUTH_ERROR: ${err.message}`);
  }

  let rawEstimates: any[] = [];
  let rawInvoices: any[] = [];

  if (locationId) {
    await Promise.all([
      (async () => {
        try { rawEstimates = await fetchAllEstimates(workspaceId, locationId, {}); }
        catch (err: any) { warnings.push(`Estimates unavailable: ${err.message}`); }
      })(),
      (async () => {
        try { rawInvoices = await fetchAllInvoices(workspaceId, locationId, {}); }
        catch (err: any) { warnings.push(`Invoices unavailable: ${err.message}`); }
      })()
    ]);
  } else {
    warnings.push('GHL Location ID not configured — outstanding data unavailable.');
  }

  function buildEstimateRecord(e: any): OutstandingRecord {
    const sentDate = e.sentAt || e.issueDate || e.updatedAt || e.createdAt || '';
    const sentMs = sentDate ? new Date(sentDate).getTime() : null;
    const contactName = sanitizeContactName(e.contactDetails?.name || e.contact?.name ||
      `${e.contact?.firstName || ''} ${e.contact?.lastName || ''}`) || 'Unknown';
    return {
      id: e._id || e.id || '',
      number: e.estimateNumber || e.number || '',
      name: e.name || e.title || e.subject || '',
      contactName,
      contactEmail: e.contactDetails?.email || e.contact?.email || '',
      status: normalizeEstimateStatus(e.estimateStatus || e.status || ''),
      sentDate,
      amount: Number(e.total) || 0,
      daysOutstanding: sentMs ? Math.max(0, Math.floor((now - sentMs) / 86400000)) : 0
    };
  }

  function buildInvoiceRecord(i: any): OutstandingRecord {
    const sentDate = i.sentAt || i.issueDate || i.updatedAt || i.createdAt || '';
    const sentMs = sentDate ? new Date(sentDate).getTime() : null;
    const contactName = i.contactDetails?.name || i.contact?.name ||
      (`${i.contact?.firstName || ''} ${i.contact?.lastName || ''}`.trim()) || 'Unknown';
    return {
      id: i._id || i.id || '',
      number: i.invoiceNumber || i.number || '',
      name: i.name || i.description || '',
      contactName,
      contactEmail: i.contactDetails?.email || i.contact?.email || '',
      status: normalizeInvoiceStatus(i.status || ''),
      sentDate,
      amount: Number(i.amountDue) || 0,
      daysOutstanding: sentMs ? Math.max(0, Math.floor((now - sentMs) / 86400000)) : 0
    };
  }

  const pendingEstimateRecords = rawEstimates
    .filter(e => PENDING_ESTIMATE_STATUSES.has(normalizeEstimateStatus(e.estimateStatus || e.status || '')))
    .map(buildEstimateRecord)
    .sort((a, b) => b.daysOutstanding - a.daysOutstanding || b.amount - a.amount);

  const unpaidInvoiceRecords = rawInvoices
    .filter(i => UNPAID_INVOICE_STATUSES.has(normalizeInvoiceStatus(i.status || '')))
    .map(buildInvoiceRecord)
    .sort((a, b) => b.daysOutstanding - a.daysOutstanding || b.amount - a.amount);

  return {
    data: {
      pendingEstimates: {
        count: pendingEstimateRecords.length,
        totalValue: pendingEstimateRecords.reduce((s, r) => s + r.amount, 0),
        records: pendingEstimateRecords
      },
      unpaidInvoices: {
        count: unpaidInvoiceRecords.length,
        totalValue: unpaidInvoiceRecords.reduce((s, r) => s + r.amount, 0),
        records: unpaidInvoiceRecords
      },
      fetchedAt: new Date().toISOString(),
      warnings
    },
    warnings
  };
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

    const cached = getReportCache<any>(workspaceId, `overview_${filters.startDate||''}_${filters.endDate||''}`);
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    try {
      const computed = await computeLiveOverviewReport(workspaceId, filters);
      setReportCache(workspaceId, `overview_${filters.startDate||''}_${filters.endDate||''}`, computed);
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

    const cached = getReportCache<any>(workspaceId, `opportunity_${filters.startDate||''}_${filters.endDate||''}`);
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    try {
      const computed = await computeLiveOpportunityReport(workspaceId, filters);
      setReportCache(workspaceId, `opportunity_${filters.startDate||''}_${filters.endDate||''}`, computed);
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

    const cached = getReportCache<any>(workspaceId, `sales_${filters.startDate||''}_${filters.endDate||''}`);
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    try {
      const computed = await computeLiveSalesReport(workspaceId, filters);
      setReportCache(workspaceId, `sales_${filters.startDate||''}_${filters.endDate||''}`, computed);
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

    const cacheKey = `owner_${filters.userId||'all'}_${filters.source||'all'}_${filters.startDate||''}_${filters.endDate||''}`;
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

    const cacheKey = `marketing_${filters.source||'all'}_${filters.campaign||'all'}_${filters.startDate||''}_${filters.endDate||''}`;
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

  static async getAppointmentDashboardReport(
    workspaceId: string,
    filters: { startDate?: string; endDate?: string; userId?: string } = {}
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const settings = db.getReportingSettings(workspaceId);

    if (settings.mode === 'MOCK') {
      const mockData: AppointmentDashboardReport = {
        summary: { totalBooked: 58, totalShowed: 42, totalNoShow: 9, totalCancelled: 7, totalConfirmed: 0, showRate: 82, noShowRate: 18, cancellationRate: 12, upcomingCount: 14 },
        statusDistribution: [
          { status: 'Showed', count: 42 },
          { status: 'No-Show', count: 9 },
          { status: 'Cancelled', count: 7 }
        ],
        calendarBreakdown: [
          { calendarId: 'cal_main', calendarName: 'Sales Consultations', total: 32, showed: 25, noshow: 5, cancelled: 2, confirmed: 0, showRate: 83 },
          { calendarId: 'cal_pool', calendarName: 'Pool Inspections', total: 18, showed: 13, noshow: 3, cancelled: 2, confirmed: 0, showRate: 81 },
          { calendarId: 'cal_follow', calendarName: 'Follow-Up Calls', total: 8, showed: 4, noshow: 1, cancelled: 3, confirmed: 0, showRate: 80 }
        ],
        repBreakdown: [
          { userId: 'usr_001', userName: 'Marcus Sterling', booked: 18, showed: 15, noshow: 2, cancelled: 1, showRate: 88 },
          { userId: 'usr_002', userName: 'Sarah Jenkins', booked: 22, showed: 16, noshow: 4, cancelled: 2, showRate: 80 },
          { userId: 'usr_003', userName: 'Devon Carter', booked: 12, showed: 8, noshow: 2, cancelled: 2, showRate: 80 },
          { userId: 'usr_004', userName: 'Isabella Cruz', booked: 6, showed: 3, noshow: 1, cancelled: 2, showRate: 75 }
        ],
        upcomingAppointments: [
          { id: 'apt_001', title: 'Pool Design Consultation — Amanda Ross', startTime: new Date(Date.now() + 2 * 3600000).toISOString(), status: 'confirmed', userId: 'usr_001', userName: 'Marcus Sterling', calendarId: 'cal_main', calendarName: 'Sales Consultations' },
          { id: 'apt_002', title: 'Pool Inspection — Donovan Corp', startTime: new Date(Date.now() + 5 * 3600000).toISOString(), status: 'confirmed', userId: 'usr_002', userName: 'Sarah Jenkins', calendarId: 'cal_pool', calendarName: 'Pool Inspections' },
          { id: 'apt_003', title: 'Inground Spa Quote — Reyes Family', startTime: new Date(Date.now() + 26 * 3600000).toISOString(), status: 'confirmed', userId: 'usr_001', userName: 'Marcus Sterling', calendarId: 'cal_main', calendarName: 'Sales Consultations' },
          { id: 'apt_004', title: 'Remodel Assessment — Holloway Estate', startTime: new Date(Date.now() + 50 * 3600000).toISOString(), status: 'confirmed', userId: 'usr_003', userName: 'Devon Carter', calendarId: 'cal_main', calendarName: 'Sales Consultations' },
          { id: 'apt_005', title: 'Commercial Pool Bid — Park District', startTime: new Date(Date.now() + 74 * 3600000).toISOString(), status: 'confirmed', userId: 'usr_002', userName: 'Sarah Jenkins', calendarId: 'cal_main', calendarName: 'Sales Consultations' }
        ],
        trends: [
          { date: 'Wk 1', booked: 12, showed: 8, noshow: 3 },
          { date: 'Wk 2', booked: 16, showed: 12, noshow: 2 },
          { date: 'Wk 3', booked: 18, showed: 14, noshow: 3 },
          { date: 'Wk 4', booked: 12, showed: 8, noshow: 1 }
        ]
      };
      return { source: 'mock' as const, data: mockData, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    const cacheKey = `appointment_${filters.userId||'all'}_${filters.startDate||''}_${filters.endDate||''}`;
    const cached = getReportCache<any>(workspaceId, cacheKey);
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    try {
      const result = await computeLiveAppointmentReport(workspaceId, filters);
      setReportCache(workspaceId, cacheKey, result.data);
      return { source: 'live' as const, data: result.data, warnings: result.warnings, unavailableMetrics: result.unavailableMetrics, stale: false };
    } catch (err: any) {
      console.error('[LiveReportingService] Appointment failed:', err.message);
      if (isProd) {
        return { source: 'live' as const, data: null as any, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ['all'] as string[], stale: false };
      }
      return { source: 'live' as const, data: null as any, warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [] as string[], stale: false };
    }
  }

  static async getEstimatesInvoicesReport(
    workspaceId: string,
    filters: { startDate?: string; endDate?: string } = {}
  ) {
    const isProd = process.env.NODE_ENV === 'production';
    const settings = db.getReportingSettings(workspaceId);

    if (settings.mode === 'MOCK') {
      const now = Date.now();
      const d = (daysAgo: number) => new Date(now - daysAgo * 86400000).toISOString();
      const mockData: EstimatesInvoicesReport = {
        estimates: {
          totalCount: 45,
          totalValue: 543500,
          byStatus: {
            DRAFT:     { count: 5,  value: 48500  },
            SENT:      { count: 12, value: 156000 },
            VIEWED:    { count: 8,  value: 104200 },
            ACCEPTED:  { count: 9,  value: 118500 },
            REJECTED:  { count: 4,  value: 42000  },
            CONVERTED: { count: 6,  value: 64800  },
            EXPIRED:   { count: 1,  value: 9500   }
          },
          funnel: { sent: 40, sentValue: 495000, viewed: 27, viewRate: 68, accepted: 9, acceptanceRate: 23, rejected: 4, rejectionRate: 10, converted: 6, conversionRate: 15, expired: 1 }
        },
        invoices: {
          totalCount: 31,
          totalValue: 400500,
          totalPaid: 214000,
          totalOutstanding: 186000,
          collectionRate: 53,
          avgInvoiceValue: 14304,
          byStatus: {
            DRAFT:     { count: 2,  value: 24000,  amountPaid: 0,      amountDue: 24000  },
            SENT:      { count: 6,  value: 87500,  amountPaid: 0,      amountDue: 87500  },
            PAID:      { count: 14, value: 196000, amountPaid: 196000, amountDue: 0      },
            PARTIAL:   { count: 3,  value: 48000,  amountPaid: 18000,  amountDue: 30000  },
            OVERDUE:   { count: 5,  value: 68500,  amountPaid: 0,      amountDue: 68500  },
            CANCELLED: { count: 1,  value: 8500,   amountPaid: 0,      amountDue: 0      }
          },
          aging: {
            current:    { count: 4, value: 38000 },
            days1to30:  { count: 4, value: 52000 },
            days31to60: { count: 3, value: 54000 },
            days61plus: { count: 3, value: 42000 }
          },
          unpaidList: [
            { id: 'inv_m1', invoiceNumber: 'INV-0041', name: 'Inground Pool Construction', contactName: 'James & Amanda Holloway', contactEmail: 'holloway@email.com',    amountDue: 18200, total: 18200, dueDate: d(75),  issueDate: d(105), daysOverdue: 75, status: 'OVERDUE'  },
            { id: 'inv_m2', invoiceNumber: 'INV-0038', name: 'Pool Renovation & Tile Work', contactName: 'Westside Properties LLC',  contactEmail: 'billing@westside.com', amountDue: 14800, total: 14800, dueDate: d(45),  issueDate: d(75),  daysOverdue: 45, status: 'OVERDUE'  },
            { id: 'inv_m3', invoiceNumber: 'INV-0040', name: 'Spa Installation Package',   contactName: 'Carter Residence',         contactEmail: 'carter@home.net',      amountDue: 12400, total: 12400, dueDate: d(35),  issueDate: d(65),  daysOverdue: 35, status: 'OVERDUE'  },
            { id: 'inv_m4', invoiceNumber: 'INV-0039', name: 'Commercial Pool Service',    contactName: 'Apex Athletic Club',       contactEmail: 'ops@apexclub.com',     amountDue: 23100, total: 23100, dueDate: d(22),  issueDate: d(52),  daysOverdue: 22, status: 'OVERDUE'  },
            { id: 'inv_m5', invoiceNumber: 'INV-0043', name: 'Pool Deck & Coping Work',    contactName: 'Rivera Family Trust',      contactEmail: 'rivera@email.com',     amountDue: 8750,  total: 17500, dueDate: d(15),  issueDate: d(45),  daysOverdue: 15, status: 'PARTIAL'  },
            { id: 'inv_m6', invoiceNumber: 'INV-0044', name: 'Equipment Upgrade Package',  contactName: 'Blue Water Estates',       contactEmail: 'bwe@estates.com',      amountDue: 7200,  total: 7200,  dueDate: d(8),   issueDate: d(38),  daysOverdue: 8,  status: 'SENT'    },
            { id: 'inv_m7', invoiceNumber: 'INV-0045', name: 'Pool Cleaning Annual Plan',  contactName: 'Henderson Household',      contactEmail: 'henderson@mail.com',   amountDue: 5500,  total: 5500,  dueDate: d(-5),  issueDate: d(25),  daysOverdue: 0,  status: 'SENT'    },
            { id: 'inv_m8', invoiceNumber: 'INV-0046', name: 'Leak Detection & Repair',    contactName: 'Davidson Properties',      contactEmail: 'davidson@prop.net',    amountDue: 14500, total: 29000, dueDate: d(-12), issueDate: d(18),  daysOverdue: 0,  status: 'PARTIAL' }
          ]
        },
        crossMetrics: { estimateToInvoiceRate: 15 },
        warnings: [],
        unavailableMetrics: ['avgDaysToPayment']
      };
      return { source: 'mock' as const, data: mockData, warnings: [] as string[], unavailableMetrics: ['avgDaysToPayment'] as string[], stale: false };
    }

    const cacheKey = `estimates_invoices_${filters.startDate||''}_${filters.endDate||''}`;
    const cached = getReportCache<any>(workspaceId, cacheKey);
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], unavailableMetrics: [] as string[], stale: false };
    }

    try {
      const result = await computeLiveEstimatesInvoicesReport(workspaceId, filters);
      setReportCache(workspaceId, cacheKey, result.data);
      return { source: 'live' as const, data: result.data, warnings: result.warnings, unavailableMetrics: result.unavailableMetrics, stale: false };
    } catch (err: any) {
      console.error('[LiveReportingService] EstimatesInvoices failed:', err.message);
      if (isProd) {
        return { source: 'live' as const, data: null as any, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ['all'] as string[], stale: false };
      }
      return { source: 'live' as const, data: null as any, warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [] as string[], stale: false };
    }
  }

  static async getOutstandingReport(workspaceId: string) {
    const isProd = process.env.NODE_ENV === 'production';
    const settings = db.getReportingSettings(workspaceId);

    if (settings.mode === 'MOCK') {
      const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();
      return {
        source: 'mock' as const,
        data: {
          pendingEstimates: {
            count: 4,
            totalValue: 89200,
            records: [
              { id: 'est_m1', number: 'EST-0022', name: 'Pool Renovation Package',       contactName: 'Brian & Lisa Whitmore', contactEmail: 'whitmore@email.com',    status: 'SENT',   sentDate: d(45), amount: 28500, daysOutstanding: 45 },
              { id: 'est_m2', number: 'EST-0024', name: 'Equipment Upgrade Quote',        contactName: 'Sunrise Properties',    contactEmail: 'ops@sunrise.com',       status: 'VIEWED', sentDate: d(28), amount: 14200, daysOutstanding: 28 },
              { id: 'est_m3', number: 'EST-0025', name: 'Spa & Water Feature Install',    contactName: 'Martinez Family',       contactEmail: 'martinez@gmail.com',    status: 'SENT',   sentDate: d(12), amount: 31800, daysOutstanding: 12 },
              { id: 'est_m4', number: 'EST-0026', name: 'Annual Service Plan',            contactName: 'Valley Club HOA',       contactEmail: 'admin@valleyclub.org',  status: 'VIEWED', sentDate: d(6),  amount: 14700, daysOutstanding: 6  },
            ] as OutstandingRecord[]
          },
          unpaidInvoices: {
            count: 5,
            totalValue: 112450,
            records: [
              { id: 'inv_o1', number: 'INV-0041', name: 'Inground Pool Construction',    contactName: 'James & Amanda Holloway', contactEmail: 'holloway@email.com',    status: 'OVERDUE', sentDate: d(105), amount: 18200, daysOutstanding: 105 },
              { id: 'inv_o2', number: 'INV-0038', name: 'Pool Renovation & Tile Work',   contactName: 'Westside Properties LLC', contactEmail: 'billing@westside.com',  status: 'OVERDUE', sentDate: d(75),  amount: 14800, daysOutstanding: 75  },
              { id: 'inv_o3', number: 'INV-0043', name: 'Pool Deck & Coping Work',       contactName: 'Rivera Family Trust',    contactEmail: 'rivera@email.com',      status: 'PARTIAL', sentDate: d(45),  amount: 8750,  daysOutstanding: 45  },
              { id: 'inv_o4', number: 'INV-0046', name: 'Leak Detection & Repair',       contactName: 'Davidson Properties',    contactEmail: 'davidson@prop.net',     status: 'PARTIAL', sentDate: d(18),  amount: 14500, daysOutstanding: 18  },
              { id: 'inv_o5', number: 'INV-0047', name: 'Pool Cleaning Annual Plan',     contactName: 'Henderson Household',    contactEmail: 'henderson@mail.com',    status: 'SENT',    sentDate: d(25),  amount: 56200, daysOutstanding: 25  },
            ] as OutstandingRecord[]
          },
          fetchedAt: new Date().toISOString(),
          warnings: [] as string[]
        } as OutstandingReport,
        warnings: [] as string[],
        stale: false
      };
    }

    const cacheKey = 'outstanding_alltime';
    const cached = getReportCache<OutstandingReport>(workspaceId, cacheKey);
    if (cached && !cached.stale) {
      return { source: 'live' as const, data: cached.data, warnings: [] as string[], stale: false };
    }

    try {
      const result = await computeLiveOutstandingReport(workspaceId);
      setReportCache(workspaceId, cacheKey, result.data);
      return { source: 'live' as const, data: result.data, warnings: result.warnings, stale: false };
    } catch (err: any) {
      console.error('[LiveReportingService] Outstanding failed:', err.message);
      if (isProd) {
        return { source: 'live' as const, data: null as any, error: err.message, warnings: [`Live data unavailable: ${err.message}`], stale: false };
      }
      return { source: 'live' as const, data: null as any, warnings: [`Dev fallback: ${err.message}`], stale: false };
    }
  }

  // ── CSV EXPORT: raw records for client-side download ──────────────────────

  static async getEstimatesExport(workspaceId: string) {
    const settings = db.getReportingSettings(workspaceId);
    if (settings.mode === 'MOCK') return { source: 'mock' as const, estimates: [], count: 0 };
    let locationId = '';
    try { locationId = resolveGHLAuthentication(workspaceId).locationId; }
    catch (err: any) { throw new Error(`AUTH_ERROR: ${err.message}`); }
    const raw = await fetchAllEstimates(workspaceId, locationId, {});
    const isoDate = (s: string) => { if (!s) return ''; try { return new Date(s).toISOString().slice(0, 10); } catch { return ''; } };
    const estimates = raw.map(e => ({
      estimateNumber: e.estimateNumber || '',
      contactName:    sanitizeContactName(e.contactDetails?.name || e.contact?.name || `${e.contact?.firstName || ''} ${e.contact?.lastName || ''}`) || '',
      contactEmail:   e.contactDetails?.email || e.contact?.email || '',
      status:         normalizeEstimateStatus(e.estimateStatus || e.status || ''),
      total:          Number(e.total) || 0,
      sentDate:       isoDate(e.sentAt || e.issueDate || ''),
      createdAt:      isoDate(e.createdAt || ''),
    }));
    return { source: 'live' as const, estimates, count: estimates.length };
  }

  static async getInvoicesExport(workspaceId: string) {
    const settings = db.getReportingSettings(workspaceId);
    if (settings.mode === 'MOCK') return { source: 'mock' as const, invoices: [], count: 0 };
    let locationId = '';
    try { locationId = resolveGHLAuthentication(workspaceId).locationId; }
    catch (err: any) { throw new Error(`AUTH_ERROR: ${err.message}`); }
    const raw = await fetchAllInvoices(workspaceId, locationId, {});
    const isoDate = (s: string) => { if (!s) return ''; try { return new Date(s).toISOString().slice(0, 10); } catch { return ''; } };
    const invoices = raw.map(i => ({
      invoiceNumber: i.invoiceNumber || i.number || '',
      contactName:   sanitizeContactName(i.contactDetails?.name || i.contact?.name || `${i.contact?.firstName || ''} ${i.contact?.lastName || ''}`) || '',
      contactEmail:  i.contactDetails?.email || i.contact?.email || '',
      status:        normalizeInvoiceStatus(i.status || ''),
      total:         Number(i.total) || 0,
      amountDue:     Number(i.amountDue) || 0,
      dueDate:       isoDate(i.dueDate || ''),
      sentDate:      isoDate(i.sentAt || i.issueDate || ''),
      createdAt:     isoDate(i.createdAt || ''),
    }));
    return { source: 'live' as const, invoices, count: invoices.length };
  }
}
