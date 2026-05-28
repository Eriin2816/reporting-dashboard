/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  RefreshCw, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  Database,
  CheckCircle,
  FileQuestion,
  Lightbulb,
  ShieldCheck,
  CheckCircle2,
  Server
} from 'lucide-react';

// ==========================================
// 1. DATA FRESHNESS BADGE
// ==========================================
interface DataFreshnessBadgeProps {
  generatedAt: string;
  isStale?: boolean;
}

export function DataFreshnessBadge({ generatedAt, isStale = false }: DataFreshnessBadgeProps) {
  const formattedTime = new Date(generatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return (
    <div 
      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border ${
        isStale 
          ? 'bg-amber-50 text-amber-700 border-amber-200' 
          : 'bg-emerald-50 text-emerald-700 border-emerald-250'
      }`}
      id="component-freshness-badge"
    >
      <Clock className="w-3 h-3 text-current" />
      <span>
        {isStale ? `Stale: Compiled ${formattedTime}` : `Synced at ${formattedTime}`}
      </span>
    </div>
  );
}

// ==========================================
// 2. MOCK DATA BADGE
// ==========================================
interface MockDataBadgeProps {
  mode: 'MOCK' | 'LIVE';
}

export function MockDataBadge({ mode }: MockDataBadgeProps) {
  const isLive = mode === 'LIVE';
  return (
    <div 
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-mono border ${
        isLive 
          ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200 shadow-5xs' 
          : 'bg-amber-50/90 text-amber-800 border-amber-250'
      }`}
      id="component-mock-badge"
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
      <span>{isLive ? 'LIVE DATASTREAM' : 'MOCK PREVIEW'}</span>
    </div>
  );
}

// ==========================================
// 3. SYNC METRICS BUTTON
// ==========================================
interface SyncMetricsButtonProps {
  onSync: () => void;
  isSyncing: boolean;
  label?: string;
}

export function SyncMetricsButton({ onSync, isSyncing, label = "Sync HighLevel Metrics" }: SyncMetricsButtonProps) {
  return (
    <button
      onClick={onSync}
      disabled={isSyncing}
      className="flex items-center justify-center gap-2 text-xs bg-white text-slate-700 border border-slate-205 hover:bg-slate-50 hover:text-slate-900 disabled:bg-slate-50 disabled:text-slate-400 px-3.5 py-2 rounded-lg font-bold shadow-xs transition cursor-pointer disabled:cursor-not-allowed"
      id="component-sync-btn"
    >
      <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-blue-600' : 'text-slate-500'}`} />
      <span>{isSyncing ? 'Synchronizing CRM...' : label}</span>
    </button>
  );
}

// ==========================================
// 4. LOADING SKELETON
// ==========================================
interface LoadingSkeletonProps {
  variant?: 'card' | 'table' | 'text';
}

export function LoadingSkeleton({ variant = 'card' }: LoadingSkeletonProps) {
  if (variant === 'text') {
    return (
      <div className="space-y-2 animate-pulse w-full">
        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
        <div className="h-2 bg-slate-100 rounded w-2/3"></div>
      </div>
    );
  }

  if (variant === 'table') {
    return (
      <div className="space-y-3 animate-pulse border border-slate-100 rounded-xl p-5 bg-white">
        <div className="h-4 bg-slate-200 rounded w-1/4 mb-4"></div>
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-4 items-center justify-between border-t border-slate-50 pt-3">
            <div className="h-3 bg-slate-100 rounded w-1/4"></div>
            <div className="h-3 bg-slate-100 rounded w-1/6"></div>
            <div className="h-3 bg-slate-100 rounded w-1/6"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-150 p-5 rounded-xl shadow-xs animate-pulse space-y-4">
      <div className="flex justify-between">
        <div className="w-10 h-10 bg-slate-100 rounded-lg"></div>
        <div className="w-16 h-4 bg-slate-100 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-150 rounded w-1/2"></div>
        <div className="h-7 bg-slate-200 rounded w-3/4"></div>
      </div>
      <div className="h-2 bg-slate-100 rounded w-5/6"></div>
    </div>
  );
}

// ==========================================
// 5. EMPTY STATE
// ==========================================
interface EmptyStateProps {
  title?: string;
  description?: string;
  onActionClick?: () => void;
  actionLabel?: string;
}

export function EmptyState({ 
  title = "No Data Discovered", 
  description = "No active campaign records or leads match the selected filter parameters.", 
  onActionClick,
  actionLabel = "Retry synchronization"
}: EmptyStateProps) {
  return (
    <div 
      className="bg-white border border-[#E2E8F0] rounded-xl p-12 text-center max-w-md mx-auto space-y-4 flex flex-col items-center"
      id="component-empty-state"
    >
      <div className="p-4 bg-slate-50 border border-slate-100 text-slate-400 rounded-full">
        <FileQuestion className="w-10 h-10" />
      </div>
      <div className="space-y-1">
        <h4 className="text-slate-800 font-extrabold text-sm">{title}</h4>
        <p className="text-[11px] text-slate-500 leading-normal">{description}</p>
      </div>
      {onActionClick && (
        <button
          onClick={onActionClick}
          className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg transition shadow-xs cursor-pointer"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ==========================================
// 6. ERROR STATE
// ==========================================
interface ErrorStateProps {
  title?: string;
  errorMessage: string;
  onRetry?: () => void;
}

export function ErrorState({ 
  title = "SaaS Synchronize Connection Warning", 
  errorMessage, 
  onRetry 
}: ErrorStateProps) {
  return (
    <div 
      className="p-5 bg-rose-50 border border-rose-250 text-rose-800 rounded-xl flex items-start gap-3.5 max-w-2xl mx-auto shadow-xs"
      id="component-error-state"
    >
      <div className="p-2.5 bg-rose-100 text-rose-700 rounded-lg shrink-0">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="space-y-1.5 flex-1">
        <h4 className="font-extrabold text-xs text-rose-900 leading-tight block">{title}</h4>
        <p className="text-[11px] text-rose-850 opacity-95 leading-normal">{errorMessage}</p>
        
        {onRetry && (
          <div className="pt-1.5">
            <button
              onClick={onRetry}
              className="px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-[11px] transition cursor-pointer"
            >
              Retry Connection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ==========================================
// 7. INSIGHT WIDGET
// ==========================================
interface InsightWidgetProps {
  insight: string;
  sourceLabel?: string;
}

export function InsightWidget({ insight, sourceLabel = "GHL Intelligence Snippet" }: InsightWidgetProps) {
  return (
    <div 
      className="bg-blue-50 border border-blue-150 border-dashed rounded-xl p-4 flex items-start gap-2 text-blue-805"
      id="component-insight-widget"
    >
      <Lightbulb className="w-4 h-4 text-blue-600 shrink-0 mt-0.5 animate-pulse" />
      <div className="space-y-1 text-left">
        <span className="text-[10px] font-black uppercase tracking-wider block text-blue-850">{sourceLabel}</span>
        <p className="text-[11px] font-medium leading-relaxed opacity-95">{insight}</p>
      </div>
    </div>
  );
}

// ==========================================
// 8. INTEGRATION STATUS CARD
// ==========================================
interface IntegrationStatusCardProps {
  locationName: string;
  locationId: string;
  mode: 'MOCK' | 'LIVE';
}

export function IntegrationStatusCard({ locationName, locationId, mode }: IntegrationStatusCardProps) {
  return (
    <div 
      className="bg-[#0f172a] text-white border border-slate-800 rounded-xl p-4 flex items-center justify-between"
      id="component-integration-status"
    >
      <div className="flex items-center gap-3">
        <div className="p-2.5 bg-slate-900 text-blue-400 rounded-lg border border-slate-800">
          <Server className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[9px] uppercase tracking-wider text-slate-400 font-extrabold block">Connected GHL Sub-Account</span>
          <h4 className="text-white text-xs font-black block mt-0.5">{locationName}</h4>
          <span className="text-[9px] font-mono text-slate-500 block">{locationId}</span>
        </div>
      </div>

      <div className="text-right">
        <span className={`inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded ${
          mode === 'LIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
        }`}>
          {mode === 'LIVE' ? 'ONLINE SYNC' : 'PREVIEW MODE'}
        </span>
      </div>
    </div>
  );
}
