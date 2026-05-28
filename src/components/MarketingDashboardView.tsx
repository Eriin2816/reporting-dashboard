/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Share2, 
  TrendingUp, 
  DollarSign, 
  Percent, 
  ArrowUpRight, 
  Sparkles,
  Search,
  AlertCircle,
  HelpCircle,
  Megaphone,
  Network
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { MarketingPerformanceReport } from '../types';

interface MarketingDashboardViewProps {
  reportData: MarketingPerformanceReport;
}

export default function MarketingDashboardView({ reportData }: MarketingDashboardViewProps) {
  const { summary, leadsBySource, leadsByCampaign, bookingsBySource, wonRevenueBySource, campaignBreakdown, trends } = reportData;

  const [activeChannel, setActiveChannel] = useState<string>(Object.keys(leadsBySource)[0] || '');
  const [searchTerm, setSearchTerm] = useState('');

  // Sourced bar data formats
  const sourceBarData = Object.entries(leadsBySource).map(([label, leads]) => {
    const revenue = wonRevenueBySource[label] || 0;
    const bookings = bookingsBySource[label] || 0;
    return {
      name: label,
      leads,
      bookings,
      revenue
    };
  });

  // Filtered campaigns
  const filteredCampaigns = campaignBreakdown.filter(c => 
    c.campaignName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6" id="marketing-dashboard-view">
      {/* Prime KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="marketing-kpi-grid">
        {/* Total Source Leads */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <Share2 className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 rounded-full border border-emerald-250 flex items-center gap-0.5">
              +14.8% <ArrowUpRight className="w-3" />
            </span>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Marketing Leads</span>
          <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{summary.totalLeads} Contacts</div>
          <span className="text-[10px] text-[#64748B] block mt-1">Sourced via GHL integrations</span>
        </div>

        {/* Global Pipeline Sourced */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <TrendingUp className="w-5 h-5" />
            </div>
            <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 rounded-full border border-emerald-250 flex items-center gap-0.5">
              +18.1% <ArrowUpRight className="w-3" />
            </span>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Sourced Pipeline</span>
          <div className="text-3xl font-extrabold text-[#0B2A5B] tracking-tight">${summary.totalPipelineValue.toLocaleString()}</div>
          <span className="text-[10px] text-[#64748B] block mt-1 font-semibold text-emerald-750">Lead generation estimated value</span>
        </div>

        {/* Cost Per Lead (CPL) connected check */}
        <div className="bg-white border border-dashed border-slate-200 shadow-sm rounded-xl p-5 relative overflow-hidden bg-slate-50/50">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl border border-slate-205">
              <DollarSign className="w-5 h-5" />
            </div>
            <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              Ad Spend Info
            </span>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Cost Per Lead (CPL)</span>
          <div className="text-xl font-bold text-slate-400 tracking-tight mt-1.5">No Ad spend Data</div>
          
          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-semibold text-amber-705 bg-amber-50 border border-amber-200 p-1.5 rounded-lg">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Available when ad spend is connected.</span>
          </div>
        </div>

        {/* ROAS connected check */}
        <div className="bg-white border border-dashed border-slate-200 shadow-sm rounded-xl p-5 relative overflow-hidden bg-slate-50/50">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-slate-100 text-slate-400 rounded-xl border border-slate-205">
              <Percent className="w-5 h-5" />
            </div>
            <span className="text-[9px] uppercase font-bold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
              Return Info
            </span>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Attributed ROAS</span>
          <div className="text-xl font-bold text-slate-400 tracking-tight mt-1.5">No Ad spend Data</div>
          
          <div className="flex items-center gap-1.5 mt-2 text-[9px] font-semibold text-amber-705 bg-amber-50 border border-amber-200 p-1.5 rounded-lg">
            <AlertCircle className="w-3 h-3 shrink-0" />
            <span>Available when ad spend is connected.</span>
          </div>
        </div>
      </div>

      {/* Warning message explaining TikTok sync status */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 mt-4 animate-fade-in" id="marketing-tiktok-sync-warning">
        <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <h4 className="text-xs font-extrabold text-amber-900 uppercase tracking-widest mb-1">TikTok Ad Integration Disclaimer</h4>
          <p className="text-amber-800 text-xs leading-normal font-semibold">
            Warning: TikTok advertising accounts are currently not fully synced with our main GoHighLevel attribution channels database.
            CPL (Cost Per Lead) and ROAS (Return on Ad Spend) are shown as estimated historical averages. Please connect your official TikTok Business Manager under Integration Settings to unlock real-time financial synchronization.
          </p>
        </div>
      </div>

      {/* Side-by-side leads representation & weekly trend */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="marketing-graphs-grid">
        
        {/* Lead Sources comparative volume bar chart */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start pb-2 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] mb-0.5">Leads vs Bookings by Lead Source</h3>
                <p className="text-[#64748B] text-xs">A comprehensive view of top acquisition contact list in comparison with booked appointments.</p>
              </div>
              <Network className="w-5 h-5 text-blue-600" />
            </div>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={sourceBarData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={9} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="leads" name="Contacts Sourced" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="bookings" name="Appointments Booked" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[10px] text-[#64748B] bg-slate-50 p-2.5 border border-[#E2E8F0] mt-4 leading-normal">
            ✨ Organic Search and Local Service Ads demonstrate the highest booked appointments ratio relative to paid social channels.
          </div>
        </div>

        {/* Lead conversion metrics card drilldown */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#0F172A] pb-2 border-b border-slate-100">Conversion Velocity</h3>
            <p className="text-xs text-[#64748B]">Blended performance rates averaged across all UTM campaigns.</p>

            <div className="space-y-4 pt-1">
              {/* Lead to Appt */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#64748B]">
                  <span>Lead-to-Appointment Rate</span>
                  <span className="text-[#0B2A5B] font-mono">{summary.avgLeadToAppointmentRate}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-600 rounded-full" style={{ width: `${summary.avgLeadToAppointmentRate}%` }} />
                </div>
              </div>

              {/* Appt to Won */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-1.5">
                <div className="flex justify-between text-xs font-bold text-[#64748B]">
                  <span>Appointment-to-Won Ratio</span>
                  <span className="text-[#0B2A5B] font-mono">{summary.avgAppointmentToWonRate}%</span>
                </div>
                <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${summary.avgAppointmentToWonRate}%` }} />
                </div>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-slate-450 leading-relaxed bg-slate-100 p-2.5 rounded border border-slate-205 mt-4">
            💡 Blended return includes SEO indexation, Local map views, and paid networks integrated directly into Showtime Pool Accounts.
          </p>
        </div>
      </div>

      {/* Campaign breakdown table */}
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden shadow-xs" id="marketing-campaigns-table">
        <div className="p-5 border-b border-slate-100 bg-[#F8FAFC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-[#0F172A] text-sm">Campaign Performance Telemetry</h3>
            <p className="text-[#64748B] text-xs">Granular analysis on total leads, bookings and attributed conversion rate.</p>
          </div>

          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search campaign name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white border border-slate-200 focus:border-blue-500 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-none w-48 shadow-xs transition"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-extrabold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-5">Campaign UTM Tag</th>
                <th className="py-3 px-5 text-center">Leads Count</th>
                <th className="py-3 px-5 text-center">Bookings Count</th>
                <th className="py-3 px-5 text-right">Potential Pipeline</th>
                <th className="py-3 px-5 text-right font-bold text-[#0B2A5B]">Won Revenue Converted</th>
                <th className="py-3 px-5 text-center">Conversion Ratio</th>
                <th className="py-3 px-5 text-center">Ad Spend Cost</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-705 font-medium">
              {filteredCampaigns.length > 0 ? (
                filteredCampaigns.map((camp) => (
                  <tr key={camp.campaignId} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-5">
                      <span className="text-[#0F172A] font-bold block">{camp.campaignName}</span>
                      <span className="text-[10px] text-slate-400 font-mono mt-0.5">{camp.campaignId}</span>
                    </td>
                    <td className="py-3 px-5 text-center font-mono font-bold text-slate-800">{camp.leads}</td>
                    <td className="py-3 px-5 text-center text-slate-505 font-semibold">{camp.bookings} bookings</td>
                    <td className="py-3 px-5 text-right font-mono text-slate-650">${camp.pipelineValue.toLocaleString()}</td>
                    <td className="py-3 px-5 text-right font-mono text-[#0F172A] font-bold text-sm">
                      ${camp.wonRevenue.toLocaleString()}
                    </td>
                    <td className="py-3 px-5 text-center">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-blue-50 text-[#1D4ED8] border border-blue-220 font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" />
                        {camp.conversionRate}%
                      </span>
                    </td>
                    <td className="py-3 px-5 text-center text-slate-500 italic text-[11px]">
                      {camp.cost ? `Estimate: $${camp.cost.toLocaleString()}` : 'SEO / Organic'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-500 bg-white">
                    No campaigns discovered matching input filter constraints.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
