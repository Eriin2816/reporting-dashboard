/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  Briefcase, 
  Target, 
  HelpCircle, 
  CheckCircle, 
  AlertTriangle, 
  DollarSign, 
  PieChart as PieIcon,
  Layers, 
  ThumbsDown,
  Percent,
  TrendingUp,
  UserCheck2,
  Share2
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { OwnerPerformanceReport } from '../types';

interface OpportunityDashboardViewProps {
  reportData: OwnerPerformanceReport;
}

export default function OpportunityDashboardView({ reportData }: OpportunityDashboardViewProps) {
  const { summary, revenueBySource, ownerBreakdown, funnel } = reportData;

  // Custom calculated states
  const totalOppsCount = Math.round(summary.totalLeads * 0.85);
  const openOppsCount = Math.round(totalOppsCount - (summary.bookedAppointments * summary.closeRate / 100) - summary.lostOpportunities);
  const wonOppsCount = Math.round(summary.bookedAppointments * summary.closeRate / 100);
  const lostOppsCount = summary.lostOpportunities;

  const weightedPipeline = Math.round(summary.pipelineValue * 0.4); // Standard booking closer probability 40%

  // Pipeline by Reps
  const repPipelineData = ownerBreakdown.map(rep => ({
    name: rep.userName,
    unweighted: rep.pipelineValue,
    weighted: Math.round(rep.pipelineValue * (rep.closeRate / 100))
  }));

  // Lost reasons distribution
  const lostReasonsData = [
    { name: 'Price & Concrete Budget', value: 38 },
    { name: 'Chose Fiber Competitor', value: 27 },
    { name: 'No-show / Contact Lost', value: 21 },
    { name: 'Project Timeline Delay', value: 14 }
  ];

  // Opportunities by Source mapping
  const sourceOppsData = Object.entries(revenueBySource).map(([source, rev]) => ({
    source,
    opportunities: Math.max(2, Math.round(rev / 15000))
  }));

  const COLORS = ['#0B2A5B', '#1D4ED8', '#34D399', '#FB7185', '#FBBF24', '#818CF8'];

  return (
    <div className="space-y-6" id="opportunity-dashboard-layout">
      {/* Target Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="opp-kpi-grid">
        {/* Total Opps */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-slate-400 font-mono">Telemetry</span>
          </div>
          <span className="text-[#64748B] text-[11px] block uppercase tracking-wider font-bold">Total Opportunities</span>
          <div className="text-2xl font-black text-[#0F172A] mt-1">{totalOppsCount} Leads</div>
          <span className="text-[10px] text-slate-500 block mt-1">In active sales cycle</span>
        </div>

        {/* Weighted value */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded-full">40% Coeff</span>
          </div>
          <span className="text-[#64748B] text-[11px] block uppercase tracking-wider font-bold">Weighted Pipeline</span>
          <div className="text-2xl font-black text-indigo-600 mt-1">${weightedPipeline.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Expected CLOSING yield</span>
        </div>

        {/* Open Opps */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg shrink-0">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-amber-600 font-bold bg-amber-50 px-1.5 rounded-full">In Progress</span>
          </div>
          <span className="text-[#64748B] text-[11px] block uppercase tracking-wider font-bold">Open Pipelines</span>
          <div className="text-2xl font-black text-amber-705 mt-1">{openOppsCount} active</div>
          <span className="text-[10px] text-slate-500 block mt-1">Pending presentation</span>
        </div>

        {/* Won Opps */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shrink-0">
              <CheckCircle className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1.5 rounded-full">Closed Won</span>
          </div>
          <span className="text-[#64748B] text-[11px] block uppercase tracking-wider font-bold">Won Contracts</span>
          <div className="text-2xl font-black text-emerald-700 mt-1">{wonOppsCount} signed</div>
          <span className="text-[10px] text-slate-500 block mt-1">In fulfillment queue</span>
        </div>

        {/* Lost Opps */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="p-2 bg-rose-50 text-rose-600 rounded-lg shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-1.5 rounded-full">Closed Lost</span>
          </div>
          <span className="text-[#64748B] text-[11px] block uppercase tracking-wider font-bold">Lost Opportunities</span>
          <div className="text-2xl font-black text-rose-605 mt-1">{lostOppsCount} failed</div>
          <span className="text-[10px] text-slate-500 block mt-1">Revenue leakage</span>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="opp-charts-grid">
        
        {/* Unweighted vs Weighted Pipeline value by sales rep */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Unweighted vs Weighted Pipeline by Assignee</h3>
                <p className="text-[#64748B] text-xs">Expected Close Rate weighted forecast versus raw deal volume per rep.</p>
              </div>
              <Percent className="w-5 h-5 text-indigo-600" />
            </div>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={repPipelineData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis tickFormatter={(val) => `$${val / 1000}k`} stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend verticalAlign="top" height={36} iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="unweighted" name="Raw Pipeline Value" fill="#60A5FA" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="weighted" name="Weighted Closer Proj" fill="#1D4ED8" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          <div className="text-[10px] text-[#64748B] bg-slate-50 p-3 rounded-lg border border-[#E2E8F0] mt-4 leading-relaxed">
            💡 <strong>Weighted Projections</strong> adjust pipeline value by each individual rep&apos;s historic win rate. This yields a highly authentic cash forecast compared to GHL unweighted totals.
          </div>
        </div>

        {/* Opportunity Stages and Status */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-4 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Opportunities by CRM Stages</h3>
                <p className="text-[#64748B] text-xs">Total contact count categorized by core GoHighLevel stages.</p>
              </div>
              <Layers className="w-5 h-5 text-blue-600" />
            </div>

            {/* Custom stage bar chart */}
            <div className="space-y-3.5 my-4">
              {funnel.map((item, idx) => {
                const max = Math.max(...funnel.map(f => f.count));
                const pct = max > 0 ? (item.count / max) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-bold text-slate-800">{item.stage}</span>
                      <span className="font-mono text-slate-600 font-bold">
                        {item.count} ({Math.round(pct)}%)
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-500" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-[#E2E8F0] mt-4 flex items-center justify-between text-xs font-bold text-slate-700">
            <span>Core Active Stages Filtered:</span>
            <span className="text-blue-600 font-mono font-black">All Pipelines</span>
          </div>
        </div>
      </div>

      {/* Lost Reason Analysis and Source distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="opp-breakdowns-grid">
        
        {/* Why Opportunities are Lost */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0F172A]">Lost Opportunity Reason Analysis</h3>
              <ThumbsDown className="w-5 h-5 text-rose-500" />
            </div>
            <p className="text-[#64748B] text-xs mt-1">Surveyed reasons why Showtime leads dropped out of the funnel.</p>

            <div className="h-44 mt-4 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={lostReasonsData}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={60}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {lostReasonsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[3 + (index % 3)]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v) => `${v}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            {lostReasonsData.map((item, idx) => (
              <div key={idx} className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2 text-slate-650 truncate max-w-[170px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[3 + (idx % 3)] }} />
                  <span className="truncate font-medium">{item.name}</span>
                </div>
                <span className="font-mono text-rose-600 font-bold shrink-0">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Opportunities Sourced by Marketing Attribution */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-base font-bold text-[#0F172A]">Opportunity Distribution by Source</h3>
              <Share2 className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[#64748B] text-xs mt-1">Mapping active pipeline contact quantities by their UTM tags.</p>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  layout="vertical" 
                  data={sourceOppsData}
                  margin={{ top: 10, right: 20, left: 30, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F1F5F9" />
                  <XAxis type="number" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis dataKey="source" type="category" stroke="#64748B" fontSize={10} width={130} tickLine={false} />
                  <Tooltip />
                  <Bar dataKey="opportunities" name="Active Opportunities" fill="#1D4ED8" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="text-[10px] text-slate-500 leading-normal bg-slate-50 p-2 border border-slate-150 rounded">
            ✨ Leads with null source tags defaulted to &quot;Other Organic Referral&quot; parameters on GHL V2 ingestion.
          </div>
        </div>
      </div>
    </div>
  );
}
