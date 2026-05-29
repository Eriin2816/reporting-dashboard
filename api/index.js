var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/types.ts
var init_types = __esm({
  "src/types.ts"() {
  }
});

// src/mockSaaSStore.ts
var mockSaaSStore_exports = {};
__export(mockSaaSStore_exports, {
  MockDatabase: () => MockDatabase,
  db: () => db,
  seededAuditLogs: () => seededAuditLogs,
  seededGHLConnections: () => seededGHLConnections,
  seededReportingSettings: () => seededReportingSettings,
  seededSubscriptions: () => seededSubscriptions,
  seededUsers: () => seededUsers,
  seededWorkspaceMembers: () => seededWorkspaceMembers,
  seededWorkspaces: () => seededWorkspaces
});
var seededUsers, seededWorkspaces, seededWorkspaceMembers, seededGHLConnections, seededReportingSettings, seededSubscriptions, seededAuditLogs, MockDatabase, db;
var init_mockSaaSStore = __esm({
  "src/mockSaaSStore.ts"() {
    init_types();
    seededUsers = [
      { id: "usr_super_admin", name: "Alex Mercer (Platform Ops)", email: "operations@showtimepoolmechanics.com", onboarded: true, createdAt: "2026-01-10T08:00:00Z" },
      { id: "usr_owner_A", name: "Marcus Sterling (Owner)", email: "owner@showtime.com", onboarded: true, createdAt: "2026-02-15T09:30:00Z" },
      { id: "usr_admin_A", name: "Sarah Chen (Admin)", email: "admin@showtime.com", onboarded: true, createdAt: "2026-03-01T14:15:00Z" },
      { id: "usr_rep_A", name: "Bobby Sales (Sales Rep)", email: "sales@showtime.com", onboarded: true, createdAt: "2026-03-10T11:00:00Z" },
      { id: "usr_member_A", name: "Tyler Member (Team Member)", email: "member@showtime.com", onboarded: true, createdAt: "2026-04-01T10:00:00Z" },
      { id: "usr_readonly_A", name: "Rachel Read (Read-Only)", email: "readonly@showtime.com", onboarded: true, createdAt: "2026-04-15T16:45:00Z" },
      // Workspace B Client isolation users
      { id: "usr_owner_B", name: "Vance Refrigeration (Owner)", email: "owner@vancepools.com", onboarded: true, createdAt: "2026-05-01T12:00:00Z" },
      { id: "usr_readonly_B", name: "Pam Beasley (Read-Only)", email: "pam@vancepools.com", onboarded: true, createdAt: "2026-05-05T09:00:00Z" }
    ];
    seededWorkspaces = [
      { id: "ws_showtime", name: "Showtime Pool Mechanics", slug: "showtime-pools", ghlLocationId: "loc_g53h7s8a", createdAt: "2026-02-15T09:30:00Z", suspended: false },
      { id: "ws_apex", name: "Apex Blue Pools", slug: "apex-blue", ghlLocationId: "loc_apex_demo", createdAt: "2026-05-01T12:00:00Z", suspended: false },
      { id: "ws_pro_clean", name: "Pro Clean Builders", slug: "pro-clean", ghlLocationId: "loc_pro_demo", createdAt: "2026-05-05T09:00:00Z", suspended: true }
      // Simulated suspended block
    ];
    seededWorkspaceMembers = [
      // Super Admin of platform has access to everything, but we link them to Workspace A by default
      { id: "mem_1", workspaceId: "ws_showtime", userId: "usr_super_admin", role: "SUPER_ADMIN" /* SUPER_ADMIN */, joinedAt: "2026-01-10T08:00:00Z" },
      // Workspace A Team (Showtime Pools)
      { id: "mem_2", workspaceId: "ws_showtime", userId: "usr_owner_A", role: "WORKSPACE_OWNER" /* WORKSPACE_OWNER */, joinedAt: "2026-02-15T09:35:00Z" },
      { id: "mem_3", workspaceId: "ws_showtime", userId: "usr_admin_A", role: "ADMIN" /* ADMIN */, joinedAt: "2026-03-01T14:20:00Z" },
      { id: "mem_4", workspaceId: "ws_showtime", userId: "usr_rep_A", role: "SALES_REP" /* SALES_REP */, joinedAt: "2026-03-10T11:05:00Z" },
      { id: "mem_5", workspaceId: "ws_showtime", userId: "usr_member_A", role: "TEAM_MEMBER" /* TEAM_MEMBER */, joinedAt: "2026-04-01T10:05:00Z" },
      { id: "mem_6", workspaceId: "ws_showtime", userId: "usr_readonly_A", role: "READ_ONLY" /* READ_ONLY */, joinedAt: "2026-04-15T16:50:00Z" },
      // Workspace B Team (Apex Blue Pools)
      { id: "mem_7", workspaceId: "ws_apex", userId: "usr_owner_B", role: "WORKSPACE_OWNER" /* WORKSPACE_OWNER */, joinedAt: "2026-05-01T12:05:00Z" },
      { id: "mem_8", workspaceId: "ws_apex", userId: "usr_readonly_B", role: "READ_ONLY" /* READ_ONLY */, joinedAt: "2026-05-05T09:05:00Z" }
    ];
    seededGHLConnections = [
      { id: "gn_1", workspaceId: "ws_showtime", locationId: "loc_g53h7s8a", apiKey: "ghl_live_token_sec_key_xyz_001", connectedAt: "2026-02-16T10:00:00Z", status: "CONNECTED" },
      { id: "gn_2", workspaceId: "ws_apex", locationId: "loc_apex_demo", apiKey: "ghl_live_token_sec_key_abc_992", connectedAt: "2026-05-02T11:00:00Z", status: "STALE" }
    ];
    seededReportingSettings = [
      {
        workspaceId: "ws_showtime",
        defaultTimeframe: "last_30_days",
        allowedDashboards: ["overview", "opportunity", "sales", "owner", "marketing"],
        lastSyncAt: "2026-05-28T15:00:00Z",
        mode: "MOCK"
      },
      {
        workspaceId: "ws_apex",
        defaultTimeframe: "this_week",
        allowedDashboards: ["overview", "opportunity", "sales"],
        // Restrict access to owner/marketing for Apex Blue
        lastSyncAt: "2026-05-28T14:45:00Z",
        mode: "MOCK"
      }
    ];
    seededSubscriptions = [
      { workspaceId: "ws_showtime", plan: "UNLIMITED", status: "ACTIVE", amount: 297, nextBillingDate: "2026-06-15T00:00:00Z" },
      { workspaceId: "ws_apex", plan: "GROWTH", status: "ACTIVE", amount: 147, nextBillingDate: "2026-06-20T00:00:00Z" },
      { workspaceId: "ws_pro_clean", plan: "STARTER", status: "PAST_DUE", amount: 97, nextBillingDate: "2026-05-25T00:00:00Z" }
    ];
    seededAuditLogs = [
      { id: "log_001", workspaceId: "ws_showtime", userId: "usr_super_admin", userEmail: "operations@showtimepoolmechanics.com", action: "INIT_SYSTEM", details: "SaaS Platform bootstrapped with secure tenants.", ipAddress: "127.0.0.1", timestamp: "2026-05-01T08:00:00Z" },
      { id: "log_002", workspaceId: "ws_showtime", userId: "usr_owner_A", userEmail: "owner@showtime.com", action: "CONNECT_GHL_API", details: "GoHighLevel private integration key was updated.", ipAddress: "198.51.100.41", timestamp: "2026-05-20T11:45:00Z" },
      { id: "log_003", workspaceId: "ws_showtime", userId: "usr_admin_A", userEmail: "admin@showtime.com", action: "CHANGE_METRICS_MODE", details: "Flipped workspace data fetch rule selector to mock mode.", ipAddress: "203.0.113.88", timestamp: "2026-05-25T14:20:00Z" }
    ];
    MockDatabase = class {
      constructor() {
        this.users = [...seededUsers];
        this.workspaces = [...seededWorkspaces];
        this.members = [...seededWorkspaceMembers];
        this.connections = [...seededGHLConnections];
        this.settings = [...seededReportingSettings];
        this.subscriptions = [...seededSubscriptions];
        this.auditLogs = [...seededAuditLogs];
      }
      getUserByEmail(email) {
        return this.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      }
      getUserById(id) {
        return this.users.find((u) => u.id === id);
      }
      getWorkspaceById(id) {
        return this.workspaces.find((w) => w.id === id);
      }
      getWorkspacesForUser(userId) {
        const memberObj = this.members.find((m) => m.userId === userId);
        if (memberObj && memberObj.role === "SUPER_ADMIN" /* SUPER_ADMIN */) {
          return this.workspaces;
        }
        const myWorkspaceIds = this.members.filter((m) => m.userId === userId).map((m) => m.workspaceId);
        return this.workspaces.filter((w) => myWorkspaceIds.includes(w.id));
      }
      getWorkspaceMember(workspaceId, userId) {
        return this.members.find((m) => m.workspaceId === workspaceId && m.userId === userId);
      }
      getMembersByWorkspace(workspaceId) {
        return this.members.filter((m) => m.workspaceId === workspaceId);
      }
      getGHLConnection(workspaceId) {
        return this.connections.find((c) => c.workspaceId === workspaceId);
      }
      getReportingSettings(workspaceId) {
        let s = this.settings.find((st) => st.workspaceId === workspaceId);
        if (!s) {
          s = {
            workspaceId,
            defaultTimeframe: "last_30_days",
            allowedDashboards: ["overview", "opportunity", "sales"],
            lastSyncAt: null,
            mode: "MOCK"
          };
          this.settings.push(s);
        }
        return s;
      }
      getSubscription(workspaceId) {
        return this.subscriptions.find((subs) => subs.workspaceId === workspaceId);
      }
      log(workspaceId, userId, userEmail, action, details) {
        const entry = {
          id: `log_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
          workspaceId,
          userId,
          userEmail,
          action,
          details,
          ipAddress: "127.0.0.1",
          timestamp: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.auditLogs.unshift(entry);
        return entry;
      }
      signup(name, email) {
        const userExists = this.getUserByEmail(email);
        if (userExists) {
          throw new Error("An account with this email address already exists.");
        }
        const newUser = {
          id: `usr_${Date.now()}`,
          name,
          email,
          onboarded: false,
          createdAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.users.push(newUser);
        return newUser;
      }
      completeOnboarding(userId, companyName, ghlMode, apiKey) {
        const user = this.getUserById(userId);
        if (!user) throw new Error("User not found.");
        const slug = companyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
        const workspaceId = `ws_${Date.now()}`;
        const newWs = {
          id: workspaceId,
          name: companyName,
          slug,
          ghlLocationId: ghlMode === "LIVE" ? "loc_live_" + slug.slice(0, 8) : "loc_mock_" + slug.slice(0, 8),
          createdAt: (/* @__PURE__ */ new Date()).toISOString(),
          suspended: false
        };
        this.workspaces.push(newWs);
        const memberId = `mem_${Date.now()}`;
        const newMember = {
          id: memberId,
          workspaceId,
          userId,
          role: "WORKSPACE_OWNER" /* WORKSPACE_OWNER */,
          joinedAt: (/* @__PURE__ */ new Date()).toISOString()
        };
        this.members.push(newMember);
        this.settings.push({
          workspaceId,
          defaultTimeframe: "last_30_days",
          allowedDashboards: ["overview", "opportunity", "sales", "owner", "marketing"],
          lastSyncAt: (/* @__PURE__ */ new Date()).toISOString(),
          mode: ghlMode
        });
        if (ghlMode === "LIVE" && apiKey) {
          this.connections.push({
            id: `gn_${Date.now()}`,
            workspaceId,
            locationId: newWs.ghlLocationId,
            apiKey,
            connectedAt: (/* @__PURE__ */ new Date()).toISOString(),
            status: "CONNECTED"
          });
        }
        user.onboarded = true;
        this.subscriptions.push({
          workspaceId,
          plan: "GROWTH",
          status: "TRIALING",
          amount: 147,
          nextBillingDate: new Date(Date.now() + 14 * 24 * 3600 * 1e3).toISOString()
          // 14 days trial
        });
        this.log(workspaceId, userId, user.email, "ONBOARD_WORKSPACE", `Completed corporate onboarding for workspace: ${companyName}`);
        return { user, workspace: newWs, member: newMember };
      }
    };
    db = new MockDatabase();
  }
});

// _api_src/index.ts
var index_exports = {};
__export(index_exports, {
  default: () => index_default,
  requireAuth: () => requireAuth
});
module.exports = __toCommonJS(index_exports);
var import_express = __toESM(require("express"));
init_types();

// src/mockReportingData.ts
var mockTeamOwners = [
  { id: "usr_001", name: "Marcus Sterling", email: "marcus@showtimepools.com" },
  { id: "usr_002", name: "Sarah Jenkins", email: "sarah@showtimepools.com" },
  { id: "usr_003", name: "Devon Carter", email: "devon@showtimepools.com" },
  { id: "usr_004", name: "Isabella Cruz", email: "isabella@showtimepools.com" }
];
var mockVirtualAssistants = [
  { id: "va_001", name: "Alisha Gomez" },
  { id: "va_002", name: "Keanu Reeves" },
  { id: "va_003", name: "Maria Santos" },
  { id: "va_004", name: "Brandon Lee" }
];
var mockCampaigns = [
  { id: "camp_001", name: "Backyard Oasis Inbound Promo" },
  { id: "camp_002", name: "Summer Hot Tub Blast 2026" },
  { id: "camp_003", name: "Organic SEO Website Funnel" },
  { id: "camp_004", name: "Facebook Direct Retargeting Leads" },
  { id: "camp_005", name: "Yelp Local High-Intent Referrals" }
];
var mockSources = [
  "Google Local Service Ads",
  "Facebook Ads",
  "Google Search Organic",
  "Referral",
  "Yelp Organic",
  "Instagram Ads"
];
function getOwnerPerformanceReport(filters = {}) {
  const userFilter = filters.userId;
  const sourceFilter = filters.source;
  const campaignFilter = filters.campaign;
  const serviceCategoryFilter = filters.serviceCategory;
  const targetingOwners = userFilter ? mockTeamOwners.filter((u) => u.id === userFilter) : mockTeamOwners;
  const mockBaseData = {
    usr_001: {
      totalLeads: 24,
      newLeads: 5,
      bookedAppointments: 18,
      showedApts: 15,
      closedWon: 8,
      pipelineValue: 36e4,
      wonRevenue: 245e3,
      lostOpps: 4,
      missedLeads: 1,
      totalSpeedSec: 88,
      revenueBySource: { "Google Local Service Ads": 135e3, "Referral": 95e3, "Yelp Organic": 15e3 },
      revenueByServiceType: { "Pool Install": 18e4, "Pool Remodel": 5e4, "Leak Detection": 15e3 }
    },
    usr_002: {
      totalLeads: 31,
      newLeads: 8,
      bookedAppointments: 22,
      showedApts: 19,
      closedWon: 9,
      pipelineValue: 285e3,
      wonRevenue: 132e3,
      lostOpps: 7,
      missedLeads: 3,
      totalSpeedSec: 142,
      revenueBySource: { "Facebook Ads": 65e3, "Google Search Organic": 45e3, "Instagram Ads": 22e3 },
      revenueByServiceType: { "Pool Remodel": 85e3, "Weekly Service": 25e3, "Leak Detection": 22e3 }
    },
    usr_003: {
      totalLeads: 19,
      newLeads: 3,
      bookedAppointments: 12,
      showedApts: 9,
      closedWon: 4,
      pipelineValue: 165e3,
      wonRevenue: 74e3,
      lostOpps: 5,
      missedLeads: 2,
      totalSpeedSec: 210,
      revenueBySource: { "Google Search Organic": 38e3, "Facebook Ads": 28e3, "Yelp Organic": 8e3 },
      revenueByServiceType: { "Pool Install": 45e3, "Leak Detection": 21e3, "Weekly Service": 8e3 }
    },
    usr_004: {
      totalLeads: 28,
      newLeads: 7,
      bookedAppointments: 20,
      showedApts: 17,
      closedWon: 7,
      pipelineValue: 24e4,
      wonRevenue: 118e3,
      lostOpps: 6,
      missedLeads: 0,
      totalSpeedSec: 95,
      revenueBySource: { "Yelp Organic": 18e3, "Referral": 58e3, "Google Local Service Ads": 42e3 },
      revenueByServiceType: { "Pool Install": 82e3, "Pool Remodel": 28e3, "Leak Detection": 8e3 }
    }
  };
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
  const aggregatedSourceRev = {};
  const aggregatedServiceRev = {};
  const ownerBreakdown = targetingOwners.map((owner) => {
    const raw = mockBaseData[owner.id] || {
      totalLeads: 10,
      newLeads: 2,
      bookedAppointments: 5,
      showedApts: 4,
      closedWon: 2,
      pipelineValue: 5e4,
      wonRevenue: 25050,
      lostOpps: 2,
      missedLeads: 1,
      totalSpeedSec: 150,
      revenueBySource: {},
      revenueByServiceType: {}
    };
    let multiplier = 1;
    if (sourceFilter) {
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
    Object.entries(raw.revenueBySource).forEach(([src, val]) => {
      if (!sourceFilter || src === sourceFilter) {
        const value = Math.round(val * (campaignFilter ? 0.5 : 1) * (serviceCategoryFilter ? 0.6 : 1));
        aggregatedSourceRev[src] = (aggregatedSourceRev[src] || 0) + value;
      }
    });
    Object.entries(raw.revenueByServiceType).forEach(([service, val]) => {
      if (!serviceCategoryFilter || service === serviceCategoryFilter) {
        const value = Math.round(val * (sourceFilter ? 0.4 : 1) * (campaignFilter ? 0.5 : 1));
        aggregatedServiceRev[service] = (aggregatedServiceRev[service] || 0) + value;
      }
    });
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
    const sRate = locBooked > 0 ? Math.round(locShowed / locBooked * 100) : 0;
    const cRate = locBooked > 0 ? Math.round(locWon / locBooked * 100) : 0;
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
  const aggregateShowRate = bookedAppointments > 0 ? Math.round(showedApts / bookedAppointments * 100) : 75;
  const aggregateCloseRate = bookedAppointments > 0 ? Math.round(closedWon / bookedAppointments * 100) : 38;
  const leadToBookingConvRate = totalLeads > 0 ? Math.round(bookedAppointments / totalLeads * 100) : 45;
  const bookingToWonConvRate = bookedAppointments > 0 ? Math.round(closedWon / bookedAppointments * 100) : 34;
  const finalAvgSpeedSec = speedCount > 0 ? Math.round(totalSpeedAcrossAllSec / speedCount) : 120;
  const trends = [
    { date: "2026-05-01", leads: Math.round(totalLeads * 0.15), wonRevenue: Math.round(wonRevenue * 0.1), pipeline: Math.round(pipelineValue * 0.15) },
    { date: "2026-05-07", leads: Math.round(totalLeads * 0.32), wonRevenue: Math.round(wonRevenue * 0.28), pipeline: Math.round(pipelineValue * 0.35) },
    { date: "2026-05-14", leads: Math.round(totalLeads * 0.55), wonRevenue: Math.round(wonRevenue * 0.5), pipeline: Math.round(pipelineValue * 0.6) },
    { date: "2026-05-21", leads: Math.round(totalLeads * 0.8), wonRevenue: Math.round(wonRevenue * 0.82), pipeline: Math.round(pipelineValue * 0.85) },
    { date: "2026-05-27", leads: totalLeads, wonRevenue, pipeline: pipelineValue }
  ];
  const funnel = [
    { stage: "Total Sourced Contacts", count: totalLeads, percentageOfPrevious: 100, percentageOfTotal: 100 },
    { stage: "Pipeline Opportunities", count: Math.round(totalLeads * 0.85), percentageOfPrevious: 85, percentageOfTotal: 85 },
    { stage: "Booked Appointments", count: bookedAppointments, percentageOfPrevious: Math.round(bookedAppointments / (totalLeads * 0.85) * 100), percentageOfTotal: leadToBookingConvRate },
    { stage: "Confirmed Attended (Showed)", count: showedApts, percentageOfPrevious: aggregateShowRate, percentageOfTotal: Math.round(showedApts / totalLeads * 100) },
    { stage: "Closed Won Contracts", count: closedWon, percentageOfPrevious: aggregateCloseRate, percentageOfTotal: Math.round(closedWon / totalLeads * 100) }
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
    revenueBySource: Object.keys(aggregatedSourceRev).length > 0 ? aggregatedSourceRev : { "Google Local Service Ads": 142e3, "Facebook Ads": 93e3, "Other Organic": 11e4 },
    revenueByServiceType: Object.keys(aggregatedServiceRev).length > 0 ? aggregatedServiceRev : { "Pool Install": 225e3, "Pool Remodel": 113e3, "Leak Detection": 72e3 },
    ownerBreakdown,
    trends,
    funnel
  };
}
function getVAPerformanceReport(filters = {}) {
  const userFilter = filters.userId;
  const sourceFilter = filters.source;
  const campaignFilter = filters.campaign;
  const targetingVAs = userFilter ? mockVirtualAssistants.filter((v) => v.id === userFilter) : mockVirtualAssistants;
  const mockBaseVA = {
    va_001: {
      leadsAssigned: 55,
      leadsContacted: 53,
      avgFirstResponseTimeMin: 2.1,
      conversationsHandled: 120,
      followUpsCompleted: 98,
      tasksCompleted: 45,
      appointmentsBooked: 24,
      noShowRecoveryAttempts: 15,
      staleLeadsCount: 1,
      responseSlaPerformance: 98
    },
    va_002: {
      leadsAssigned: 48,
      leadsContacted: 44,
      avgFirstResponseTimeMin: 4.8,
      conversationsHandled: 95,
      followUpsCompleted: 78,
      tasksCompleted: 38,
      appointmentsBooked: 18,
      noShowRecoveryAttempts: 8,
      staleLeadsCount: 4,
      responseSlaPerformance: 89
    },
    va_003: {
      leadsAssigned: 62,
      leadsContacted: 61,
      avgFirstResponseTimeMin: 1.8,
      conversationsHandled: 145,
      followUpsCompleted: 110,
      tasksCompleted: 52,
      appointmentsBooked: 29,
      noShowRecoveryAttempts: 19,
      staleLeadsCount: 2,
      responseSlaPerformance: 99
    },
    va_004: {
      leadsAssigned: 42,
      leadsContacted: 38,
      avgFirstResponseTimeMin: 6.2,
      conversationsHandled: 82,
      followUpsCompleted: 65,
      tasksCompleted: 30,
      appointmentsBooked: 14,
      noShowRecoveryAttempts: 6,
      staleLeadsCount: 5,
      responseSlaPerformance: 82
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
  const vaBreakdown = targetingVAs.map((va) => {
    const raw = mockBaseVA[va.id] || {
      leadsAssigned: 20,
      leadsContacted: 18,
      avgFirstResponseTimeMin: 5,
      conversationsHandled: 40,
      followUpsCompleted: 30,
      tasksCompleted: 15,
      appointmentsBooked: 6,
      noShowRecoveryAttempts: 5,
      staleLeadsCount: 2,
      responseSlaPerformance: 90
    };
    let multiplier = 1;
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
    const bRate = locContacted > 0 ? Math.round(locApts / locContacted * 100) : 0;
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
  const finalBookingRate = leadsContacted > 0 ? Math.round(appointmentsBooked / leadsContacted * 100) : 41;
  const finalAvgResponse = countVAs > 0 ? Number((sumFirstResponse / countVAs).toFixed(1)) : 3.5;
  const staleLeadsDetails = [
    { id: "con_stale_1", leadName: "Jack Reacher", assignedVa: "Alisha Gomez", daysStale: 14, lastContactDate: "2026-05-13", status: "Snoozed" },
    { id: "con_stale_2", leadName: "Monica Geller", assignedVa: "Brandon Lee", daysStale: 9, lastContactDate: "2026-05-18", status: "Needs Follow-up" },
    { id: "con_stale_3", leadName: "Chandler Bing", assignedVa: "Keanu Reeves", daysStale: 11, lastContactDate: "2026-05-16", status: "Unresponsive" },
    { id: "con_stale_4", leadName: "Ross Geller", assignedVa: "Maria Santos", daysStale: 12, lastContactDate: "2026-05-15", status: "Pending Re-engagement" }
  ].filter((l) => !userFilter || l.assignedVa.includes(targetingVAs[0]?.name || "_"));
  const recentActivity = [
    { id: "act_1", timestamp: (/* @__PURE__ */ new Date()).toISOString(), vaName: "Alisha Gomez", leadName: "Sally Jenkins", action: "Left Voice Mail & SMS follow-up", status: "success" },
    { id: "act_2", timestamp: new Date(Date.now() - 3e5).toISOString(), vaName: "Keanu Reeves", leadName: "Douglas Croft", action: "Booked service call request", status: "success" },
    { id: "act_3", timestamp: new Date(Date.now() - 12e5).toISOString(), vaName: "Maria Santos", leadName: "Brenda Wilkes", action: "Sent custom pool dimensions quote link", status: "info" },
    { id: "act_4", timestamp: new Date(Date.now() - 48e5).toISOString(), vaName: "Brandon Lee", leadName: "Thomas Shelby", action: "No-show recovery call dialed", status: "pending" }
  ].filter((act) => !userFilter || act.vaName === targetingVAs[0]?.name);
  const trends = [
    { date: "2026-05-01", assigned: Math.round(leadsAssigned * 0.2), booked: Math.round(appointmentsBooked * 0.15) },
    { date: "2026-05-07", assigned: Math.round(leadsAssigned * 0.4), booked: Math.round(appointmentsBooked * 0.35) },
    { date: "2026-05-14", assigned: Math.round(leadsAssigned * 0.65), booked: Math.round(appointmentsBooked * 0.6) },
    { date: "2026-05-21", assigned: Math.round(leadsAssigned * 0.85), booked: Math.round(appointmentsBooked * 0.8) },
    { date: "2026-05-27", assigned: leadsAssigned, booked: appointmentsBooked }
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
function getMarketingPerformanceReport(filters = {}) {
  const sourceFilter = filters.source;
  const campaignFilter = filters.campaign;
  const baselineSources = [
    { name: "Google Local Service Ads", leads: 48, won: 19, val: 142e3, bookings: 32, cost: 4200 },
    { name: "Facebook Ads", leads: 62, won: 14, val: 93500, bookings: 28, cost: 3800 },
    { name: "Google Search Organic", leads: 28, won: 9, val: 82e3, bookings: 16, cost: 0 },
    { name: "Referral", leads: 12, won: 8, val: 11e4, bookings: 10, cost: 150 },
    { name: "Yelp Organic", leads: 15, won: 4, val: 23e3, bookings: 8, cost: 50 },
    { name: "Instagram Ads", leads: 21, won: 6, val: 38e3, bookings: 12, cost: 1100 }
  ];
  let totalLeads = 0;
  let totalBookings = 0;
  let totalPipelineValue = 0;
  let totalWonRevenue = 0;
  let totalSpend = 0;
  const leadsBySource = {};
  const bookingsBySource = {};
  const pipelineValueBySource = {};
  const wonRevenueBySource = {};
  baselineSources.forEach((s) => {
    if (!sourceFilter || s.name === sourceFilter) {
      let multiplier = 1;
      if (campaignFilter) {
        multiplier = 0.55;
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
  const campaignBreakdown = mockCampaigns.map((camp, idx) => {
    let multiplier = 1;
    if (sourceFilter) {
      multiplier = sourceFilter.includes("Google") || sourceFilter.includes("Facebook") ? 0.7 : 0.15;
    }
    const cLeads = Math.max(1, Math.round((25 - idx * 4) * multiplier));
    const cBookings = Math.max(1, Math.round((18 - idx * 3) * multiplier));
    const cWon = Math.max(0, Math.round((10 - idx * 2) * multiplier));
    const cRevenue = Math.round((95e3 - idx * 18e3) * multiplier);
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
      conversionRate: cLeads > 0 ? Math.round(cWon / cLeads * 100) : 0
    };
  });
  const leadToApptSla = totalLeads > 0 ? Math.round(totalBookings / totalLeads * 100) : 51;
  const bookingsSought = baselineSources.reduce((sum, s) => sum + s.won, 0);
  const apptToWonSla = totalBookings > 0 ? Math.round(bookingsSought / totalBookings * 100) : 69;
  const costPerLead = totalLeads > 0 ? Number((totalSpend / totalLeads).toFixed(2)) : 22.5;
  const calculatedRoas = totalSpend > 0 ? Number((totalWonRevenue / totalSpend).toFixed(1)) : 8.5;
  const leadsByCampaign = {};
  campaignBreakdown.forEach((c) => {
    leadsByCampaign[c.campaignName] = c.leads;
  });
  const trends = [
    { date: "2026-05-01", adsCost: Math.round(totalSpend * 0.18), returnRevenue: Math.round(totalWonRevenue * 0.12), bookingsCount: Math.round(totalBookings * 0.15) },
    { date: "2026-05-07", adsCost: Math.round(totalSpend * 0.35), returnRevenue: Math.round(totalWonRevenue * 0.29), bookingsCount: Math.round(totalBookings * 0.32) },
    { date: "2026-05-14", adsCost: Math.round(totalSpend * 0.58), returnRevenue: Math.round(totalWonRevenue * 0.52), bookingsCount: Math.round(totalBookings * 0.55) },
    { date: "2026-05-21", adsCost: Math.round(totalSpend * 0.82), returnRevenue: Math.round(totalWonRevenue * 0.78), bookingsCount: Math.round(totalBookings * 0.8) },
    { date: "2026-05-27", adsCost: totalSpend, returnRevenue: totalWonRevenue, bookingsCount: totalBookings }
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

// src/ghlService.ts
init_mockSaaSStore();

// src/mockData.ts
var mockContacts = [
  { id: "con_001", name: "Robert Vance", email: "vance.r@example.com", phone: "512-555-0192", source: "Google Local Service Ads", tags: ["Pool Install", "Hot Lead"], dateAdded: "2026-05-10T14:30:00Z" },
  { id: "con_002", name: "Emily Thorne", email: "emily.thorne@example.com", phone: "512-555-0283", source: "Facebook Ads", tags: ["Pool Remodel", "Retargeting"], dateAdded: "2026-05-12T09:15:00Z" },
  { id: "con_003", name: "David Miller", email: "dmiller@example.com", phone: "512-555-0374", source: "Google Search Organic", tags: ["Weekly Service", "Inquiry"], dateAdded: "2026-05-14T11:00:00Z" },
  { id: "con_004", name: "Michael Scott", email: "regional_sales@example.com", phone: "512-555-0465", source: "Referral", tags: ["Commercial Pool", "Quote Sent"], dateAdded: "2026-05-15T16:45:00Z" },
  { id: "con_005", name: "Pam Beesly", email: "pam.b@example.com", phone: "512-555-0556", source: "Google Local Service Ads", tags: ["Pool Install", "Appointment Booked"], dateAdded: "2026-05-16T10:20:00Z" },
  { id: "con_006", name: "Jim Halpert", email: "jim.h@example.com", phone: "512-555-0647", source: "Yelp Organic", tags: ["Leak Detection", "Urgent"], dateAdded: "2026-05-18T08:30:00Z" },
  { id: "con_007", name: "Angela Martin", email: "angela.m@example.com", phone: "512-555-0738", source: "Facebook Ads", tags: ["Weekly Service"], dateAdded: "2026-05-19T13:10:00Z" },
  { id: "con_008", name: "Oscar Martinez", email: "omartinez@example.com", phone: "512-555-0829", source: "Referral", tags: ["Pool Remodel", "High Value"], dateAdded: "2026-05-20T15:00:00Z" },
  { id: "con_009", name: "Stanley Hudson", email: "stanley.h@example.com", phone: "512-555-0911", source: "Google Search Organic", tags: ["Pool Install"], dateAdded: "2026-05-21T11:40:00Z" },
  { id: "con_010", name: "Kelly Kapoor", email: "kelly.k@example.com", phone: "512-555-1022", source: "Instagram Ads", tags: ["Pool Remodel", "Social Lead"], dateAdded: "2026-05-22T17:15:00Z" },
  { id: "con_011", name: "Toby Flenderson", email: "toby.f@example.com", phone: "512-555-1133", source: "Yelp Organic", tags: ["Leak Detection"], dateAdded: "2026-05-23T09:05:00Z" },
  { id: "con_012", name: "Ryan Howard", email: "ryan.h@example.com", phone: "512-555-1244", source: "Google Local Service Ads", tags: ["Pool Install", "Hot Lead"], dateAdded: "2026-05-24T14:50:00Z" },
  { id: "con_013", name: "Andy Bernard", email: "cornell.andy@example.com", phone: "512-555-1355", source: "Referral", tags: ["Pool Install", "High Value"], dateAdded: "2026-05-25T10:30:00Z" },
  { id: "con_014", name: "Creed Bratton", email: "creed@example.com", phone: "512-555-1466", source: "Google Search Organic", tags: ["Leak Detection"], dateAdded: "2026-05-25T16:20:00Z" },
  { id: "con_015", name: "Phyllis Vance", email: "phyllis@example.com", phone: "512-555-1577", source: "Facebook Ads", tags: ["Weekly Service", "Local Quote"], dateAdded: "2026-05-26T11:10:00Z" }
];
var mockOpportunities = [
  { id: "opp_001", name: "Robert Vance - Inground Pool", pipelineId: "pipe_pools", stageId: "stage_win", value: 45e3, status: "won", assignedTo: "usr_001", source: "Google Local Service Ads", createdAt: "2026-05-10T14:40:00Z" },
  { id: "opp_002", name: "Emily Thorne - Concrete Decking", pipelineId: "pipe_pools", stageId: "stage_proposal", value: 12500, status: "open", assignedTo: "usr_002", source: "Facebook Ads", createdAt: "2026-05-12T09:30:00Z" },
  { id: "opp_003", name: "David Miller - Pool Renovation", pipelineId: "pipe_pools", stageId: "stage_won", value: 18e3, status: "won", assignedTo: "usr_003", source: "Google Search Organic", createdAt: "2026-05-14T11:15:00Z" },
  { id: "opp_004", name: "Michael Scott - Commercial Spa", pipelineId: "pipe_pools", stageId: "stage_negotiate", value: 65e3, status: "open", assignedTo: "usr_001", source: "Referral", createdAt: "2026-05-15T17:00:00Z" },
  { id: "opp_005", name: "Pam Beesly - Vinyl Liner Replacement", pipelineId: "pipe_pools", stageId: "stage_booked", value: 8500, status: "open", assignedTo: "usr_002", source: "Google Local Service Ads", createdAt: "2026-05-16T10:45:00Z" },
  { id: "opp_006", name: "Jim Halpert - Leak Repair & Filter Install", pipelineId: "pipe_pools", stageId: "stage_won", value: 3200, status: "won", assignedTo: "usr_004", source: "Yelp Organic", createdAt: "2026-05-18T08:45:00Z" },
  { id: "opp_007", name: "Angela Martin - Safety Cover & Winterize", pipelineId: "pipe_pools", stageId: "stage_lost", value: 2400, status: "lost", assignedTo: "usr_003", source: "Facebook Ads", createdAt: "2026-05-19T13:30:00Z" },
  { id: "opp_008", name: "Oscar Martinez - Custom Infinity Edge Pool", pipelineId: "pipe_pools", stageId: "stage_proposal", value: 95e3, status: "open", assignedTo: "usr_001", source: "Referral", createdAt: "2026-05-20T15:15:00Z" },
  { id: "opp_009", name: "Stanley Hudson - Saltwater Upgrade", pipelineId: "pipe_pools", stageId: "stage_won", value: 5800, status: "won", assignedTo: "usr_002", source: "Google Search Organic", createdAt: "2026-05-21T12:00:00Z" },
  { id: "opp_010", name: "Kelly Kapoor - Spa Automation System", pipelineId: "pipe_pools", stageId: "stage_proposal", value: 4500, status: "open", assignedTo: "usr_004", source: "Instagram Ads", createdAt: "2026-05-22T17:30:00Z" },
  { id: "opp_011", name: "Toby Flenderson - Pool Shell Repair", pipelineId: "pipe_pools", stageId: "stage_lost", value: 7200, status: "lost", assignedTo: "usr_003", source: "Yelp Organic", createdAt: "2026-05-23T09:20:00Z" },
  { id: "opp_012", name: "Ryan Howard - Backyard Remodel Combo", pipelineId: "pipe_pools", stageId: "stage_negotiate", value: 35e3, status: "open", assignedTo: "usr_002", source: "Google Local Service Ads", createdAt: "2026-05-24T15:00:00Z" },
  { id: "opp_013", name: "Andy Bernard - Classic Kidney Pool Build", pipelineId: "pipe_pools", stageId: "stage_won", value: 52e3, status: "won", assignedTo: "usr_004", source: "Referral", createdAt: "2026-05-25T10:45:00Z" },
  { id: "opp_014", name: "Creed Bratton - Plumbing Renewal", pipelineId: "pipe_pools", stageId: "stage_abandoned", value: 6e3, status: "abandoned", assignedTo: "usr_003", source: "Google Search Organic", createdAt: "2026-05-25T16:30:00Z" },
  { id: "opp_015", name: "Phyllis Vance - Monthly Premium Service Contract", pipelineId: "pipe_pools", stageId: "stage_won", value: 4800, status: "won", assignedTo: "usr_001", source: "Facebook Ads", createdAt: "2026-05-26T11:25:00Z" }
];
var mockAppointments = [
  { id: "apt_001", title: "Consultation - Robert Vance", appointmentStatus: "showed", startTime: "2026-05-11T10:00:00Z", userId: "usr_001" },
  { id: "apt_002", title: "Design Review - Emily Thorne", appointmentStatus: "showed", startTime: "2026-05-13T14:00:00Z", userId: "usr_002" },
  { id: "apt_003", title: "Quote - David Miller", appointmentStatus: "showed", startTime: "2026-05-15T09:00:00Z", userId: "usr_003" },
  { id: "apt_004", title: "Site Inspection - Michael Scott", appointmentStatus: "confirmed", startTime: "2026-05-28T11:00:00Z", userId: "usr_001" },
  { id: "apt_005", title: "Consultation - Pam Beesly", appointmentStatus: "showed", startTime: "2026-05-17T15:30:00Z", userId: "usr_002" },
  { id: "apt_006", title: "Service Quote - Jim Halpert", appointmentStatus: "showed", startTime: "2026-05-19T10:00:00Z", userId: "usr_004" },
  { id: "apt_007", title: "Site Inspection - Angela Martin", appointmentStatus: "noshow", startTime: "2026-05-20T13:00:00Z", userId: "usr_003" },
  { id: "apt_008", title: "Design Review - Oscar Martinez", appointmentStatus: "showed", startTime: "2026-05-22T16:00:00Z", userId: "usr_001" },
  { id: "apt_009", title: "Remodel Discussion - Kelly Kapoor", appointmentStatus: "cancelled", startTime: "2026-05-23T11:00:00Z", userId: "usr_004" },
  { id: "apt_010", title: "Repair Quote - Toby Flenderson", appointmentStatus: "noshow", startTime: "2026-05-24T09:00:00Z", userId: "usr_003" },
  { id: "apt_011", title: "Mega Consultation - Andy Bernard", appointmentStatus: "showed", startTime: "2026-05-26T14:00:00Z", userId: "usr_004" },
  { id: "apt_012", title: "Weekly Maintenance Intro - Phyllis Vance", appointmentStatus: "showed", startTime: "2026-05-27T09:30:00Z", userId: "usr_001" }
];
function getDashboardMetrics() {
  const totalLeads = mockContacts.length;
  const activeOpps = mockOpportunities.filter((o) => o.status === "open" || o.status === "won");
  const pipelineValue = activeOpps.reduce((sum, o) => sum + o.value, 0);
  const wonOpps = mockOpportunities.filter((o) => o.status === "won");
  const closedWonRevenue = wonOpps.reduce((sum, o) => sum + o.value, 0);
  const showableAppointments = mockAppointments.filter((a) => a.appointmentStatus === "showed" || a.appointmentStatus === "noshow");
  const showedAppointments = mockAppointments.filter((a) => a.appointmentStatus === "showed");
  const appointmentShowRate = showableAppointments.length > 0 ? Math.round(showedAppointments.length / showableAppointments.length * 100) : 75;
  return {
    totalLeads,
    leadsDelta: 14.2,
    // comparison relative mock
    pipelineValue,
    pipelineDelta: 8.7,
    closedWonRevenue,
    revenueDelta: 22.4,
    appointmentShowRate,
    showRateDelta: 3.5,
    trends: {
      leads: [12, 14, 11, 15, 18, 14, totalLeads],
      pipeline: [21e4, 245e3, 23e4, 28e4, 31e4, 318e3, pipelineValue],
      revenue: [95e3, 104e3, 108e3, 115e3, 122e3, 125e3, closedWonRevenue],
      appointments: [6, 8, 5, 9, 7, 8, mockAppointments.length]
    }
  };
}

// src/ghlService.ts
var globalRateLimits = { remaining: 100, limit: 100, resetTime: 0 };
var serverCacheMemory = {};
function resolveGHLAuthentication(workspaceId) {
  const connection = db.getGHLConnection(workspaceId);
  if (!connection || !connection.apiKey) {
    const envApiKey = (process.env.GHL_PRIVATE_INTEGRATION_TOKEN || process.env.GHL_API_KEY || "").replace(/^﻿/, "");
    const envLocId = process.env.GHL_LOCATION_ID || "";
    if (!envApiKey) {
      throw new Error("NO_CREDENTIALS: GoHighLevel API credentials are not configured for this workspace.");
    }
    return { authHeader: `Bearer ${envApiKey}`, locationId: envLocId, authType: "PrivateToken" };
  }
  const isOAuth = connection.apiKey.startsWith("oauth_") || connection.apiKey.length > 100;
  return {
    authHeader: `Bearer ${connection.apiKey}`,
    locationId: connection.locationId,
    authType: isOAuth ? "OAuth" : "PrivateToken"
  };
}
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
async function fetchFromGHLAPI(endpoint, workspaceId, options = {}) {
  const warnings = [];
  const unavailableMetrics = [];
  let authInfo;
  try {
    authInfo = resolveGHLAuthentication(workspaceId);
  } catch (err) {
    throw new Error(`AUTH_ERROR: ${err.message}`);
  }
  const { authHeader, locationId } = authInfo;
  const baseUrl = process.env.GHL_BASE_URL || "https://services.leadconnectorhq.com";
  const apiVersion = process.env.GHL_API_VERSION || "2021-07-28";
  const alreadyHasLocation = endpoint.includes("locationId=") || endpoint.includes("location_id=");
  const divider = endpoint.includes("?") ? "&" : "?";
  const fullUrl = `${baseUrl}/${endpoint}${locationId && !alreadyHasLocation ? `${divider}locationId=${locationId}` : ""}`;
  const headers = {
    "Authorization": authHeader,
    "Version": apiVersion,
    "Content-Type": "application/json",
    ...options.headers || {}
  };
  const maxRetries = 3;
  let attempt = 0;
  let delay = 1e3;
  while (attempt < maxRetries) {
    attempt++;
    try {
      if (globalRateLimits.remaining <= 1 && Date.now() < globalRateLimits.resetTime) {
        const wait = globalRateLimits.resetTime - Date.now();
        console.warn(`[GHL] Rate-limit guard active \u2014 waiting ${wait}ms`);
        await sleep(wait + 100);
      }
      const response = await fetch(fullUrl, { ...options, headers });
      const rem = response.headers.get("x-ratelimit-remaining");
      const lim = response.headers.get("x-ratelimit-limit");
      const rst = response.headers.get("x-ratelimit-reset");
      if (rem) globalRateLimits.remaining = parseInt(rem, 10);
      if (lim) globalRateLimits.limit = parseInt(lim, 10);
      if (rst) {
        const s = parseInt(rst, 10);
        globalRateLimits.resetTime = Date.now() + (isNaN(s) ? 60 : s) * 1e3;
      }
      if (response.status === 429) {
        console.warn(`[GHL] 429 rate limit \u2014 retry ${attempt} in ${delay}ms`);
        await sleep(delay);
        delay *= 2;
        continue;
      }
      if (response.status >= 502 && response.status <= 504) {
        console.warn(`[GHL] ${response.status} server error \u2014 retry ${attempt}`);
        await sleep(delay);
        delay *= 1.5;
        continue;
      }
      if (!response.ok) {
        const body = await response.text().catch(() => "");
        throw new Error(`GHL API HTTP ${response.status}: ${body.slice(0, 300)}`);
      }
      const payload = await response.json();
      return { data: payload, warnings, unavailableMetrics };
    } catch (err) {
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
function getReportCache(workspaceId, cacheKey) {
  const settings = db.getReportingSettings(workspaceId);
  const ttlMs = (settings.cacheTtlMinutes || 15) * 60 * 1e3;
  const key = `${workspaceId}_${cacheKey}`;
  const cached = serverCacheMemory[key];
  if (!cached) return null;
  return { data: cached.data, stale: Date.now() - cached.timestamp > ttlMs };
}
function setReportCache(workspaceId, cacheKey, data) {
  serverCacheMemory[`${workspaceId}_${cacheKey}`] = { data, timestamp: Date.now(), ttlMs: 15 * 60 * 1e3 };
}
function invalidateWorkspaceCacheStore(workspaceId) {
  Object.keys(serverCacheMemory).filter((k) => k.startsWith(`${workspaceId}_`)).forEach((k) => delete serverCacheMemory[k]);
  console.log(`[Cache] Flushed for workspace: ${workspaceId}`);
}
function isDateInFilterRange(itemDateStr, startDate, endDate) {
  if (!startDate && !endDate) return true;
  const t = new Date(itemDateStr).getTime();
  if (isNaN(t)) return true;
  if (startDate && t < new Date(startDate).getTime()) return false;
  if (endDate && t > (/* @__PURE__ */ new Date(endDate + "T23:59:59.999Z")).getTime()) return false;
  return true;
}
function bucketCountByWeek(items, dateField, startMs, endMs) {
  const seg = (endMs - startMs) / 4;
  const buckets = [0, 0, 0, 0];
  items.forEach((item) => {
    const t = new Date(item[dateField]).getTime();
    if (isNaN(t)) return;
    const idx = Math.min(3, Math.floor((t - startMs) / seg));
    if (idx >= 0) buckets[idx]++;
  });
  let running = 0;
  return buckets.map((b) => {
    running += b;
    return running;
  });
}
function bucketValueByWeek(items, dateField, valueField, startMs, endMs) {
  const seg = (endMs - startMs) / 4;
  const buckets = [0, 0, 0, 0];
  items.forEach((item) => {
    const t = new Date(item[dateField]).getTime();
    if (isNaN(t)) return;
    const idx = Math.min(3, Math.floor((t - startMs) / seg));
    if (idx >= 0) buckets[idx] += Number(item[valueField]) || 0;
  });
  let running = 0;
  return buckets.map((b) => {
    running += b;
    return running;
  });
}
function mapAppointmentStatus(status) {
  const s = (status || "").toLowerCase();
  if (s === "showed" || s === "attended" || s === "completed") return "showed";
  if (s === "noshow" || s === "no-show" || s === "no_show") return "noshow";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  return "confirmed";
}
async function fetchAllContacts(workspaceId) {
  const all = [];
  let startAfterId = "";
  let startAfter = "";
  for (let page = 0; page < 10; page++) {
    const params = { limit: "100" };
    if (startAfterId) {
      params.startAfterId = startAfterId;
      params.startAfter = startAfter;
    }
    const res = await fetchFromGHLAPI(
      `contacts/?${new URLSearchParams(params)}`,
      workspaceId
    );
    const batch = res.data?.contacts ?? [];
    all.push(...batch);
    if (batch.length < 100 || !res.data?.meta?.startAfterId) break;
    startAfterId = res.data.meta.startAfterId;
    startAfter = res.data.meta.startAfter || "";
  }
  return all;
}
async function fetchAllOpportunities(workspaceId, locationId) {
  const all = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetchFromGHLAPI(
      `opportunities/search?location_id=${encodeURIComponent(locationId)}&limit=100&page=${page}`,
      workspaceId
    );
    const batch = res.data?.opportunities ?? [];
    all.push(...batch);
    if (batch.length < 100 || !res.data?.meta?.nextPage) break;
  }
  return all;
}
async function fetchAllConversations(workspaceId) {
  const all = [];
  for (let page = 1; page <= 5; page++) {
    const res = await fetchFromGHLAPI(
      `conversations/search?limit=100&page=${page}`,
      workspaceId
    );
    const batch = res.data?.conversations ?? [];
    all.push(...batch);
    if (batch.length < 100) break;
  }
  return all;
}
async function getLiveCRMData(workspaceId, opts = {}) {
  const warnings = [];
  const unavailableMetrics = [];
  let locationId = "";
  try {
    const auth = resolveGHLAuthentication(workspaceId);
    locationId = auth.locationId;
  } catch (err) {
    throw new Error(`AUTH_ERROR: ${err.message}`);
  }
  if (!locationId) {
    warnings.push("GHL Location ID is not configured \u2014 some data may be incomplete.");
  }
  const now = Date.now();
  const defaultMs = 30 * 24 * 60 * 60 * 1e3;
  const startMs = opts.startDate ? new Date(opts.startDate).getTime() : now - defaultMs;
  const endMs = opts.endDate ? (/* @__PURE__ */ new Date(opts.endDate + "T23:59:59.999Z")).getTime() : now;
  let contacts = [];
  let opportunities = [];
  let appointments = [];
  let users = [];
  let conversations = [];
  await Promise.all([
    // Task 1: Contacts (cursor-paginated, up to 1 000 records)
    (async () => {
      try {
        const raw = await fetchAllContacts(workspaceId);
        contacts = raw.map((c) => ({
          id: c.id,
          name: `${c.firstName || ""} ${c.lastName || ""}`.trim() || "Anonymous Lead",
          email: c.email || "",
          phone: c.phone || "",
          source: c.source || "Direct",
          tags: Array.isArray(c.tags) ? c.tags : [],
          dateAdded: c.dateAdded || c.createdAt || (/* @__PURE__ */ new Date()).toISOString()
        }));
      } catch (err) {
        warnings.push(`Contacts unavailable: ${err.message}`);
        unavailableMetrics.push("leadsList", "leadSourceBreakdowns", "missedLeads");
      }
    })(),
    // Task 2: Opportunities (page-paginated; note: uses location_id not locationId)
    (async () => {
      try {
        const raw = await fetchAllOpportunities(workspaceId, locationId);
        opportunities = raw.map((o) => ({
          id: o.id,
          name: o.name || "Opportunity",
          pipelineId: o.pipelineId || "",
          stageId: o.pipelineStageId || o.stageId || "",
          // GHL v2 uses monetaryValue, not value
          value: Number(o.monetaryValue ?? o.value) || 0,
          status: ["open", "won", "lost", "abandoned"].includes((o.status || "").toLowerCase()) ? o.status.toLowerCase() : "open",
          assignedTo: o.assignedTo || "",
          source: o.contact?.source || o.source || "",
          createdAt: o.createdAt || (/* @__PURE__ */ new Date()).toISOString(),
          contactId: o.contactId || o.contact?.id || ""
        }));
      } catch (err) {
        warnings.push(`Opportunities unavailable: ${err.message}`);
        unavailableMetrics.push("pipelineBreakdown", "wonRevenue", "closeRates");
      }
    })(),
    // Task 3: Calendar Events
    // GHL v2 calendars/events requires calendarId, userId, or groupId — locationId alone is not accepted.
    // Fetch all calendars for the location first, then get events for each.
    (async () => {
      try {
        const calRes = await fetchFromGHLAPI("calendars/", workspaceId);
        const calendarIds = (calRes.data?.calendars || []).map((c) => c.id).slice(0, 5);
        if (calendarIds.length === 0) {
          warnings.push("No calendars found for this location \u2014 appointment data unavailable.");
          unavailableMetrics.push("bookedAppointments", "showRate");
          return;
        }
        const allEvents = [];
        await Promise.all(calendarIds.map(async (calId) => {
          try {
            const evRes = await fetchFromGHLAPI(
              `calendars/events?calendarId=${encodeURIComponent(calId)}&startTime=${startMs}&endTime=${endMs}`,
              workspaceId
            );
            if (evRes.data?.events) allEvents.push(...evRes.data.events);
          } catch {
          }
        }));
        appointments = allEvents.map((e) => ({
          id: e.id,
          title: e.title || "Appointment",
          appointmentStatus: mapAppointmentStatus(e.status || e.appointmentStatus || ""),
          startTime: e.startTime || (/* @__PURE__ */ new Date()).toISOString(),
          userId: e.userId || "",
          contactId: e.contactId || ""
        }));
      } catch (err) {
        warnings.push(`Calendar appointments unavailable: ${err.message}`);
        unavailableMetrics.push("bookedAppointments", "showRate");
      }
    })(),
    // Task 4: Sub-account users
    // GHL v2 users/search requires companyId (set GHL_COMPANY_ID env var).
    (async () => {
      try {
        const companyId = process.env.GHL_COMPANY_ID || "";
        if (!companyId) {
          warnings.push("GHL_COMPANY_ID not configured \u2014 team roster unavailable.");
          unavailableMetrics.push("teamRoster", "perRepBreakdown");
          return;
        }
        const res = await fetchFromGHLAPI(
          `users/search?companyId=${encodeURIComponent(companyId)}`,
          workspaceId
        );
        if (res.data?.users) {
          users = res.data.users.map((u) => ({
            id: u.id,
            name: `${u.firstName || ""} ${u.lastName || ""}`.trim() || "Team Member",
            email: u.email || "",
            avatarUrl: u.avatarUrl || "",
            role: ["admin", "user"].includes((u.role || "").toLowerCase()) ? u.role.toLowerCase() : "user"
          }));
        }
      } catch (err) {
        warnings.push(`Team roster unavailable: ${err.message}`);
        unavailableMetrics.push("teamRoster", "perRepBreakdown");
      }
    })(),
    // Task 5: Conversations (correct endpoint: conversations/search, page-paginated)
    // Note: GHL v2 conversations list does NOT include avgResponseTimeMin — marked unavailable
    (async () => {
      try {
        const raw = await fetchAllConversations(workspaceId);
        conversations = raw.map((c) => ({
          id: c.id,
          userId: c.userId || c.assignedTo || "",
          smsCount: Number(c.smsCount || c.unreadCount) || 0,
          emailCount: Number(c.emailCount) || 0,
          callCount: Number(c.callCount) || 0,
          avgResponseTimeMin: 0
          // not exposed by GHL v2 conversations list endpoint
        }));
      } catch (err) {
        warnings.push(`Conversations unavailable: ${err.message}`);
        unavailableMetrics.push("conversationCounts");
      }
    })()
  ]);
  return { contacts, opportunities, appointments, users, conversations, warnings, unavailableMetrics };
}
async function computeLiveOverviewReport(workspaceId, filters = {}) {
  const crm = await getLiveCRMData(workspaceId, filters);
  const now = Date.now();
  const defaultMs = 30 * 24 * 60 * 60 * 1e3;
  const startMs = filters.startDate ? new Date(filters.startDate).getTime() : now - defaultMs;
  const endMs = filters.endDate ? (/* @__PURE__ */ new Date(filters.endDate + "T23:59:59.999Z")).getTime() : now;
  const periodMs = endMs - startMs;
  const curContacts = crm.contacts.filter((c) => isDateInFilterRange(c.dateAdded, filters.startDate, filters.endDate));
  const curOpps = crm.opportunities.filter((o) => isDateInFilterRange(o.createdAt, filters.startDate, filters.endDate));
  const priorStart = new Date(startMs - periodMs).toISOString().slice(0, 10);
  const priorEnd = new Date(startMs - 1).toISOString().slice(0, 10);
  const priorContacts = crm.contacts.filter((c) => isDateInFilterRange(c.dateAdded, priorStart, priorEnd));
  const priorOpps = crm.opportunities.filter((o) => isDateInFilterRange(o.createdAt, priorStart, priorEnd));
  const leadsCount = curContacts.length;
  const priorLeads = priorContacts.length;
  const leadsDelta = priorLeads > 0 ? parseFloat(((leadsCount - priorLeads) / priorLeads * 100).toFixed(1)) : 0;
  const wonOpps = curOpps.filter((o) => o.status === "won");
  const closedWonRevenue = wonOpps.reduce((s, o) => s + o.value, 0);
  const priorWonRevenue = priorOpps.filter((o) => o.status === "won").reduce((s, o) => s + o.value, 0);
  const revenueDelta = priorWonRevenue > 0 ? parseFloat(((closedWonRevenue - priorWonRevenue) / priorWonRevenue * 100).toFixed(1)) : 0;
  const activeOpps = curOpps.filter((o) => o.status === "open" || o.status === "won");
  const totalPipeline = activeOpps.reduce((s, o) => s + o.value, 0);
  const priorPipeline = priorOpps.filter((o) => o.status === "open" || o.status === "won").reduce((s, o) => s + o.value, 0);
  const pipelineDelta = priorPipeline > 0 ? parseFloat(((totalPipeline - priorPipeline) / priorPipeline * 100).toFixed(1)) : 0;
  const apts = crm.appointments;
  const showedApts = apts.filter((a) => a.appointmentStatus === "showed").length;
  const confirmedApts = apts.filter((a) => a.appointmentStatus === "confirmed" || a.appointmentStatus === "showed").length;
  const showRate = confirmedApts > 0 ? Math.round(showedApts / confirmedApts * 100) : 0;
  return {
    totalLeads: leadsCount,
    leadsDelta,
    pipelineValue: totalPipeline,
    pipelineDelta,
    closedWonRevenue,
    revenueDelta,
    appointmentShowRate: showRate,
    showRateDelta: 0,
    // would require prior-period calendar fetch; marked 0
    trends: {
      leads: bucketCountByWeek(curContacts, "dateAdded", startMs, endMs),
      pipeline: bucketValueByWeek(activeOpps, "createdAt", "value", startMs, endMs),
      revenue: bucketValueByWeek(wonOpps, "createdAt", "value", startMs, endMs),
      appointments: bucketCountByWeek(apts, "startTime", startMs, endMs)
    },
    warnings: crm.warnings,
    unavailableMetrics: crm.unavailableMetrics
  };
}
async function computeLiveOpportunityReport(workspaceId, filters = {}) {
  const crm = await getLiveCRMData(workspaceId, filters);
  const filteredOpps = crm.opportunities.filter((o) => isDateInFilterRange(o.createdAt, filters.startDate, filters.endDate));
  const totalCount = filteredOpps.length;
  const wonCount = filteredOpps.filter((o) => o.status === "won").length;
  const lostCount = filteredOpps.filter((o) => o.status === "lost").length;
  const openCount = filteredOpps.filter((o) => o.status === "open" || o.status === "abandoned").length;
  const totalValue = filteredOpps.reduce((s, o) => s + o.value, 0);
  const wonValue = filteredOpps.filter((o) => o.status === "won").reduce((s, o) => s + o.value, 0);
  const winRate = totalCount > 0 ? Math.round(wonCount / totalCount * 100) : 0;
  const totalLeads = crm.contacts.length;
  const funnel = [
    { stage: "Total Leads", count: totalLeads, percentageOfPrevious: 100, percentageOfTotal: 100 },
    { stage: "Open Opportunities", count: totalCount, percentageOfPrevious: totalLeads > 0 ? Math.round(totalCount / totalLeads * 100) : 0, percentageOfTotal: totalLeads > 0 ? Math.round(totalCount / totalLeads * 100) : 0 },
    { stage: "Closed-Won Deals", count: wonCount, percentageOfPrevious: totalCount > 0 ? Math.round(wonCount / totalCount * 100) : 0, percentageOfTotal: totalLeads > 0 ? Math.round(wonCount / totalLeads * 100) : 0 }
  ];
  return {
    summary: { totalOpportunities: totalCount, openOpportunities: openCount, wonOpportunities: wonCount, lostOpportunities: lostCount, totalPipelineValue: totalValue, wonRevenue: wonValue, winRate },
    funnel,
    warnings: crm.warnings,
    unavailableMetrics: crm.unavailableMetrics
  };
}
async function computeLiveSalesReport(workspaceId, filters = {}) {
  const crm = await getLiveCRMData(workspaceId, filters);
  const filteredOpps = crm.opportunities.filter((o) => isDateInFilterRange(o.createdAt, filters.startDate, filters.endDate));
  const wonOpps = filteredOpps.filter((o) => o.status === "won");
  const wonRevenue = wonOpps.reduce((s, o) => s + o.value, 0);
  const avgDeal = wonOpps.length > 0 ? Math.round(wonRevenue / wonOpps.length) : 0;
  const showedCount = crm.appointments.filter((a) => a.appointmentStatus === "showed").length;
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
async function computeLiveOwnerReport(workspaceId, filters = {}) {
  const crm = await getLiveCRMData(workspaceId, filters);
  const unavailableMetrics = [...crm.unavailableMetrics, "avgSpeedToLeadSec", "revenueByServiceType"];
  const filteredContacts = crm.contacts.filter((c) => {
    if (!isDateInFilterRange(c.dateAdded, filters.startDate, filters.endDate)) return false;
    if (filters.source && c.source !== filters.source) return false;
    return true;
  });
  const filteredOpps = crm.opportunities.filter((o) => {
    if (!isDateInFilterRange(o.createdAt, filters.startDate, filters.endDate)) return false;
    if (filters.source && o.source !== filters.source) return false;
    return true;
  });
  const apts = crm.appointments;
  const contactsWithOpps = new Set(filteredOpps.map((o) => o.contactId).filter(Boolean));
  const missedLeadsTotal = filteredContacts.filter((c) => !contactsWithOpps.has(c.id)).length;
  const usersToReport = filters.userId ? crm.users.filter((u) => u.id === filters.userId) : crm.users.length > 0 ? crm.users : [{ id: "live_default", name: "Sales Rep", email: "", avatarUrl: "", role: "user" }];
  const ownerBreakdown = usersToReport.map((user) => {
    const repOpps = filteredOpps.filter((o) => o.assignedTo === user.id);
    const repContactIds = new Set(repOpps.map((o) => o.contactId).filter(Boolean));
    const repContacts = filteredContacts.filter((c) => repContactIds.has(c.id));
    const repApts = apts.filter((a) => a.userId === user.id);
    const wonRepOpps = repOpps.filter((o) => o.status === "won");
    const wonRevenue = wonRepOpps.reduce((s, o) => s + o.value, 0);
    const pipelineValue = repOpps.reduce((s, o) => s + o.value, 0);
    const showedApts = repApts.filter((a) => a.appointmentStatus === "showed").length;
    const confirmedApts = repApts.filter((a) => a.appointmentStatus === "confirmed" || a.appointmentStatus === "showed").length;
    return {
      userId: user.id,
      userName: user.name,
      userEmail: user.email,
      totalLeads: repContacts.length || repOpps.length,
      newLeads: repContacts.length,
      bookedAppointments: repApts.length,
      showRate: confirmedApts > 0 ? Math.round(showedApts / confirmedApts * 100) : 0,
      closeRate: repOpps.length > 0 ? Math.round(wonRepOpps.length / repOpps.length * 100) : 0,
      pipelineValue,
      wonRevenue,
      lostOpportunities: repOpps.filter((o) => o.status === "lost").length,
      missedLeads: filteredContacts.filter((c) => repContactIds.has(c.id) && !contactsWithOpps.has(c.id)).length,
      avgSpeedToLeadSec: 0
      // not available from GHL v2 conversations list
    };
  });
  const totalOpps = filteredOpps.length;
  const totalWon2 = filteredOpps.filter((o) => o.status === "won").length;
  const wonOppsAll = filteredOpps.filter((o) => o.status === "won");
  const showedTotal = apts.filter((a) => a.appointmentStatus === "showed").length;
  const confirmedTotal = apts.filter((a) => a.appointmentStatus === "confirmed" || a.appointmentStatus === "showed").length;
  const now = Date.now();
  const defaultMs = 30 * 24 * 60 * 60 * 1e3;
  const startMs = filters.startDate ? new Date(filters.startDate).getTime() : now - defaultMs;
  const endMs = filters.endDate ? (/* @__PURE__ */ new Date(filters.endDate + "T23:59:59.999Z")).getTime() : now;
  const wkLabels = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
  const leadsWeekly = bucketCountByWeek(filteredContacts, "dateAdded", startMs, endMs);
  const revenueWeekly = bucketValueByWeek(wonOppsAll, "createdAt", "value", startMs, endMs);
  const trends = wkLabels.map((date, i) => ({ date, totalLeads: leadsWeekly[i], wonRevenue: revenueWeekly[i] }));
  const revenueBySource = {};
  wonOppsAll.forEach((o) => {
    const src = o.source || "Direct";
    revenueBySource[src] = (revenueBySource[src] || 0) + o.value;
  });
  const funnel = [
    { stage: "Leads", count: filteredContacts.length, percentageOfPrevious: 100, percentageOfTotal: 100 },
    { stage: "Booked", count: apts.length, percentageOfPrevious: filteredContacts.length > 0 ? Math.round(apts.length / filteredContacts.length * 100) : 0, percentageOfTotal: filteredContacts.length > 0 ? Math.round(apts.length / filteredContacts.length * 100) : 0 },
    { stage: "Won", count: totalWon2, percentageOfPrevious: apts.length > 0 ? Math.round(totalWon2 / apts.length * 100) : 0, percentageOfTotal: filteredContacts.length > 0 ? Math.round(totalWon2 / filteredContacts.length * 100) : 0 }
  ];
  const report = {
    summary: {
      totalLeads: filteredContacts.length,
      newLeads: filteredContacts.length,
      bookedAppointments: apts.length,
      showRate: confirmedTotal > 0 ? Math.round(showedTotal / confirmedTotal * 100) : 0,
      closeRate: totalOpps > 0 ? Math.round(totalWon2 / totalOpps * 100) : 0,
      pipelineValue: filteredOpps.reduce((s, o) => s + o.value, 0),
      wonRevenue: wonOppsAll.reduce((s, o) => s + o.value, 0),
      lostOpportunities: filteredOpps.filter((o) => o.status === "lost").length,
      missedLeadsOrCalls: missedLeadsTotal,
      avgSpeedToLeadSec: 0,
      leadToBookingConvRate: filteredContacts.length > 0 ? Math.round(apts.length / filteredContacts.length * 100) : 0,
      bookingToWonConvRate: apts.length > 0 ? Math.round(totalWon2 / apts.length * 100) : 0
    },
    revenueBySource,
    revenueByServiceType: {},
    // no service type field in GHL opportunities
    ownerBreakdown,
    trends,
    funnel
  };
  return { data: report, warnings: crm.warnings, unavailableMetrics };
}
async function computeLiveMarketingReport(workspaceId, filters = {}) {
  const crm = await getLiveCRMData(workspaceId, filters);
  const unavailableMetrics = [...crm.unavailableMetrics, "campaignBreakdown", "costPerLead", "roas", "adsCost"];
  const validContacts = crm.contacts.filter((c) => isDateInFilterRange(c.dateAdded, filters.startDate, filters.endDate));
  const validOpps = crm.opportunities.filter((o) => isDateInFilterRange(o.createdAt, filters.startDate, filters.endDate));
  const validApts = crm.appointments;
  const contactSourceMap = new Map(crm.contacts.map((c) => [c.id, c.source || "Direct"]));
  const leadsBySource = {};
  validContacts.forEach((c) => {
    const src = c.source || "Direct";
    leadsBySource[src] = (leadsBySource[src] || 0) + 1;
  });
  const pipelineValueBySource = {};
  const wonRevenueBySource = {};
  validOpps.forEach((o) => {
    const src = o.source || "Direct";
    pipelineValueBySource[src] = (pipelineValueBySource[src] || 0) + o.value;
    if (o.status === "won") wonRevenueBySource[src] = (wonRevenueBySource[src] || 0) + o.value;
  });
  const bookingsBySource = {};
  validApts.forEach((a) => {
    const src = a.contactId ? contactSourceMap.get(a.contactId) || "Direct" : "Direct";
    bookingsBySource[src] = (bookingsBySource[src] || 0) + 1;
  });
  const totalLeads = Object.values(leadsBySource).reduce((s, c) => s + c, 0);
  const totalBookings = Object.values(bookingsBySource).reduce((s, c) => s + c, 0);
  const totalPipeline = Object.values(pipelineValueBySource).reduce((s, c) => s + c, 0);
  const totalWonRevenue = Object.values(wonRevenueBySource).reduce((s, c) => s + c, 0);
  const now = Date.now();
  const defaultMs = 30 * 24 * 60 * 60 * 1e3;
  const startMs = filters.startDate ? new Date(filters.startDate).getTime() : now - defaultMs;
  const endMs = filters.endDate ? (/* @__PURE__ */ new Date(filters.endDate + "T23:59:59.999Z")).getTime() : now;
  const wkLabels = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
  const leadsWeekly = bucketCountByWeek(validContacts, "dateAdded", startMs, endMs);
  const revenueWeekly = bucketValueByWeek(validOpps.filter((o) => o.status === "won"), "createdAt", "value", startMs, endMs);
  const trends = wkLabels.map((date, i) => ({
    date,
    adsCost: 0,
    // not available from GHL API
    returnRevenue: revenueWeekly[i],
    bookingsCount: 0
  }));
  const report = {
    summary: {
      totalLeads,
      totalBookings,
      totalPipelineValue: totalPipeline,
      totalWonRevenue,
      avgLeadToAppointmentRate: totalLeads > 0 ? Math.round(totalBookings / totalLeads * 100) : 0,
      avgAppointmentToWonRate: totalBookings > 0 ? Math.round(totalWon(validOpps) / totalBookings * 100) : 0,
      costPerLeadPlaceholder: 0,
      // not available from GHL API
      roasPlaceholder: 0
      // not available from GHL API
    },
    leadsBySource,
    leadsByCampaign: {},
    // GHL has no campaign reporting endpoint
    bookingsBySource,
    pipelineValueBySource,
    wonRevenueBySource,
    campaignBreakdown: [],
    // GHL has no campaign breakdown endpoint
    trends
  };
  return { data: report, warnings: crm.warnings, unavailableMetrics };
}
function totalWon(opps) {
  return opps.filter((o) => o.status === "won").length;
}
var LiveReportingService = class {
  static async getOverviewDashboardReport(workspaceId, filters = {}) {
    const isProd = process.env.NODE_ENV === "production";
    const settings = db.getReportingSettings(workspaceId);
    if (settings.mode === "MOCK") {
      return { source: "mock", data: getDashboardMetrics(), warnings: [], unavailableMetrics: [], stale: false };
    }
    const cached = getReportCache(workspaceId, "overview");
    if (cached && !cached.stale) {
      return { source: "live", data: cached.data, warnings: [], unavailableMetrics: [], stale: false };
    }
    try {
      const computed = await computeLiveOverviewReport(workspaceId, filters);
      setReportCache(workspaceId, "overview", computed);
      return { source: "live", data: computed, warnings: computed.warnings, unavailableMetrics: computed.unavailableMetrics, stale: false };
    } catch (err) {
      console.error("[LiveReportingService] Overview failed:", err.message);
      if (isProd) {
        return { source: "live", data: null, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ["all"], stale: false };
      }
      return { source: "mock", data: getDashboardMetrics(), warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [], stale: false };
    }
  }
  static async getOpportunityDashboardReport(workspaceId, filters = {}) {
    const isProd = process.env.NODE_ENV === "production";
    const settings = db.getReportingSettings(workspaceId);
    if (settings.mode === "MOCK") {
      return { source: "mock", data: getDashboardMetrics(), warnings: [], unavailableMetrics: [], stale: false };
    }
    const cached = getReportCache(workspaceId, "opportunity");
    if (cached && !cached.stale) {
      return { source: "live", data: cached.data, warnings: [], unavailableMetrics: [], stale: false };
    }
    try {
      const computed = await computeLiveOpportunityReport(workspaceId, filters);
      setReportCache(workspaceId, "opportunity", computed);
      return { source: "live", data: computed, warnings: computed.warnings, unavailableMetrics: computed.unavailableMetrics, stale: false };
    } catch (err) {
      console.error("[LiveReportingService] Opportunity failed:", err.message);
      if (isProd) {
        return { source: "live", data: null, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ["all"], stale: false };
      }
      return { source: "mock", data: getDashboardMetrics(), warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [], stale: false };
    }
  }
  static async getSalesDashboardReport(workspaceId, filters = {}) {
    const isProd = process.env.NODE_ENV === "production";
    const settings = db.getReportingSettings(workspaceId);
    if (settings.mode === "MOCK") {
      return { source: "mock", data: getDashboardMetrics(), warnings: [], unavailableMetrics: [], stale: false };
    }
    const cached = getReportCache(workspaceId, "sales");
    if (cached && !cached.stale) {
      return { source: "live", data: cached.data, warnings: [], unavailableMetrics: [], stale: false };
    }
    try {
      const computed = await computeLiveSalesReport(workspaceId, filters);
      setReportCache(workspaceId, "sales", computed);
      return { source: "live", data: computed, warnings: computed.warnings, unavailableMetrics: computed.unavailableMetrics, stale: false };
    } catch (err) {
      console.error("[LiveReportingService] Sales failed:", err.message);
      if (isProd) {
        return { source: "live", data: null, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ["all"], stale: false };
      }
      return { source: "mock", data: getDashboardMetrics(), warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [], stale: false };
    }
  }
  static async getOwnerDashboardReport(workspaceId, filters = {}) {
    const isProd = process.env.NODE_ENV === "production";
    const settings = db.getReportingSettings(workspaceId);
    if (settings.mode === "MOCK") {
      return { source: "mock", data: getOwnerPerformanceReport(filters), warnings: [], unavailableMetrics: [], stale: false };
    }
    const cacheKey = `owner_${filters.userId || "all"}_${filters.source || "all"}`;
    const cached = getReportCache(workspaceId, cacheKey);
    if (cached && !cached.stale) {
      return { source: "live", data: cached.data, warnings: [], unavailableMetrics: [], stale: false };
    }
    try {
      const result = await computeLiveOwnerReport(workspaceId, filters);
      setReportCache(workspaceId, cacheKey, result.data);
      return { source: "live", data: result.data, warnings: result.warnings, unavailableMetrics: result.unavailableMetrics, stale: false };
    } catch (err) {
      console.error("[LiveReportingService] Owner failed:", err.message);
      if (isProd) {
        return { source: "live", data: null, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ["all"], stale: false };
      }
      return { source: "mock", data: getOwnerPerformanceReport(filters), warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [], stale: false };
    }
  }
  static async getMarketingDashboardReport(workspaceId, filters = {}) {
    const isProd = process.env.NODE_ENV === "production";
    const settings = db.getReportingSettings(workspaceId);
    if (settings.mode === "MOCK") {
      return { source: "mock", data: getMarketingPerformanceReport(filters), warnings: [], unavailableMetrics: [], stale: false };
    }
    const cacheKey = `marketing_${filters.source || "all"}_${filters.campaign || "all"}`;
    const cached = getReportCache(workspaceId, cacheKey);
    if (cached && !cached.stale) {
      return { source: "live", data: cached.data, warnings: [], unavailableMetrics: [], stale: false };
    }
    try {
      const result = await computeLiveMarketingReport(workspaceId, filters);
      setReportCache(workspaceId, cacheKey, result.data);
      return { source: "live", data: result.data, warnings: result.warnings, unavailableMetrics: result.unavailableMetrics, stale: false };
    } catch (err) {
      console.error("[LiveReportingService] Marketing failed:", err.message);
      if (isProd) {
        return { source: "live", data: null, error: err.message, warnings: [`Live data unavailable: ${err.message}`], unavailableMetrics: ["all"], stale: false };
      }
      return { source: "mock", data: getMarketingPerformanceReport(filters), warnings: [`Dev fallback: ${err.message}`], unavailableMetrics: [], stale: false };
    }
  }
};

// src/supabase.ts
var import_supabase_js = require("@supabase/supabase-js");
var supabaseUrl = process.env.SUPABASE_URL || "";
var supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("[Supabase] SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set");
}
var supabaseAdmin = (0, import_supabase_js.createClient)(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseServiceKey || "placeholder-key",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false
    }
  }
);
async function supabaseSignIn(email, password) {
  const res = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "apikey": supabaseServiceKey
    },
    body: JSON.stringify({ email, password })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    return { error: err.error_description || err.msg || `Auth failed (HTTP ${res.status})` };
  }
  const data = await res.json();
  return {
    accessToken: data.access_token,
    userId: data.user?.id,
    userMetadata: data.user?.user_metadata ?? {},
    email: data.user?.email
  };
}

// _api_src/index.ts
var import_dotenv = __toESM(require("dotenv"));
import_dotenv.default.config();
function toSaaSUser(authUser, profile) {
  return {
    id: authUser.id,
    name: profile?.name || (authUser.email?.split("@")[0] ?? "Unknown"),
    email: authUser.email || "",
    onboarded: profile?.onboarded ?? false,
    createdAt: authUser.created_at || (/* @__PURE__ */ new Date()).toISOString()
  };
}
function toWorkspace(row) {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    ghlLocationId: row.ghl_location_id,
    createdAt: row.created_at,
    suspended: row.suspended
  };
}
function toMember(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    userId: row.user_id,
    role: row.role,
    joinedAt: row.joined_at
  };
}
function toGHLConnection(row) {
  return {
    id: row.id,
    workspaceId: row.workspace_id,
    locationId: row.location_id,
    apiKey: row.api_key,
    connectedAt: row.connected_at,
    status: row.status
  };
}
function toReportingSettings(row) {
  return {
    workspaceId: row.workspace_id,
    defaultTimeframe: row.default_timeframe,
    allowedDashboards: row.allowed_dashboards,
    lastSyncAt: row.last_sync_at,
    mode: row.mode,
    allowAdminManageGHL: row.allow_admin_manage_ghl,
    cacheTtlMinutes: row.cache_ttl_minutes
  };
}
async function getProfile(userId) {
  const { data } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).single();
  return data;
}
async function getWorkspaceById(id) {
  const { data } = await supabaseAdmin.from("workspaces").select("*").eq("id", id).single();
  return data ? toWorkspace(data) : null;
}
async function getWorkspacesForUser(userId) {
  const { data } = await supabaseAdmin.from("workspace_members").select("role, workspaces(*)").eq("user_id", userId);
  if (!data) return [];
  const isSuperAdmin = data.some((m) => m.role === "SUPER_ADMIN");
  if (isSuperAdmin) {
    const { data: all } = await supabaseAdmin.from("workspaces").select("*");
    return (all || []).map(toWorkspace);
  }
  return data.map((m) => toWorkspace(m.workspaces)).filter(Boolean);
}
async function getWorkspaceMember(workspaceId, userId) {
  const { data } = await supabaseAdmin.from("workspace_members").select("*").eq("workspace_id", workspaceId).eq("user_id", userId).single();
  return data ? toMember(data) : null;
}
async function getMembersByWorkspace(workspaceId) {
  const { data } = await supabaseAdmin.from("workspace_members").select("*").eq("workspace_id", workspaceId);
  return (data || []).map(toMember);
}
async function getGHLConnection(workspaceId) {
  const { data } = await supabaseAdmin.from("ghl_connections").select("*").eq("workspace_id", workspaceId).single();
  return data ? toGHLConnection(data) : null;
}
async function getOrCreateReportingSettings(workspaceId) {
  const { data } = await supabaseAdmin.from("reporting_settings").select("*").eq("workspace_id", workspaceId).single();
  if (data) return toReportingSettings(data);
  const defaultMode = process.env.REPORTING_DATA_SOURCE === "live" ? "LIVE" : "MOCK";
  const defaults = {
    workspace_id: workspaceId,
    default_timeframe: "last_30_days",
    allowed_dashboards: ["overview", "opportunity", "sales"],
    last_sync_at: null,
    mode: defaultMode,
    allow_admin_manage_ghl: true,
    cache_ttl_minutes: 15
  };
  await supabaseAdmin.from("reporting_settings").insert(defaults);
  return toReportingSettings(defaults);
}
async function logAction(workspaceId, userId, userEmail, action, details) {
  await supabaseAdmin.from("audit_logs").insert({
    id: `log_${Date.now()}_${Math.floor(Math.random() * 1e3)}`,
    workspace_id: workspaceId,
    user_id: userId,
    user_email: userEmail,
    action,
    details,
    ip_address: "127.0.0.1",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
}
async function syncGhlToMockDb(workspaceId) {
  const { db: db2 } = await Promise.resolve().then(() => (init_mockSaaSStore(), mockSaaSStore_exports));
  const settings = await getOrCreateReportingSettings(workspaceId);
  const mockSettings = db2.getReportingSettings(workspaceId);
  mockSettings.mode = settings.mode;
  mockSettings.allowAdminManageGHL = settings.allowAdminManageGHL;
  mockSettings.cacheTtlMinutes = settings.cacheTtlMinutes ?? 15;
  const conn = await getGHLConnection(workspaceId);
  if (conn) {
    const existing = db2.getGHLConnection(workspaceId);
    if (!existing) {
      db2.connections.push({
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
var webhookLogs = [
  { timestamp: new Date(Date.now() - 36e5).toISOString(), source: "GoHighLevel Webhook", event: "contact.create", payload: { id: "con_web_1", contactName: "Sally Jenkins" } },
  { timestamp: new Date(Date.now() - 172e5).toISOString(), source: "GoHighLevel Webhook", event: "opportunity.update", payload: { id: "opp_web_1", status: "won", value: 12500 } }
];
var tenantMetricsCache = /* @__PURE__ */ new Map();
var tenantOwnerPerfCache = /* @__PURE__ */ new Map();
var tenantMarketingCache = /* @__PURE__ */ new Map();
function invalidateTenantCache(workspaceId) {
  tenantMetricsCache.delete(workspaceId);
  tenantOwnerPerfCache.delete(workspaceId);
  tenantMarketingCache.delete(workspaceId);
  invalidateWorkspaceCacheStore(workspaceId);
}
async function getWorkspaceGhlConfig(workspaceId) {
  const connection = await getGHLConnection(workspaceId);
  const settings = await getOrCreateReportingSettings(workspaceId);
  let dataSourceMode = "MOCK";
  if (settings.mode) {
    dataSourceMode = settings.mode;
  } else if (process.env.GHL_DATA_SOURCE === "LIVE" || process.env.REPORTING_DATA_SOURCE === "live") {
    dataSourceMode = "LIVE";
  }
  let apiKey = "";
  if (connection?.apiKey) {
    apiKey = connection.apiKey;
  } else {
    apiKey = process.env.GHL_PRIVATE_INTEGRATION_TOKEN || process.env.GHL_API_KEY || "";
  }
  let locationId = "";
  if (connection?.locationId) {
    locationId = connection.locationId;
  } else {
    const ws = await getWorkspaceById(workspaceId);
    locationId = process.env.GHL_LOCATION_ID || ws?.ghlLocationId || "";
  }
  const companyId = process.env.GHL_COMPANY_ID || "co_ghl_company_9a2b";
  const maskToken = (t) => !t ? "" : t.length <= 8 ? "ghl_\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022" : `${t.slice(0, 4)}\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022${t.slice(-5)}`;
  return {
    dataSourceMode,
    apiKey,
    apiKeyMasked: maskToken(apiKey),
    locationId,
    companyId,
    allowAdminManageGHL: settings.allowAdminManageGHL !== false,
    cacheTtlMinutes: settings.cacheTtlMinutes || 15,
    status: connection?.status || (apiKey && locationId ? "CONNECTED" : "DISCONNECTED"),
    connectedAt: connection?.connectedAt || (apiKey && locationId ? (/* @__PURE__ */ new Date()).toISOString() : null)
  };
}
function canUserManageGhl(role, allowAdminManageGHL) {
  if (role === "SUPER_ADMIN" /* SUPER_ADMIN */ || role === "WORKSPACE_OWNER" /* WORKSPACE_OWNER */) return true;
  if (role === "ADMIN" /* ADMIN */) return allowAdminManageGHL;
  return false;
}
var isValidDateString = (d) => /^\d{4}-\d{2}-\d{2}$/.test(d) && !isNaN(Date.parse(d));
var DEMO_CREDENTIALS = {
  "token_super_admin": { email: "operations@showtimepoolmechanics.com", password: "Demo2026!" },
  "token_marcus": { email: "owner@showtime.com", password: "Demo2026!" },
  "token_sarah": { email: "admin@showtime.com", password: "Demo2026!" },
  "token_bobby": { email: "sales@showtime.com", password: "Demo2026!" },
  "token_rachel": { email: "readonly@showtime.com", password: "Demo2026!" },
  "token_bob": { email: "owner@vancepools.com", password: "Demo2026!" }
};
var requireAuth = (allowedRoles) => {
  return async (req, res, next) => {
    const authHeader = req.headers["x-auth-token"] || req.headers["authorization"];
    if (!authHeader) {
      return res.status(401).json({ status: "error", error: "Authentication required. No session token provided." });
    }
    const token = authHeader.toString().replace("Bearer ", "");
    const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !authUser) {
      return res.status(401).json({ status: "error", error: "Invalid or expired session token. Please log in again." });
    }
    const profile = await getProfile(authUser.id);
    const user = toSaaSUser(authUser, profile);
    let activeWorkspaceId = authUser.user_metadata?.active_workspace_id || "";
    let workspace = null;
    let member = null;
    if (activeWorkspaceId) {
      workspace = await getWorkspaceById(activeWorkspaceId);
      if (workspace) member = await getWorkspaceMember(activeWorkspaceId, authUser.id);
    }
    if (!workspace) {
      const { data: memRows } = await supabaseAdmin.from("workspace_members").select("*, workspaces(*)").eq("user_id", authUser.id).order("joined_at").limit(1);
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
      req.user = user;
      req.workspace = null;
      req.member = null;
      req.role = "READ_ONLY" /* READ_ONLY */;
      req.token = token;
      req.supabaseUserId = authUser.id;
      return next();
    }
    const isSuperAdmin = member?.role === "SUPER_ADMIN" /* SUPER_ADMIN */;
    if (workspace.suspended && !isSuperAdmin) {
      return res.status(403).json({ status: "error", error: `Access Denied: The workspace "${workspace.name}" has been suspended.`, suspended: true });
    }
    if (!member && !isSuperAdmin) {
      return res.status(403).json({ status: "error", error: "Access Denied: You are not an authenticated member of this workspace." });
    }
    const role = isSuperAdmin ? "SUPER_ADMIN" /* SUPER_ADMIN */ : member?.role || "READ_ONLY" /* READ_ONLY */;
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(role)) {
      return res.status(403).json({ status: "error", error: `Access Denied: Role "${role}" does not have sufficient permissions.` });
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
var app = (0, import_express.default)();
app.use(import_express.default.json());
app.post("/api/auth/login", async (req, res) => {
  const { email, password, impersonateToken } = req.body;
  let loginEmail;
  let loginPassword;
  if (impersonateToken) {
    const demo = DEMO_CREDENTIALS[impersonateToken];
    if (!demo) return res.status(401).json({ status: "error", error: "Unknown playground token." });
    loginEmail = demo.email;
    loginPassword = demo.password;
  } else {
    if (!email) return res.status(400).json({ status: "error", error: "Email is required." });
    loginEmail = email;
    loginPassword = password || "";
  }
  const signInResult = await supabaseSignIn(loginEmail, loginPassword);
  if (signInResult.error || !signInResult.accessToken) {
    return res.status(401).json({ status: "error", error: "Invalid credentials. Check your email and password." });
  }
  const { data: { user: authUser }, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(signInResult.userId);
  if (getUserError || !authUser) {
    return res.status(401).json({ status: "error", error: "Authentication failed. Please try again." });
  }
  const sessionToken = signInResult.accessToken;
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
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;
  const member = activeWorkspace ? await getWorkspaceMember(activeWorkspace.id, authUser.id) : null;
  const role = member?.role === "SUPER_ADMIN" /* SUPER_ADMIN */ ? "SUPER_ADMIN" /* SUPER_ADMIN */ : member?.role || "READ_ONLY" /* READ_ONLY */;
  await logAction(
    activeWorkspace?.id || null,
    authUser.id,
    authUser.email || "",
    "USER_LOGIN",
    impersonateToken ? `Authenticated via Playground as ${role}` : "Authenticated via email+password"
  );
  res.json({ status: "success", session: { user, activeWorkspace, memberRecord: member, role, token: sessionToken }, workspaces });
});
app.post("/api/auth/signup", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ status: "error", error: "Name, email, and password are required." });
  }
  const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name }
  });
  if (createError) {
    const msg = createError.message.toLowerCase().includes("already") || createError.message.toLowerCase().includes("exists") ? "An account with this email already exists." : createError.message;
    return res.status(400).json({ status: "error", error: msg });
  }
  await supabaseAdmin.from("profiles").insert({ id: newUser.user.id, name, onboarded: false });
  const signInResult = await supabaseSignIn(email, password);
  if (signInResult.error || !signInResult.accessToken) {
    return res.status(500).json({ status: "error", error: "Account created but auto sign-in failed. Please log in manually." });
  }
  const token = signInResult.accessToken;
  const user = toSaaSUser(newUser.user, { name, onboarded: false });
  res.json({ status: "success", user, token });
});
app.post("/api/auth/onboarding", async (req, res) => {
  const { token, companyName, ghlMode, apiKey } = req.body;
  if (!token) return res.status(401).json({ status: "error", error: "Authentication token is required." });
  if (!companyName || !ghlMode) return res.status(400).json({ status: "error", error: "Company name and mode are required." });
  const { data: { user: authUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
  if (authError || !authUser) return res.status(401).json({ status: "error", error: "Invalid or expired session token." });
  const slug = companyName.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-");
  const workspaceId = `ws_${Date.now()}`;
  await supabaseAdmin.from("workspaces").insert({
    id: workspaceId,
    name: companyName,
    slug,
    ghl_location_id: ghlMode === "LIVE" ? `loc_live_${slug.slice(0, 8)}` : `loc_mock_${slug.slice(0, 8)}`,
    suspended: false
  });
  await supabaseAdmin.from("workspace_members").insert({
    id: `mem_${Date.now()}`,
    workspace_id: workspaceId,
    user_id: authUser.id,
    role: "WORKSPACE_OWNER",
    joined_at: (/* @__PURE__ */ new Date()).toISOString()
  });
  await supabaseAdmin.from("reporting_settings").insert({
    workspace_id: workspaceId,
    default_timeframe: "last_30_days",
    allowed_dashboards: ["overview", "opportunity", "sales", "owner", "marketing"],
    mode: ghlMode,
    allow_admin_manage_ghl: true,
    cache_ttl_minutes: 15
  });
  await supabaseAdmin.from("subscriptions").insert({
    workspace_id: workspaceId,
    plan: "GROWTH",
    status: "TRIALING",
    amount: 147,
    next_billing_date: new Date(Date.now() + 14 * 24 * 3600 * 1e3).toISOString()
  });
  if (ghlMode === "LIVE" && apiKey) {
    await supabaseAdmin.from("ghl_connections").insert({
      id: `gn_${Date.now()}`,
      workspace_id: workspaceId,
      location_id: `loc_live_${slug.slice(0, 8)}`,
      api_key: apiKey,
      status: "CONNECTED"
    });
  }
  await supabaseAdmin.from("profiles").update({ onboarded: true }).eq("id", authUser.id);
  await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
    user_metadata: { ...authUser.user_metadata, active_workspace_id: workspaceId }
  });
  const profile = await getProfile(authUser.id);
  const user = toSaaSUser(authUser, profile);
  const workspace = await getWorkspaceById(workspaceId);
  const member = await getWorkspaceMember(workspaceId, authUser.id);
  await logAction(workspaceId, authUser.id, authUser.email || "", "ONBOARD_WORKSPACE", `Workspace "${companyName}" onboarded`);
  res.json({ status: "success", session: { user, activeWorkspace: workspace, memberRecord: member, role: "WORKSPACE_OWNER" /* WORKSPACE_OWNER */, token }, workspaces: [workspace] });
});
app.get("/api/auth/me", async (req, res) => {
  const authHeader = req.headers["x-auth-token"] || req.headers["authorization"];
  if (!authHeader) return res.status(401).json({ status: "unauthorized", error: "No token" });
  const token = authHeader.toString().replace("Bearer ", "");
  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !authUser) return res.status(401).json({ status: "unauthorized", error: "Session expired" });
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
  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId) || workspaces[0] || null;
  const member = activeWorkspace ? await getWorkspaceMember(activeWorkspace.id, authUser.id) : null;
  const role = member?.role === "SUPER_ADMIN" /* SUPER_ADMIN */ ? "SUPER_ADMIN" /* SUPER_ADMIN */ : member?.role || "READ_ONLY" /* READ_ONLY */;
  res.json({ status: "success", session: { user, activeWorkspace, memberRecord: member, role, token }, workspaces });
});
app.post("/api/auth/switch-workspace", async (req, res) => {
  const { token, workspaceId } = req.body;
  if (!token || !workspaceId) return res.status(400).json({ status: "error", error: "Token and workspaceId are required." });
  const { data: { user: authUser }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !authUser) return res.status(401).json({ status: "error", error: "Invalid token." });
  const workspaces = await getWorkspacesForUser(authUser.id);
  const isSuperAdmin = (await supabaseAdmin.from("workspace_members").select("role").eq("user_id", authUser.id)).data?.some((m) => m.role === "SUPER_ADMIN");
  const hasMembership = workspaces.some((w) => w.id === workspaceId) || isSuperAdmin;
  if (!hasMembership) return res.status(403).json({ status: "error", error: "Access Denied: You do not have membership in this workspace." });
  await supabaseAdmin.auth.admin.updateUserById(authUser.id, {
    user_metadata: { ...authUser.user_metadata, active_workspace_id: workspaceId }
  });
  const profile = await getProfile(authUser.id);
  const user = toSaaSUser(authUser, profile);
  const activeWorkspace = await getWorkspaceById(workspaceId);
  const member = await getWorkspaceMember(workspaceId, authUser.id);
  const role = member?.role === "SUPER_ADMIN" /* SUPER_ADMIN */ ? "SUPER_ADMIN" /* SUPER_ADMIN */ : member?.role || "READ_ONLY" /* READ_ONLY */;
  await logAction(workspaceId, authUser.id, authUser.email || "", "SWITCH_WORKSPACE", `Switched to: ${activeWorkspace?.name}`);
  res.json({ status: "success", session: { user, activeWorkspace, memberRecord: member, role, token }, workspaces });
});
app.get("/api/workspaces/settings", requireAuth(), async (req, res) => {
  const settings = await getOrCreateReportingSettings(req.workspace.id);
  const { data: sub } = await supabaseAdmin.from("subscriptions").select("*").eq("workspace_id", req.workspace.id).single();
  const conn = await getGHLConnection(req.workspace.id);
  res.json({ status: "success", settings, subscription: sub, connection: conn ? { locationId: conn.locationId, status: conn.status, connectedAt: conn.connectedAt } : null });
});
app.post("/api/workspaces/settings", requireAuth(["SUPER_ADMIN" /* SUPER_ADMIN */, "WORKSPACE_OWNER" /* WORKSPACE_OWNER */, "ADMIN" /* ADMIN */]), async (req, res) => {
  const { defaultTimeframe, allowedDashboards, ghlApiKey, removeConnection } = req.body;
  const updates = {};
  if (defaultTimeframe !== void 0) updates.default_timeframe = defaultTimeframe;
  if (allowedDashboards !== void 0) updates.allowed_dashboards = allowedDashboards;
  if (ghlApiKey !== void 0 && ghlApiKey !== "") {
    const existing = await getGHLConnection(req.workspace.id);
    if (!existing) {
      await supabaseAdmin.from("ghl_connections").insert({ id: `gn_${Date.now()}`, workspace_id: req.workspace.id, location_id: req.workspace.ghlLocationId, api_key: ghlApiKey, status: "CONNECTED" });
    } else {
      await supabaseAdmin.from("ghl_connections").update({ api_key: ghlApiKey, status: "CONNECTED", connected_at: (/* @__PURE__ */ new Date()).toISOString() }).eq("workspace_id", req.workspace.id);
    }
    updates.mode = "LIVE";
    await logAction(req.workspace.id, req.user.id, req.user.email, "UPDATE_INTEGRATION_KEY", "Updated GHL integration key.");
  }
  if (removeConnection) {
    await supabaseAdmin.from("ghl_connections").delete().eq("workspace_id", req.workspace.id);
    updates.mode = "MOCK";
    await logAction(req.workspace.id, req.user.id, req.user.email, "REMOVE_INTEGRATION", "Removed GHL connector.");
  }
  if (Object.keys(updates).length > 0) {
    await supabaseAdmin.from("reporting_settings").update(updates).eq("workspace_id", req.workspace.id);
  }
  const settings = await getOrCreateReportingSettings(req.workspace.id);
  res.json({ status: "success", settings, message: "Workspace configurations updated successfully." });
});
app.get("/api/workspaces/members", requireAuth(["SUPER_ADMIN" /* SUPER_ADMIN */, "WORKSPACE_OWNER" /* WORKSPACE_OWNER */, "ADMIN" /* ADMIN */]), async (req, res) => {
  const members = await getMembersByWorkspace(req.workspace.id);
  const list = await Promise.all(members.map(async (m) => {
    const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(m.userId);
    const profile = await getProfile(m.userId);
    return { id: m.id, userId: m.userId, userName: profile?.name || authUser?.user?.email?.split("@")[0] || "Unknown", userEmail: authUser?.user?.email || "unknown@company.com", role: m.role, joinedAt: m.joinedAt };
  }));
  res.json({ status: "success", members: list });
});
app.post("/api/workspaces/invite", requireAuth(["SUPER_ADMIN" /* SUPER_ADMIN */, "WORKSPACE_OWNER" /* WORKSPACE_OWNER */]), async (req, res) => {
  const { name, email, role } = req.body;
  if (!name || !email || !role) return res.status(400).json({ status: "error", error: "Name, email, and role are required." });
  let userId;
  const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
  const existing = existingUsers?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  if (existing) {
    userId = existing.id;
  } else {
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({ email, email_confirm: true, user_metadata: { name }, password: "ChangeMe2026!" });
    if (error) return res.status(400).json({ status: "error", error: error.message });
    await supabaseAdmin.from("profiles").insert({ id: newUser.user.id, name, onboarded: true });
    userId = newUser.user.id;
  }
  const alreadyMember = await getWorkspaceMember(req.workspace.id, userId);
  if (alreadyMember) return res.status(400).json({ status: "error", error: "User is already a member of this workspace." });
  await supabaseAdmin.from("workspace_members").insert({ id: `mem_${Date.now()}`, workspace_id: req.workspace.id, user_id: userId, role, joined_at: (/* @__PURE__ */ new Date()).toISOString() });
  await logAction(req.workspace.id, req.user.id, req.user.email, "INVITE_USER", `Invited ${email} as ${role}`);
  res.json({ status: "success", message: `Invited ${email} successfully.` });
});
app.get("/api/admin/workspaces", requireAuth(["SUPER_ADMIN" /* SUPER_ADMIN */]), async (req, res) => {
  const { data: allWs } = await supabaseAdmin.from("workspaces").select("*");
  const list = await Promise.all((allWs || []).map(async (ws) => {
    const members = await getMembersByWorkspace(ws.id);
    const conn = await getGHLConnection(ws.id);
    const { data: sub } = await supabaseAdmin.from("subscriptions").select("*").eq("workspace_id", ws.id).single();
    return { ...toWorkspace(ws), membersCount: members.length, connectionStatus: conn?.status || "DISCONNECTED", plan: sub?.plan || "N/A", amount: sub?.amount || 0 };
  }));
  res.json({ status: "success", workspaces: list });
});
app.post("/api/admin/suspend", requireAuth(["SUPER_ADMIN" /* SUPER_ADMIN */]), async (req, res) => {
  const { workspaceId, suspend } = req.body;
  if (!workspaceId) return res.status(400).json({ status: "error", error: "workspaceId is required." });
  const ws = await getWorkspaceById(workspaceId);
  if (!ws) return res.status(404).json({ status: "error", error: "Workspace not found." });
  await supabaseAdmin.from("workspaces").update({ suspended: !!suspend }).eq("id", workspaceId);
  await logAction(workspaceId, req.user.id, req.user.email, "TOGGLE_SUSPEND_WORKSPACE", `Workspace suspension set to: ${!!suspend}`);
  res.json({ status: "success", message: `Workspace "${ws.name}" has been ${suspend ? "SUSPENDED" : "ACTIVATED"}.` });
});
app.get("/api/admin/users", requireAuth(["SUPER_ADMIN" /* SUPER_ADMIN */]), async (req, res) => {
  const { data: users } = await supabaseAdmin.auth.admin.listUsers();
  const list = await Promise.all((users?.users || []).map(async (u) => {
    const profile = await getProfile(u.id);
    const { data: mems } = await supabaseAdmin.from("workspace_members").select("workspace_id, role, workspaces(name)").eq("user_id", u.id);
    return {
      id: u.id,
      name: profile?.name || u.email?.split("@")[0] || "Unknown",
      email: u.email,
      createdAt: u.created_at,
      onboarded: profile?.onboarded || false,
      memberships: (mems || []).map((m) => ({ workspaceId: m.workspace_id, workspaceName: m.workspaces?.name || "Unknown", role: m.role }))
    };
  }));
  res.json({ status: "success", users: list });
});
app.get("/api/admin/audit-logs", requireAuth(), async (req, res) => {
  if (req.role === "SUPER_ADMIN" /* SUPER_ADMIN */) {
    const { data } = await supabaseAdmin.from("audit_logs").select("*").order("timestamp", { ascending: false }).limit(500);
    res.json({ status: "success", logs: data || [] });
  } else if (req.role === "WORKSPACE_OWNER" /* WORKSPACE_OWNER */ || req.role === "ADMIN" /* ADMIN */) {
    const { data } = await supabaseAdmin.from("audit_logs").select("*").eq("workspace_id", req.workspace.id).order("timestamp", { ascending: false }).limit(200);
    res.json({ status: "success", logs: data || [] });
  } else {
    res.status(403).json({ status: "error", error: "Access Denied." });
  }
});
app.get("/api/ghl/config", requireAuth(), async (req, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  const warnings = [];
  if (config.dataSourceMode === "MOCK") warnings.push("Mock data is currently active.");
  if (config.dataSourceMode === "LIVE" && (!config.apiKey || !config.locationId)) warnings.push("Live mode selected but credentials are missing. Falling back to mock.");
  let allWorkspaceConnections = [];
  if (req.role === "SUPER_ADMIN" /* SUPER_ADMIN */) {
    const { data: allWs } = await supabaseAdmin.from("workspaces").select("*");
    allWorkspaceConnections = await Promise.all((allWs || []).map(async (ws) => {
      const c = await getWorkspaceGhlConfig(ws.id);
      return { workspaceId: ws.id, workspaceName: ws.name, locationId: c.locationId, connectionStatus: c.status, connectedAt: c.connectedAt, mode: c.dataSourceMode };
    }));
  }
  res.json({
    status: "success",
    role: req.role,
    canManage: canUserManageGhl(req.role, config.allowAdminManageGHL),
    data: { dataSourceMode: config.dataSourceMode, apiKey: config.apiKeyMasked, apiKeyMasked: config.apiKeyMasked, authMode: process.env.GHL_AUTH_MODE || "private_token", locationId: config.locationId, companyId: config.companyId, lastSyncTime: config.connectedAt || (/* @__PURE__ */ new Date()).toISOString(), cacheTtlMinutes: config.cacheTtlMinutes, allowAdminManageGHL: config.allowAdminManageGHL, apiConnectedSince: config.connectedAt, connectionStatus: config.status, rateLimitStatus: { remaining: 98, limit: 100 }, webhookUrl: process.env.APP_URL ? `${process.env.APP_URL}/api/ghl/webhook` : "https://example.com/api/ghl/webhook", healthCheckStatus: config.apiKey && config.locationId ? config.status === "CONNECTED" ? "SUCCESS" : "FAILED" : "UNKNOWN", lastError: null, scopeChecks: { "contacts.readonly": true, "contacts.write": false, "opportunities.readonly": true, "opportunities.write": false, "users.readonly": true }, warnings, allWorkspaceConnections },
    webhookLogs: webhookLogs.slice(0, 10)
  });
});
app.post("/api/ghl/config", requireAuth(["SUPER_ADMIN" /* SUPER_ADMIN */, "WORKSPACE_OWNER" /* WORKSPACE_OWNER */, "ADMIN" /* ADMIN */]), async (req, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  if (!canUserManageGhl(req.role, config.allowAdminManageGHL)) return res.status(403).json({ status: "error", error: "Access Denied." });
  const { dataSourceMode, apiKey, locationId, cacheTtlMinutes, allowAdminManageGHL } = req.body;
  const settingsUpdate = {};
  if (dataSourceMode !== void 0) settingsUpdate.mode = dataSourceMode;
  if (cacheTtlMinutes !== void 0) settingsUpdate.cache_ttl_minutes = Number(cacheTtlMinutes) || 15;
  if (allowAdminManageGHL !== void 0) settingsUpdate.allow_admin_manage_ghl = !!allowAdminManageGHL;
  if (Object.keys(settingsUpdate).length > 0) {
    await supabaseAdmin.from("reporting_settings").update(settingsUpdate).eq("workspace_id", req.workspace.id);
  }
  let resolvedApiKey = apiKey;
  if (apiKey && apiKey.includes("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022")) resolvedApiKey = config.apiKey;
  if (locationId !== void 0 || resolvedApiKey !== void 0 && resolvedApiKey !== "") {
    const existing = await getGHLConnection(req.workspace.id);
    if (!existing) {
      await supabaseAdmin.from("ghl_connections").insert({ id: `gn_${Date.now()}`, workspace_id: req.workspace.id, location_id: locationId || req.workspace.ghlLocationId || "", api_key: resolvedApiKey || "", status: resolvedApiKey ? "CONNECTED" : "DISCONNECTED" });
    } else {
      const connUpdate = {};
      if (locationId !== void 0) connUpdate.location_id = locationId;
      if (resolvedApiKey !== void 0) {
        connUpdate.api_key = resolvedApiKey;
        connUpdate.status = resolvedApiKey ? "CONNECTED" : "DISCONNECTED";
        connUpdate.connected_at = (/* @__PURE__ */ new Date()).toISOString();
      }
      await supabaseAdmin.from("ghl_connections").update(connUpdate).eq("workspace_id", req.workspace.id);
    }
  }
  await logAction(req.workspace.id, req.user.id, req.user.email, "UPDATE_INTEGRATION_KEY", "Updated GHL integration parameters.");
  invalidateTenantCache(req.workspace.id);
  const updated = await getWorkspaceGhlConfig(req.workspace.id);
  res.json({ status: "success", message: "Workspace configurations updated successfully.", data: { dataSourceMode: updated.dataSourceMode, apiKey: updated.apiKeyMasked, apiKeyMasked: updated.apiKeyMasked, locationId: updated.locationId, companyId: updated.companyId, cacheTtlMinutes: updated.cacheTtlMinutes, allowAdminManageGHL: updated.allowAdminManageGHL, connectionStatus: updated.status, apiConnectedSince: updated.connectedAt } });
});
app.post("/api/ghl/save-connection", requireAuth(), async (req, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  if (!canUserManageGhl(req.role, config.allowAdminManageGHL)) return res.status(403).json({ status: "error", error: "Access Denied." });
  let { apiKey, locationId, allowAdminManageGHL } = req.body;
  if (apiKey && apiKey.includes("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022")) apiKey = config.apiKey;
  const existing = await getGHLConnection(req.workspace.id);
  if (!existing) {
    await supabaseAdmin.from("ghl_connections").insert({ id: `gn_${Date.now()}`, workspace_id: req.workspace.id, location_id: locationId || req.workspace.ghlLocationId || "", api_key: apiKey || "", status: apiKey ? "CONNECTED" : "DISCONNECTED" });
  } else {
    const upd = {};
    if (locationId !== void 0) upd.location_id = locationId;
    if (apiKey !== void 0) {
      upd.api_key = apiKey;
      upd.status = apiKey ? "CONNECTED" : "DISCONNECTED";
      upd.connected_at = (/* @__PURE__ */ new Date()).toISOString();
    }
    await supabaseAdmin.from("ghl_connections").update(upd).eq("workspace_id", req.workspace.id);
  }
  if (allowAdminManageGHL !== void 0) {
    await supabaseAdmin.from("reporting_settings").update({ allow_admin_manage_ghl: !!allowAdminManageGHL }).eq("workspace_id", req.workspace.id);
  }
  await logAction(req.workspace.id, req.user.id, req.user.email, "SAVE_GHL_CONNECTION", `Saved GHL connection. Location: ${locationId}`);
  invalidateTenantCache(req.workspace.id);
  res.json({ status: "success", message: "Connection settings saved successfully." });
});
app.post("/api/ghl/test-connection", requireAuth(), async (req, res) => {
  const workspaceConfig = await getWorkspaceGhlConfig(req.workspace.id);
  let { apiKey, locationId } = req.body;
  if (!apiKey || apiKey.includes("\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022")) apiKey = workspaceConfig.apiKey;
  if (!locationId) locationId = workspaceConfig.locationId;
  if (workspaceConfig.dataSourceMode === "MOCK" && (!apiKey || !locationId)) {
    return res.json({ status: "success", source: "mock", message: "Synthesized Sandbox Connection Test Passed.", details: { responseTimeMs: 38, authType: "Private Integration Token", scopesActive: ["contacts.readonly", "opportunities.readonly", "users.readonly"], rateLimits: { remaining: 100, limit: 100 } } });
  }
  if (!apiKey || !locationId) return res.status(400).json({ status: "error", error: "GHL Private Token and Location ID are required." });
  try {
    const baseUrl = process.env.GHL_BASE_URL || "https://services.leadconnectorhq.com";
    const version = process.env.GHL_API_VERSION || "2021-07-28";
    const testResponse = await fetch(`${baseUrl}/users/?locationId=${locationId}`, { method: "GET", headers: { "Authorization": `Bearer ${apiKey}`, "Version": version, "Content-Type": "application/json" } });
    if (testResponse.ok) {
      await logAction(req.workspace.id, req.user.id, req.user.email, "TEST_GHL_API_SUCCESS", "Test connection succeeded.");
      return res.json({ status: "success", source: "live", message: "Connection successful! HighLevel API V2 responded with HTTP 200 OK.", details: { responseTimeMs: 122, authType: "Private Integration Token", scopesActive: ["contacts.readonly", "opportunities.readonly", "users.readonly"], rateLimits: { remaining: parseInt(testResponse.headers.get("x-ratelimit-remaining") || "98"), limit: parseInt(testResponse.headers.get("x-ratelimit-limit") || "100") } } });
    } else {
      const errText = await testResponse.text();
      let errorMsg = `Connection failed: HTTP ${testResponse.status}`;
      if (testResponse.status === 401) errorMsg = "Unauthorized. Check your Private Integration Key.";
      else if (testResponse.status === 403) errorMsg = "Forbidden. Validate your Location ID permissions.";
      return res.status(testResponse.status).json({ status: "error", error: errorMsg });
    }
  } catch (err) {
    return res.status(500).json({ status: "error", error: `API Gateway unreachable: ${err.message}` });
  }
});
app.post("/api/ghl/switch-mode", requireAuth(), async (req, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  if (!canUserManageGhl(req.role, config.allowAdminManageGHL)) return res.status(403).json({ status: "error", error: "Access Denied." });
  const { mode } = req.body;
  if (mode !== "MOCK" && mode !== "LIVE") return res.status(400).json({ status: "error", error: "Invalid mode." });
  await supabaseAdmin.from("reporting_settings").update({ mode }).eq("workspace_id", req.workspace.id);
  await logAction(req.workspace.id, req.user.id, req.user.email, "TOGGLE_REPORTING_SOURCE_MODE", `Switched reporting source to ${mode}`);
  invalidateTenantCache(req.workspace.id);
  res.json({ status: "success", message: `Data source changed to ${mode} mode.` });
});
app.post("/api/ghl/disconnect", requireAuth(), async (req, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  if (!canUserManageGhl(req.role, config.allowAdminManageGHL)) return res.status(403).json({ status: "error", error: "Access Denied." });
  await supabaseAdmin.from("ghl_connections").delete().eq("workspace_id", req.workspace.id);
  await supabaseAdmin.from("reporting_settings").update({ mode: "MOCK" }).eq("workspace_id", req.workspace.id);
  await logAction(req.workspace.id, req.user.id, req.user.email, "DISCONNECT_GHL_CREDENTIALS", "Severed GHL API credentials.");
  invalidateTenantCache(req.workspace.id);
  res.json({ status: "success", message: "GoHighLevel connection deleted. Mode fell back to Mock." });
});
app.post("/api/ghl/update-cache-ttl", requireAuth(), async (req, res) => {
  const config = await getWorkspaceGhlConfig(req.workspace.id);
  if (!canUserManageGhl(req.role, config.allowAdminManageGHL)) return res.status(403).json({ status: "error", error: "Access Denied." });
  const minutes = Number(req.body.cacheTtlMinutes);
  if (isNaN(minutes) || minutes < 1 || minutes > 1440) return res.status(400).json({ status: "error", error: "Cache TTL must be between 1 and 1440 minutes." });
  await supabaseAdmin.from("reporting_settings").update({ cache_ttl_minutes: minutes }).eq("workspace_id", req.workspace.id);
  await logAction(req.workspace.id, req.user.id, req.user.email, "CHANGE_CACHE_TTL", `Cache TTL set to ${minutes} minutes.`);
  invalidateTenantCache(req.workspace.id);
  res.json({ status: "success", message: "Cache TTL updated successfully." });
});
app.post("/api/ghl/webhook", async (req, res) => {
  const payload = req.body;
  webhookLogs.unshift({ timestamp: (/* @__PURE__ */ new Date()).toISOString(), source: "GoHighLevel Webhook (Live Inflow)", event: payload.type || "unknown_event", payload });
  const { data: conn } = await supabaseAdmin.from("ghl_connections").select("workspace_id").eq("location_id", payload.locationId || payload.location_id || "").single();
  if (conn) {
    invalidateTenantCache(conn.workspace_id);
  } else {
    tenantMetricsCache.clear();
    tenantOwnerPerfCache.clear();
    tenantMarketingCache.clear();
  }
  res.status(200).json({ status: "delivered", received: true });
});
app.get("/api/ghl/metrics", requireAuth(), async (req, res) => {
  try {
    await syncGhlToMockDb(req.workspace.id);
    const result = await LiveReportingService.getOverviewDashboardReport(req.workspace.id);
    if (!result.data) return res.status(503).json({ status: "error", source: result.source, error: result.error || "Live data unavailable", warnings: result.warnings || [] });
    return res.json({ status: "success", source: result.source, stale: !!result.stale, warnings: result.warnings || [], data: result.data });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});
app.get("/api/ghl/owner-performance", requireAuth(), async (req, res) => {
  try {
    await syncGhlToMockDb(req.workspace.id);
    const result = await LiveReportingService.getOwnerDashboardReport(req.workspace.id);
    if (!result.data) return res.status(503).json({ status: "error", source: result.source, error: result.error || "Live data unavailable", warnings: result.warnings || [] });
    return res.json({ status: "success", source: result.source, data: result.data.ownerBreakdown });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});
app.get("/api/ghl/marketing-performance", requireAuth(), async (req, res) => {
  try {
    await syncGhlToMockDb(req.workspace.id);
    const result = await LiveReportingService.getMarketingDashboardReport(req.workspace.id);
    if (!result.data) return res.status(503).json({ status: "error", source: result.source, error: result.error || "Live data unavailable", warnings: result.warnings || [] });
    const rep = result.data;
    const formatted = Object.keys(rep.leadsBySource).map((src) => {
      const leads = rep.leadsBySource[src] || 0;
      const bookings = rep.bookingsBySource[src] || 0;
      const wonVal = rep.wonRevenueBySource[src] || 0;
      const pip = rep.pipelineValueBySource[src] || 0;
      return { source: src, leadsCount: leads, conversionRate: leads > 0 ? Math.round(bookings / leads * 100) : 0, pipelineValue: pip, closedWonValue: wonVal, costEstimate: 0, roi: 0, weeklyLeadsTrend: [{ date: "Wk 1", count: Math.round(leads * 0.2) }, { date: "Wk 2", count: Math.round(leads * 0.3) }, { date: "Wk 3", count: Math.round(leads * 0.5) }, { date: "Wk 4", count: leads }] };
    });
    return res.json({ status: "success", source: result.source, data: formatted });
  } catch (err) {
    return res.status(500).json({ status: "error", error: err.message });
  }
});
app.get("/api/reporting/owner-performance", requireAuth(), async (req, res) => {
  try {
    await syncGhlToMockDb(req.workspace.id);
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : void 0;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : void 0;
    const userId = typeof req.query.userId === "string" ? req.query.userId : void 0;
    const source = typeof req.query.source === "string" ? req.query.source : void 0;
    const campaign = typeof req.query.campaign === "string" ? req.query.campaign : void 0;
    const warnings = [];
    if (startDate && !isValidDateString(startDate)) return res.status(400).json({ status: "error", source: "mock", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: "startDate must be YYYY-MM-DD." });
    if (endDate && !isValidDateString(endDate)) return res.status(400).json({ status: "error", source: "mock", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: "endDate must be YYYY-MM-DD." });
    const result = await LiveReportingService.getOwnerDashboardReport(req.workspace.id, { startDate, endDate, userId, source, campaign });
    if (result.warnings) warnings.push(...result.warnings);
    if (!result.data) return res.status(503).json({ status: "error", source: result.source, generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: false, warnings, unavailableMetrics: ["all"], error: result.error || "Live data unavailable" });
    return res.status(200).json({ status: "success", source: result.source, generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: !!result.stale, warnings, unavailableMetrics: result.unavailableMetrics || [], data: result.data });
  } catch (err) {
    return res.status(500).json({ status: "error", source: "mock", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: err.message });
  }
});
app.get("/api/reporting/va-performance", requireAuth(), (req, res) => {
  try {
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : void 0;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : void 0;
    const userId = typeof req.query.userId === "string" ? req.query.userId : void 0;
    const source = typeof req.query.source === "string" ? req.query.source : void 0;
    const campaign = typeof req.query.campaign === "string" ? req.query.campaign : void 0;
    const serviceCategory = typeof req.query.serviceCategory === "string" ? req.query.serviceCategory : void 0;
    const data = getVAPerformanceReport({ startDate, endDate, userId, source, campaign, serviceCategory });
    return res.status(200).json({ status: "success", source: "mock", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: false, warnings: [], unavailableMetrics: [], data });
  } catch (err) {
    return res.status(500).json({ status: "error", source: "mock", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: err.message });
  }
});
app.get("/api/reporting/marketing-performance", requireAuth(), async (req, res) => {
  try {
    await syncGhlToMockDb(req.workspace.id);
    const startDate = typeof req.query.startDate === "string" ? req.query.startDate : void 0;
    const endDate = typeof req.query.endDate === "string" ? req.query.endDate : void 0;
    const userId = typeof req.query.userId === "string" ? req.query.userId : void 0;
    const source = typeof req.query.source === "string" ? req.query.source : void 0;
    const campaign = typeof req.query.campaign === "string" ? req.query.campaign : void 0;
    const warnings = [];
    if (startDate && !isValidDateString(startDate)) return res.status(400).json({ status: "error", source: "mock", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: "startDate must be YYYY-MM-DD." });
    if (endDate && !isValidDateString(endDate)) return res.status(400).json({ status: "error", source: "mock", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: "endDate must be YYYY-MM-DD." });
    if (source && source.toLowerCase().includes("tiktok")) warnings.push("TikTok ad accounts are not synced. Cost metrics are estimated.");
    const result = await LiveReportingService.getMarketingDashboardReport(req.workspace.id, { startDate, endDate, userId, source, campaign });
    if (result.warnings) warnings.push(...result.warnings);
    if (!result.data) return res.status(503).json({ status: "error", source: result.source, generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: false, warnings, unavailableMetrics: ["all"], error: result.error || "Live data unavailable" });
    return res.status(200).json({ status: "success", source: result.source, generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: !!result.stale, warnings, unavailableMetrics: result.unavailableMetrics || [], data: result.data });
  } catch (err) {
    return res.status(500).json({ status: "error", source: "mock", generatedAt: (/* @__PURE__ */ new Date()).toISOString(), stale: false, warnings: [], unavailableMetrics: [], error: err.message });
  }
});
var index_default = app;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  requireAuth
});
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
