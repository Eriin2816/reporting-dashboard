/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// GHL API V2 Objects Definitions

export interface GHLUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  avatarUrl?: string;
}

export interface GHLContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  tags: string[];
  dateAdded: string;
}

export interface GHLOpportunity {
  id: string;
  name: string;
  pipelineId: string;
  stageId: string;
  value: number; // e.g., deal size or recurring fee
  status: 'open' | 'won' | 'lost' | 'abandoned';
  assignedTo: string; // User ID
  source: string;
  createdAt: string;
}

export interface GHLAppointment {
  id: string;
  title: string;
  appointmentStatus: 'confirmed' | 'showed' | 'noshow' | 'cancelled';
  startTime: string;
  userId: string; // Assigned owner
}

export interface GHLConversation {
  id: string;
  userId: string;
  smsCount: number;
  emailCount: number;
  callCount: number;
  avgResponseTimeMin: number;
}

// Aggregated UI Metrics Response

export interface DashboardMetrics {
  totalLeads: number;
  leadsDelta: number; // monthly comparison percentage
  pipelineValue: number;
  pipelineDelta: number;
  closedWonRevenue: number;
  revenueDelta: number;
  appointmentShowRate: number; // percentage
  showRateDelta: number;
  
  // Weekly trend for Sparkline
  trends: {
    leads: number[];
    pipeline: number[];
    revenue: number[];
    appointments: number[];
  };
}

export interface OwnerPerformanceMetric {
  userId: string;
  userName: string;
  userEmail: string;
  opportunitiesCount: number;
  closedWonCount: number;
  closedWonValue: number;
  winRate: number; // percentage
  avgResponseTimeMin: number;
  appointmentsCount: number;
  noShowCount: number;
  funnel: {
    leads: number;
    opps: number;
    won: number;
  };
}

export interface MarketingMetric {
  source: string;
  leadsCount: number;
  conversionRate: number; // percentage of leads converting to won opportunities
  pipelineValue: number;
  closedWonValue: number;
  costEstimate?: number;
  roi?: number; // percentage
  weeklyLeadsTrend: { date: string; count: number }[];
}

export interface GHLAppConfig {
  dataSourceMode: 'MOCK' | 'LIVE';
  apiKey: string;
  locationId: string;
  webhookUrl: string;
  apiConnectedSince: string | null;
  cacheTtlMinutes: number;
  rateLimitStatus: {
    remaining: number;
    limit: number;
  };
}

// ==========================================
// NEW REPORTING COMMAND CENTER ARCHITECTURE
// ==========================================

// Shared Interfaces
export interface MetricCard {
  id: string;
  label: string;
  value: string | number;
  change: number; // monthly comparison percentage, e.g. +14.8 or -2.3
  trend: 'up' | 'down' | 'neutral';
  timeframe?: string;
}

export interface TrendChartPoint {
  date: string; // ISO date string or formatted (e.g., "Wk 1", "2026-05-20")
  [key: string]: string | number; // allow flexible key metrics like leads, appointments, etc.
}

export interface FunnelStage {
  stage: string; // e.g. "Leads", "Booked", "Showed", "Won"
  count: number;
  percentageOfPrevious: number; // calculation relative to previous stage
  percentageOfTotal: number; // calculation relative to top funnel (leads)
}

export interface TableColumn {
  id: string;
  header: string;
  type: 'string' | 'number' | 'percentage' | 'currency' | 'date';
}

export interface TableData {
  columns: TableColumn[];
  rows: Record<string, any>[];
}

export interface SourceBreakdown {
  source: string;
  leads: number;
  appointments: number;
  won: number;
  revenue: number;
  conversionRate: number;
}

// Filter Definitions
export interface DateRangeFilter {
  startDate?: string; // YYYY-MM-DD
  endDate?: string; // YYYY-MM-DD
}

export interface UserFilter {
  userId?: string;
  userName?: string;
}

export interface SourceFilter {
  source?: string;
}

export interface PipelineFilter {
  pipelineId?: string;
}

export interface CampaignFilter {
  campaign?: string;
}

export interface ServiceCategoryFilter {
  serviceCategory?: string; // e.g., "Pool Install", "Pool Remodel", "Leak Detection"
}

// Normalized API Response Wrapper
export interface ApiResponse<T> {
  data: T;
  status: 'success' | 'error';
  source: 'mock' | 'live';
  generatedAt: string;
  stale: boolean;
  warnings: string[];
  unavailableMetrics: string[];
  error?: string;
}

// Page 1: Owner Performance Report Payload
export interface OwnerPerformanceReport {
  summary: {
    totalLeads: number;
    newLeads: number;
    bookedAppointments: number;
    showRate: number; // percentage
    closeRate: number; // percentage
    pipelineValue: number;
    wonRevenue: number;
    lostOpportunities: number;
    missedLeadsOrCalls: number;
    avgSpeedToLeadSec: number;
    leadToBookingConvRate: number;
    bookingToWonConvRate: number;
  };
  revenueBySource: Record<string, number>;
  revenueByServiceType: Record<string, number>;
  ownerBreakdown: {
    userId: string;
    userName: string;
    userEmail: string;
    totalLeads: number;
    newLeads: number;
    bookedAppointments: number;
    showRate: number;
    closeRate: number;
    pipelineValue: number;
    wonRevenue: number;
    lostOpportunities: number;
    missedLeads: number;
    avgSpeedToLeadSec: number;
  }[];
  trends: TrendChartPoint[];
  funnel: FunnelStage[];
}

// Page 2: VA Performance Report Payload
export interface VAPerformanceReport {
  summary: {
    leadsAssigned: number;
    leadsContacted: number;
    avgFirstResponseTimeMin: number;
    conversationsHandled: number;
    followUpsCompleted: number;
    tasksCompleted: number;
    appointmentsBooked: number;
    bookingRate: number; // percentage
    noShowRecoveryAttempts: number;
    staleLeadsCount: number;
    responseSlaPerformance: number; // percentage of responses within 5 minutes SLA
  };
  vaBreakdown: {
    vaId: string;
    vaName: string;
    leadsAssigned: number;
    leadsContacted: number;
    avgFirstResponseTimeMin: number;
    conversationsHandled: number;
    followUpsCompleted: number;
    tasksCompleted: number;
    appointmentsBooked: number;
    bookingRate: number;
    noShowRecoveryAttempts: number;
    staleLeadsCount: number;
    responseSlaPerformance: number;
  }[];
  recentActivity: {
    id: string;
    timestamp: string;
    vaName: string;
    leadName: string;
    action: string;
    status: 'success' | 'pending' | 'failed' | 'info';
  }[];
  staleLeadsDetails: {
    id: string;
    leadName: string;
    assignedVa: string;
    daysStale: number;
    lastContactDate: string;
    status: string;
  }[];
  trends: TrendChartPoint[];
}

// Page 3: Marketing Performance Report Payload
export interface MarketingPerformanceReport {
  summary: {
    totalLeads: number;
    totalBookings: number;
    totalPipelineValue: number;
    totalWonRevenue: number;
    avgLeadToAppointmentRate: number; // percentage
    avgAppointmentToWonRate: number; // percentage
    costPerLeadPlaceholder: number;
    roasPlaceholder: number; // return on ad spend multiplier (e.g. 5.2x)
  };
  leadsBySource: Record<string, number>;
  leadsByCampaign: Record<string, number>;
  bookingsBySource: Record<string, number>;
  pipelineValueBySource: Record<string, number>;
  wonRevenueBySource: Record<string, number>;
  campaignBreakdown: {
    campaignId: string;
    campaignName: string;
    leads: number;
    bookings: number;
    pipelineValue: number;
    wonRevenue: number;
    cost: number;
    roas: number;
    conversionRate: number;
  }[];
  trends: TrendChartPoint[];
}

// ==========================================
// SAAS AUTHENTICATION, ROLE, & WORKSPACE TYPES
// ==========================================

export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  WORKSPACE_OWNER = 'WORKSPACE_OWNER',
  ADMIN = 'ADMIN',
  SALES_REP = 'SALES_REP',
  TEAM_MEMBER = 'TEAM_MEMBER',
  READ_ONLY = 'READ_ONLY'
}

export interface SaaSUser {
  id: string;
  name: string;
  email: string;
  onboarded: boolean;
  createdAt: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ghlLocationId: string;
  createdAt: string;
  suspended: boolean;
}

export interface WorkspaceMember {
  id: string;
  workspaceId: string;
  userId: string;
  role: UserRole;
  joinedAt: string;
}

export interface GHLConnection {
  id: string;
  workspaceId: string;
  locationId: string;
  apiKey: string;
  connectedAt: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'STALE';
}

export interface ReportingSettings {
  workspaceId: string;
  defaultTimeframe: 'today' | 'this_week' | 'this_month' | 'last_30_days' | 'this_quarter' | 'this_year';
  allowedDashboards: ('overview' | 'opportunity' | 'sales' | 'owner' | 'marketing')[];
  lastSyncAt: string | null;
  mode: 'MOCK' | 'LIVE';
  allowAdminManageGHL?: boolean;
  cacheTtlMinutes?: number;
}

export interface SubscriptionPlaceholder {
  workspaceId: string;
  plan: 'STARTER' | 'GROWTH' | 'UNLIMITED';
  status: 'ACTIVE' | 'PAST_DUE' | 'CANCELED' | 'TRIALING';
  amount: number;
  nextBillingDate: string;
}

export interface AuditLog {
  id: string;
  workspaceId: string | null;
  userId: string;
  userEmail: string;
  action: string;
  details: string;
  ipAddress: string;
  timestamp: string;
}

export interface SecureAuthSession {
  user: SaaSUser;
  activeWorkspace: Workspace | null;
  memberRecord: WorkspaceMember | null;
  token: string;
}

