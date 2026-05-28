/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  MapPin, 
  UserCircle2, 
  Share2, 
  Megaphone, 
  Download, 
  RefreshCw, 
  FileSpreadsheet,
  AlertOctagon,
  Printer,
  Copy,
  RotateCcw,
  Clock,
  ShieldAlert,
  SlidersHorizontal,
  CheckCircle2,
  XCircle,
  FileDown
} from 'lucide-react';

// Custom views
import OverviewDashboardView from './OverviewDashboardView';
import OpportunityDashboardView from './OpportunityDashboardView';
import SalesDashboardView from './SalesDashboardView';
import OwnerDashboardView from './OwnerDashboardView';
import MarketingDashboardView from './MarketingDashboardView';

import { OwnerPerformanceReport, MarketingPerformanceReport, ApiResponse } from '../types';

interface ReportingCommandCenterProps {
  dataSourceMode: 'MOCK' | 'LIVE';
  onSyncMetrics: () => void;
  isSyncing: boolean;
  forcedView?: 'overview' | 'opportunity' | 'sales' | 'owner' | 'marketing';
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
  const [dashboardType, setDashboardType] = useState<'overview' | 'opportunity' | 'sales' | 'owner' | 'marketing'>(forcedView || 'overview');
  
  // Sync forcedView prop to state if provided
  useEffect(() => {
    if (forcedView) {
      setDashboardType(forcedView);
    }
  }, [forcedView]);

  // 2. Filter states & pristine baseline
  const [startDate, setStartDate] = useState<string>('2026-05-01');
  const [endDate, setEndDate] = useState<string>('2026-05-27');
  const [location, setLocation] = useState<string>('loc_g53h7s8a');
  const [selectedRep, setSelectedRep] = useState<string>('');
  const [selectedSource, setSelectedSource] = useState<string>('');
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');

  // Local re-fetch sequencer trigger
  const [refreshTriggerSeq, setRefreshTriggerSeq] = useState<number>(0);

  // Clipboard copy and modal fallback states
  const [copiedSuccess, setCopiedSuccess] = useState<boolean>(false);
  const [fallbackCopyText, setFallbackCopyText] = useState<string | null>(null);

  // 3. API payload states
  const [ownerReport, setOwnerReport] = useState<OwnerPerformanceReport | null>(null);
  const [marketingReport, setMarketingReport] = useState<MarketingPerformanceReport | null>(null);
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
        // Build query string
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);
        if (selectedRep) params.append('userId', selectedRep);
        if (selectedSource) params.append('source', selectedSource);
        if (selectedCampaign) params.append('campaign', selectedCampaign);

        const queryStr = params.toString();

        const headers: Record<string, string> = {};
        const activeToken = token || localStorage.getItem('saas_token') || '';
        if (activeToken) {
          headers['x-auth-token'] = activeToken;
        }

        // Query the endpoints in parallel with full auth metadata
        const [ownerRes, markRes] = await Promise.all([
          fetch(`/api/reporting/owner-performance?${queryStr}`, { headers }),
          fetch(`/api/reporting/marketing-performance?${queryStr}`, { headers })
        ]);

        if (!active) return;

        const ownerData: ApiResponse<OwnerPerformanceReport> = await ownerRes.json();
        const markData: ApiResponse<MarketingPerformanceReport> = await markRes.json();

        if (ownerData.status === 'success' && markData.status === 'success') {
          setOwnerReport(ownerData.data);
          setMarketingReport(markData.data);
          setResponseContext({
            source: ownerData.source,
            generatedAt: ownerData.generatedAt,
            stale: ownerData.stale,
            warnings: [...(ownerData.warnings || []), ...(markData.warnings || [])],
            unavailableMetrics: [...(ownerData.unavailableMetrics || []), ...(markData.unavailableMetrics || [])]
          });
        }
      } catch (err) {
        console.error("Failed to compile reporting components:", err);
      } finally {
        if (active) setIsLoading(false);
      }
    }

    fetchPayloads();

    return () => {
      active = false;
    };
  }, [startDate, endDate, selectedRep, selectedSource, selectedCampaign, location, isSyncing, refreshTriggerSeq, token]);

  // Human Readable User Rep Mapping
  const getUserLabel = (id: string) => {
    const reps: Record<string, string> = {
      'usr_001': 'Marcus Sterling (Owner)',
      'usr_002': 'Sarah Jenkins (Closer)',
      'usr_003': 'Devon Carter (Rep)',
      'usr_004': 'Isabella Cruz (Closer)'
    };
    return reps[id] || id;
  };

  // Determine active custom filters to display summary
  const getActiveFiltersList = () => {
    const list: { key: string; label: string; clearFn: () => void }[] = [];
    
    if (startDate !== '2026-05-01' || endDate !== '2026-05-27') {
      list.push({
        key: 'date',
        label: `Period: ${startDate} to ${endDate}`,
        clearFn: () => {
          setStartDate('2026-05-01');
          setEndDate('2026-05-27');
        }
      });
    }

    if (location !== 'loc_g53h7s8a') {
      list.push({
        key: 'location',
        label: `Workspace Account: ${location === 'loc_demo_sub' ? 'Showtime Inbound' : location === 'loc_demo_back' ? 'Backyard Builders' : location}`,
        clearFn: () => setLocation('loc_g53h7s8a')
      });
    }

    if (selectedRep) {
      list.push({
        key: 'rep',
        label: `Rep: ${getUserLabel(selectedRep)}`,
        clearFn: () => setSelectedRep('')
      });
    }

    if (selectedSource) {
      list.push({
        key: 'source',
        label: `Source: ${selectedSource}`,
        clearFn: () => setSelectedSource('')
      });
    }

    if (selectedCampaign) {
      list.push({
        key: 'campaign',
        label: `UTM Campaign: ${selectedCampaign}`,
        clearFn: () => setSelectedCampaign('')
      });
    }

    return list;
  };

  // Clear all filters handler
  const handleClearAllFilters = () => {
    setStartDate('2026-05-01');
    setEndDate('2026-05-27');
    setLocation('loc_g53h7s8a');
    setSelectedRep('');
    setSelectedSource('');
    setSelectedCampaign('');
  };

  // Manual fast layout reload
  const handleManualRefresh = () => {
    setRefreshTriggerSeq(prev => prev + 1);
    onSyncMetrics();
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
    else if (dashboardType === 'owner') {
      const s = ownerReport.summary;
      const bestPerformer = [...ownerReport.ownerBreakdown].sort((a, b) => b.wonRevenue - a.wonRevenue)[0];
      const lowestResponse = [...ownerReport.ownerBreakdown].sort((a, b) => a.avgSpeedToLeadSec - b.avgSpeedToLeadSec)[0];

      csvContent += `"Fastest Speed-to-Lead SLA","${lowestResponse?.userName || 'N/A'} (${lowestResponse?.avgSpeedToLeadSec}s)","SLA Compliant","Fastest representative feedback"\n`;
      csvContent += `"Top Sales Volume Performer","${bestPerformer?.userName || 'N/A'} ($${bestPerformer?.wonRevenue.toLocaleString()})","Target Achieved","Max closed won dollar weight"\n`;
      csvContent += `"Overall Attributed Team Revenue","$${s.wonRevenue} Cash","+24.1%","Consolidated workspace sales"\n`;
      csvContent += `"Average Team Speed to Lead","${s.avgSpeedToLeadSec} Seconds","SLA Certified","Consolidated communication speed"\n`;
      csvContent += `"Missed Calls / Idle Contacts","${s.missedLeadsOrCalls} Misses","Risk Warning","Untouched pipeline risk"\n`;
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
    else if (dashboardType === 'owner') {
      csvContent += `"Team Members GHL SLA Conversions Dashboard"\n`;
      csvContent += `"Rank Placement","Representative","Leads Sourced","Consultations Booked","Speed-To-Lead SLA","Pipeline Value","Revenue Converted","Close Rate Yield"\n`;
      const sortedReps = [...ownerReport.ownerBreakdown].sort((a,b) => b.wonRevenue - a.wonRevenue);
      sortedReps.forEach((r, idx) => {
        csvContent += `"#${idx + 1}","${r.userName} (${r.userEmail})","${r.totalLeads}","${r.bookedAppointments} Booked","${r.avgSpeedToLeadSec}s Avg","$${r.pipelineValue}","$${r.wonRevenue} Won","${r.closeRate}%"\n`;
      });
    } 
    else if (dashboardType === 'marketing') {
      csvContent += `"GoHighLevel Ad UTM Campaigns Performance Table"\n`;
      csvContent += `"Campaign Identifier","UTM Source Name","Leads Count","Bookings","Gross Pipeline Worth","Actual Revenue Won","Spent Budget","ROAS Conversion Rate"\n`;
      marketingReport.campaignBreakdown.forEach(c => {
        csvContent += `"${c.campaignId}","${c.campaignName}","${c.leads}","${c.bookings} Booked","$${c.pipelineValue}","$${c.wonRevenue} Won","$${c.cost}","${c.conversionRate}%"\n`;
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

    if (dashboardType === 'overview' || dashboardType === 'opportunity' || dashboardType === 'sales' || dashboardType === 'owner') {
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

  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-6" id="reporting-command-center-container">
      
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
            {/* Sync Trigger button */}
            <button
              onClick={handleManualRefresh}
              disabled={isSyncing || isLoading}
              title="Sync metrics and refresh raw data from GoHighLevel V2 pipeline"
              className="flex items-center gap-1.5 text-xs bg-white border border-slate-205 hover:bg-slate-50 disabled:bg-slate-100 text-slate-700 hover:text-slate-900 px-3 py-1.5 rounded-lg font-bold shadow-2xs transition cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing || isLoading ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
              <span>Sync</span>
            </button>

            {/* Copy summary button */}
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
              <span>{copiedSuccess ? 'Copied View!' : 'Copy Summary'}</span>
            </button>

            {/* Print Friendly Trigger */}
            <button
              onClick={handlePrintReport}
              title="Format system cards and grids for printing or PDF save"
              className="flex items-center gap-1.5 text-xs bg-white border border-slate-205 hover:bg-slate-50 text-slate-705 px-3 py-1.5 rounded-lg font-bold shadow-2xs transition cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Print/PDF</span>
            </button>

            <div className="h-4 w-[1px] bg-slate-200" />

            {/* Export KPI summary */}
            <button
              onClick={handleExportKPIsCSV}
              disabled={isLoading || !ownerReport}
              title="Download dashboard top cards KPI summary as CSV"
              className="flex items-center gap-1.5 text-xs bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:text-slate-400 text-slate-700 border border-slate-205 px-3 py-1.5 rounded-lg font-bold shadow-2xs transition cursor-pointer"
            >
              <FileDown className="w-3.5 h-3.5 text-blue-600" />
              <span>Export KPIs</span>
            </button>

            {/* Export Current active table */}
            <button
              onClick={handleExportTableCSV}
              disabled={isLoading || !ownerReport}
              title="Download currently loaded dashboard grid tables as CSV"
              className="flex items-center gap-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white px-3.5 py-1.5 rounded-lg font-black shadow-sm transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Grid Table</span>
            </button>
          </div>
        </div>

        {/* Filters Panel Grid */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 ${forcedView ? 'xl:grid-cols-5' : 'xl:grid-cols-6'} gap-4 pt-5`} id="toolbar-filters-grid">
          {/* Filter 1: Dashboard Selector */}
          {!forcedView && (
            <div className="space-y-1.5 flex flex-col justify-end">
              <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] flex items-center gap-1 select-none">
                <FileSpreadsheet className="w-3.5 h-3.5 text-[#1D4ED8]" />
                Dashboard View
              </label>
              <select
                value={dashboardType}
                onChange={(e) => setDashboardType(e.target.value as any)}
                className="bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 rounded-lg py-2 px-3 text-xs text-slate-800 font-extrabold focus:outline-none w-full transition select-none cursor-pointer"
              >
                <option value="overview">Overview Dashboard</option>
                <option value="opportunity">Opportunity Dashboard</option>
                <option value="sales">Sales Dashboard</option>
                <option value="owner">Owner Dashboard</option>
                <option value="marketing">Marketing Dashboard</option>
              </select>
            </div>
          )}

          {/* Filter 2: Date Selector */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] flex items-center gap-1 select-none">
              <Calendar className="w-3.5 h-3.5 text-[#1D4ED8]" />
              Date Range Filters
            </label>
            <div className="flex items-center gap-1 bg-[#F8FAFC] border border-slate-200 rounded-lg px-2.5 py-1.5 shadow-2xs w-full">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none w-full cursor-pointer"
              />
              <span className="text-[#64748B] text-xs font-semibold px-1 select-none">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none w-full cursor-pointer"
              />
            </div>
          </div>

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
              <option value="loc_demo_sub">Showtime Inbound Dealers (Sub-account)</option>
              <option value="loc_demo_back">Backyard Builders (Remodel sub)</option>
            </select>
          </div>

          {/* Filter 4: User/Rep filter */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] flex items-center gap-1 select-none">
              <UserCircle2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
              User / Sales Rep
            </label>
            <select
              value={selectedRep}
              onChange={(e) => setSelectedRep(e.target.value)}
              className="bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-705 focus:outline-none w-full cursor-pointer"
            >
              <option value="">All Team Assignees</option>
              <option value="usr_001">Marcus Sterling (Owner)</option>
              <option value="usr_002">Sarah Jenkins (Closer)</option>
              <option value="usr_003">Devon Carter (Rep)</option>
              <option value="usr_004">Isabella Cruz (Closer)</option>
            </select>
          </div>

          {/* Filter 5: Source Filter */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] flex items-center gap-1 select-none">
              <Share2 className="w-3.5 h-3.5 text-[#1D4ED8]" />
              Lead Attribution Source
            </label>
            <select
              value={selectedSource}
              onChange={(e) => setSelectedSource(e.target.value)}
              className="bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-705 focus:outline-none w-full cursor-pointer"
            >
              <option value="">All Lead Sources</option>
              <option value="Google Local Service Ads">Google Local Service Ads</option>
              <option value="Facebook Ads">Facebook Ads</option>
              <option value="Google Search Organic">Google Search Organic</option>
              <option value="Referral">Referral Loyalty</option>
              <option value="Yelp Organic">Yelp Organic</option>
              <option value="Instagram Ads">Instagram Ads</option>
            </select>
          </div>

          {/* Filter 6: Campaign Filter */}
          <div className="space-y-1.5 flex flex-col justify-end">
            <label className="text-[10px] font-extrabold uppercase tracking-widest text-[#64748B] flex items-center gap-1 select-none">
              <Megaphone className="w-3.5 h-3.5 text-[#1D4ED8]" />
              UTM Campaign Filter
            </label>
            <select
              value={selectedCampaign}
              onChange={(e) => setSelectedCampaign(e.target.value)}
              className="bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 rounded-lg py-2 px-3 text-xs font-semibold text-slate-750 focus:outline-none w-full cursor-pointer"
            >
              <option value="">All Marketing Campaigns</option>
              <option value="Backyard Oasis Inbound Promo">Backyard Oasis Inbound Promo</option>
              <option value="Summer Hot Tub Blast 2026">Summer Hot Tub Blast 2026</option>
              <option value="Organic SEO Website Funnel">Organic SEO Website Funnel</option>
              <option value="Facebook Direct Retargeting Leads">Facebook Direct Retargeting Leads</option>
              <option value="Yelp Local High-Intent Referrals">Yelp Local High-Intent Referrals</option>
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

        {/* Dynamic Warning and Unavailable Metrics row */}
        {responseContext && (responseContext.warnings.length > 0 || responseContext.unavailableMetrics.length > 0) && (
          <div className="mt-4 pt-3 border-t border-slate-100 flex flex-col md:flex-row gap-3">
            {responseContext.warnings.length > 0 && (
              <div className="bg-amber-50 border border-amber-100 rounded-lg p-3 flex-1 flex items-start gap-2 text-xs text-amber-800 animate-fade-in">
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
            )}

            {responseContext.unavailableMetrics.length > 0 && (
              <div className="bg-slate-50 border border-slate-220 rounded-lg p-3 flex-1 flex items-start gap-2 text-xs text-slate-600 animate-fade-in">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-slate-400" />
                <div className="space-y-0.5">
                  <strong className="font-bold">Unavailable Telemetry Metrics:</strong>
                  <p className="text-[10px] text-slate-500 mb-1">These metrics are not synced or require OAuth/Ad Manager permissions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {responseContext.unavailableMetrics.map((m, idx) => (
                      <span key={idx} className="bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold text-slate-500 uppercase">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Switching Content Area */}
      {isLoading || !ownerReport || !marketingReport ? (
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
          {dashboardType === 'owner' && (
            <OwnerDashboardView reportData={ownerReport} />
          )}
          {dashboardType === 'marketing' && (
            <MarketingDashboardView reportData={marketingReport} />
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
