/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CalendarCheck2,
  CheckCircle2,
  XCircle,
  CalendarX2,
  CalendarClock,
  TrendingUp,
  Users,
  Calendar,
  ChevronRight,
  AlertTriangle
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
import { AppointmentDashboardReport } from '../types';
import { getReportingTimezone } from './GlobalSettingsView';

interface AppointmentDashboardViewProps {
  reportData: AppointmentDashboardReport;
}

const STATUS_COLORS: Record<string, string> = {
  Showed: '#10b981',
  'No-Show': '#f43f5e',
  Cancelled: '#f59e0b',
  Confirmed: '#3b82f6'
};

function ShowRateBadge({ rate }: { rate: number }) {
  const color = rate >= 80 ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : rate >= 60 ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-rose-700 bg-rose-50 border-rose-200';
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-black border ${color}`}>
      {rate}%
    </span>
  );
}

function formatRelativeTime(isoStr: string): string {
  const diff = new Date(isoStr).getTime() - Date.now();
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `in ${d}d ${h % 24}h`;
  if (h > 0) return `in ${h}h`;
  const m = Math.floor(diff / 60000);
  return m > 0 ? `in ${m}m` : 'now';
}

function formatApptDate(isoStr: string, tz: string): string {
  try {
    return new Date(isoStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: tz });
  } catch { return new Date(isoStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }); }
}

function formatApptTime(isoStr: string, tz: string): string {
  try {
    return new Date(isoStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', timeZone: tz });
  } catch { return new Date(isoStr).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }); }
}

function tzAbbr(tz: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { timeZone: tz, timeZoneName: 'short' })
      .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value || '';
  } catch { return ''; }
}

export default function AppointmentDashboardView({ reportData }: AppointmentDashboardViewProps) {
  const timezone = getReportingTimezone();
  const { summary, statusDistribution, calendarBreakdown, repBreakdown, upcomingAppointments, trends } = reportData;
  const [activeTab, setActiveTab] = useState<'calendars' | 'reps'>('calendars');

  const kpiCards = [
    {
      label: 'Total Booked',
      value: summary.totalBooked,
      icon: CalendarCheck2,
      iconBg: 'bg-blue-50 text-blue-600 border-blue-100',
      valueCls: 'text-[#0F172A]'
    },
    {
      label: 'Show Rate',
      value: `${summary.showRate}%`,
      icon: CheckCircle2,
      iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100',
      valueCls: summary.showRate >= 75 ? 'text-emerald-700' : summary.showRate >= 55 ? 'text-amber-600' : 'text-rose-600',
      sub: `${summary.totalShowed} showed`
    },
    {
      label: 'No-Shows',
      value: summary.totalNoShow,
      icon: XCircle,
      iconBg: 'bg-rose-50 text-rose-600 border-rose-100',
      valueCls: 'text-rose-700',
      sub: `${summary.noShowRate}% rate`
    },
    {
      label: 'Cancellations',
      value: summary.totalCancelled,
      icon: CalendarX2,
      iconBg: 'bg-amber-50 text-amber-600 border-amber-100',
      valueCls: 'text-amber-700',
      sub: `${summary.cancellationRate}% rate`
    },
    {
      label: 'Upcoming',
      value: summary.upcomingCount,
      icon: CalendarClock,
      iconBg: 'bg-violet-50 text-violet-600 border-violet-100',
      valueCls: 'text-violet-700',
      sub: 'within date range'
    }
  ];

  return (
    <div className="space-y-6" id="appointment-dashboard-view">

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4" id="apt-kpi-cards">
        {kpiCards.map(card => (
          <div key={card.label} className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex items-start gap-3">
            <div className={`p-2.5 rounded-xl border shrink-0 ${card.iconBg}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-0.5 leading-tight">{card.label}</span>
              <p className={`text-2xl font-black leading-none ${card.valueCls}`}>{card.value}</p>
              {card.sub && <p className="text-[10px] text-slate-500 font-semibold mt-1">{card.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

        {/* Status Distribution Donut */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5">
          <div className="mb-4">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#64748B]">Status Breakdown</span>
            <h3 className="text-sm font-black text-[#0F172A] mt-0.5">Appointment Outcomes</h3>
          </div>
          {statusDistribution.length === 0 ? (
            <div className="h-40 flex items-center justify-center">
              <p className="text-xs text-slate-400 font-semibold">No appointment data for period</p>
            </div>
          ) : (
            <>
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={72}
                    paddingAngle={2}
                  >
                    {statusDistribution.map((entry, idx) => (
                      <Cell key={idx} fill={STATUS_COLORS[entry.status] || '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: number, name: string) => [`${val} appts`, name]}
                    contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid #e2e8f0' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-1.5 mt-2">
                {statusDistribution.map(entry => (
                  <div key={entry.status} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[entry.status] || '#94a3b8' }} />
                      <span className="font-semibold text-slate-600">{entry.status}</span>
                    </div>
                    <span className="font-black text-slate-800">{entry.count}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Weekly Trend Bar Chart */}
        <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 lg:col-span-2">
          <div className="mb-4">
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#64748B]">Weekly Trends</span>
            <h3 className="text-sm font-black text-[#0F172A] mt-0.5">Booked vs. Showed vs. No-Show</h3>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={trends} barCategoryGap="30%" barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="date" tick={{ fontSize: 11, fontWeight: 700, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid #e2e8f0' }}
                cursor={{ fill: '#f8fafc' }}
              />
              <Legend wrapperStyle={{ fontSize: 11, fontWeight: 700 }} />
              <Bar dataKey="booked" name="Booked" fill="#3b82f6" radius={[3, 3, 0, 0]} />
              <Bar dataKey="showed" name="Showed" fill="#10b981" radius={[3, 3, 0, 0]} />
              <Bar dataKey="noshow" name="No-Show" fill="#f43f5e" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Breakdown Table (Calendars / Reps tabs) */}
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#64748B]">Breakdown</span>
            <h3 className="text-sm font-black text-[#0F172A] mt-0.5">Performance by {activeTab === 'calendars' ? 'Calendar' : 'Team Member'}</h3>
          </div>
          <div className="flex items-center bg-slate-100 rounded-lg p-0.5 gap-0.5">
            <button
              onClick={() => setActiveTab('calendars')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${activeTab === 'calendars' ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Calendar className="w-3 h-3" /> Calendars
            </button>
            <button
              onClick={() => setActiveTab('reps')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-bold transition cursor-pointer ${activeTab === 'reps' ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
            >
              <Users className="w-3 h-3" /> Team Members
            </button>
          </div>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden divide-y divide-slate-100">
          {activeTab === 'calendars' ? (
            calendarBreakdown.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400 font-semibold">No calendar data available for this period</p>
            ) : (
              calendarBreakdown.map(cal => (
                <div key={cal.calendarId} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F172A]">{cal.calendarName}</span>
                    <ShowRateBadge rate={cal.showRate} />
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    <div className="text-center"><span className="block text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Total</span><span className="font-black text-slate-700">{cal.total}</span></div>
                    <div className="text-center"><span className="block text-[9px] uppercase font-extrabold text-emerald-400 tracking-wider">Showed</span><span className="font-bold text-emerald-700">{cal.showed}</span></div>
                    <div className="text-center"><span className="block text-[9px] uppercase font-extrabold text-rose-400 tracking-wider">No-Show</span><span className="font-bold text-rose-700">{cal.noshow}</span></div>
                    <div className="text-center"><span className="block text-[9px] uppercase font-extrabold text-amber-400 tracking-wider">Cancelled</span><span className="font-bold text-amber-700">{cal.cancelled}</span></div>
                  </div>
                </div>
              ))
            )
          ) : (
            repBreakdown.length === 0 ? (
              <p className="text-center py-8 text-xs text-slate-400 font-semibold">No rep breakdown available — GHL_COMPANY_ID may not be configured</p>
            ) : (
              repBreakdown.sort((a, b) => b.booked - a.booked).map(rep => (
                <div key={rep.userId} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-[#0F172A]">{rep.userName}</span>
                    <ShowRateBadge rate={rep.showRate} />
                  </div>
                  <div className="grid grid-cols-4 gap-1 text-[11px]">
                    <div className="text-center"><span className="block text-[9px] uppercase font-extrabold text-slate-400 tracking-wider">Total</span><span className="font-black text-slate-700">{rep.booked}</span></div>
                    <div className="text-center"><span className="block text-[9px] uppercase font-extrabold text-emerald-400 tracking-wider">Showed</span><span className="font-bold text-emerald-700">{rep.showed}</span></div>
                    <div className="text-center"><span className="block text-[9px] uppercase font-extrabold text-rose-400 tracking-wider">No-Show</span><span className="font-bold text-rose-700">{rep.noshow}</span></div>
                    <div className="text-center"><span className="block text-[9px] uppercase font-extrabold text-amber-400 tracking-wider">Cancelled</span><span className="font-bold text-amber-700">{rep.cancelled}</span></div>
                  </div>
                </div>
              ))
            )
          )}
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-slate-100">
                <th className="text-left px-5 py-3 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">
                  {activeTab === 'calendars' ? 'Calendar' : 'Team Member'}
                </th>
                <th className="text-center px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Total</th>
                <th className="text-center px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">Showed</th>
                <th className="text-center px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-rose-600">No-Show</th>
                <th className="text-center px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-amber-600">Cancelled</th>
                <th className="text-center px-4 py-3 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Show Rate</th>
              </tr>
            </thead>
            <tbody>
              {activeTab === 'calendars' ? (
                calendarBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-slate-400 font-semibold">No calendar data available for this period</td>
                  </tr>
                ) : (
                  calendarBreakdown.map((cal, i) => (
                    <tr key={cal.calendarId} className={`border-b border-slate-50 hover:bg-[#F8FAFC] transition ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                      <td className="px-5 py-3 font-bold text-[#0F172A]">{cal.calendarName}</td>
                      <td className="px-4 py-3 text-center font-black text-slate-700">{cal.total}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">{cal.showed}</td>
                      <td className="px-4 py-3 text-center font-bold text-rose-700">{cal.noshow}</td>
                      <td className="px-4 py-3 text-center font-bold text-amber-700">{cal.cancelled}</td>
                      <td className="px-4 py-3 text-center"><ShowRateBadge rate={cal.showRate} /></td>
                    </tr>
                  ))
                )
              ) : (
                repBreakdown.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-8 text-xs text-slate-400 font-semibold">No rep breakdown available — GHL_COMPANY_ID may not be configured</td>
                  </tr>
                ) : (
                  repBreakdown.sort((a, b) => b.booked - a.booked).map((rep, i) => (
                    <tr key={rep.userId} className={`border-b border-slate-50 hover:bg-[#F8FAFC] transition ${i % 2 === 0 ? '' : 'bg-slate-50/40'}`}>
                      <td className="px-5 py-3 font-bold text-[#0F172A]">{rep.userName}</td>
                      <td className="px-4 py-3 text-center font-black text-slate-700">{rep.booked}</td>
                      <td className="px-4 py-3 text-center font-bold text-emerald-700">{rep.showed}</td>
                      <td className="px-4 py-3 text-center font-bold text-rose-700">{rep.noshow}</td>
                      <td className="px-4 py-3 text-center font-bold text-amber-700">{rep.cancelled}</td>
                      <td className="px-4 py-3 text-center"><ShowRateBadge rate={rep.showRate} /></td>
                    </tr>
                  ))
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Upcoming Appointments List */}
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#64748B]">Upcoming</span>
            <h3 className="text-sm font-black text-[#0F172A] mt-0.5">Scheduled Appointments</h3>
          </div>
          <span className="text-[10px] font-black text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded-full font-mono">
            {tzAbbr(timezone)} · {timezone.replace('America/', '').replace('_', ' ')}
          </span>
        </div>

        {upcomingAppointments.length === 0 ? (
          <div className="py-10 flex flex-col items-center gap-2 text-slate-400">
            <CalendarClock className="w-8 h-8" />
            <p className="text-xs font-semibold">No upcoming appointments in this date range</p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-50">
            {upcomingAppointments.map(apt => (
              <li key={apt.id} className="flex items-start gap-4 px-5 py-3.5 hover:bg-[#F8FAFC] transition">
                <div className="w-9 h-9 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                  <CalendarCheck2 className="w-4 h-4 text-[#1D4ED8]" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black text-[#0F172A] truncate">{apt.title}</p>
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                    {apt.calendarName && (
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {apt.calendarName}
                      </span>
                    )}
                    {apt.userName && (
                      <span className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                        <Users className="w-3 h-3" /> {apt.userName}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <span className="text-[10px] font-black text-blue-700 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                    {formatRelativeTime(apt.startTime)}
                  </span>
                  <p className="text-[10px] text-slate-400 font-mono mt-1">
                    {formatApptDate(apt.startTime, timezone)} {formatApptTime(apt.startTime, timezone)}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

    </div>
  );
}
