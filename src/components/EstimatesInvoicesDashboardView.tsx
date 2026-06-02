/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  FileText,
  Receipt,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ArrowRight,
  DollarSign,
  TrendingUp,
  RefreshCw
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell
} from 'recharts';
import { EstimatesInvoicesReport } from '../types';

interface EstimatesInvoicesDashboardViewProps {
  reportData: EstimatesInvoicesReport;
}

function fmt$(n: number) {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(1)}k`;
  return `$${n.toLocaleString()}`;
}

function pct(n: number) { return `${n}%`; }

const STATUS_COLORS: Record<string, string> = {
  DRAFT: '#94a3b8', SENT: '#3b82f6', VIEWED: '#8b5cf6', ACCEPTED: '#10b981',
  REJECTED: '#f43f5e', CONVERTED: '#06b6d4', EXPIRED: '#f59e0b',
  PAID: '#10b981', PARTIAL: '#f59e0b', OVERDUE: '#f43f5e', CANCELLED: '#94a3b8',
  UNKNOWN: '#cbd5e1'
};

const AGING_COLORS = {
  current:    { bg: 'bg-blue-50',   border: 'border-blue-200',   text: 'text-blue-700',   label: 'Current' },
  days1to30:  { bg: 'bg-amber-50',  border: 'border-amber-200',  text: 'text-amber-700',  label: '1–30 Days' },
  days31to60: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', label: '31–60 Days' },
  days61plus: { bg: 'bg-rose-50',   border: 'border-rose-200',   text: 'text-rose-700',   label: '60+ Days' },
};

function StatusPill({ status }: { status: string }) {
  const s = (status || '').toUpperCase();
  const color = STATUS_COLORS[s] || '#94a3b8';
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border" style={{ backgroundColor: `${color}18`, color, borderColor: `${color}40` }}>
      {s}
    </span>
  );
}

export default function EstimatesInvoicesDashboardView({ reportData }: EstimatesInvoicesDashboardViewProps) {
  const { estimates, invoices, crossMetrics } = reportData;
  const [activeSection, setActiveSection] = useState<'estimates' | 'invoices'>('invoices');

  // Funnel chart data
  const funnelData = [
    { name: 'Sent',      value: estimates.funnel.sent,      color: '#3b82f6' },
    { name: 'Viewed',    value: estimates.funnel.viewed,     color: '#8b5cf6' },
    { name: 'Accepted',  value: estimates.funnel.accepted,   color: '#10b981' },
    { name: 'Converted', value: estimates.funnel.converted,  color: '#06b6d4' },
  ];

  const unpaidCount = invoices.unpaidList.length;

  return (
    <div className="space-y-6" id="estimates-invoices-view">

      {/* ── SECTION TABS ── */}
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 w-fit">
        <button
          onClick={() => setActiveSection('invoices')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeSection === 'invoices' ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <Receipt className="w-3.5 h-3.5" /> Invoices & AR
        </button>
        <button
          onClick={() => setActiveSection('estimates')}
          className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${activeSection === 'estimates' ? 'bg-white text-[#1D4ED8] shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
        >
          <FileText className="w-3.5 h-3.5" /> Estimates & Funnel
        </button>
      </div>

      {/* ════════ INVOICES SECTION ════════ */}
      {activeSection === 'invoices' && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Total Invoiced',   value: fmt$(invoices.totalValue),       sub: `${invoices.totalCount} invoices`,         icon: Receipt,       color: 'text-[#1D4ED8]', iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
              { label: 'Collected',        value: fmt$(invoices.totalPaid),         sub: `${invoices.collectionRate}% rate`,         icon: CheckCircle2,  color: 'text-emerald-700', iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { label: 'Outstanding',      value: fmt$(invoices.totalOutstanding),  sub: `${unpaidCount} unpaid`,                   icon: DollarSign,    color: 'text-amber-700', iconBg: 'bg-amber-50 text-amber-600 border-amber-100' },
              { label: 'Overdue 60+ Days', value: fmt$(invoices.aging.days61plus.value), sub: `${invoices.aging.days61plus.count} invoices`, icon: AlertTriangle, color: 'text-rose-700', iconBg: 'bg-rose-50 text-rose-600 border-rose-100' },
              { label: 'Avg Invoice',      value: fmt$(invoices.avgInvoiceValue),   sub: 'non-draft/cancelled',                     icon: TrendingUp,    color: 'text-slate-700', iconBg: 'bg-slate-50 text-slate-600 border-slate-100' },
            ].map(card => (
              <div key={card.label} className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border shrink-0 ${card.iconBg}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-0.5">{card.label}</span>
                  <p className={`text-2xl font-black leading-none ${card.color}`}>{card.value}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Aging + Status breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Aging buckets */}
            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5">
              <div className="mb-4">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#64748B]">Accounts Receivable Aging</span>
                <h3 className="text-sm font-black text-[#0F172A] mt-0.5">Outstanding by Age</h3>
              </div>
              <div className="space-y-3">
                {(Object.entries(AGING_COLORS) as [keyof typeof invoices.aging, typeof AGING_COLORS[keyof typeof AGING_COLORS]][]).map(([key, style]) => {
                  const bucket = invoices.aging[key];
                  const pctOfTotal = invoices.totalOutstanding > 0 ? Math.round((bucket.value / invoices.totalOutstanding) * 100) : 0;
                  return (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={`font-bold ${style.text}`}>{style.label}</span>
                        <span className="font-black text-slate-700">{fmt$(bucket.value)} <span className="text-slate-400 font-semibold">({bucket.count})</span></span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${style.bg.replace('bg-', 'bg-').replace('-50', '-400')}`} style={{ width: `${pctOfTotal}%` }} />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-2 border-t border-slate-100 flex justify-between text-xs font-bold text-slate-600">
                  <span>Total Outstanding</span>
                  <span className="text-[#0F172A]">{fmt$(invoices.totalOutstanding)}</span>
                </div>
              </div>
            </div>

            {/* Invoice status breakdown */}
            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#64748B]">Status Breakdown</span>
                <h3 className="text-sm font-black text-[#0F172A] mt-0.5">All Invoice Statuses</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Status</th>
                      <th className="text-center px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Count</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Total</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-emerald-600">Paid</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-600">Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(invoices.byStatus).sort((a,b) => b[1].value - a[1].value).map(([status, d], i) => (
                      <tr key={status} className={`border-b border-slate-50 hover:bg-[#F8FAFC] ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                        <td className="px-4 py-2.5"><StatusPill status={status} /></td>
                        <td className="px-3 py-2.5 text-center font-black text-slate-700">{d.count}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-700">{fmt$(d.value)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-emerald-700">{fmt$(d.amountPaid)}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-amber-700">{d.amountDue > 0 ? fmt$(d.amountDue) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Unpaid invoice list */}
          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#64748B]">Action Required</span>
                <h3 className="text-sm font-black text-[#0F172A] mt-0.5">Unpaid Invoices ({unpaidCount})</h3>
              </div>
              <span className="text-xs font-black text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-full">
                {fmt$(invoices.totalOutstanding)} outstanding
              </span>
            </div>
            {invoices.unpaidList.length === 0 ? (
              <div className="py-12 flex flex-col items-center gap-2 text-slate-400">
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                <p className="text-xs font-semibold">All invoices paid — no outstanding balance</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Invoice</th>
                      <th className="text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Contact</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-amber-600">Amount Due</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Total</th>
                      <th className="text-center px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Due Date</th>
                      <th className="text-center px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-rose-600">Overdue</th>
                      <th className="text-center px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.unpaidList.map((inv, i) => {
                      const overdueCls = inv.daysOverdue > 60 ? 'text-rose-700 font-black' : inv.daysOverdue > 30 ? 'text-orange-700 font-bold' : inv.daysOverdue > 0 ? 'text-amber-700 font-bold' : 'text-slate-400 font-semibold';
                      return (
                        <tr key={inv.id} className={`border-b border-slate-50 hover:bg-[#F8FAFC] ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                          <td className="px-4 py-3">
                            <p className="font-bold text-[#0F172A] truncate max-w-[160px]">{inv.name || inv.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.invoiceNumber}</p>
                          </td>
                          <td className="px-4 py-3">
                            <p className="font-bold text-slate-700 truncate max-w-[140px]">{inv.contactName}</p>
                            <p className="text-[10px] text-slate-400 truncate max-w-[140px]">{inv.contactEmail}</p>
                          </td>
                          <td className="px-4 py-3 text-right font-black text-amber-700">{fmt$(inv.amountDue)}</td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-500">{fmt$(inv.total)}</td>
                          <td className="px-4 py-3 text-center text-slate-500 font-mono text-[11px]">
                            {inv.dueDate ? new Date(inv.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: '2-digit' }) : '—'}
                          </td>
                          <td className={`px-4 py-3 text-center ${overdueCls}`}>
                            {inv.daysOverdue > 0 ? `${inv.daysOverdue}d` : 'Current'}
                          </td>
                          <td className="px-4 py-3 text-center"><StatusPill status={inv.status} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ════════ ESTIMATES SECTION ════════ */}
      {activeSection === 'estimates' && (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {[
              { label: 'Sent',           value: estimates.funnel.sent,               sub: fmt$(estimates.funnel.sentValue),   icon: FileText,     color: 'text-[#1D4ED8]',   iconBg: 'bg-blue-50 text-blue-600 border-blue-100' },
              { label: 'View Rate',      value: pct(estimates.funnel.viewRate),       sub: `${estimates.funnel.viewed} viewed`, icon: TrendingUp,   color: estimates.funnel.viewRate >= 60 ? 'text-emerald-700' : 'text-amber-700', iconBg: 'bg-violet-50 text-violet-600 border-violet-100' },
              { label: 'Acceptance Rate',value: pct(estimates.funnel.acceptanceRate), sub: `${estimates.funnel.accepted} accepted`, icon: CheckCircle2, color: estimates.funnel.acceptanceRate >= 20 ? 'text-emerald-700' : 'text-amber-700', iconBg: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
              { label: '→ Invoice Rate', value: pct(estimates.funnel.conversionRate), sub: `${estimates.funnel.converted} converted`, icon: ArrowRight,  color: 'text-cyan-700',    iconBg: 'bg-cyan-50 text-cyan-600 border-cyan-100' },
              { label: 'Rejected',       value: estimates.funnel.rejected,            sub: pct(estimates.funnel.rejectionRate),icon: XCircle,      color: 'text-rose-700',    iconBg: 'bg-rose-50 text-rose-600 border-rose-100' },
            ].map(card => (
              <div key={card.label} className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 flex items-start gap-3">
                <div className={`p-2.5 rounded-xl border shrink-0 ${card.iconBg}`}>
                  <card.icon className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-0.5">{card.label}</span>
                  <p className={`text-2xl font-black leading-none ${card.color}`}>{card.value}</p>
                  <p className="text-[10px] text-slate-500 font-semibold mt-1">{card.sub}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Funnel chart + status breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Funnel bar chart */}
            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5">
              <div className="mb-4">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#64748B]">Estimate Funnel</span>
                <h3 className="text-sm font-black text-[#0F172A] mt-0.5">Sent → Viewed → Accepted → Converted</h3>
              </div>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={funnelData} layout="vertical" margin={{ left: 8, right: 32 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 11, fontWeight: 700, fill: '#475569' }} axisLine={false} tickLine={false} width={72} />
                  <Tooltip contentStyle={{ fontSize: 11, fontWeight: 700, borderRadius: 8, border: '1px solid #e2e8f0' }} cursor={{ fill: '#f8fafc' }} />
                  <Bar dataKey="value" name="Count" radius={[0, 4, 4, 0]} label={{ position: 'right', fontSize: 10, fontWeight: 700, fill: '#475569' }}>
                    {funnelData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
              <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between text-[11px] font-bold text-slate-500">
                <span>Est.→Invoice conversion</span>
                <span className="text-cyan-700">{pct(crossMetrics.estimateToInvoiceRate)}</span>
              </div>
            </div>

            {/* Estimate status breakdown */}
            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100">
                <span className="text-[10px] uppercase font-extrabold tracking-widest text-[#64748B]">Status Breakdown</span>
                <h3 className="text-sm font-black text-[#0F172A] mt-0.5">All Estimate Statuses</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-[#F8FAFC] border-b border-slate-100">
                      <th className="text-left px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Status</th>
                      <th className="text-center px-3 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Count</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Total Value</th>
                      <th className="text-right px-4 py-2.5 text-[10px] font-extrabold uppercase tracking-widest text-[#64748B]">Avg</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(estimates.byStatus).sort((a,b) => b[1].value - a[1].value).map(([status, d], i) => (
                      <tr key={status} className={`border-b border-slate-50 hover:bg-[#F8FAFC] ${i % 2 === 1 ? 'bg-slate-50/40' : ''}`}>
                        <td className="px-4 py-2.5"><StatusPill status={status} /></td>
                        <td className="px-3 py-2.5 text-center font-black text-slate-700">{d.count}</td>
                        <td className="px-4 py-2.5 text-right font-bold text-slate-700">{fmt$(d.value)}</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-slate-500">{d.count > 0 ? fmt$(Math.round(d.value / d.count)) : '—'}</td>
                      </tr>
                    ))}
                    <tr className="border-t-2 border-slate-200 bg-slate-50">
                      <td className="px-4 py-2.5 font-extrabold text-slate-700 text-[10px] uppercase tracking-wide">Total</td>
                      <td className="px-3 py-2.5 text-center font-black text-slate-900">{estimates.totalCount}</td>
                      <td className="px-4 py-2.5 text-right font-black text-slate-900">{fmt$(estimates.totalValue)}</td>
                      <td className="px-4 py-2.5 text-right font-black text-slate-900">{estimates.totalCount > 0 ? fmt$(Math.round(estimates.totalValue / estimates.totalCount)) : '—'}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </>
      )}

    </div>
  );
}
