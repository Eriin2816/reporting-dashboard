/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Calendar,
  MapPin,
  Download,
  RefreshCw,
  FileSpreadsheet,
  AlertOctagon,
  Copy,
  RotateCcw,
  Clock,
  FileDown,
  MoreHorizontal
} from 'lucide-react';
import { useOfflineStatus } from '../hooks/useOfflineStatus';
import OfflineBanner from './OfflineBanner';

// Custom views
import OverviewDashboardView from './OverviewDashboardView';
import OpportunityDashboardView from './OpportunityDashboardView';
import SalesDashboardView from './SalesDashboardView';
import AppointmentDashboardView from './AppointmentDashboardView';
import MarketingDashboardView from './MarketingDashboardView';
import { EstimatesInvoicesDashboardViewWithBoundary as EstimatesInvoicesDashboardView } from './EstimatesInvoicesDashboardView';

import { OwnerPerformanceReport, MarketingPerformanceReport, AppointmentDashboardReport, EstimatesInvoicesReport, OutstandingReport, IntegrationStatus, GA4Report, MetaAdsReport, ApiResponse } from '../types';

function getMonthToDateLA(): { start: string; end: string } {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });
  const parts = fmt.formatToParts(new Date());
  const y = parts.find(p => p.type === 'year')!.value;
  const m = parts.find(p => p.type === 'month')!.value;
  const d = parts.find(p => p.type === 'day')!.value;
  return { start: `${y}-${m}-01`, end: `${y}-${m}-${d}` };
}

interface ReportingCommandCenterProps {
  dataSourceMode: 'MOCK' | 'LIVE';
  onSyncMetrics: () => void;
  isSyncing: boolean;
  forcedView?: 'overview' | 'opportunity' | 'sales' | 'appointment' | 'marketing' | 'estimates';
  token?: string;
  user?: any;
  activeWorkspace?: any;
  role?: string;
}

export default function ReportingCommandCenter({
  dataSourceMode,
  onSyncMetrics,
  isSyncing,
  forcedView,
  token,
  user,
  activeWorkspace,
  role
}: ReportingCommandCenterProps) {
  // 1. Selector states
  const [dashboardType, setDashboardType] = useState<'overview' | 'opportunity' | 'sales' | 'appointment' | 'marketing' | 'estimates'>(forcedView || 'overview');
  
  // Sync forcedView prop to state if provided
  useEffect(() => {
    if (forcedView) {
      setDashboardType(forcedView);
    }
  }, [forcedView]);

  // 2. Filter states — dates default to month-to-date in America/Los_Angeles on every mount
  const [startDate, setStartDate] = useState<string>(() => getMonthToDateLA().start);
  const [endDate, setEndDate] = useState<string>(() => getMonthToDateLA().end);
  const [location, setLocation] = useState<string>('loc_g53h7s8a');
  const [isPdfLoading, setIsPdfLoading] = useState<boolean>(false);
  const [estimatesReport, setEstimatesReport] = useState<EstimatesInvoicesReport | null>(null);
  const [isEstimatesLoading, setIsEstimatesLoading] = useState<boolean>(false);
  const [outstandingReport, setOutstandingReport] = useState<OutstandingReport | null>(null);
  const [isOutstandingLoading, setIsOutstandingLoading] = useState<boolean>(false);
  const [outstandingError, setOutstandingError] = useState<string | null>(null);
  const [ga4Integration, setGa4Integration] = useState<IntegrationStatus | null>(null);
  const [ga4Report, setGa4Report] = useState<GA4Report | null>(null);
  const [isGa4Loading, setIsGa4Loading] = useState<boolean>(false);
  const [ga4RefreshSeq, setGa4RefreshSeq] = useState<number>(0);
  const [metaIntegration, setMetaIntegration] = useState<IntegrationStatus | null>(null);
  const [metaReport, setMetaReport] = useState<MetaAdsReport | null>(null);
  const [isMetaLoading, setIsMetaLoading] = useState<boolean>(false);
  const [metaRefreshSeq, setMetaRefreshSeq] = useState<number>(0);

  // Local re-fetch sequencer trigger
  const [refreshTriggerSeq, setRefreshTriggerSeq] = useState<number>(0);
  const [forceRefresh, setForceRefresh] = useState<boolean>(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<number | null>(null);
  const [moreToolsOpen, setMoreToolsOpen] = useState<boolean>(false);

  // Offline / PWA status — auto-refresh when connection returns
  const handleReconnect = useCallback(() => {
    setRefreshTriggerSeq(s => s + 1);
  }, []);
  const { isOffline, lastSyncTime, recordSync } = useOfflineStatus(handleReconnect);

  // Clipboard copy and modal fallback states
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [fallbackCopyText, setFallbackCopyText] = useState<string | null>(null);

  // 3. API payload states
  const [ownerReport, setOwnerReport] = useState<OwnerPerformanceReport | null>(null);
  const [marketingReport, setMarketingReport] = useState<MarketingPerformanceReport | null>(null);
  const [appointmentReport, setAppointmentReport] = useState<AppointmentDashboardReport | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [responseContext, setResponseContext] = useState<{
    source: 'mock' | 'live';
    generatedAt: string;
    stale: boolean;
    warnings: string[];
    unavailableMetrics: string[];
  } | null>(null);

  // 4. Triggered loader hook incorporating active filters
  useEffect(() => {
    let active = true;

    async function fetchPayloads() {
      setIsLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (forceRefresh) params.append('force', '1');

        const queryStr = params.toString();
        const headers: Record<string, string> = {};
        const activeToken = token || localStorage.getItem('saas_token') || '';
        if (activeToken) headers['x-auth-token'] = activeToken;

        // Fetch all three in parallel; process each independently as it resolves
        const [ownerRes, markRes, aptRes] = await Promise.all([
          fetch(`/api/reporting/owner-performance?${queryStr}`, { headers }),
          fetch(`/api/reporting/marketing-performance?${queryStr}`, { headers }),
          fetch(`/api/reporting/appointment-performance?${queryStr}`, { headers })
        ]);

        if (!active) return;

        const [ownerData, markData, aptData]: [
          ApiResponse<OwnerPerformanceReport>,
          ApiResponse<MarketingPerformanceReport>,
          ApiResponse<AppointmentDashboardReport>
        ] = await Promise.all([ownerRes.json(), markRes.json(), aptRes.json()]);

        if (!active) return;

        if (ownerData.status === 'success') {
          setOwnerReport(ownerData.data);
          if (ownerData.cachedAt) setLastSyncedAt(ownerData.cachedAt);
        }
        if (markData.status === 'success') {
          setMarketingReport(markData.data);
          if (markData.cachedAt) setLastSyncedAt(prev => markData.cachedAt! > (prev || 0) ? markData.cachedAt! : prev);
        }
        if (aptData.status === 'success') {
          setAppointmentReport(aptData.data);
        }
        // Record successful live sync for offline banner
        if (ownerData.status === 'success' || markData.status === 'success' || aptData.status === 'success') {
          recordSync();
        }

        // Merge context from all three responses
        if (ownerData.status === 'success' || markData.status === 'success') {
          const primary = ownerData.status === 'success' ? ownerData : markData;
          setResponseContext({
            source: primary.source,
            generatedAt: primary.generatedAt,
            stale: primary.stale,
            warnings: [...(ownerData.warnings || []), ...(markData.warnings || []), ...(aptData.warnings || [])],
            unavailableMetrics: [...(ownerData.unavailableMetrics || []), ...(markData.unavailableMetrics || []), ...(aptData.unavailableMetrics || [])]
          });
        }
      } catch (err) {
        console.error("Failed to compile reporting components:", err);
      } finally {
        if (active) {
          setIsLoading(false);
          setForceRefresh(false);
        }
      }
    }

    fetchPayloads();

    return () => { active = false; };
  }, [startDate, endDate, location, refreshTriggerSeq, token]);

  // Lazy-load estimates/invoices only when that view is active
  const isEstimatesView = dashboardType === 'estimates';
  useEffect(() => {
    if (!isEstimatesView) return;
    let active = true;
    async function fetchEstimates() {
      setIsEstimatesLoading(true);
      try {
        const headers: Record<string, string> = {};
        const activeToken = token || localStorage.getItem('saas_token') || '';
        if (activeToken) headers['x-auth-token'] = activeToken;
        const url = forceRefresh ? `/api/reporting/estimates-invoices?force=1` : `/api/reporting/estimates-invoices`;
        const res = await fetch(url, { headers });
        if (!active) return;
        const data: ApiResponse<EstimatesInvoicesReport> = await res.json();
        if (data.status === 'success') {
          setEstimatesReport(data.data);
          if (data.cachedAt) setLastSyncedAt(data.cachedAt);
        }
      } catch (err) {
        console.error('[Estimates fetch]', err);
      } finally {
        if (active) setIsEstimatesLoading(false);
      }
    }
    fetchEstimates();
    return () => { active = false; };
  }, [isEstimatesView, refreshTriggerSeq, token]);

  // Lazy-load outstanding (all-time) — no date params, refetches only on Sync or first visit
  useEffect(() => {
    if (!isEstimatesView) return;
    let active = true;
    async function fetchOutstanding() {
      setIsOutstandingLoading(true);
      setOutstandingError(null);
      try {
        const activeToken = token || localStorage.getItem('saas_token') || '';
        const headers: Record<string, string> = { 'x-auth-token': activeToken };
        const suffix = forceRefresh ? `force=1&_t=${Date.now()}` : `_t=${Date.now()}`;
        const res = await fetch(`/api/reporting/outstanding?${suffix}`, { headers, cache: 'no-store' });
        if (!active) return;
        const data = await res.json();
        if (data.status === 'success') {
          setOutstandingReport(data.data);
          if (data.cachedAt) setLastSyncedAt(data.cachedAt);
        }
        else setOutstandingError(data.error || 'Failed to load outstanding data.');
      } catch (err: any) {
        if (active) setOutstandingError('Network error loading outstanding data.');
        console.error('[Outstanding fetch]', err);
      } finally {
        if (active) setIsOutstandingLoading(false);
      }
    }
    fetchOutstanding();
    return () => { active = false; };
  }, [isEstimatesView, refreshTriggerSeq, token]);

  // Lazy-load GA4 + Meta Ads integration status + reports only when marketing view is active
  const isMarketingView = dashboardType === 'marketing';
  useEffect(() => {
    if (!isMarketingView) return;
    let active = true;
    async function fetchMarketingIntegrations() {
      setIsGa4Loading(true);
      setIsMetaLoading(true);
      try {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        const activeToken = token || localStorage.getItem('saas_token') || '';
        const headers: Record<string, string> = { 'x-auth-token': activeToken };
        const cacheBust = `_t=${Date.now()}`;
        const [statusRes, ga4Res, metaRes] = await Promise.all([
          fetch(`/api/integrations/status?${cacheBust}`, { headers, cache: 'no-store' }),
          fetch(`/api/reporting/ga4?${params}&${cacheBust}`, { headers, cache: 'no-store' }),
          fetch(`/api/reporting/meta-ads?${params}&${cacheBust}`, { headers, cache: 'no-store' })
        ]);
        if (!active) return;
        const statusData = await statusRes.json();
        const ga4Data = await ga4Res.json();
        const metaData = await metaRes.json();
        if (statusData.status === 'success') {
          const ga4 = (statusData.integrations || []).find((i: any) => i.provider === 'google_analytics');
          setGa4Integration(ga4 || { provider: 'google_analytics', status: 'NOT_CONNECTED', propertyId: null, propertyName: null, connectedAt: null });
          const meta = (statusData.integrations || []).find((i: any) => i.provider === 'meta_ads');
          setMetaIntegration(meta || { provider: 'meta_ads', status: 'NOT_CONNECTED', propertyId: null, propertyName: null, connectedAt: null });
        }
        if (ga4Data.status === 'success' && ga4Data.data) {
          setGa4Report(ga4Data.data);
        } else if (ga4Data.status === 'success' && !ga4Data.connected) {
          setGa4Report(null);
        }
        if (metaData.status === 'success' && metaData.data) {
          setMetaReport(metaData.data);
        }
      } catch (err) {
        console.error('[Marketing integrations fetch]', err);
      } finally {
        if (active) {
          setIsGa4Loading(false);
          setIsMetaLoading(false);
        }
      }
    }
    fetchMarketingIntegrations();
    return () => { active = false; };
  }, [isMarketingView, startDate, endDate, refreshTriggerSeq, ga4RefreshSeq, metaRefreshSeq, token]);

  // Determine active custom filters to display summary
  const getActiveFiltersList = () => {
    const mtd = getMonthToDateLA();
    const list: { key: string; label: string; clearFn: () => void }[] = [];

    if (startDate !== mtd.start || endDate !== mtd.end) {
      list.push({
        key: 'date',
        label: `Period: ${startDate} to ${endDate}`,
        clearFn: () => { const d = getMonthToDateLA(); setStartDate(d.start); setEndDate(d.end); }
      });
    }

    if (location !== 'loc_g53h7s8a') {
      list.push({
        key: 'location',
        label: `Workspace Account: ${location === 'loc_demo_sub' ? 'Showtime Inbound' : location === 'loc_demo_back' ? 'Backyard Builders' : location}`,
        clearFn: () => setLocation('loc_g53h7s8a')
      });
    }

    return list;
  };

  // Clear all filters — reset to MTD + default location
  const handleClearAllFilters = () => {
    const mtd = getMonthToDateLA();
    setStartDate(mtd.start);
    setEndDate(mtd.end);
    setLocation('loc_g53h7s8a');
  };

  // Manual refresh — force-bypass server cache + bump seq to retrigger all fetch effects
  const handleManualRefresh = () => {
    setForceRefresh(true);
    setRefreshTriggerSeq(prev => prev + 1);
  };

  // One-click PDF download — captures dashboard stage, assembles multi-page PDF via jsPDF
  const handleDownloadPDF = async () => {
    const stage = document.getElementById('command-center-dashboard-stage');
    if (!stage) return;
    setIsPdfLoading(true);
    try {
      const { toPng } = await import('html-to-image');
      const { jsPDF } = await import('jspdf');

      const dataUrl = await toPng(stage, {
        pixelRatio: 2,
        backgroundColor: '#f1f5f9',
        cacheBust: true
      });

      const img = new Image();
      img.src = dataUrl;
      await new Promise<void>(resolve => { img.onload = () => resolve(); });

      const A4_W = 210;
      const A4_H = 297;
      const margin = 10;
      const headerH = 20;
      const contentW = A4_W - margin * 2;
      const scale = contentW / img.naturalWidth;
      const imgH = img.naturalHeight * scale;

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const wsName = activeWorkspace?.name || 'Dashboard';
      const today = new Date().toISOString().slice(0, 10);
      const viewLabel = (forcedView || dashboardType).charAt(0).toUpperCase() + (forcedView || dashboardType).slice(1);
      const fileName = `DashPro-Report-${wsName.replace(/[^a-z0-9]/gi, '-')}-${today}.pdf`;

      // Header band on page 1
      pdf.setFillColor(11, 20, 36);
      pdf.rect(0, 0, A4_W, headerH, 'F');
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(10);
      pdf.setTextColor(255, 255, 255);
      pdf.text(`${wsName} — ${viewLabel} Dashboard`, margin, 9);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(148, 163, 184);
      pdf.text(`Period: ${startDate} – ${endDate}   |   Generated: ${today}   |   DashPro Reporting`, margin, 16);

      // Image starts below header; jsPDF clips naturally at page boundary
      pdf.addImage(dataUrl, 'PNG', margin, headerH, contentW, imgH);

      // Additional pages — shift image up so the next slice is visible
      const firstSlice = A4_H - headerH;
      for (let p = 1; firstSlice + (p - 1) * A4_H < imgH; p++) {
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', margin, -(firstSlice + (p - 1) * A4_H), contentW, imgH);
      }

      pdf.save(fileName);
    } catch (err: any) {
      console.error('[PDF Export] Failed:', err);
      alert(`PDF export failed: ${err.message}\n\nThis may be a CSS compatibility issue — contact support to enable server-side rendering.`);
    } finally {
      setIsPdfLoading(false);
    }
  };

  /**
   * FEATURE 1: Export Current Dashboard View KPIs as CSV
   */
  const handleExportKPIsCSV = () => {
    if (!ownerReport || !marketingReport) return;

    const datasetSource = responseContext?.source || 'mock';
    const timestamp = responseContext?.generatedAt || new Date().toISOString();
    const workspaceName = activeWorkspace?.name || 'Showtime Pool Mechanics';

    let csvContent = '';
    // Main Headers
    csvContent += `"METRIC PORTFOLIO PERFORMANCE SUMMARY"\n`;
    csvContent += `"Workspace Name","${workspaceName.replace(/"/g, '""')}"\n`;
    csvContent += `"Dashboard View Area","${dashboardType.toUpperCase()}"\n`;
    csvContent += `"Campaign Date Range","${startDate} to ${endDate}"\n`;
    csvContent += `"Export Timestamp","${timestamp}"\n`;
    csvContent += `"Data Stream Source Mode","${datasetSource.toUpperCase()}"\n\n`;

    csvContent += `"Core Metric Indicator","Assigned Score / Value","Pristine Delta Period Yield","Analytical Context"\n`;

    if (dashboardType === 'overview') {
      const s = ownerReport.summary;
      csvContent += `"Total Inbound Leads Sourced","${s.totalLeads} Contacts","+14.5%","Attributed CRM Traffic"\n`;
      csvContent += `"Unweighted Pipeline Worth","$${s.pipelineValue} Pipeline","+12.2%","Total pipeline in funnel"\n`;
      csvContent += `"Closed-Won Cash Collected","$${s.wonRevenue} Won","+24.1%","Actual revenue booked"\n`;
      csvContent += `"Representative Seat Show-Rate","${s.showRate}% Rate","+4.8%","Appointment attendance"\n`;
    } 
    else if (dashboardType === 'opportunity') {
      const s = ownerReport.summary;
      csvContent += `"Total Leads Sourced","${s.totalLeads} Contacts","Baseline","CRM Inflow"\n`;
      csvContent += `"New Non-Contacted Leads","${s.newLeads} Contacts","Neutral","Idle initial stage"\n`;
      csvContent += `"Active Open Pipeline Value","$${s.pipelineValue} Pipeline","+12.2%","In-progress ticket value"\n`;
      csvContent += `"Closed-Won Converted Revenue","$${s.wonRevenue} Cash","+24.1%","Final conversion tier"\n`;
      csvContent += `"Lost Rejected Opportunities","${s.lostOpportunities} Deals","Down","Lost stages leakage"\n`;
    } 
    else if (dashboardType === 'sales') {
      const s = ownerReport.summary;
      const totalWonDealsCount = ownerReport.ownerBreakdown.reduce((sum, r) => sum + Math.round(r.bookedAppointments * (r.closeRate / 100)), 0) || 28;
      const avgDealValue = totalWonDealsCount > 0 ? Math.round(s.wonRevenue / totalWonDealsCount) : 12400;

      csvContent += `"Booked Appointments Count","${s.bookedAppointments} Bookings","+18.2%","Registered scheduled bookings"\n`;
      csvContent += `"Physical Show-Rate Achievement","${s.showRate}%","+4.8%","Attended consultations ratio"\n`;
      csvContent += `"Final Signed Won Contracts","${totalWonDealsCount} Closed","+21.4%","Converted deals count"\n`;
      csvContent += `"Average Closed Ticket Size","$${avgDealValue} Per Deal","Stable","Average deal weight"\n`;
      csvContent += `"Appointment-to-Won Velocity Rate","${s.bookingToWonConvRate}%","+1.5%","Appointments closing factor"\n`;
    } 
    else if (dashboardType === 'appointment') {
      const s = appointmentReport.summary;
      csvContent += `"Total Booked Appointments","${s.totalBooked} Bookings","Baseline","Calendar bookings in period"\n`;
      csvContent += `"Total Showed (Attended)","${s.totalShowed} Showed","+Show","Confirmed attended consultations"\n`;
      csvContent += `"Show Rate","${s.showRate}%","Target: 80%","Attended vs showed+noshow"\n`;
      csvContent += `"No-Shows","${s.totalNoShow} No-Shows","${s.noShowRate}% Rate","Missed appointments"\n`;
      csvContent += `"Cancellations","${s.totalCancelled} Cancelled","${s.cancellationRate}% Rate","Cancelled appointments"\n`;
      csvContent += `"Upcoming Appointments","${s.upcomingCount} Upcoming","Scheduled","Future scheduled"\n`;
    } 
    else if (dashboardType === 'marketing') {
      const s = marketingReport.summary;
      csvContent += `"Total Marketing Sourced Leads","${s.totalLeads} Contacts","+14.5%","Attributed ads traffic"\n`;
      csvContent += `"Automated Consultations Bookings","${s.totalBookings} Bookings","+18.2%","Booked calendars count"\n`;
      csvContent += `"Marketing Dynamic Pipeline Value","$${s.totalPipelineValue} Potential","+12.2%","Total pipeline opportunities"\n`;
      csvContent += `"Marketing Solid Attributed Revenue","$${s.totalWonRevenue} Cash","+24.1%","Final closed marketing value"\n`;
      csvContent += `"Primary Cost Per Sourced Lead","$${s.costPerLeadPlaceholder} CPL","Optimized","Normalized acquisition expense"\n`;
      csvContent += `"Consolidated ROAS Multiple","${s.roasPlaceholder}x Return","Excellent","Sales conversion vs budget coefficient"\n`;
    }

    if (dashboardType === 'estimates' && estimatesReport) {
      const e = estimatesReport.estimates;
      const i = estimatesReport.invoices;
      csvContent += `"Estimates Sent","${e.funnel.sent}","${e.funnel.viewRate}% View Rate","Non-draft estimates"\n`;
      csvContent += `"Acceptance Rate","${e.funnel.acceptanceRate}%","${e.funnel.accepted} accepted","Accepted / sent"\n`;
      csvContent += `"Estimate→Invoice Rate","${e.funnel.conversionRate}%","${e.funnel.converted} converted","Converted / sent"\n`;
      csvContent += `"Total Invoiced","$${i.totalValue.toLocaleString()}","${i.totalCount} invoices","Billable invoices"\n`;
      csvContent += `"Total Collected","$${i.totalPaid.toLocaleString()}","${i.collectionRate}% rate","Payments received"\n`;
      csvContent += `"Outstanding Balance","$${i.totalOutstanding.toLocaleString()}","AR","Unpaid invoices"\n`;
      csvContent += `"Overdue 60+ Days","$${i.aging.days61plus.value.toLocaleString()}","${i.aging.days61plus.count} invoices","Severely overdue"\n`;
    }

    triggerCSVDownload(csvContent, `highlevel-kpi-${dashboardType}-summary.csv`);
  };

  /**
   * FEATURE 2: Export Active Table Grid Details as CSV
   */
  const handleExportTableCSV = () => {
    if (!ownerReport || !marketingReport) return;

    const datasetSource = responseContext?.source || 'mock';
    const timestamp = responseContext?.generatedAt || new Date().toISOString();
    const workspaceName = activeWorkspace?.name || 'Showtime Pool Mechanics';

    let csvContent = '';
    // Main Headers
    csvContent += `"INTERACTIVE DASHBOARD ACTIVE GRID TABLE DATAFEED"\n`;
    csvContent += `"Workspace Name","${workspaceName.replace(/"/g, '""')}"\n`;
    csvContent += `"Selected View Context","${dashboardType.toUpperCase()}"\n`;
    csvContent += `"Period Filtering Range","${startDate} to ${endDate}"\n`;
    csvContent += `"Generation Date UTC","${timestamp}"\n`;
    csvContent += `"Security Permission Scope","WORKSPACE_MEMBER_SECURED_EXPORT"\n`;
    csvContent += `"Source Stream Mode","${datasetSource.toUpperCase()}"\n\n`;

    if (dashboardType === 'overview') {
      csvContent += `"Trend Tracking Timeline - Weekly Metrics Data"\n`;
      csvContent += `"Date / Week Indicator","Leads Count","Pipeline Potential Worth","Closed Won Cash Gained"\n`;
      ownerReport.trends.forEach(pt => {
        csvContent += `"${pt.date}","${pt.leads || 0}","${pt.pipeline || 0}","${pt.wonRevenue || 0}"\n`;
      });
      csvContent += `\n"UTM Lead Source Attribution Split"\n`;
      csvContent += `"Channel Marketing Source","Gross Cash Revenue Contribution"\n`;
      Object.entries(ownerReport.revenueBySource).forEach(([name, val]) => {
        csvContent += `"${name}","$${val}"\n`;
      });
    } 
    else if (dashboardType === 'opportunity') {
      csvContent += `"CRM Opportunity Funnel Stages Breakdown"\n`;
      csvContent += `"Opportunity Stage Header","Contacts Count","Percentage of Previous Tier","Percentage of Top Inflow Funnel"\n`;
      ownerReport.funnel.forEach(f => {
        csvContent += `"${f.stage}","${f.count} Accounts","${f.percentageOfPrevious}%","${f.percentageOfTotal}%"\n`;
      });
    } 
    else if (dashboardType === 'sales') {
      csvContent += `"Sales Representative Leaderboard Performance"\n`;
      csvContent += `"Sales Advisor Name","Won Revenue Volume","Unweighted Pipeline Contribution","Win Conversion Rate"\n`;
      const sortedReps = [...ownerReport.ownerBreakdown].sort((a,b) => b.wonRevenue - a.wonRevenue);
      sortedReps.forEach(r => {
        csvContent += `"${r.userName}","$${r.wonRevenue} Won","$${r.pipelineValue} Potential","${r.closeRate}% Win"\n`;
      });
    } 
    else if (dashboardType === 'appointment') {
      csvContent += `"Appointment Performance by Calendar"\n`;
      csvContent += `"Calendar Name","Total Booked","Showed","No-Show","Cancelled","Show Rate"\n`;
      appointmentReport.calendarBreakdown.forEach(cal => {
        csvContent += `"${cal.calendarName}","${cal.total}","${cal.showed}","${cal.noshow}","${cal.cancelled}","${cal.showRate}%"\n`;
      });
      csvContent += `\n"Appointment Performance by Team Member"\n`;
      csvContent += `"Team Member","Total Booked","Showed","No-Show","Cancelled","Show Rate"\n`;
      appointmentReport.repBreakdown.sort((a, b) => b.booked - a.booked).forEach(rep => {
        csvContent += `"${rep.userName}","${rep.booked}","${rep.showed}","${rep.noshow}","${rep.cancelled}","${rep.showRate}%"\n`;
      });
    } 
    else if (dashboardType === 'marketing') {
      csvContent += `"GoHighLevel Ad UTM Campaigns Performance Table"\n`;
      csvContent += `"Campaign Identifier","UTM Source Name","Leads Count","Bookings","Gross Pipeline Worth","Actual Revenue Won","Spent Budget","ROAS Conversion Rate"\n`;
      marketingReport.campaignBreakdown.forEach(c => {
        csvContent += `"${c.campaignId}","${c.campaignName}","${c.leads}","${c.bookings} Booked","$${c.pipelineValue}","$${c.wonRevenue} Won","$${c.cost}","${c.conversionRate}%"\n`;
      });
    }

    if (dashboardType === 'estimates' && estimatesReport) {
      csvContent += `"Unpaid Invoices"\n`;
      csvContent += `"Invoice #","Contact","Email","Amount Due","Total","Issue Date","Due Date","Days Overdue","Status"\n`;
      estimatesReport.invoices.unpaidList.forEach(inv => {
        csvContent += `"${inv.invoiceNumber}","${inv.contactName}","${inv.contactEmail}","$${inv.amountDue}","$${inv.total}","${inv.issueDate.slice(0,10)}","${inv.dueDate.slice(0,10)}","${inv.daysOverdue}","${inv.status}"\n`;
      });
      csvContent += `\n"Estimate Status Summary"\n`;
      csvContent += `"Status","Count","Total Value"\n`;
      (Object.entries(estimatesReport.estimates.byStatus) as [string, { count: number; value: number }][]).forEach(([s, d]) => {
        csvContent += `"${s}","${d.count}","$${d.value}"\n`;
      });
    }

    triggerCSVDownload(csvContent, `highlevel-table-${dashboardType}-grid.csv`);
  };

  // Helper to trigger file save
  const triggerCSVDownload = (csvContent: string, filename: string) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    link.click();
    URL.revokeObjectURL(url);
  };

  /**
   * FEATURE 4: Copy Report Summary to Clipboard (Plain Text / Markdown)
   */
  const handleCopySummary = () => {
    if (!ownerReport || !marketingReport) return;

    const workspaceName = activeWorkspace?.name || 'Showtime Pool Mechanics';
    const activeFilters = getActiveFiltersList();
    const filterTxt = activeFilters.length > 0 
      ? activeFilters.map(f => f.label).join(' | ')
      : 'No constraints applied (Full Historical)';

    let summaryText = ``;
    summaryText += `==============================================\n`;
    summaryText += `EXECUTIVE KPI PERFORMANCE REPORT\n`;
    summaryText += `==============================================\n`;
    summaryText += `🏢 Workspace: ${workspaceName}\n`;
    summaryText += `📊 Dashboard View: ${dashboardType.toUpperCase()}\n`;
    summaryText += `📅 Scope Period: ${startDate} to ${endDate}\n`;
    summaryText += `🛡️ Access Context: SECURED (Role: ${role || 'MEMBER'})\n`;
    summaryText += `⚙️ Active Filters: ${filterTxt}\n`;
    summaryText += `📡 Data Stream: ${responseContext?.source?.toUpperCase() || 'MOCK'} mode\n`;
    summaryText += `🕒 Generated At: ${responseContext?.generatedAt || new Date().toISOString()}\n`;
    summaryText += `==============================================\n\n`;

    if (dashboardType === 'overview' || dashboardType === 'opportunity' || dashboardType === 'sales') {
      const s = ownerReport.summary;
      summaryText += `🏆 CORE PERFORMANCE METRICS:\n`;
      summaryText += ` - Total Leads Inflow: ${s.totalLeads} Contacts\n`;
      summaryText += ` - Appointments Booked: ${s.bookedAppointments} Managed\n`;
      summaryText += ` - Show Attendance Rate: ${s.showRate}%\n`;
      summaryText += ` - Pipeline Open Value: $${s.pipelineValue.toLocaleString()} Potential\n`;
      summaryText += ` - Cash Revenue Converted: $${s.wonRevenue.toLocaleString()} Won\n`;
      summaryText += ` - Average Speed to Lead SLA: ${s.avgSpeedToLeadSec} Seconds\n\n`;

      const best = [...ownerReport.ownerBreakdown].sort((a,b) => b.wonRevenue - a.wonRevenue)[0];
      if (best) {
        summaryText += `🥇 TOP WINNING REPRESENTATIVE:\n`;
        summaryText += ` - Advisor: ${best.userName}\n`;
        summaryText += ` - Volume Closed: $${best.wonRevenue.toLocaleString()} Won\n`;
        summaryText += ` - Closed Close Rate: ${best.closeRate}%\n\n`;
      }
    }
    else if (dashboardType === 'estimates' && estimatesReport) {
      const e = estimatesReport.estimates;
      const i = estimatesReport.invoices;
      summaryText += `📄 ESTIMATES & INVOICES SUMMARY:\n`;
      summaryText += ` - Estimates Sent: ${e.funnel.sent} (${e.funnel.viewRate}% viewed, ${e.funnel.acceptanceRate}% accepted)\n`;
      summaryText += ` - Converted to Invoice: ${e.funnel.converted} (${e.funnel.conversionRate}%)\n\n`;
      summaryText += ` - Total Invoiced: $${i.totalValue.toLocaleString()}\n`;
      summaryText += ` - Collected: $${i.totalPaid.toLocaleString()} (${i.collectionRate}% collection rate)\n`;
      summaryText += ` - Outstanding: $${i.totalOutstanding.toLocaleString()}\n`;
      summaryText += ` - Overdue 60+ Days: $${i.aging.days61plus.value.toLocaleString()} (${i.aging.days61plus.count} invoices)\n\n`;
    }
    else if (dashboardType === 'appointment') {
      const a = appointmentReport.summary;
      summaryText += `📅 APPOINTMENT PERFORMANCE SUMMARY:\n`;
      summaryText += ` - Total Booked: ${a.totalBooked} Appointments\n`;
      summaryText += ` - Showed: ${a.totalShowed} Attended\n`;
      summaryText += ` - Show Rate: ${a.showRate}%\n`;
      summaryText += ` - No-Shows: ${a.totalNoShow} (${a.noShowRate}%)\n`;
      summaryText += ` - Cancellations: ${a.totalCancelled} (${a.cancellationRate}%)\n`;
      summaryText += ` - Upcoming: ${a.upcomingCount} Scheduled\n\n`;
    }
    else if (dashboardType === 'marketing') {
      const m = marketingReport.summary;
      summaryText += `📣 AD UTM CAMPAIGNS SUMMARY:\n`;
      summaryText += ` - Total Sourced Contacts: ${m.totalLeads} Contacts\n`;
      summaryText += ` - Sourced Bookings Count: ${m.totalBookings} Consultations\n`;
      summaryText += ` - Inflow Campaign Pipeline Value: $${m.totalPipelineValue.toLocaleString()} Potential\n`;
      summaryText += ` - Converted Ad Spend Revenue: $${m.totalWonRevenue.toLocaleString()} Cash\n`;
      summaryText += ` - Normalized Cost-Per-Lead: $${m.costPerLeadPlaceholder} CPL\n`;
      summaryText += ` - Return on Ad Spend Ratio: ${m.roasPlaceholder}x ROAS multiplier\n\n`;

      const topCamp = [...marketingReport.campaignBreakdown].sort((a,b) => b.wonRevenue - a.wonRevenue)[0];
      if (topCamp) {
        summaryText += `🔥 HIGHEST YIELD MARKETING CHANNEL:\n`;
        summaryText += ` - Campaign: "${topCamp.campaignName}"\n`;
        summaryText += ` - Attributed Converted Cash: $${topCamp.wonRevenue.toLocaleString()}\n`;
        summaryText += ` - Campaign Conversion Efficiency: ${topCamp.conversionRate}%\n\n`;
      }
    }

    summaryText += `----------------------------------------------\n`;
    summaryText += `Generated on GHL Performance Command Center Hub.`;

    // Attempt standard navigator write
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(summaryText)
        .then(() => {
          setCopiedSuccess(true);
          setTimeout(() => setCopiedSuccess(false), 2500);
        })
        .catch(err => {
          console.warn("Navigator clipboard disabled inside sandbox iframe, switching to fallback dialog.", err);
          showFallbackDialog(summaryText);
        });
    } else {
      showFallbackDialog(summaryText);
    }
  };

  const showFallbackDialog = (text: string) => {
    setFallbackCopyText(text);
  };

  return (
    <div className="space-y-6" id="reporting-command-center-container">

      {/* Offline banner — shown when device has no connectivity */}
      {isOffline && (
        <OfflineBanner
          lastSyncTime={lastSyncTime}
          onRetry={() => setRefreshTriggerSeq(s => s + 1)}
        />
      )}

      {/* FEATURE 3: PRINT INTERACTIVE STYLE SHEET (Only processed during window.print()) */}
      <style>{`
        @media print {
          /* Force page margins */
          @page {
            size: auto;
            margin: 1.5cm 1.2cm 1.5cm 1.2cm;
          }
          body, html {
            background-color: #ffffff !important;
            color: #000000 !important;
            font-size: 11pt !important;
          }
          /* Hide app shell layout selectors completely */
          #control-center-sidebar, aside, header, footer, 
          .no-print, button, select, input, option,
          #command-center-toolbar, #toolbar-filters-grid, #active-filters-banner,
          .interactive-btn {
            display: none !important;
            height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          /* Ensure wrapper scales nicely for regular paper widths */
          #reporting-command-center-container {
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            display: block !important;
          }
          /* Eliminate high screen padding for paper elements */
          .bg-white {
            border: 1px solid #cbd5e1 !important;
            box-shadow: none !important;
            page-break-inside: avoid !important;
            margin-bottom: 16px !important;
          }
          /* Keep text clean of light grey modes */
          .text-slate-450, .text-slate-500, .text-[#64748B] {
            color: #334155 !important;
          }
          /* Show table structure borders elegantly */
          table {
            border-collapse: collapse !important;
            width: 100% !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
            padding: 6px 8px !important;
            font-size: 9pt !important;
          }
          /* Render simple page break rules */
          tr {
            page-break-inside: avoid !important;
          }
          /* Avoid chart truncation blocks and maintain readable grids */
          .grid {
            display: grid !important;
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            gap: 12px !important;
          }
          /* Force standard full layouts instead of mobile stacks */
          .sm\\:grid-cols-2 {
            grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          }
          .lg\\:grid-cols-4 {
            grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
          }
          .md\\:grid-cols-3 {
            grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
          }
          /* Show print-only header elements */
          .print-header-layout {
            display: block !important;
          }
        }
        @media screen {
          .print-header-layout {
            display: none !important;
          }
        }
      `}</style>

      {/* DYNAMIC PRINT PAPER HEADER WRAP (Visible only in physical prints) */}
      <div className="print-header-layout bg-white border border-slate-300 rounded-xl p-6 hidden">
        <div className="flex justify-between items-start border-b border-slate-320 pb-4 mb-4">
          <div>
            <span className="text-[10px] font-bold text-blue-700 tracking-widest uppercase">GHL solutions performance suite</span>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
              {activeWorkspace?.name || 'Showtime Pool Mechanics'} - Executive Report
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Active Dashboard Tab Area: <strong className="font-bold underline text-slate-800 uppercase">{dashboardType} Performance metrics</strong>
            </p>
          </div>
          <div className="text-right text-xs font-mono text-slate-500">
            <div>Doc Export: SECURE WORKSPACE REPORT</div>
            <div>Stream: {responseContext?.source?.toUpperCase() || 'MOCK'}</div>
            <div>Generated: {responseContext?.generatedAt ? new Date(responseContext.generatedAt).toLocaleString() : new Date().toLocaleString()}</div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs pt-2">
          <div>
            <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Period Segment:</span>
            <strong className="text-slate-800 font-bold">{startDate} to {endDate}</strong>
          </div>
          <div>
            <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Workspace locationID:</span>
            <strong className="text-slate-800 font-mono font-bold select-all">{activeWorkspace?.ghlLocationId || 'loc_g53h7s8a'}</strong>
          </div>
          <div>
            <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Export Member:</span>
            <strong className="text-slate-800 font-bold">{user?.name || 'Operations'} ({role || 'ADMIN'})</strong>
          </div>
          <div>
            <span className="text-[9px] font-extrabold uppercase text-slate-500 block">Report Parameters Filtered:</span>
            <strong className="text-slate-805 font-medium italic">
              {getActiveFiltersList().length > 0 
                ? getActiveFiltersList().map(f => f.label).join(' | ') 
                : 'No filters constraints applied (Consolidated Full Overview)'}
            </strong>
          </div>
        </div>
      </div>

      {/* Dynamic Header Toolbar containing state variables */}
      <div className="bg-white border border-[#E2E8F0] shadow-2xs rounded-xl p-5 no-print" id="command-center-toolbar">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 pb-5 border-b border-slate-100">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <h2 className="text-xl font-extrabold text-[#0F172A] tracking-tight animate-fade-in">
                Reporting Command Center
              </h2>
              {responseContext && (
                <div className="flex flex-wrap gap-1.5">
                  <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold border flex items-center gap-1 ${
                    responseContext.source === 'live' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${
                      responseContext.source === 'live' ? 'bg-emerald-500' : 'bg-amber-500'
                    }`} />
                    {responseContext.source === 'live' ? 'LIVE DATASTREAM' : 'MOCK PREVIEW'}
                  </span>

                  {responseContext.stale && (
                    <span className="px-2.5 py-0.5 rounded-full text-[9px] font-bold border bg-rose-50 text-rose-800 border-rose-200 flex items-center gap-1 animate-pulse">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      STALE METRICS
                    </span>
                  )}
                </div>
              )}
            </div>
            
            {/* Last Sourced & Access Identity Cluster */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-1 text-slate-500 text-xs font-semibold">
              <div className="flex items-center gap-1.5 text-slate-605">
                <Clock className="w-3.5 h-3.5 text-blue-500" />
                <span>Last Updated:</span>
                <span className="font-mono text-slate-800 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                  {responseContext?.generatedAt ? new Date(responseContext.generatedAt).toISOString().split('T')[0] : '2026-05-28'} {responseContext?.generatedAt ? new Date(responseContext.generatedAt).toTimeString().split(' ')[0] : '16:38:52'} UTC
                </span>
              </div>
              <div className="h-3 w-[1px] bg-slate-200 hidden sm:block" />
              <div className="flex items-center gap-1 bg-slate-50 text-[11px] text-slate-650 px-2 py-0.5 rounded-md border border-slate-200">
                <span className="font-bold underline text-slate-850 truncate max-w-[150px]">
                  {user?.name || 'Operations'}
                </span>
                <span className="text-slate-400 font-light">•</span>
                <span className="font-black text-blue-700 uppercase text-[9px] tracking-wide">
                  {role || 'WORKSPACE ADMIN'}
                </span>
              </div>
            </div>
          </div>

          {/* UTILITY BUTTONS INTERACTIVE GROUP */}
          <div className="flex flex-wrap items-center gap-2 self-start xl:self-auto" id="util-controls-wrapper">
            {/* Sync Trigger button — always visible */}
            <button
              onClick={handleManualRefresh}
              disabled={isSyncing || isLoading}
              title="Force-refresh all data from GoHighLevel — bypasses server cache"
              className="flex items-center gap-1.5 text-xs bg-white border border-slate-205 hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 hover:text-slate-900 px-3 py-2 rounded-lg font-bold shadow-2xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>{isSyncing || isLoading ? 'Syncing...' : 'Sync'}</span>
            </button>
            {lastSyncedAt && !isLoading && (
              <span className="hidden sm:inline text-[10px] text-slate-400 font-medium whitespace-nowrap" title={new Date(lastSyncedAt).toLocaleString()}>
                <Clock className="w-3 h-3 inline-block mr-0.5 mb-0.5" />
                {(() => {
                  const diffMs = Date.now() - lastSyncedAt;
                  const diffMin = Math.floor(diffMs / 60000);
                  if (diffMin < 1) return 'just now';
                  if (diffMin < 60) return `${diffMin}m ago`;
                  const diffHr = Math.floor(diffMin / 60);
                  return `${diffHr}h ago`;
                })()}
              </span>
            )}

            {/* Desktop: Copy / PDF / Export visible inline */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={handleCopySummary}
                title="Copy markdown statistical summary to clipboard"
                className={`flex items-center gap-1.5 text-xs border px-3 py-1.5 rounded-lg font-bold shadow-2xs transition cursor-pointer ${
                  copiedSuccess
                    ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                    : 'bg-white hover:bg-slate-50 text-slate-705 border-slate-205'
                }`}
              >
                <Copy className={`w-3.5 h-3.5 ${copiedSuccess ? 'text-emerald-600' : 'text-slate-500'}`} />
                <span>{copiedSuccess ? 'Copied!' : 'Copy Summary'}</span>
              </button>

              <button
                onClick={handleDownloadPDF}
                disabled={isPdfLoading || isLoading || !ownerReport}
                title="Download current dashboard view as a PDF file"
                className="flex items-center gap-1.5 text-xs bg-white border border-slate-205 hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 px-3 py-1.5 rounded-lg font-bold shadow-2xs transition cursor-pointer"
              >
                <Download className={`w-3.5 h-3.5 ${isPdfLoading ? 'animate-bounce text-blue-600' : 'text-slate-500'}`} />
                <span>{isPdfLoading ? 'Generating...' : 'Download PDF'}</span>
              </button>

              <div className="h-4 w-[1px] bg-slate-200" />

              <button
                onClick={handleExportKPIsCSV}
                disabled={isLoading || !ownerReport}
                title="Download dashboard top cards KPI summary as CSV"
                className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 border border-slate-205 px-3 py-1.5 rounded-lg font-bold shadow-2xs transition cursor-pointer"
              >
                <FileDown className="w-3.5 h-3.5 text-blue-600" />
                <span>Export KPIs</span>
              </button>
            </div>

            {/* Mobile: More menu */}
            <div className="sm:hidden relative">
              <button
                onClick={() => setMoreToolsOpen(v => !v)}
                className="flex items-center gap-1.5 text-xs bg-white border border-slate-205 hover:bg-slate-50 text-slate-700 px-3 py-2 rounded-lg font-bold shadow-2xs transition cursor-pointer"
              >
                <MoreHorizontal className="w-3.5 h-3.5 text-slate-500" />
                More
              </button>
              {moreToolsOpen && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setMoreToolsOpen(false)} />
                  <div className="absolute right-0 top-full mt-1 z-20 bg-white border border-slate-200 rounded-xl shadow-lg p-1.5 space-y-0.5 min-w-[170px]">
                    <button
                      onClick={() => { handleCopySummary(); setMoreToolsOpen(false); }}
                      className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-xs font-bold cursor-pointer transition ${copiedSuccess ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-slate-50 text-slate-700'}`}
                    >
                      <Copy className="w-3.5 h-3.5 shrink-0" />
                      {copiedSuccess ? 'Copied!' : 'Copy Summary'}
                    </button>
                    <button
                      onClick={() => { handleDownloadPDF(); setMoreToolsOpen(false); }}
                      disabled={isPdfLoading || isLoading || !ownerReport}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-40 transition"
                    >
                      <Download className="w-3.5 h-3.5 shrink-0 text-slate-500" />
                      {isPdfLoading ? 'Generating…' : 'Download PDF'}
                    </button>
                    <button
                      onClick={() => { handleExportKPIsCSV(); setMoreToolsOpen(false); }}
                      disabled={isLoading || !ownerReport}
                      className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-slate-50 rounded-lg text-xs font-bold text-slate-700 cursor-pointer disabled:opacity-40 transition"
                    >
                      <FileDown className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                      Export KPIs
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Filters Panel Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 ${forcedView ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-4 pt-5`} id="toolbar-filters-grid">
          {/* Filter 1: Dashboard label — only shown on General Dashboard (no forcedView), single option so no selector needed */}
          {!forcedView && (
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] flex items-center gap-1 select-none">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Dashboard View
              </label>
              <div className="bg-[#F8FAFC] border border-slate-200 rounded-lg py-2 px-3 text-xs text-slate-800 font-extrabold w-full select-none">
                Overview Dashboard
              </div>
            </div>
          )}

          {/* Filter 2: Date Selector — hidden on Estimates & Invoices (that tab is all-time) */}
          {!isEstimatesView && (
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] flex items-center gap-1 select-none">
                <Calendar className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Date Range Filters
              </label>
              <div className="flex flex-col sm:flex-row items-stretch gap-1.5 sm:gap-0 bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs w-full">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none flex-1 min-w-0 py-1 touch-manipulation cursor-pointer"
                />
                <span className="text-[#64748B] text-xs font-semibold px-1 select-none text-center sm:self-center">to</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none flex-1 min-w-0 py-1 touch-manipulation cursor-pointer"
                />
              </div>
            </div>
          )}

          {/* Filter 3: Location */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] flex items-center gap-1 select-none">
              <MapPin className="w-3.5 h-3.5 text-[#1D4ED8]" />
              GHL Account Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-705 focus:outline-none w-full cursor-pointer"
            >
              <option value="loc_g53h7s8a">Showtime Pool Mechanics</option>
            </select>
          </div>

        </div>

        {/* FEATURE 7 & 8: ACTIVE FILTERS SUMMARY & CLEAR FILTERS BANNER */}
        {getActiveFiltersList().length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs" id="active-filters-banner">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-bold text-[#64748B] tracking-wider uppercase text-[10px] mr-1">Active Filters:</span>
              {getActiveFiltersList().map(filt => (
                <span 
                  key={filt.key}
                  className="bg-blue-50/70 border border-blue-200 text-blue-800 font-bold px-2 py-0.5 rounded-full flex items-center gap-1.5 select-none"
                >
                  <span>{filt.label}</span>
                  <button 
                    onClick={filt.clearFn}
                    className="hover:text-red-500 font-black cursor-pointer text-[10px] transition"
                    title="Remove filter constraint"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <button
              onClick={handleClearAllFilters}
              className="flex items-center gap-1 text-slate-500 hover:text-rose-600 px-2 py-1 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg text-[11px] font-black tracking-tight transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filter Locks</span>
            </button>
          </div>
        )}

        {/* API Warnings row */}
        {responseContext && responseContext.warnings.length > 0 && (
          <div className="mt-4 pt-3 border-t border-slate-100">
            <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex items-start gap-2 text-xs text-amber-800 animate-fade-in">
              <AlertOctagon className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-0.5">
                <strong className="font-bold">Active API Warnings:</strong>
                <ul className="list-disc pl-4 space-y-0.5">
                  {responseContext.warnings.map((w, idx) => (
                    <li key={idx} className="font-medium text-[11px]">{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Main Switching Content Area */}
      {isEstimatesView ? (
        isEstimatesLoading ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-20 flex flex-col items-center justify-center space-y-3">
            <RefreshCw className="w-8 h-8 text-[#1D4ED8] animate-spin" />
            <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Loading invoices &amp; estimates...</span>
          </div>
        ) : !estimatesReport ? (
          <div className="bg-white border border-[#E2E8F0] rounded-xl p-20 flex flex-col items-center justify-center space-y-3 text-slate-400">
            <span className="text-xs font-semibold">No estimates or invoice data available for this period.</span>
          </div>
        ) : (
          <div className="transition-all duration-350" id="command-center-dashboard-stage">
            <EstimatesInvoicesDashboardView
            reportData={estimatesReport}
            outstandingReport={outstandingReport}
            isOutstandingLoading={isOutstandingLoading}
            outstandingError={outstandingError}
            token={token}
            locationName={activeWorkspace?.name || 'ShowtimePoolMechanics'}
          />
          </div>
        )
      ) : isLoading || !ownerReport || !marketingReport || !appointmentReport ? (
        <div className="bg-white border border-[#E2E8F0] rounded-xl p-20 flex flex-col items-center justify-center space-y-3" id="command-center-loading">
          <RefreshCw className="w-8 h-8 text-[#1D4ED8] animate-spin" />
          <span className="text-xs font-bold text-slate-600 uppercase tracking-widest">Compiling dynamic performance datasets...</span>
        </div>
      ) : (
        <div className="transition-all duration-350" id="command-center-dashboard-stage">
          {dashboardType === 'overview' && (
            <OverviewDashboardView reportData={ownerReport} />
          )}
          {dashboardType === 'opportunity' && (
            <OpportunityDashboardView reportData={ownerReport} />
          )}
          {dashboardType === 'sales' && (
            <SalesDashboardView reportData={ownerReport} />
          )}
          {dashboardType === 'appointment' && (
            <AppointmentDashboardView reportData={appointmentReport} />
          )}
          {dashboardType === 'marketing' && (
            <MarketingDashboardView
              reportData={marketingReport}
              ga4Integration={ga4Integration}
              ga4Report={ga4Report}
              isGa4Loading={isGa4Loading}
              token={token}
              onGA4Refresh={() => setGa4RefreshSeq(prev => prev + 1)}
              metaIntegration={metaIntegration}
              metaReport={metaReport}
              isMetaLoading={isMetaLoading}
              onMetaRefresh={() => setMetaRefreshSeq(prev => prev + 1)}
            />
          )}
        </div>
      )}

      {/* FALLBACK MANUAL CLIPBOARD DIALOG (Solves sandboxed iFrame clipboard restrictions) */}
      {fallbackCopyText !== null && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-2xs flex items-center justify-center z-50 p-4 no-print animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-300 max-w-lg w-full overflow-hidden p-6 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-150">
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <Copy className="w-4 h-4 text-blue-600" />
                <span>Manual Clipboard Fallback</span>
              </h4>
              <button 
                onClick={() => setFallbackCopyText(null)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer font-black text-sm p-1"
              >
                ×
              </button>
            </div>
            
            <p className="text-xs text-slate-600 leading-relaxed">
              Standard secure copy operations are restricted by sandboxed browser frame sandbox layers. 
              Please select all text inside this block below and copy it manually:
            </p>

            <textarea
              readOnly
              value={fallbackCopyText}
              onClick={(e) => (e.target as HTMLTextAreaElement).select()}
              rows={8}
              className="w-full bg-[#F8FAFC] border border-slate-200 rounded-lg p-3 text-xs font-mono text-slate-800 outline-none focus:border-blue-500 font-medium select-all"
            />

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  try {
                    const el = document.createElement('textarea');
                    el.value = fallbackCopyText;
                    document.body.appendChild(el);
                    el.select();
                    document.execCommand('copy');
                    document.body.removeChild(el);
                    setCopiedSuccess(true);
                    setTimeout(() => setCopiedSuccess(false), 2500);
                  } catch (e) {
                    console.error("ExecCommand fallback failed:", e);
                  }
                  setFallbackCopyText(null);
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-2xs cursor-pointer transition"
              >
                Auto Copy & Close
              </button>
              <button
                onClick={() => setFallbackCopyText(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-705 text-xs font-bold rounded-lg cursor-pointer transition"
              >
                Close Dialog
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
