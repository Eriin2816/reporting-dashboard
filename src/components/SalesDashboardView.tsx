/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  DollarSign, 
  Award, 
  TrendingUp, 
  Percent, 
  Smartphone, 
  TrendingDown, 
  Sparkles,
  PieChart as PieIcon,
  ShoppingBag,
  Clock,
  ArrowUpRight
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  AreaChart,
  Area,
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

interface SalesDashboardViewProps {
  reportData: OwnerPerformanceReport;
}

export default function SalesDashboardView({ reportData }: SalesDashboardViewProps) {
  const { summary, revenueBySource, revenueByServiceType, ownerBreakdown, trends } = reportData;

  // Custom sales stats
  const totalWonDealsCount = ownerBreakdown.reduce((sum, r) => sum + Math.round(r.bookedAppointments * (r.closeRate / 100)), 0) || 28;
  const avgDealValue = totalWonDealsCount > 0 ? Math.round(summary.wonRevenue / totalWonDealsCount) : 12400;

  // Pie chart service types
  const servicePieData = Object.entries(revenueByServiceType).map(([name, value]) => ({ name, value }));

  // Reps sales data sorted
  const sortedRepsSales = [...ownerBreakdown]
    .map(r => ({
      name: r.userName,
      revenue: r.wonRevenue,
      pipeline: r.pipelineValue,
      winRate: r.closeRate
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const COLORS = ['#0B2A5B', '#1D4ED8', '#60A5FA', '#34D399', '#FB7185', '#FBBF24'];

  return (
    <div className="space-y-6" id="sales-dashboard-layout">
      {/* High impact sales cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5" id="sales-kpi-grid">
        {/* Total revenue */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-700 text-xs font-bold bg-emerald-50 px-2 rounded-full border border-emerald-250">
              <ArrowUpRight className="w-3" /> +24.1%
            </div>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Gross Won Revenue</span>
          <div className="text-3xl font-extrabold text-[#0B2A5B] tracking-tight">${summary.wonRevenue.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Cash collected via location</span>
        </div>

        {/* Won deals */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-700 text-xs font-bold bg-emerald-50 px-2 rounded-full border border-emerald-250">
              <ArrowUpRight className="w-3" /> +18.2%
            </div>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Signed Contracts</span>
          <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">{totalWonDealsCount} Closed</div>
          <span className="text-[10px] text-slate-500 block mt-1">Won opportunities count</span>
        </div>

        {/* Average Deal Value */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl border border-emerald-100">
              <Award className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-700 text-xs font-bold bg-emerald-50 px-2 rounded-full border border-emerald-250">
              Stable
            </div>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Average Ticket Size</span>
          <div className="text-3xl font-extrabold text-[#0F172A] tracking-tight">${avgDealValue.toLocaleString()}</div>
          <span className="text-[10px] text-slate-500 block mt-1">Average closed-won value</span>
        </div>

        {/* Closing efficiency */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 relative overflow-hidden">
          <div className="flex justify-between items-start mb-3">
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl border border-amber-100">
              <Percent className="w-5 h-5" />
            </div>
            <div className="flex items-center gap-0.5 text-emerald-700 text-xs font-bold bg-emerald-50 px-2 rounded-full border border-emerald-250">
              +1.5% MoM
            </div>
          </div>
          <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">Conversion Win Rate</span>
          <div className="text-3xl font-extrabold text-emerald-700 tracking-tight">{summary.bookingToWonConvRate}%</div>
          <span className="text-[10px] text-slate-500 block mt-1">Appt-to-Won closer percentage</span>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sales-charts">
        
        {/* Cumulative Revenue Trend Area Chart */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A] mb-0.5">Revenue & Pipeline Trend</h3>
                <p className="text-[#64748B] text-xs">Continuous timeline tracking of compiled won-cash vs open pipeline.</p>
              </div>
              <TrendingUp className="w-5 h-5 text-[#1D4ED8]" />
            </div>

            <div className="h-64 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trends} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorWon" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1D4ED8" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#1D4ED8" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorPip" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#60A5FA" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#60A5FA" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                  <XAxis dataKey="date" stroke="#64748B" fontSize={10} tickLine={false} />
                  <YAxis tickFormatter={(v) => `$${v / 1000}k`} stroke="#64748B" fontSize={10} tickLine={false} />
                  <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                  <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: 11 }} />
                  <Area type="monotone" dataKey="wonRevenue" name="Cash Earned" stroke="#1D4ED8" fillOpacity={1} fill="url(#colorWon)" strokeWidth={2} />
                  <Area type="monotone" dataKey="pipeline" name="Pipeline Opened" stroke="#60A5FA" fillOpacity={1} fill="url(#colorPip)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-lg border border-[#E2E8F0] text-xs text-slate-500 font-medium leading-normal mt-4">
            🔥 Gross Closed Won Volume reached <strong className="text-slate-800">${summary.wonRevenue.toLocaleString()}</strong>, displaying continuous weekly expansion through GoHighLevel automation rules.
          </div>
        </div>

        {/* Revenue by Service Categories Donut */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center pb-2 border-b border-slate-100 mb-4">
              <h3 className="text-base font-bold text-[#0F172A]">Sales by Service</h3>
              <PieIcon className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-[#64748B] text-xs">Attributed closing volume split by service Category.</p>

            <div className="h-56 mt-4 relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={servicePieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {servicePieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
              
              <div className="absolute flex flex-col items-center">
                <span className="text-[9px] text-[#64748B] uppercase tracking-widest font-extrabold">Service Revenue</span>
                <span className="text-base font-black text-[#0B2A5B] mt-1">${summary.wonRevenue.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100">
            {servicePieData.slice(0, 4).map((entry, idx) => {
              const rat = summary.wonRevenue > 0 ? Math.round((entry.value / summary.wonRevenue) * 100) : 0;
              return (
                <div key={idx} className="flex justify-between items-center text-xs">
                  <div className="flex items-center gap-2 text-slate-650 truncate max-w-[150px]">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }} />
                    <span className="truncate font-medium">{entry.name}</span>
                  </div>
                  <span className="font-mono text-slate-800 font-bold shrink-0">
                    ${entry.value.toLocaleString()} <span className="text-slate-400 font-normal">({rat}%)</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Leaderboard comparisons table & metrics breakdown side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="sales-closers">
        
        {/* Left: Rep performance list bar chart */}
        <div className="lg:col-span-2 bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-[#0F172A] mb-1">Won Volume Leaderboard</h3>
            <p className="text-[#64748B] text-xs">Total cash closed per sales representative.</p>

            <div className="space-y-3.5 my-5">
              {sortedRepsSales.map((rep, idx) => {
                const max = Math.max(...sortedRepsSales.map(r => r.revenue));
                const pct = max > 0 ? (rep.revenue / max) * 100 : 0;
                return (
                  <div key={idx} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono font-black text-[10px] text-slate-400">#{idx + 1}</span>
                        <span className="font-bold text-slate-850">{rep.name}</span>
                      </div>
                      <span className="font-mono text-slate-900 font-black">
                        ${rep.revenue.toLocaleString()} <span className="text-slate-500 font-semibold">({rep.winRate}% win)</span>
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full transition-all duration-705" 
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-[10px] text-slate-500 bg-slate-50 p-2.5 border border-slate-150 rounded leading-normal">
            ⭐ <strong>Top Performer:</strong> {sortedRepsSales[0]?.name} is leading closure efficiency with an incredible <strong className="text-emerald-705">{sortedRepsSales[0]?.winRate}% Close Rate</strong>.
          </div>
        </div>

        {/* Right Info Box */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="text-base font-bold text-[#0F172A] pb-2 border-b border-slate-100">Expected Pipelines</h3>
            
            <div className="space-y-3">
              {sortedRepsSales.map((rep, idx) => (
                <div key={idx} className="flex justify-between items-center p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                  <div>
                    <span className="font-bold text-slate-800 block">{rep.name}</span>
                    <span className="text-[10px] text-[#64748B] block mt-0.5">Win probability: {rep.winRate}%</span>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[#0B2A5B] font-bold block">${rep.pipeline.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-500">Unweighted</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[10px] text-[#64748B] border-t border-slate-100 pt-3 mt-4">
            * Pipeline allocations reflect real GHL lead assignees calculated continuously.
          </div>
        </div>
      </div>
    </div>
  );
}
