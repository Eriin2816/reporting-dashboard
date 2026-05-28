/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  CalendarDays, 
  RefreshCw, 
  Filter, 
  ChevronRight, 
  Sparkles, 
  FileSpreadsheet, 
  Users2, 
  DollarSign, 
  CheckCircle,
  TrendingUp,
  Award
} from 'lucide-react';

import { MiniTrendLine } from './DataCharts';

// ==========================================
// 1. METRIC CARD
// ==========================================
interface MetricCardProps {
  title: string;
  value: string | number;
  delta?: number; // percentage change value
  deltaLabel?: string; // "vs last month"
  icon: React.ReactNode;
  trendData?: number[];
  colorTheme?: 'blue' | 'purple' | 'emerald' | 'amber';
}

export function MetricCard({ 
  title, 
  value, 
  delta, 
  deltaLabel = "vs prior period", 
  icon, 
  trendData, 
  colorTheme = 'blue' 
}: MetricCardProps) {
  
  const isPositive = delta !== undefined ? delta >= 0 : true;
  
  // Theme styling mapping
  const borderColors = {
    blue: 'border-blue-100 hover:border-blue-300',
    purple: 'border-violet-100 hover:border-violet-300',
    emerald: 'border-emerald-100 hover:border-emerald-300',
    amber: 'border-amber-100 hover:border-amber-300',
  };

  const bgCircles = {
    blue: 'bg-blue-50 text-blue-600 border-blue-105',
    purple: 'bg-violet-50 text-violet-600 border-violet-105',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-105',
    amber: 'bg-amber-50 text-amber-600 border-amber-105',
  };

  return (
    <div 
      className={`bg-white border ${borderColors[colorTheme]} rounded-xl p-5 shadow-xs transition duration-300 flex flex-col justify-between space-y-4`}
      id={`metric-card-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="flex justify-between items-start">
        <div className="space-y-1.5">
          <span className="text-[10px] grid font-extrabold uppercase tracking-widest text-[#64748B] block">
            {title}
          </span>
          <h2 className="text-[#0F172A] text-2xl font-black tracking-tight leading-none font-sans">
            {value}
          </h2>
        </div>

        <div className={`p-2.5 rounded-lg border shrink-0 ${bgCircles[colorTheme]}`}>
          {icon}
        </div>
      </div>

      <div className="flex items-center justify-between pt-1 border-t border-slate-50">
        {delta !== undefined ? (
          <div className="flex items-center gap-1.5">
            <span className={`inline-flex items-center gap-0.5 text-[10px] font-black px-2 py-0.5 rounded-full border ${
              isPositive 
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {isPositive ? (
                <ArrowUpRight className="w-3 h-3 text-emerald-600 shrink-0" />
              ) : (
                <ArrowDownRight className="w-3 h-3 text-rose-600 shrink-0" />
              )}
              {isPositive ? '+' : ''}{delta}%
            </span>
            <span className="text-[10px] text-slate-450 font-medium whitespace-nowrap">{deltaLabel}</span>
          </div>
        ) : (
          <span className="text-[10px] text-slate-400 font-medium">Real-time update</span>
        )}

        {/* Dynamic mini trend overlay block */}
        {trendData && trendData.length > 1 && (
          <div className="shrink-0 pl-1.5">
            <MiniTrendLine data={trendData} isPositive={isPositive} width={65} height={18} />
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 2. DASHBOARD VIEW SWITCHER
// ==========================================
interface DashboardViewSwitcherProps {
  activeView: 'overview' | 'opportunity' | 'sales' | 'owner' | 'marketing';
  onChangeView: (view: 'overview' | 'opportunity' | 'sales' | 'owner' | 'marketing') => void;
}

export function DashboardViewSwitcher({ activeView, onChangeView }: DashboardViewSwitcherProps) {
  const views: Array<{ key: typeof activeView; label: string; icon: React.ReactNode }> = [
    { key: 'overview', label: 'Suite General', icon: <Sparkles className="w-3.5 h-3.5" /> },
    { key: 'opportunity', label: 'Opportunity Flow', icon: <FileSpreadsheet className="w-3.5 h-3.5" /> },
    { key: 'sales', label: 'Sales closing', icon: <DollarSign className="w-3.5 h-3.5" /> },
    { key: 'owner', label: 'Rep Diagnostics', icon: <Users2 className="w-3.5 h-3.5" /> },
    { key: 'marketing', label: 'Channels ROI', icon: <TrendingUp className="w-3.5 h-3.5" /> },
  ];

  return (
    <div 
      className="flex flex-wrap p-1 bg-slate-100 border border-slate-200 rounded-xl gap-0.5 inline-flex"
      id="component-view-switcher"
    >
      {views.map((v) => (
        <button
          key={v.key}
          onClick={() => onChangeView(v.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold font-sans transition cursor-pointer ${
            activeView === v.key
              ? 'bg-[#0f172a] text-white shadow-xs'
              : 'text-[#64748B] hover:text-[#0F172A] hover:bg-slate-200'
          }`}
        >
          {v.icon}
          <span>{v.label}</span>
        </button>
      ))}
    </div>
  );
}

// ==========================================
// 3. DATE RANGE FILTER WITH QUICK PRESETS
// ==========================================
interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (val: string) => void;
  onEndDateChange: (val: string) => void;
}

export function DateRangeFilter({ 
  startDate, 
  endDate, 
  onStartDateChange, 
  onEndDateChange 
}: DateRangeFilterProps) {
  
  const applyPreset = (daysBack: number) => {
    const today = new Date();
    const prior = new Date();
    prior.setDate(today.getDate() - daysBack);
    onStartDateChange(prior.toISOString().split('T')[0]);
    onEndDateChange(today.toISOString().split('T')[0]);
  };

  return (
    <div 
      className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-white p-3 border border-slate-200 rounded-xl"
      id="component-date-filter"
    >
      <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
        <CalendarDays className="w-4 h-4 text-slate-500" />
        <span>Target calendar bounds:</span>
      </div>

      <div className="flex items-center gap-1.5 flex-wrap sm:flex-nowrap">
        {/* Simple Input date range wrapper style */}
        <input
          type="date"
          value={startDate}
          onChange={(e) => onStartDateChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-blue-500 select-all cursor-pointer text-slate-850"
        />
        <span className="text-slate-400 text-xs font-bold">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => onEndDateChange(e.target.value)}
          className="bg-slate-50 border border-slate-200 text-xs font-semibold py-1.5 px-2.5 rounded-lg focus:outline-none focus:border-blue-500 select-all cursor-pointer text-slate-850"
        />
      </div>

      {/* Quick click presets */}
      <div className="flex items-center gap-1 border-t sm:border-t-0 sm:border-l border-slate-100 pt-2 sm:pt-0 sm:pl-3">
        <button
          onClick={() => applyPreset(7)}
          className="px-2 py-1 bg-slate-50 border border-slate-150 rounded hover:bg-slate-100 text-[10px] text-slate-600 font-extrabold cursor-pointer"
        >
          Last 7d
        </button>
        <button
          onClick={() => applyPreset(30)}
          className="px-2 py-1 bg-slate-50 border border-slate-150 rounded hover:bg-slate-100 text-[10px] text-slate-600 font-extrabold cursor-pointer"
        >
          Last 30d
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 4. FILTER TOOLBAR
// ==========================================
interface FilterToolbarProps {
  children?: React.ReactNode;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function FilterToolbar({ children, onRefresh, isRefreshing }: FilterToolbarProps) {
  return (
    <div 
      className="bg-white border border-[#E2E8F0] shadow-2xs rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
      id="component-filter-bar"
    >
      <div className="flex items-center gap-2 flex-wrap lg:flex-nowrap">
        <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
          <Filter className="w-3.5 h-3.5" />
        </div>
        <div>
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">SaaS CRM filter engine</span>
          <span className="text-xs text-[#0F172A] font-extrabold">Refine reporting streams and coordinates:</span>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 flex-wrap">
        {children}
        
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          className="inline-flex items-center justify-center gap-2 p-2 px-3.5 bg-slate-900 hover:bg-slate-950 text-white text-xs font-bold rounded-lg transition disabled:opacity-50 shadow-xs cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          <span>{isRefreshing ? 'Recomputing...' : 'Reload Metrics'}</span>
        </button>
      </div>
    </div>
  );
}

// ==========================================
// 5. RANKED TABLE
// ==========================================
interface RankedRow {
  rank: number;
  label: string;
  metricLabel: string | number;
  revenueLabel?: string;
  subValue?: string;
}

interface RankedTableProps {
  title: string;
  headers: string[];
  rows: RankedRow[];
  icon?: React.ReactNode;
}

export function RankedTable({ title, headers, rows, icon }: RankedTableProps) {
  return (
    <div 
      className="bg-white border border-slate-200 shadow-sm rounded-xl overflow-hidden"
      id={`ranked-table-${title.toLowerCase().replace(/\s+/g, '-')}`}
    >
      <div className="bg-slate-50 px-5 py-3 border-b border-slate-205 flex items-center justify-between">
        <h4 className="text-[#0F172A] text-xs font-black uppercase tracking-widest flex items-center gap-1.5">
          {icon}
          {title}
        </h4>
        <span className="text-[10px] bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded font-bold uppercase tracking-wide">
          Ranking Model
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-100 text-[#64748B] font-extrabold uppercase text-[10px] tracking-wider select-none bg-slate-50/40">
              <th className="py-2.5 px-4 w-12 text-center">Rank</th>
              <th className="py-2.5 px-4">{headers[0]}</th>
              <th className="py-2.5 px-4 text-center">{headers[1]}</th>
              {headers[2] && <th className="py-2.5 px-4 text-right">{headers[2]}</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-semibold">
            {rows.map((row, idx) => {
              // Specific rank design indicators
              const rankClass = 
                row.rank === 1 ? 'bg-amber-100 text-amber-800 font-black border-amber-200' :
                row.rank === 2 ? 'bg-slate-200 text-slate-800' :
                row.rank === 3 ? 'bg-amber-50 text-amber-900 border-amber-100' :
                'bg-slate-50 text-slate-500';

              return (
                <tr key={idx} className="hover:bg-slate-50/60 transition group">
                  <td className="py-3 px-4 text-center">
                    <span className={`w-6 h-6 rounded-md flex items-center justify-center mx-auto text-[11px] border ${rankClass}`}>
                      {row.rank}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div>
                      <span className="text-[#0F172A] font-bold block">{row.label}</span>
                      {row.subValue && <span className="text-[10px] text-slate-450 block font-normal mt-0.5 font-mono">{row.subValue}</span>}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="font-mono text-slate-800 text-xs font-extrabold bg-slate-50 px-2 py-0.5 border border-slate-150 rounded">
                      {row.metricLabel}
                    </span>
                  </td>
                  {row.revenueLabel !== undefined && (
                    <td className="py-3 px-4 text-right text-emerald-700 font-mono font-bold">
                      {row.revenueLabel}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ==========================================
// 6. PIPELINE STATUS CARD
// ==========================================
interface StageDetail {
  name: string;
  leadsCount: number;
  volumePercent: number;
}

interface PipelineStatusCardProps {
  stages: StageDetail[];
}

export function PipelineStatusCard({ stages }: PipelineStatusCardProps) {
  return (
    <div 
      className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5 space-y-4"
      id="component-pipeline-status"
    >
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <span className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
          <Award className="w-4 h-4 text-blue-600" />
          Opportunity stage volume mapping
        </span>
        <span className="text-[9px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-mono font-bold border border-blue-150">
          Conversion SLA OK
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {stages.map((stg, index) => (
          <div key={index} className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col justify-between hover:shadow-2xs transition">
            <div className="space-y-1">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-widest leading-none">
                STAGE 0{index + 1}
              </span>
              <span className="text-slate-850 font-extrabold text-xs block truncate leading-tight">
                {stg.name}
              </span>
            </div>

            <div className="mt-4 flex items-baseline gap-1.5">
              <span className="text-xl font-mono text-[#0F172A] font-black leading-none">
                {stg.leadsCount}
              </span>
              <span className="text-[10px] text-slate-450 font-bold leading-none">leads tracked</span>
            </div>

            {/* Inner tiny progress horizontal line */}
            <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-3">
              <div 
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${stg.volumePercent}%` }}
              />
            </div>

            <span className="text-[9px] text-[#64748B] block mt-1.5 font-bold">
              占据 {stg.volumePercent}% 核心转化流
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
