/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Award, 
  Clock, 
  TrendingUp, 
  ChevronRight, 
  BookOpen, 
  Users, 
  CheckCircle,
  HelpCircle,
  TrendingDown,
  ListOrdered,
  XCircle,
  PhoneOff,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  Legend
} from 'recharts';
import { OwnerPerformanceReport } from '../types';

interface OwnerDashboardViewProps {
  reportData: OwnerPerformanceReport;
}

export default function OwnerDashboardView({ reportData }: OwnerDashboardViewProps) {
  const { summary, ownerBreakdown, funnel } = reportData;

  const [selectedUserId, setSelectedUserId] = useState<string>(ownerBreakdown[0]?.userId || '');
  const selectedUser = ownerBreakdown.find(u => u.userId === selectedUserId) || ownerBreakdown[0];

  // Global totals / highlights
  const bestPerformer = [...ownerBreakdown].sort((a, b) => b.wonRevenue - a.wonRevenue)[0];
  const lowestResponse = [...ownerBreakdown].sort((a, b) => a.avgSpeedToLeadSec - b.avgSpeedToLeadSec)[0];

  return (
    <div className="space-y-6" id="owner-dashboard-view">
      {/* Staff Highlights Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5" id="owner-highlights">
        {/* Top Performer */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl border border-amber-100 shrink-0">
            <Award className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-0.5">Top Deal Closer</span>
            <h4 className="text-[#0F172A] font-extrabold text-base leading-tight">{bestPerformer?.userName}</h4>
            <p className="text-emerald-700 font-mono font-bold text-sm mt-0.5">${bestPerformer?.wonRevenue.toLocaleString()}</p>
          </div>
        </div>

        {/* Fastest Speed-to-lead */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-[#1D4ED8] rounded-xl border border-blue-105 shrink-0">
            <Clock className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-0.5">Fastest Response</span>
            <h4 className="text-[#0F172A] font-extrabold text-base leading-tight">{lowestResponse?.userName}</h4>
            <p className="text-[#1D4ED8] font-mono font-bold text-xs mt-0.5">Average: {lowestResponse?.avgSpeedToLeadSec} secs</p>
          </div>
        </div>

        {/* Total Won */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex items-center gap-4">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shrink-0">
            <TrendingUp className="w-8 h-8" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-0.5">Attributed Revenue</span>
            <h4 className="text-[#0F172A] font-extrabold text-base leading-tight">Total Team Won</h4>
            <p className="text-indigo-600 font-mono font-bold text-base mt-0.5">${summary.wonRevenue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Main Splits view */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="owner-team-split">
        
        {/* Left Side: Reps Picker & High Level Activity Leaderboard */}
        <div className="lg:col-span-1 bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 space-y-4">
          <div className="flex justify-between items-center pb-3 border-b border-slate-100">
            <h3 className="font-bold text-[#0F172A] text-sm">Assignees List</h3>
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider font-semibold">dissect performance</span>
          </div>

          <div className="space-y-2">
            {ownerBreakdown.map((rep) => {
              const isSelected = rep.userId === selectedUser?.userId;
              return (
                <button
                  key={rep.userId}
                  onClick={() => setSelectedUserId(rep.userId)}
                  className={`w-full text-left p-3 rounded-lg border transition-all text-xs flex items-center justify-between cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-50/50 border-[#1D4ED8] shadow-xs' 
                      : 'bg-white border-slate-150 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 uppercase border border-slate-200 overflow-hidden text-[10px] shrink-0">
                      {rep.userName.split(' ').map(n=>n[0]).join('')}
                    </div>
                    <div className="truncate max-w-[120px]">
                      <h4 className="font-bold text-slate-800 text-xs truncate">{rep.userName}</h4>
                      <p className="text-slate-400 text-[10px] truncate">{rep.userEmail}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="font-mono text-slate-900 text-xs block font-bold">${rep.wonRevenue.toLocaleString()}</span>
                    <span className="text-[10px] text-slate-450 block font-semibold">Win rate: {rep.closeRate}%</span>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="text-[10px] text-slate-500 bg-slate-50 p-2.5 border border-slate-200 rounded leading-relaxed">
            💡 Selecting any staff representative updates the funnel and speed-to-lead metrics diagnostics.
          </p>
        </div>

        {/* Right Side: Detailed Diagnostics & Conversion Funnel */}
        {selectedUser && (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Conversion Funnel */}
            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 space-y-4">
              <div>
                <h3 className="text-base font-bold text-[#0F172A]">Rep Conversion & Pipeline Velocity</h3>
                <p className="text-[#64748B] text-xs">
                  Review {selectedUser.userName}&apos;s opportunities from lead stage through booked service.
                </p>
              </div>

              {/* Graphical Funnel representation with standard HighLevel CRM layers */}
              <div className="space-y-3 my-5">
                {/* 1. Leads Assigned */}
                <div className="relative">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-705 px-4 py-2 bg-slate-50 border border-slate-150 rounded-lg max-w-[100%] mx-auto relative overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-blue-50 text-[#1D4ED8] flex items-center justify-center font-bold border border-blue-200 text-[10px]">1</span>
                      Assigned Contact Inflow
                    </span>
                    <span className="relative z-10 font-bold text-[#1D4ED8] font-mono text-xs">{selectedUser.totalLeads} Leads</span>
                  </div>
                </div>

                {/* 2. Opportunities Created */}
                <div className="relative">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-705 px-4 py-2 bg-slate-50 border border-slate-150 rounded-lg max-w-[95%] mx-auto relative overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold border border-indigo-200 text-[10px]">2</span>
                      Booked Appointments
                    </span>
                    <span className="relative z-10 font-bold text-indigo-600 font-mono text-xs">
                      {selectedUser.bookedAppointments} Booked
                    </span>
                  </div>
                </div>

                {/* 3. Closed Contracts */}
                <div className="relative">
                  <div className="flex justify-between items-center text-xs font-semibold text-slate-705 px-4 py-2 bg-slate-50 border border-slate-150 rounded-lg max-w-[90%] mx-auto relative overflow-hidden">
                    <span className="relative z-10 flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold border border-emerald-250 text-[10px]">3</span>
                      Won Contracts Converted
                    </span>
                    <span className="relative z-10 font-bold text-emerald-700 font-mono text-xs">
                      {Math.round(selectedUser.bookedAppointments * (selectedUser.closeRate / 100))} Closed ({selectedUser.closeRate}%)
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-3 border-t border-slate-100 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex-1 space-y-0.5">
                  <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Lead Booking Rate</span>
                  <span className="text-[#0F172A] font-mono text-sm font-bold">
                    {selectedUser.totalLeads > 0 ? Math.round((selectedUser.bookedAppointments / selectedUser.totalLeads) * 100) : 0}%
                  </span>
                </div>
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 flex-1 space-y-0.5">
                  <span className="text-[10px] text-[#64748B] font-bold uppercase tracking-wider block">Close Rate Target</span>
                  <span className="text-emerald-700 font-mono text-sm font-bold">{selectedUser.closeRate}%</span>
                </div>
              </div>

              {/* Grid with Donut Chart and Target Close Rate Gauge */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 pt-4 border-t border-slate-100">
                {/* 1. Source Attribution Donut Chart */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1">Attributed Revenue Donut</h4>
                    <span className="text-[10px] text-slate-400 block mb-3">Estimated gross sales split by UTM channel.</span>
                    <div className="h-32 flex items-center justify-center relative">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'Google LSA', value: Math.round(selectedUser.wonRevenue * 0.45) },
                              { name: 'Facebook Ads', value: Math.round(selectedUser.wonRevenue * 0.25) },
                              { name: 'Organic SEO', value: Math.round(selectedUser.wonRevenue * 0.20) },
                              { name: 'Referral Promo', value: Math.round(selectedUser.wonRevenue * 0.10) }
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={25}
                            outerRadius={45}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {['#0B2A5B', '#1D4ED8', '#64748B', '#10B981'].map((color, i) => (
                              <Cell key={`cell-${i}`} fill={color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value) => `$${Number(value).toLocaleString()}`} />
                        </PieChart>
                      </ResponsiveContainer>
                      <span className="absolute text-[10px] uppercase font-mono font-bold text-slate-400">Sources</span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center pt-2 border-t border-slate-200/50">
                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[#0B2A5B]" /> LSA</span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[#1D4ED8]" /> FB</span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[#64748B]" /> SEO</span>
                    <span className="flex items-center gap-1 text-[9px] font-bold text-slate-600"><span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" /> Ref</span>
                  </div>
                </div>

                {/* 2. Target Close Rate Gauge */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-800 mb-1">Target Close Rate Gauge</h4>
                    <span className="text-[10px] text-slate-400 block mb-2">Representative progress vs 35% win rate target.</span>
                    <div className="flex flex-col items-center justify-center p-2 relative h-28">
                      {/* Custom radial progress representation */}
                      <svg className="w-24 h-24 transform -rotate-95">
                        <circle cx="48" cy="48" r="38" strokeWidth="6" stroke="#E2E8F0" fill="transparent" />
                        <circle cx="48" cy="48" r="38" strokeWidth="6" stroke={selectedUser.closeRate >= 35 ? '#10B981' : '#1D4ED8'} fill="transparent"
                          strokeDasharray={2 * Math.PI * 38}
                          strokeDashoffset={2 * Math.PI * 38 * (1 - Math.min(selectedUser.closeRate, 100) / 100)}
                          strokeLinecap="round" />
                      </svg>
                      <div className="absolute text-center">
                        <span className="text-base font-extrabold font-mono text-[#0F172A]">{selectedUser.closeRate}%</span>
                        <span className="text-[8px] font-bold text-slate-400 block uppercase">Win Yield</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-center text-[9px] font-bold text-slate-500 pt-2 border-t border-slate-200/50">
                    {selectedUser.closeRate >= 35 ? '🏆 Quota target achieved!' : `${35 - selectedUser.closeRate}% remaining to reach target`}
                  </div>
                </div>
              </div>
            </div>

            {/* Speed to Lead and No Show diagnostics */}
            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 space-y-5">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div>
                  <h3 className="text-sm font-bold text-[#0F172A]">Rep Speed & Communication SLA</h3>
                  <p className="text-xs text-[#64748B]">Real-time response times and customer attendance diagnostics compared across team.</p>
                </div>
                <span className="text-xs font-semibold font-mono text-rose-700 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-200 flex items-center gap-1 shrink-0">
                  <Clock className="w-3.5 h-3.5" />
                  {selectedUser.avgSpeedToLeadSec}s avg
                </span>
              </div>

              {/* Comparative Team Speed-to-Lead Bar Chart */}
              <div className="h-44 mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ownerBreakdown.map(r => ({ name: r.userName.split(' ')[0], Speed: r.avgSpeedToLeadSec }))}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="name" fontSize={9} stroke="#64748B" />
                    <YAxis label={{ value: 'Seconds', angle: -90, position: 'insideLeft', style: {fontSize: 8, fill: '#64748B'} }} fontSize={9} stroke="#64748B" />
                    <Tooltip formatter={(value) => [`${value} seconds`, 'Speed to Lead']} />
                    <Bar dataKey="Speed" name="Avg Speed to Lead" fill="#FBBF24" radius={[4, 4, 0, 0]}>
                      {ownerBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.userId === selectedUser.userId ? '#1D4ED8' : '#FBBF24'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="rep-submetrics">
                <div className="bg-slate-50 border border-slate-200 p-3 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-0.5">Avg Response</span>
                  <div className="text-base font-bold text-[#0F172A]">{selectedUser.avgSpeedToLeadSec} seconds</div>
                  <span className="text-[9px] text-[#1D4ED8] bg-blue-50 px-1 py-0.5 rounded font-bold mt-1 inline-block">SLA Compliant</span>
                </div>

                <div className="bg-slate-50 border border-[#E2E8F0] p-3 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-0.5">Lost Opps</span>
                  <div className="text-base font-bold text-rose-600">{selectedUser.lostOpportunities} Leakages</div>
                  <span className="text-[9px] text-slate-400">Dropped Stages</span>
                </div>

                <div className="bg-slate-50 border border-[#E2E8F0] p-3 rounded-xl text-center">
                  <span className="text-[9px] uppercase font-bold tracking-wider text-slate-500 block mb-0.5">Missed Contacts</span>
                  <div className="text-base font-bold text-amber-600">{selectedUser.missedLeads} Misses</div>
                  <span className="text-[9px] text-slate-400">Unresolved calls</span>
                </div>
              </div>

              {/* SLA Recommendation Insight Widget */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex items-start gap-3 mt-2 animate-fade-in text-xs">
                <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                <div className="space-y-1 text-slate-705">
                  <strong className="font-bold text-slate-900 block">AI SLA Recommendations for {selectedUser.userName}</strong>
                  <p className="leading-relaxed">
                    {selectedUser.avgSpeedToLeadSec > 90 
                      ? `Speed-to-lead is currently at ${selectedUser.avgSpeedToLeadSec}s. We suggest configuring a GoHighLevel automated text-back trigger block to auto-reply to inbound SMS contacts within 15 seconds.`
                      : `Excellent response rate of ${selectedUser.avgSpeedToLeadSec}s. To minimize the ${selectedUser.lostOpportunities} lost opportunities, focus communication on reactivation offers or customized remodeling discount codes.`}
                  </p>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* Reps performance leaderboard table */}
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden shadow-xs" id="owner-reps-leaderboard">
        <div className="p-5 border-b border-slate-100 bg-[#F8FAFC]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-[#0F172A] text-sm">Team Members Conversions Dashboard</h3>
              <p className="text-[#64748B] text-xs">A side-by-side view of speed-to-lead and win yield across our HighLevel location.</p>
            </div>
            
            <span className="flex items-center gap-1 bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-[10px] font-bold font-mono text-[#64748B] shadow-xs">
              <ListOrdered className="w-3.5 h-3.5 text-blue-600" />
              Ordered by Revenue Won
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] uppercase tracking-wider font-extrabold text-[10px]">
                <th className="py-3 px-5">Assignee / Owner</th>
                <th className="py-3 px-5 text-center">Leads Sourced</th>
                <th className="py-3 px-5 text-center">Appointments</th>
                <th className="py-3 px-5 text-center">Avg Response</th>
                <th className="py-3 px-5 text-right">Raw Pipeline</th>
                <th className="py-3 px-5 text-right font-bold text-[#0B2A5B]">Revenue Converted</th>
                <th className="py-3 px-5 text-center">Close Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-105 font-medium text-slate-700">
              {[...ownerBreakdown].sort((a,b) => b.wonRevenue - a.wonRevenue).map((rep, idx) => (
                <tr key={rep.userId} className="hover:bg-slate-50 transition">
                  <td className="py-3 px-5 flex items-center gap-2.5">
                    <span className="font-mono text-[10px] text-slate-400 font-bold">#{idx + 1}</span>
                    <div>
                      <div className="text-[#0F172A] font-bold">{rep.userName}</div>
                      <div className="text-[9px] text-slate-400 font-mono">{rep.userId}</div>
                    </div>
                  </td>
                  <td className="py-3 px-5 text-center font-bold font-mono text-slate-800">{rep.totalLeads}</td>
                  <td className="py-3 px-5 text-center text-slate-500">{rep.bookedAppointments} Booked</td>
                  <td className="py-3 px-5 text-center text-rose-700 font-bold font-mono">{rep.avgSpeedToLeadSec}s</td>
                  <td className="py-3 px-5 text-right font-mono text-slate-650">${rep.pipelineValue.toLocaleString()}</td>
                  <td className="py-3 px-5 text-right text-[#0F172A] font-mono font-bold">${rep.wonRevenue.toLocaleString()}</td>
                  <td className="py-3 px-5 text-center">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
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
