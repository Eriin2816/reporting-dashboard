/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GHLUser, GHLContact, GHLOpportunity, GHLAppointment, GHLConversation, OwnerPerformanceMetric, MarketingMetric, DashboardMetrics } from './types';

export const mockUsers: GHLUser[] = [
  { id: 'usr_001', name: 'Marcus Sterling', email: 'marcus@showtimepools.com', role: 'admin', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&h=100&fit=crop&crop=faces' },
  { id: 'usr_002', name: 'Sarah Jenkins', email: 'sarah@showtimepools.com', role: 'user', avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=faces' },
  { id: 'usr_003', name: 'Devon Carter', email: 'devon@showtimepools.com', role: 'user', avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop&crop=faces' },
  { id: 'usr_004', name: 'Isabella Cruz', email: 'isabella@showtimepools.com', role: 'user', avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100&h=100&fit=crop&crop=faces' }
];

export const mockContacts: GHLContact[] = [
  { id: 'con_001', name: 'Robert Vance', email: 'vance.r@example.com', phone: '512-555-0192', source: 'Google Local Service Ads', tags: ['Pool Install', 'Hot Lead'], dateAdded: '2026-05-10T14:30:00Z' },
  { id: 'con_002', name: 'Emily Thorne', email: 'emily.thorne@example.com', phone: '512-555-0283', source: 'Facebook Ads', tags: ['Pool Remodel', 'Retargeting'], dateAdded: '2026-05-12T09:15:00Z' },
  { id: 'con_003', name: 'David Miller', email: 'dmiller@example.com', phone: '512-555-0374', source: 'Google Search Organic', tags: ['Weekly Service', 'Inquiry'], dateAdded: '2026-05-14T11:00:00Z' },
  { id: 'con_004', name: 'Michael Scott', email: 'regional_sales@example.com', phone: '512-555-0465', source: 'Referral', tags: ['Commercial Pool', 'Quote Sent'], dateAdded: '2026-05-15T16:45:00Z' },
  { id: 'con_005', name: 'Pam Beesly', email: 'pam.b@example.com', phone: '512-555-0556', source: 'Google Local Service Ads', tags: ['Pool Install', 'Appointment Booked'], dateAdded: '2026-05-16T10:20:00Z' },
  { id: 'con_006', name: 'Jim Halpert', email: 'jim.h@example.com', phone: '512-555-0647', source: 'Yelp Organic', tags: ['Leak Detection', 'Urgent'], dateAdded: '2026-05-18T08:30:00Z' },
  { id: 'con_007', name: 'Angela Martin', email: 'angela.m@example.com', phone: '512-555-0738', source: 'Facebook Ads', tags: ['Weekly Service'], dateAdded: '2026-05-19T13:10:00Z' },
  { id: 'con_008', name: 'Oscar Martinez', email: 'omartinez@example.com', phone: '512-555-0829', source: 'Referral', tags: ['Pool Remodel', 'High Value'], dateAdded: '2026-05-20T15:00:00Z' },
  { id: 'con_009', name: 'Stanley Hudson', email: 'stanley.h@example.com', phone: '512-555-0911', source: 'Google Search Organic', tags: ['Pool Install'], dateAdded: '2026-05-21T11:40:00Z' },
  { id: 'con_010', name: 'Kelly Kapoor', email: 'kelly.k@example.com', phone: '512-555-1022', source: 'Instagram Ads', tags: ['Pool Remodel', 'Social Lead'], dateAdded: '2026-05-22T17:15:00Z' },
  { id: 'con_011', name: 'Toby Flenderson', email: 'toby.f@example.com', phone: '512-555-1133', source: 'Yelp Organic', tags: ['Leak Detection'], dateAdded: '2026-05-23T09:05:00Z' },
  { id: 'con_012', name: 'Ryan Howard', email: 'ryan.h@example.com', phone: '512-555-1244', source: 'Google Local Service Ads', tags: ['Pool Install', 'Hot Lead'], dateAdded: '2026-05-24T14:50:00Z' },
  { id: 'con_013', name: 'Andy Bernard', email: 'cornell.andy@example.com', phone: '512-555-1355', source: 'Referral', tags: ['Pool Install', 'High Value'], dateAdded: '2026-05-25T10:30:00Z' },
  { id: 'con_014', name: 'Creed Bratton', email: 'creed@example.com', phone: '512-555-1466', source: 'Google Search Organic', tags: ['Leak Detection'], dateAdded: '2026-05-25T16:20:00Z' },
  { id: 'con_015', name: 'Phyllis Vance', email: 'phyllis@example.com', phone: '512-555-1577', source: 'Facebook Ads', tags: ['Weekly Service', 'Local Quote'], dateAdded: '2026-05-26T11:10:00Z' }
];

export const mockOpportunities: GHLOpportunity[] = [
  { id: 'opp_001', name: 'Robert Vance - Inground Pool', pipelineId: 'pipe_pools', stageId: 'stage_win', value: 45000, status: 'won', assignedTo: 'usr_001', source: 'Google Local Service Ads', createdAt: '2026-05-10T14:40:00Z' },
  { id: 'opp_002', name: 'Emily Thorne - Concrete Decking', pipelineId: 'pipe_pools', stageId: 'stage_proposal', value: 12500, status: 'open', assignedTo: 'usr_002', source: 'Facebook Ads', createdAt: '2026-05-12T09:30:00Z' },
  { id: 'opp_003', name: 'David Miller - Pool Renovation', pipelineId: 'pipe_pools', stageId: 'stage_won', value: 18000, status: 'won', assignedTo: 'usr_003', source: 'Google Search Organic', createdAt: '2026-05-14T11:15:00Z' },
  { id: 'opp_004', name: 'Michael Scott - Commercial Spa', pipelineId: 'pipe_pools', stageId: 'stage_negotiate', value: 65000, status: 'open', assignedTo: 'usr_001', source: 'Referral', createdAt: '2026-05-15T17:00:00Z' },
  { id: 'opp_005', name: 'Pam Beesly - Vinyl Liner Replacement', pipelineId: 'pipe_pools', stageId: 'stage_booked', value: 8500, status: 'open', assignedTo: 'usr_002', source: 'Google Local Service Ads', createdAt: '2026-05-16T10:45:00Z' },
  { id: 'opp_006', name: 'Jim Halpert - Leak Repair & Filter Install', pipelineId: 'pipe_pools', stageId: 'stage_won', value: 3200, status: 'won', assignedTo: 'usr_004', source: 'Yelp Organic', createdAt: '2026-05-18T08:45:00Z' },
  { id: 'opp_007', name: 'Angela Martin - Safety Cover & Winterize', pipelineId: 'pipe_pools', stageId: 'stage_lost', value: 2400, status: 'lost', assignedTo: 'usr_003', source: 'Facebook Ads', createdAt: '2026-05-19T13:30:00Z' },
  { id: 'opp_008', name: 'Oscar Martinez - Custom Infinity Edge Pool', pipelineId: 'pipe_pools', stageId: 'stage_proposal', value: 95000, status: 'open', assignedTo: 'usr_001', source: 'Referral', createdAt: '2026-05-20T15:15:00Z' },
  { id: 'opp_009', name: 'Stanley Hudson - Saltwater Upgrade', pipelineId: 'pipe_pools', stageId: 'stage_won', value: 5800, status: 'won', assignedTo: 'usr_002', source: 'Google Search Organic', createdAt: '2026-05-21T12:00:00Z' },
  { id: 'opp_010', name: 'Kelly Kapoor - Spa Automation System', pipelineId: 'pipe_pools', stageId: 'stage_proposal', value: 4500, status: 'open', assignedTo: 'usr_004', source: 'Instagram Ads', createdAt: '2026-05-22T17:30:00Z' },
  { id: 'opp_011', name: 'Toby Flenderson - Pool Shell Repair', pipelineId: 'pipe_pools', stageId: 'stage_lost', value: 7200, status: 'lost', assignedTo: 'usr_003', source: 'Yelp Organic', createdAt: '2026-05-23T09:20:00Z' },
  { id: 'opp_012', name: 'Ryan Howard - Backyard Remodel Combo', pipelineId: 'pipe_pools', stageId: 'stage_negotiate', value: 35000, status: 'open', assignedTo: 'usr_002', source: 'Google Local Service Ads', createdAt: '2026-05-24T15:00:00Z' },
  { id: 'opp_013', name: 'Andy Bernard - Classic Kidney Pool Build', pipelineId: 'pipe_pools', stageId: 'stage_won', value: 52000, status: 'won', assignedTo: 'usr_004', source: 'Referral', createdAt: '2026-05-25T10:45:00Z' },
  { id: 'opp_014', name: 'Creed Bratton - Plumbing Renewal', pipelineId: 'pipe_pools', stageId: 'stage_abandoned', value: 6000, status: 'abandoned', assignedTo: 'usr_003', source: 'Google Search Organic', createdAt: '2026-05-25T16:30:00Z' },
  { id: 'opp_015', name: 'Phyllis Vance - Monthly Premium Service Contract', pipelineId: 'pipe_pools', stageId: 'stage_won', value: 4800, status: 'won', assignedTo: 'usr_001', source: 'Facebook Ads', createdAt: '2026-05-26T11:25:00Z' }
];

export const mockAppointments: GHLAppointment[] = [
  { id: 'apt_001', title: 'Consultation - Robert Vance', appointmentStatus: 'showed', startTime: '2026-05-11T10:00:00Z', userId: 'usr_001' },
  { id: 'apt_002', title: 'Design Review - Emily Thorne', appointmentStatus: 'showed', startTime: '2026-05-13T14:00:00Z', userId: 'usr_002' },
  { id: 'apt_003', title: 'Quote - David Miller', appointmentStatus: 'showed', startTime: '2026-05-15T09:00:00Z', userId: 'usr_003' },
  { id: 'apt_004', title: 'Site Inspection - Michael Scott', appointmentStatus: 'confirmed', startTime: '2026-05-28T11:00:00Z', userId: 'usr_001' },
  { id: 'apt_005', title: 'Consultation - Pam Beesly', appointmentStatus: 'showed', startTime: '2026-05-17T15:30:00Z', userId: 'usr_002' },
  { id: 'apt_006', title: 'Service Quote - Jim Halpert', appointmentStatus: 'showed', startTime: '2026-05-19T10:00:00Z', userId: 'usr_004' },
  { id: 'apt_007', title: 'Site Inspection - Angela Martin', appointmentStatus: 'noshow', startTime: '2026-05-20T13:00:00Z', userId: 'usr_003' },
  { id: 'apt_008', title: 'Design Review - Oscar Martinez', appointmentStatus: 'showed', startTime: '2026-05-22T16:00:00Z', userId: 'usr_001' },
  { id: 'apt_009', title: 'Remodel Discussion - Kelly Kapoor', appointmentStatus: 'cancelled', startTime: '2026-05-23T11:00:00Z', userId: 'usr_004' },
  { id: 'apt_010', title: 'Repair Quote - Toby Flenderson', appointmentStatus: 'noshow', startTime: '2026-05-24T09:00:00Z', userId: 'usr_003' },
  { id: 'apt_011', title: 'Mega Consultation - Andy Bernard', appointmentStatus: 'showed', startTime: '2026-05-26T14:00:00Z', userId: 'usr_004' },
  { id: 'apt_012', title: 'Weekly Maintenance Intro - Phyllis Vance', appointmentStatus: 'showed', startTime: '2026-05-27T09:30:00Z', userId: 'usr_001' }
];

export const mockConversations: GHLConversation[] = [
  { id: 'conv_001', userId: 'usr_001', smsCount: 48, emailCount: 14, callCount: 3, avgResponseTimeMin: 12 },
  { id: 'conv_002', userId: 'usr_002', smsCount: 75, emailCount: 22, callCount: 8, avgResponseTimeMin: 7 },
  { id: 'conv_003', userId: 'usr_003', smsCount: 35, emailCount: 9, callCount: 4, avgResponseTimeMin: 28 },
  { id: 'conv_004', userId: 'usr_004', smsCount: 92, emailCount: 31, callCount: 12, avgResponseTimeMin: 5 }
];

// Helper functions that calculate raw data metrics to replicate real GHL backend reporting

export function getDashboardMetrics(): DashboardMetrics {
  const totalLeads = mockContacts.length;
  // pipeline value of open or won opportunities
  const activeOpps = mockOpportunities.filter(o => o.status === 'open' || o.status === 'won');
  const pipelineValue = activeOpps.reduce((sum, o) => sum + o.value, 0);
  
  const wonOpps = mockOpportunities.filter(o => o.status === 'won');
  const closedWonRevenue = wonOpps.reduce((sum, o) => sum + o.value, 0);

  // Appointment statistics
  const showableAppointments = mockAppointments.filter(a => a.appointmentStatus === 'showed' || a.appointmentStatus === 'noshow');
  const showedAppointments = mockAppointments.filter(a => a.appointmentStatus === 'showed');
  const appointmentShowRate = showableAppointments.length > 0 
    ? Math.round((showedAppointments.length / showableAppointments.length) * 100)
    : 75; // fallback industry rate

  return {
    totalLeads,
    leadsDelta: 14.2, // comparison relative mock
    pipelineValue,
    pipelineDelta: 8.7,
    closedWonRevenue,
    revenueDelta: 22.4,
    appointmentShowRate,
    showRateDelta: 3.5,
    trends: {
      leads: [12, 14, 11, 15, 18, 14, totalLeads],
      pipeline: [210000, 245000, 230000, 280000, 310000, 318000, pipelineValue],
      revenue: [95000, 104000, 108000, 115000, 122000, 125000, closedWonRevenue],
      appointments: [6, 8, 5, 9, 7, 8, mockAppointments.length]
    }
  };
}

export function getOwnerPerformance(): OwnerPerformanceMetric[] {
  return mockUsers.map(user => {
    // filter opportunities assigned to this owner
    const userOpps = mockOpportunities.filter(o => o.assignedTo === user.id);
    const closedWon = userOpps.filter(o => o.status === 'won');
    
    const opportunitiesCount = userOpps.length;
    const closedWonCount = closedWon.length;
    const closedWonValue = closedWon.reduce((sum, o) => sum + o.value, 0);
    const winRate = opportunitiesCount > 0 
      ? Math.round((closedWonCount / opportunitiesCount) * 100) 
      : 0;

    const conv = mockConversations.find(c => c.userId === user.id);
    const avgResponseTimeMin = conv ? conv.avgResponseTimeMin : 15;

    const userApts = mockAppointments.filter(a => a.userId === user.id);
    const appointmentsCount = userApts.length;
    const noShowCount = userApts.filter(a => a.appointmentStatus === 'noshow').length;

    // Build funnel counts: leads assigned (mock relation: 3, 4, 3, 5 based on opportunities ratio), opps generated, won contracts
    const leadsCountMock = userOpps.length + Math.round(userOpps.length * 0.4);

    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      opportunitiesCount,
      closedWonCount,
      closedWonValue,
      winRate,
      avgResponseTimeMin,
      appointmentsCount,
      noShowCount,
      funnel: {
        leads: leadsCountMock,
        opps: opportunitiesCount,
        won: closedWonCount
      }
    };
  });
}

export function getMarketingPerformance(): MarketingMetric[] {
  // Group opportunities and leads by channel
  const sources = [
    { name: 'Google Local Service Ads', cost: 1200 },
    { name: 'Facebook Ads', cost: 850 },
    { name: 'Google Search Organic', cost: 0 },
    { name: 'Referral', cost: 150 },
    { name: 'Yelp Organic', cost: 50 },
    { name: 'Instagram Ads', cost: 400 }
  ];

  return sources.map(src => {
    const leads = mockContacts.filter(c => c.source === src.name);
    const opps = mockOpportunities.filter(o => o.source === src.name);
    const wonOpps = opps.filter(o => o.status === 'won');

    const leadsCount = leads.length || Math.floor(Math.random() * 2) + 1; // backfill logic
    const oppsCount = opps.length;
    const closedWonValue = wonOpps.reduce((sum, o) => sum + o.value, 0);
    const pipelineValue = opps.reduce((sum, o) => sum + o.value, 0);

    const conversionRate = leadsCount > 0 
      ? Math.round((wonOpps.length / leadsCount) * 100) 
      : 0;

    // ROI calculation: (Revenue - Cost) / Cost * 100
    const costEstimate = src.cost;
    let roi = undefined;
    if (costEstimate > 0) {
      roi = Math.round(((closedWonValue - costEstimate) / costEstimate) * 100);
    } else if (closedWonValue > 0) {
      roi = 500; // organic inf ROI representer
    }

    // Dynamic weekly trends grouped by source
    const weeklyLeadsTrend = [
      { date: 'Wk 1', count: Math.floor(leadsCount * 0.3) + 1 },
      { date: 'Wk 2', count: Math.floor(leadsCount * 0.5) + 1 },
      { date: 'Wk 3', count: Math.floor(leadsCount * 0.8) + 1 },
      { date: 'Wk 4', count: leadsCount }
    ];

    return {
      source: src.name,
      leadsCount,
      conversionRate,
      pipelineValue,
      closedWonValue,
      costEstimate,
      roi,
      weeklyLeadsTrend
    };
  });
}
