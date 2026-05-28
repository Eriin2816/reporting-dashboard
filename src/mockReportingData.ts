/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { OwnerPerformanceReport, VAPerformanceReport, MarketingPerformanceReport, TrendChartPoint, FunnelStage } from './types.js';

// Raw list of team members/users to keep consistency
export const mockTeamOwners = [
  { id: 'usr_001', name: 'Marcus Sterling', email: 'marcus@showtimepools.com' },
  { id: 'usr_002', name: 'Sarah Jenkins', email: 'sarah@showtimepools.com' },
  { id: 'usr_003', name: 'Devon Carter', email: 'devon@showtimepools.com' },
  { id: 'usr_004', name: 'Isabella Cruz', email: 'isabella@showtimepools.com' }
];

// Raw list of VAs/Assigned responders
export const mockVirtualAssistants = [
  { id: 'va_001', name: 'Alisha Gomez' },
  { id: 'va_002', name: 'Keanu Reeves' },
  { id: 'va_003', name: 'Maria Santos' },
  { id: 'va_004', name: 'Brandon Lee' }
];

// Campaign list
export const mockCampaigns = [
  { id: 'camp_001', name: 'Backyard Oasis Inbound Promo' },
  { id: 'camp_002', name: 'Summer Hot Tub Blast 2026' },
  { id: 'camp_003', name: 'Organic SEO Website Funnel' },
  { id: 'camp_004', name: 'Facebook Direct Retargeting Leads' },
  { id: 'camp_005', name: 'Yelp Local High-Intent Referrals' }
];

// Lead Sourced Channels
export const mockSources = [
  'Google Local Service Ads',
  'Facebook Ads',
  'Google Search Organic',
  'Referral',
  'Yelp Organic',
  'Instagram Ads'
];

// Service categories (service types / tags)
export const mockServiceCategories = [
  'Pool Install',
  'Pool Remodel',
  'Leak Detection',
  'Weekly Service'
];

/**
 * Filter simulation helper that checks if a item date fits within startDate/endDate parameters
 */
function isDateInFilterRange(itemDateStr: string, startDate?: string, endDate?: string): boolean {
  if (!startDate && !endDate) return true;
  const t = new Date(itemDateStr).getTime();
  if (startDate) {
    const s = new Date(startDate).getTime();
    if (t < s) return false;
  }
  if (endDate) {
    const e = new Date(endDate).getTime();
    if (t > e) return false;
  }
  return true;
}

/**
 * GENERATOR: Page 1: Owner Performance Metrics & Attributions
 */
export function getOwnerPerformanceReport(filters: {
  startDate?: string;
  endDate?: string;
  userId?: string;
  source?: string;
  campaign?: string;
  serviceCategory?: string;
} = {}): OwnerPerformanceReport {
  // We can filter our mock parameters dynamically to simulate an outstanding, functional backend engine
  const userFilter = filters.userId;
  const sourceFilter = filters.source;
  const campaignFilter = filters.campaign;
  const serviceCategoryFilter = filters.serviceCategory;

  // Filter breakdown users list
  const targetingOwners = userFilter 
    ? mockTeamOwners.filter(u => u.id === userFilter) 
    : mockTeamOwners;

  // Seed baseline owner metrics to generate aggregated views and breakdown array
  const mockBaseData: Record<string, {
    totalLeads: number;
    newLeads: number;
    bookedAppointments: number;
    showedApts: number;
    closedWon: number;
    pipelineValue: number;
    wonRevenue: number;
    lostOpps: number;
    missedLeads: number;
    totalSpeedSec: number;
    revenueBySource: Record<string, number>;
    revenueByServiceType: Record<string, number>;
  }> = {
    usr_001: {
      totalLeads: 24, newLeads: 5, bookedAppointments: 18, showedApts: 15, closedWon: 8,
      pipelineValue: 360000, wonRevenue: 245000, lostOpps: 4, missedLeads: 1, totalSpeedSec: 88,
      revenueBySource: { 'Google Local Service Ads': 135000, 'Referral': 95000, 'Yelp Organic': 15000 },
      revenueByServiceType: { 'Pool Install': 180000, 'Pool Remodel': 50000, 'Leak Detection': 15000 }
    },
    usr_002: {
      totalLeads: 31, newLeads: 8, bookedAppointments: 22, showedApts: 19, closedWon: 9,
      pipelineValue: 285000, wonRevenue: 132000, lostOpps: 7, missedLeads: 3, totalSpeedSec: 142,
      revenueBySource: { 'Facebook Ads': 65000, 'Google Search Organic': 45000, 'Instagram Ads': 22000 },
      revenueByServiceType: { 'Pool Remodel': 85000, 'Weekly Service': 25000, 'Leak Detection': 22000 }
    },
    usr_003: {
      totalLeads: 19, newLeads: 3, bookedAppointments: 12, showedApts: 9, closedWon: 4,
      pipelineValue: 165000, wonRevenue: 74000, lostOpps: 5, missedLeads: 2, totalSpeedSec: 210,
      revenueBySource: { 'Google Search Organic': 38000, 'Facebook Ads': 28000, 'Yelp Organic': 8000 },
      revenueByServiceType: { 'Pool Install': 45000, 'Leak Detection': 21000, 'Weekly Service': 8000 }
    },
    usr_004: {
      totalLeads: 28, newLeads: 7, bookedAppointments: 20, showedApts: 17, closedWon: 7,
      pipelineValue: 240000, wonRevenue: 118000, lostOpps: 6, missedLeads: 0, totalSpeedSec: 95,
      revenueBySource: { 'Yelp Organic': 18000, 'Referral': 58000, 'Google Local Service Ads': 42000 },
      revenueByServiceType: { 'Pool Install': 82000, 'Pool Remodel': 28000, 'Leak Detection': 8000 }
    }
  };

  // Compile matching metrics based on filters
  let totalLeads = 0;
  let newLeads = 0;
  let bookedAppointments = 0;
  let showedApts = 0;
  let closedWon = 0;
  let pipelineValue = 0;
  let wonRevenue = 0;
  let lostOpps = 0;
  let missedLeadsOrCalls = 0;
  let totalSpeedAcrossAllSec = 0;
  let speedCount = 0;

  const aggregatedSourceRev: Record<string, number> = {};
  const aggregatedServiceRev: Record<string, number> = {};

  const ownerBreakdown = targetingOwners.map(owner => {
    const raw = mockBaseData[owner.id] || {
      totalLeads: 10, newLeads: 2, bookedAppointments: 5, showedApts: 4, closedWon: 2,
      pipelineValue: 50000, wonRevenue: 25050, lostOpps: 2, missedLeads: 1, totalSpeedSec: 150,
      revenueBySource: {}, revenueByServiceType: {}
    };

    // Apply specific source filters if supplied
    let multiplier = 1.0;
    if (sourceFilter) {
      // simulate filter impact
      multiplier = mockSources.includes(sourceFilter) ? 0.4 : 0.05;
    }
    if (campaignFilter) {
      multiplier *= 0.35;
    }
    if (serviceCategoryFilter) {
      multiplier *= 0.5;
    }

    const locLeads = Math.max(1, Math.round(raw.totalLeads * multiplier));
    const locNew = Math.max(0, Math.round(raw.newLeads * multiplier));
    const locBooked = Math.max(1, Math.round(raw.bookedAppointments * multiplier));
    const locShowed = Math.max(1, Math.round(raw.showedApts * multiplier));
    const locWon = Math.max(0, Math.round(raw.closedWon * multiplier));
    const locPip = Math.round(raw.pipelineValue * multiplier);
    const locRev = Math.round(raw.wonRevenue * multiplier);
    const locLost = Math.max(0, Math.round(raw.lostOpps * multiplier));
    const locMissed = Math.max(0, Math.round(raw.missedLeads * multiplier));
    const speed = Math.max(15, raw.totalSpeedSec);

    // Filtered internal breakdowns of Revenue Source
    Object.entries(raw.revenueBySource).forEach(([src, val]) => {
      if (!sourceFilter || src === sourceFilter) {
        const value = Math.round(val * (campaignFilter ? 0.5 : 1) * (serviceCategoryFilter ? 0.6 : 1));
        aggregatedSourceRev[src] = (aggregatedSourceRev[src] || 0) + value;
      }
    });

    // Filtered internal breakdowns of Service Type
    Object.entries(raw.revenueByServiceType).forEach(([service, val]) => {
      if (!serviceCategoryFilter || service === serviceCategoryFilter) {
        const value = Math.round(val * (sourceFilter ? 0.4 : 1) * (campaignFilter ? 0.5 : 1));
        aggregatedServiceRev[service] = (aggregatedServiceRev[service] || 0) + value;
      }
    });

    // Accumulate summaries
    totalLeads += locLeads;
    newLeads += locNew;
    bookedAppointments += locBooked;
    showedApts += locShowed;
    closedWon += locWon;
    pipelineValue += locPip;
    wonRevenue += locRev;
    lostOpps += locLost;
    missedLeadsOrCalls += locMissed;
    totalSpeedAcrossAllSec += speed;
    speedCount++;

    const sRate = locBooked > 0 ? Math.round((locShowed / locBooked) * 100) : 0;
    const cRate = locBooked > 0 ? Math.round((locWon / locBooked) * 100) : 0;

    return {
      userId: owner.id,
      userName: owner.name,
      userEmail: owner.email,
      totalLeads: locLeads,
      newLeads: locNew,
      bookedAppointments: locBooked,
      showRate: Math.min(100, sRate),
      closeRate: Math.min(100, cRate),
      pipelineValue: locPip,
      wonRevenue: locRev,
      lostOpportunities: locLost,
      missedLeads: locMissed,
      avgSpeedToLeadSec: speed
    };
  });

  const aggregateShowRate = bookedAppointments > 0 ? Math.round((showedApts / bookedAppointments) * 100) : 75;
  const aggregateCloseRate = bookedAppointments > 0 ? Math.round((closedWon / bookedAppointments) * 100) : 38;
  const leadToBookingConvRate = totalLeads > 0 ? Math.round((bookedAppointments / totalLeads) * 100) : 45;
  const bookingToWonConvRate = bookedAppointments > 0 ? Math.round((closedWon / bookedAppointments) * 100) : 34;
  const finalAvgSpeedSec = speedCount > 0 ? Math.round(totalSpeedAcrossAllSec / speedCount) : 120;

  // Assemble charts trend line over May 2026
  const trends: TrendChartPoint[] = [
    { date: '2026-05-01', leads: Math.round(totalLeads * 0.15), wonRevenue: Math.round(wonRevenue * 0.1), pipeline: Math.round(pipelineValue * 0.15) },
    { date: '2026-05-07', leads: Math.round(totalLeads * 0.32), wonRevenue: Math.round(wonRevenue * 0.28), pipeline: Math.round(pipelineValue * 0.35) },
    { date: '2026-05-14', leads: Math.round(totalLeads * 0.55), wonRevenue: Math.round(wonRevenue * 0.5), pipeline: Math.round(pipelineValue * 0.6) },
    { date: '2026-05-21', leads: Math.round(totalLeads * 0.8), wonRevenue: Math.round(wonRevenue * 0.82), pipeline: Math.round(pipelineValue * 0.85) },
    { date: '2026-05-27', leads: totalLeads, wonRevenue: wonRevenue, pipeline: pipelineValue }
  ];

  // Assemble dynamic funnel stages representation
  const funnel: FunnelStage[] = [
    { stage: 'Total Sourced Contacts', count: totalLeads, percentageOfPrevious: 100, percentageOfTotal: 100 },
    { stage: 'Pipeline Opportunities', count: Math.round(totalLeads * 0.85), percentageOfPrevious: 85, percentageOfTotal: 85 },
    { stage: 'Booked Appointments', count: bookedAppointments, percentageOfPrevious: Math.round((bookedAppointments / (totalLeads * 0.85)) * 100), percentageOfTotal: leadToBookingConvRate },
    { stage: 'Confirmed Attended (Showed)', count: showedApts, percentageOfPrevious: aggregateShowRate, percentageOfTotal: Math.round((showedApts / totalLeads) * 100) },
    { stage: 'Closed Won Contracts', count: closedWon, percentageOfPrevious: aggregateCloseRate, percentageOfTotal: Math.round((closedWon / totalLeads) * 100) }
  ];

  return {
    summary: {
      totalLeads,
      newLeads,
      bookedAppointments,
      showRate: Math.min(100, aggregateShowRate),
      closeRate: Math.min(100, aggregateCloseRate),
      pipelineValue,
      wonRevenue,
      lostOpportunities: lostOpps,
      missedLeadsOrCalls,
      avgSpeedToLeadSec: finalAvgSpeedSec,
      leadToBookingConvRate: Math.min(100, leadToBookingConvRate),
      bookingToWonConvRate: Math.min(100, bookingToWonConvRate)
    },
    revenueBySource: Object.keys(aggregatedSourceRev).length > 0 ? aggregatedSourceRev : { 'Google Local Service Ads': 142000, 'Facebook Ads': 93000, 'Other Organic': 110000 },
    revenueByServiceType: Object.keys(aggregatedServiceRev).length > 0 ? aggregatedServiceRev : { 'Pool Install': 225000, 'Pool Remodel': 113000, 'Leak Detection': 72000 },
    ownerBreakdown,
    trends,
    funnel
  };
}

/**
 * GENERATOR: Page 2: VA (Virtual Assistant) Performance report
 */
export function getVAPerformanceReport(filters: {
  startDate?: string;
  endDate?: string;
  userId?: string;
  source?: string;
  campaign?: string;
  serviceCategory?: string;
} = {}): VAPerformanceReport {
  // Read inputs to adjust response dynamically
  const userFilter = filters.userId;
  const sourceFilter = filters.source;
  const campaignFilter = filters.campaign;

  // Filter virtual assistants list
  const targetingVAs = userFilter 
    ? mockVirtualAssistants.filter(v => v.id === userFilter) 
    : mockVirtualAssistants;

  // VA Sourced Baseline
  const mockBaseVA: Record<string, {
    leadsAssigned: number;
    leadsContacted: number;
    avgFirstResponseTimeMin: number;
    conversationsHandled: number;
    followUpsCompleted: number;
    tasksCompleted: number;
    appointmentsBooked: number;
    noShowRecoveryAttempts: number;
    staleLeadsCount: number;
    responseSlaPerformance: number;
  }> = {
    va_001: {
      leadsAssigned: 55, leadsContacted: 53, avgFirstResponseTimeMin: 2.1, conversationsHandled: 120,
      followUpsCompleted: 98, tasksCompleted: 45, appointmentsBooked: 24, noShowRecoveryAttempts: 15,
      staleLeadsCount: 1, responseSlaPerformance: 98
    },
    va_002: {
      leadsAssigned: 48, leadsContacted: 44, avgFirstResponseTimeMin: 4.8, conversationsHandled: 95,
      followUpsCompleted: 78, tasksCompleted: 38, appointmentsBooked: 18, noShowRecoveryAttempts: 8,
      staleLeadsCount: 4, responseSlaPerformance: 89
    },
    va_003: {
      leadsAssigned: 62, leadsContacted: 61, avgFirstResponseTimeMin: 1.8, conversationsHandled: 145,
      followUpsCompleted: 110, tasksCompleted: 52, appointmentsBooked: 29, noShowRecoveryAttempts: 19,
      staleLeadsCount: 2, responseSlaPerformance: 99
    },
    va_004: {
      leadsAssigned: 42, leadsContacted: 38, avgFirstResponseTimeMin: 6.2, conversationsHandled: 82,
      followUpsCompleted: 65, tasksCompleted: 30, appointmentsBooked: 14, noShowRecoveryAttempts: 6,
      staleLeadsCount: 5, responseSlaPerformance: 82
    }
  };

  let leadsAssigned = 0;
  let leadsContacted = 0;
  let sumFirstResponse = 0;
  let conversationsHandled = 0;
  let followUpsCompleted = 0;
  let tasksCompleted = 0;
  let appointmentsBooked = 0;
  let noShowRecoveryAttempts = 0;
  let staleLeadsCount = 0;
  let sumSlaPerf = 0;
  let countVAs = 0;

  const vaBreakdown = targetingVAs.map(va => {
    const raw = mockBaseVA[va.id] || {
      leadsAssigned: 20, leadsContacted: 18, avgFirstResponseTimeMin: 5, conversationsHandled: 40,
      followUpsCompleted: 30, tasksCompleted: 15, appointmentsBooked: 6, noShowRecoveryAttempts: 5,
      staleLeadsCount: 2, responseSlaPerformance: 90
    };

    let multiplier = 1.0;
    if (sourceFilter) multiplier *= 0.45;
    if (campaignFilter) multiplier *= 0.35;

    const locAssigned = Math.max(1, Math.round(raw.leadsAssigned * multiplier));
    const locContacted = Math.max(1, Math.round(raw.leadsContacted * multiplier));
    const locConversations = Math.max(2, Math.round(raw.conversationsHandled * multiplier));
    const locFollowups = Math.max(1, Math.round(raw.followUpsCompleted * multiplier));
    const locTasks = Math.max(1, Math.round(raw.tasksCompleted * multiplier));
    const locApts = Math.max(1, Math.round(raw.appointmentsBooked * multiplier));
    const locNoShowRec = Math.max(0, Math.round(raw.noShowRecoveryAttempts * multiplier));
    const locStale = Math.max(0, Math.round(raw.staleLeadsCount * (sourceFilter ? 0.5 : 1)));

    leadsAssigned += locAssigned;
    leadsContacted += locContacted;
    sumFirstResponse += raw.avgFirstResponseTimeMin;
    conversationsHandled += locConversations;
    followUpsCompleted += locFollowups;
    tasksCompleted += locTasks;
    appointmentsBooked += locApts;
    noShowRecoveryAttempts += locNoShowRec;
    staleLeadsCount += locStale;
    sumSlaPerf += raw.responseSlaPerformance;
    countVAs++;

    const bRate = locContacted > 0 ? Math.round((locApts / locContacted) * 100) : 0;

    return {
      vaId: va.id,
      vaName: va.name,
      leadsAssigned: locAssigned,
      leadsContacted: locContacted,
      avgFirstResponseTimeMin: raw.avgFirstResponseTimeMin,
      conversationsHandled: locConversations,
      followUpsCompleted: locFollowups,
      tasksCompleted: locTasks,
      appointmentsBooked: locApts,
      bookingRate: Math.min(100, bRate),
      noShowRecoveryAttempts: locNoShowRec,
      staleLeadsCount: locStale,
      responseSlaPerformance: raw.responseSlaPerformance
    };
  });

  const finalAvgSla = countVAs > 0 ? Math.round(sumSlaPerf / countVAs) : 92;
  const finalBookingRate = leadsContacted > 0 ? Math.round((appointmentsBooked / leadsContacted) * 100) : 41;
  const finalAvgResponse = countVAs > 0 ? Number((sumFirstResponse / countVAs).toFixed(1)) : 3.5;

  // Stale Leads drilldowns mockup
  const staleLeadsDetails = [
    { id: 'con_stale_1', leadName: 'Jack Reacher', assignedVa: 'Alisha Gomez', daysStale: 14, lastContactDate: '2026-05-13', status: 'Snoozed' },
    { id: 'con_stale_2', leadName: 'Monica Geller', assignedVa: 'Brandon Lee', daysStale: 9, lastContactDate: '2026-05-18', status: 'Needs Follow-up' },
    { id: 'con_stale_3', leadName: 'Chandler Bing', assignedVa: 'Keanu Reeves', daysStale: 11, lastContactDate: '2026-05-16', status: 'Unresponsive' },
    { id: 'con_stale_4', leadName: 'Ross Geller', assignedVa: 'Maria Santos', daysStale: 12, lastContactDate: '2026-05-15', status: 'Pending Re-engagement' }
  ].filter(l => !userFilter || l.assignedVa.includes(targetingVAs[0]?.name || '_'));

  // Recent activity logs representation
  const recentActivity = [
    { id: 'act_1', timestamp: new Date().toISOString(), vaName: 'Alisha Gomez', leadName: 'Sally Jenkins', action: 'Left Voice Mail & SMS follow-up', status: 'success' as const },
    { id: 'act_2', timestamp: new Date(Date.now() - 300000).toISOString(), vaName: 'Keanu Reeves', leadName: 'Douglas Croft', action: 'Booked service call request', status: 'success' as const },
    { id: 'act_3', timestamp: new Date(Date.now() - 1200000).toISOString(), vaName: 'Maria Santos', leadName: 'Brenda Wilkes', action: 'Sent custom pool dimensions quote link', status: 'info' as const },
    { id: 'act_4', timestamp: new Date(Date.now() - 4800000).toISOString(), vaName: 'Brandon Lee', leadName: 'Thomas Shelby', action: 'No-show recovery call dialed', status: 'pending' as const }
  ].filter(act => !userFilter || act.vaName === targetingVAs[0]?.name);

  const trends: TrendChartPoint[] = [
    { date: '2026-05-01', assigned: Math.round(leadsAssigned * 0.2), booked: Math.round(appointmentsBooked * 0.15) },
    { date: '2026-05-07', assigned: Math.round(leadsAssigned * 0.4), booked: Math.round(appointmentsBooked * 0.35) },
    { date: '2026-05-14', assigned: Math.round(leadsAssigned * 0.65), booked: Math.round(appointmentsBooked * 0.6) },
    { date: '2026-05-21', assigned: Math.round(leadsAssigned * 0.85), booked: Math.round(appointmentsBooked * 0.8) },
    { date: '2026-05-27', assigned: leadsAssigned, booked: appointmentsBooked }
  ];

  return {
    summary: {
      leadsAssigned,
      leadsContacted,
      avgFirstResponseTimeMin: finalAvgResponse,
      conversationsHandled,
      followUpsCompleted,
      tasksCompleted,
      appointmentsBooked,
      bookingRate: Math.min(100, finalBookingRate),
      noShowRecoveryAttempts,
      staleLeadsCount,
      responseSlaPerformance: finalAvgSla
    },
    vaBreakdown,
    recentActivity,
    staleLeadsDetails,
    trends
  };
}

/**
 * GENERATOR: Page 3: Marketing Attribution & Campaign Return metrics
 */
export function getMarketingPerformanceReport(filters: {
  startDate?: string;
  endDate?: string;
  userId?: string;
  source?: string;
  campaign?: string;
  serviceCategory?: string;
} = {}): MarketingPerformanceReport {
  const sourceFilter = filters.source;
  const campaignFilter = filters.campaign;

  // Original GHL CRM source lists baseline
  const baselineSources = [
    { name: 'Google Local Service Ads', leads: 48, won: 19, val: 142000, bookings: 32, cost: 4200 },
    { name: 'Facebook Ads', leads: 62, won: 14, val: 93500, bookings: 28, cost: 3800 },
    { name: 'Google Search Organic', leads: 28, won: 9, val: 82000, bookings: 16, cost: 0 },
    { name: 'Referral', leads: 12, won: 8, val: 110000, bookings: 10, cost: 150 },
    { name: 'Yelp Organic', leads: 15, won: 4, val: 23000, bookings: 8, cost: 50 },
    { name: 'Instagram Ads', leads: 21, won: 6, val: 38000, bookings: 12, cost: 1100 }
  ];

  let totalLeads = 0;
  let totalBookings = 0;
  let totalPipelineValue = 0;
  let totalWonRevenue = 0;
  let totalSpend = 0;

  const leadsBySource: Record<string, number> = {};
  const bookingsBySource: Record<string, number> = {};
  const pipelineValueBySource: Record<string, number> = {};
  const wonRevenueBySource: Record<string, number> = {};

  baselineSources.forEach(s => {
    if (!sourceFilter || s.name === sourceFilter) {
      let multiplier = 1.0;
      if (campaignFilter) {
        multiplier = 0.55; // simulate drilling into a single attribution
      }

      const l = Math.max(1, Math.round(s.leads * multiplier));
      const b = Math.max(1, Math.round(s.bookings * multiplier));
      const wVal = Math.round(s.val * multiplier);
      const pip = Math.round(s.val * 1.3 * multiplier);
      const cost = Math.round(s.cost * multiplier);

      totalLeads += l;
      totalBookings += b;
      totalWonRevenue += wVal;
      totalPipelineValue += pip;
      totalSpend += cost;

      leadsBySource[s.name] = l;
      bookingsBySource[s.name] = b;
      pipelineValueBySource[s.name] = pip;
      wonRevenueBySource[s.name] = wVal;
    }
  });

  // Campaigns list formatting
  const campaignBreakdown = mockCampaigns.map((camp, idx) => {
    let multiplier = 1.0;
    if (sourceFilter) {
      // make check
      multiplier = sourceFilter.includes('Google') || sourceFilter.includes('Facebook') ? 0.7 : 0.15;
    }

    const cLeads = Math.max(1, Math.round((25 - idx * 4) * multiplier));
    const cBookings = Math.max(1, Math.round((18 - idx * 3) * multiplier));
    const cWon = Math.max(0, Math.round((10 - idx * 2) * multiplier));
    const cRevenue = Math.round((95000 - idx * 18000) * multiplier);
    const cPip = Math.round(cRevenue * 1.25);
    const cCost = Math.round((2200 - idx * 400) * multiplier);
    const roas = cCost > 0 ? Number((cRevenue / cCost).toFixed(1)) : 12.5;

    return {
      campaignId: camp.id,
      campaignName: camp.name,
      leads: cLeads,
      bookings: cBookings,
      pipelineValue: cPip,
      wonRevenue: cRevenue,
      cost: cCost,
      roas,
      conversionRate: cLeads > 0 ? Math.round((cWon / cLeads) * 100) : 0
    };
  });

  const leadToApptSla = totalLeads > 0 ? Math.round((totalBookings / totalLeads) * 100) : 51;
  const bookingsSought = baselineSources.reduce((sum, s) => sum + s.won, 0);
  const apptToWonSla = totalBookings > 0 ? Math.round((bookingsSought / totalBookings) * 100) : 69;
  const costPerLead = totalLeads > 0 ? Number((totalSpend / totalLeads).toFixed(2)) : 22.5;
  const calculatedRoas = totalSpend > 0 ? Number((totalWonRevenue / totalSpend).toFixed(1)) : 8.5;

  const leadsByCampaign: Record<string, number> = {};
  campaignBreakdown.forEach(c => {
    leadsByCampaign[c.campaignName] = c.leads;
  });

  const trends: TrendChartPoint[] = [
    { date: '2026-05-01', adsCost: Math.round(totalSpend * 0.18), returnRevenue: Math.round(totalWonRevenue * 0.12), bookingsCount: Math.round(totalBookings * 0.15) },
    { date: '2026-05-07', adsCost: Math.round(totalSpend * 0.35), returnRevenue: Math.round(totalWonRevenue * 0.29), bookingsCount: Math.round(totalBookings * 0.32) },
    { date: '2026-05-14', adsCost: Math.round(totalSpend * 0.58), returnRevenue: Math.round(totalWonRevenue * 0.52), bookingsCount: Math.round(totalBookings * 0.55) },
    { date: '2026-05-21', adsCost: Math.round(totalSpend * 0.82), returnRevenue: Math.round(totalWonRevenue * 0.78), bookingsCount: Math.round(totalBookings * 0.8) },
    { date: '2026-05-27', adsCost: totalSpend, returnRevenue: totalWonRevenue, bookingsCount: totalBookings }
  ];

  return {
    summary: {
      totalLeads,
      totalBookings,
      totalPipelineValue,
      totalWonRevenue,
      avgLeadToAppointmentRate: Math.min(100, leadToApptSla),
      avgAppointmentToWonRate: Math.min(100, apptToWonSla),
      costPerLeadPlaceholder: costPerLead,
      roasPlaceholder: calculatedRoas
    },
    leadsBySource,
    leadsByCampaign,
    bookingsBySource,
    pipelineValueBySource,
    wonRevenueBySource,
    campaignBreakdown,
    trends
  };
}
