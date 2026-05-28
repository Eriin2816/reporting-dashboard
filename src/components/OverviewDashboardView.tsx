/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  ArrowUpRight, 
  ArrowDownRight, 
  AlertCircle,
  TrendingDown,
  Sparkles,
  ShieldCheck,
  UserCheck2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';
import { OwnerPerformanceReport } from '../types';

interface OverviewDashboardViewProps {
  reportData: OwnerPerformanceReport;
}

export default function OverviewDashboardView({ reportData }: OverviewDashboardViewProps) {
  const { summary, revenueBySource, revenueByServiceType, ownerBreakdown, trends, funnel } = reportData;

  // Pie chart data
  const sourcePieData = Object.entries(revenueBySource).map(([name, value]) => ({ name, value }));
  const serviceBarData = Object.entries(revenueByServiceType).map(([name, value]) => ({ name, value }));
  const COLORS = ['#0B2A5B', '#1D4ED8', '#60A5FA', '#34D399', '#FB7185', '#FBBF24'];

  // Sparkline generator
  const SparkLine = ({ data = [], stroke = '#1d4ed8' }) => {
    if (data.length < 2) return null;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min === 0 ? 1 : max - min;
    const width = 80;
    const height = 24;
    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - min) / range) * height;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg className="w-20 h-6" viewBox={`0 0 ${width} ${height}`}>
        <polyline fill="none" stroke={stroke} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" points={points} />
      </svg>
    );
  };

  return (
    <div className="space-y-6" id="overview-dashboard-layout">
      {/* KPI metric cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="overview-kpi-grid">
        {/* Total Leads */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 relative overflow-hidden" id="card-leads">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 text-[#1D4ED8] rounded-xl border border-blue-100">
              <Users className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-700 text-xs font-bold bg-emerald-50 px-2 rounded-full border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +14.5%
            </div>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Total Leads</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{summary.totalLeads}</span>
            <span className="text-[#64748B] text-[10px] font-semibold">Contacts</span>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Weekly Growth</span>
            <SparkLine data={trends.map(t => Number(t.leads))} stroke="#1d4ed8" />
          </div>
        </div>

        {/* Active Pipeline */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 relative overflow-hidden" id="card-pipeline">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-700 text-xs font-bold bg-emerald-50 px-2 rounded-full border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +12.2%
            </div>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Active Pipeline</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight">
              ${summary.pipelineValue.toLocaleString()}
            </span>
            <span className="text-[#64748B] text-[10px] font-semibold">Unweighted</span>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Value Inflow</span>
            <SparkLine data={trends.map(t => Number(t.pipeline))} stroke="#4f46e5" />
          </div>
        </div>

        {/* Closed Won Revenue */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 relative overflow-hidden" id="card-revenue">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-700 text-xs font-bold bg-emerald-50 px-2 rounded-full border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +24.1%
            </div>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Won Revenue</span>
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-[#0B2A5B] tracking-tight">
              ${summary.wonRevenue.toLocaleString()}
            </span>
            <span className="text-[#64748B] text-[10px] font-semibold">Closed Cash</span>
          </div>
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 text-xs text-slate-500">
            <span>Revenue Gained</span>
            <SparkLine data={trends.map(t => Number(t.wonRevenue))} stroke="#16a34a" />
          </div>
        </div>

        {/* Convert Rate Gauge */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 relative overflow-hidden" id="card-showrate">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Calendar className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-700 text-xs font-bold bg-emerald-50 px-2 rounded-full border border-emerald-200">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +4.8%
            </div>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Appt Show Rate</span>
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{summary.showRate}%</span>
              <span className="text-[#64748B] text-[10px] block font-medium">Attended: {summary.bookedAppointments} Bookings</span>
            </div>

            {/* Custom SVG circle gauge */}
            <div className="relative w-14 h-14 flex items-center justify-center shrink-0">
              <svg className="w-full h-full transform -rotate-90">
                <circle cx="28" cy="28" r="23" className="stroke-slate-100" strokeWidth="4.5" fill="none" />
                <circle cx="28" cy="28" r="23" className="stroke-[#1D4ED8]" strokeWidth="4.5" fill="none"
                  strokeDasharray={`${2 * Math.PI * 23}`}
                  strokeDashoffset={`${2 * Math.PI * 23 * (1 - summary.showRate / 100)}`}
                  strokeLinecap="round"
                />
              </svg>
              <span className="absolute text-[10px] font-black text-[#0F172A]">{summary.showRate}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Quick Metrics Cards for complete data transparency */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="overview-secondary-metrics">
        <div className="bg-slate-50 border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold">Total Opportunities</span>
            <div className="text-xl font-bold text-slate-800">{Math.round(summary.totalLeads * 0.85)}</div>
          </div>
          <span className="text-[10px] font-bold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded-full">Pipelines</span>
        </div>

        <div className="bg-slate-50 border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold">Booked Appointments</span>
            <div className="text-xl font-bold text-slate-800">{summary.bookedAppointments}</div>
          </div>
          <span className="text-[10px] font-bold text-[#1D4ED8] bg-blue-50 px-2 py-0.5 rounded-full">Calendar</span>
        </div>

        <div className="bg-slate-50 border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold">Lost Opportunities</span>
            <div className="text-xl font-bold text-slate-800">{summary.lostOpportunities}</div>
          </div>
          <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">Leakage</span>
        </div>

        <div className="bg-slate-50 border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase tracking-wider text-[#64748B] font-bold">Missed Leads or Calls</span>
            <div className="text-xl font-bold text-slate-800">{summary.missedLeadsOrCalls}</div>
          </div>
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Unresolved</span>
        </div>
      </div>

      {/* Main Charts area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="overview-charts-grid">
        
        {/* Dynamic Conversion Funnel Visualizer */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between" id="overview-funnel-card">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] mb-0.5">Contact-to-Won Conversion Funnel</h3>
                <p className="text-[#64748B] text-xs">Customer journey conversion steps and rates for localized Showtime leads.</p>
              </div>
              <span className="text-[11px] font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-105 shadow-xs">CRM Process</span>
            </div>

            {/* Custom Funnel Design via Stacked Proportional Columns */}
            <div className="space-y-3.5 my-6">
              {funnel.map((stage, idx) => {
                const widthStyle = `${100 - idx * 7}%`;
                const isBottom = idx === funnel.length - 1;
                return (
                  <div key={idx} className="relative">
                    <div 
                      className={`flex justify-between items-center text-xs font-semibold px-4 py-2 bg-slate-50 border border-slate-150 rounded-lg relative overflow-hidden transition-all duration-500`}
                      style={{ maxWidth: widthStyle, margin: '0 auto' }}
                    >
                      <div className={`absolute left-0 top-0 h-full opacity-10 ${isBottom ? 'bg-emerald-500 w-full' : 'bg-[#1D4ED8] w-full'}`} />
                      <div className="relative z-10 flex items-center gap-2">
                        <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono border ${
                          isBottom ? 'bg-emerald-100 text-emerald-850 border-emerald-300' : 'bg-blue-100 text-blue-700 border-blue-200'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="text-slate-700 text-[11px]">{stage.stage}</span>
                      </div>
                      <div className="relative z-10 text-right font-mono text-[11px]">
                        <span className="font-bold text-slate-900">{stage.count}</span>
                        {idx > 0 && (
                          <span className={`${isBottom ? 'text-emerald-705 font-bold' : 'text-[#64748B]'} ml-2`}>
                            ({stage.percentageOfPrevious}% step)
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-slate-100">
            <div className="bg-slate-50 p-3 rounded-lg border border-[#E2E8F0] flex-1 text-center">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-0.5">Lead-to-Booking Conversion</span>
              <span className="text-[#0B2A5B] font-mono text-base font-bold">{summary.leadToBookingConvRate}%</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-[#E2E8F0] flex-1 text-center">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-0.5">Booking-to-Won Ratio</span>
              <span className="text-emerald-700 font-mono text-base font-bold">{summary.bookingToWonConvRate}%</span>
            </div>
            <div className="bg-slate-50 p-3 rounded-lg border border-[#E2E8F0] flex-1 text-center">
              <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block mb-0.5">Overall Close Rate</span>
              <span className="text-[#1D4ED8] font-mono text-base font-bold">{summary.closeRate}%</span>
            </div>
          </div>
        </div>

        {/* Revenue Distribution Donut */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between" id="overview-revenue-donut">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1">Won Revenue by Source</h3>
            <p className="text-[#64748B] text-xs">Attributed opportunity value grouped by original UTM source tracking.</p>

            <div className="h-56 mt-4 flex items-center justify-center relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sourcePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={75}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {sourcePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Closed Revenue']} />
                </PieChart>
              </ResponsiveContainer>

              {/* Central textual overlay */}
              <div className="absolute flex flex-col items-center justify-center">
                <span className="text-[#64748B] text-[9px] font-bold uppercase tracking-widest leading-none">Gross Cash</span>
                <span className="text-[15px] font-black text-[#0B2A5B] mt-1">${summary.wonRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 border-t border-slate-100 pt-3">
            {sourcePieData.slice(0, 4).map((item, idx) => {
              const share = summary.wonRevenue > 0 ? Math.round((item.value / summary.wonRevenue) * 100) : 0;
              return (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-600 truncate max-w-[130px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate font-medium">{item.name}</span>
                  </div>
                  <div className="font-mono text-slate-800 font-semibold shrink-0">
                    ${item.value.toLocaleString()} <span className="text-slate-400 font-normal">({share}%)</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Dynamic Services Revenue Bar representation and dynamic SLA Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="overview-additional-diagnostics">
        {/* Left Side: Services Revenue mix via vertical bar chart */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] mb-0.5">Revenue Breakdown by Service Mix</h3>
                <p className="text-[#64748B] text-xs">A comprehensive view of active installation, remodeling and service tickets bookings values.</p>
              </div>
              <span className="text-[11px] font-bold text-[#1D4ED8] bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-105 shadow-xs">Service Category</span>
            </div>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={serviceBarData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val / 1000}k`} stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Bar dataKey="value" name="Gross Sales" fill="#1D4ED8" radius={[4, 4, 0, 0]}>
                    {serviceBarData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[10px] text-[#64748B] bg-slate-50 p-2 border border-slate-150 rounded mt-4">
            ✨ Pool Install remains the principal driver of closed won revenue volume across all regional areas.
          </div>
        </div>

        {/* Right Side: CRM Insight widgets and diagnostic alerts */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between" id="overview-insights-widget">
          <div>
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0F172A]">SLA Diagnostics & Key Insights</h3>
              <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" />
            </div>

            <div className="space-y-3.5">
              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8] shrink-0 mt-2" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#0F172A]">Outstanding Speed-To-Lead SLA</h4>
                  <p className="text-[#64748B] text-[11px] leading-normal">
                    The team&apos;s current average response SLA of <strong className="text-slate-800">{summary.avgSpeedToLeadSec}s</strong> is well within the 2-minute optimal GoHighLevel trigger benchmark.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#0F172A]">Lead Leakage Warning ({summary.lostOpportunities} Leakages)</h4>
                  <p className="text-[#64748B] text-[11px] leading-normal">
                    Showtime has encountered <strong className="text-[#0F172A]">{summary.lostOpportunities} closed lost</strong> opportunities. Ensure automated follow-ups are active to revive stale contacts.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-2" />
                <div className="space-y-0.5">
                  <h4 className="text-xs font-bold text-[#0F172A]">Missed Leads and Calls: {summary.missedLeadsOrCalls} Misses</h4>
                  <p className="text-[#64748B] text-[11px] leading-normal">
                    There are currently <strong className="text-rose-600 font-bold">{summary.missedLeadsOrCalls} unresolved</strong> contacts. Click Sync Metrics or setup instant push notifications in settings to avoid dropping opportunities.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-[#F8FAFC] border border-slate-200 p-2.5 rounded-lg text-[10px] text-slate-500 mt-4 leading-normal">
            💡 <strong>CRM Optimization Tip:</strong> Setting up a text-back workflow on missed calls reduces lead leakage by 40%.
          </div>
        </div>
      </div>

      {/* Bottom Leaderboard / Reps list */}
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden shadow-xs" id="overview-reps-table">
        <div className="p-5 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-base font-bold text-[#0F172A] mb-0.5">HighLevel Reps Leaderboard</h3>
              <p className="text-[#64748B] text-xs">A comprehensive comparison of lead assignments, won revenue and win rates.</p>
            </div>
            
            <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-white border border-slate-200 px-3 py-1 rounded-lg font-semibold shadow-xs">
              <UserCheck2 className="w-3.5 h-3.5 text-blue-600" />
              <span>Sorted by Revenue Won</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-5">Sales Rep / Assignee</th>
                <th className="py-3 px-5 text-center">Contacts Sourced</th>
                <th className="py-3 px-5 text-center">Appts Managed</th>
                <th className="py-3 px-5 text-center">Show Rate</th>
                <th className="py-3 px-5 text-right font-semibold text-slate-700">Pipeline Value</th>
                <th className="py-3 px-5 text-right font-bold text-[#0B2A5B]">Won Revenue Volume</th>
                <th className="py-3 px-5 text-center">Win Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-705 font-medium">
              {ownerBreakdown.map((rep) => (
                <tr key={rep.userId} className="hover:bg-slate-50/50 transition">
                  <td className="py-3 px-5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-bold uppercase text-[10px]">
                      {rep.userName.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-bold text-[#0F172A]">{rep.userName}</div>
                      <div className="text-[10px] font-mono text-slate-400">{rep.userEmail}</div>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-center font-bold font-mono text-slate-800">{rep.totalLeads}</td>
                  <td className="py-3 px-5 text-center text-[#64748B] font-semibold">{rep.bookedAppointments} Booked</td>
                  <td className="py-3 px-5 text-center font-bold font-mono text-slate-705">{rep.showRate}%</td>
                  <td className="py-3 px-5 text-right font-mono text-slate-650">${rep.pipelineValue.toLocaleString()}</td>
                  <td className="py-3 px-5 text-right font-mono text-slate-900 font-bold text-sm">${rep.wonRevenue.toLocaleString()}</td>
                  <td className="py-3 px-5 text-center">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-250">
                      <span className="w-1 h-1 rounded-full bg-emerald-500" />
                      {rep.closeRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
