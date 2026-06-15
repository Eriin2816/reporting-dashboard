import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  lastSyncTime: number | null;
  onRetry: () => void;
}

function fmtTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHrs < 24) {
    const mins = diffMins % 60;
    return mins > 0 ? `${diffHrs}h ${mins}m ago` : `${diffHrs}h ago`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

export default function OfflineBanner({ lastSyncTime, onRetry }: OfflineBannerProps) {
  return (
    <div className="flex items-center gap-3 bg-amber-50 border border-amber-300 rounded-xl px-4 py-3 no-print">
      <WifiOff className="w-4 h-4 text-amber-600 shrink-0" />
      <div className="flex-1 min-w-0">
        <span className="text-xs font-bold text-amber-900">
          Offline — showing cached snapshot
        </span>
        {lastSyncTime && (
          <span className="text-[10px] text-amber-700 font-semibold ml-1.5">
            (last sync: {fmtTime(lastSyncTime)})
          </span>
        )}
        {!lastSyncTime && (
          <span className="text-[10px] text-amber-600 ml-1.5">No cached data available yet.</span>
        )}
      </div>
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-[10px] font-bold text-amber-800 hover:text-amber-900 bg-amber-100 hover:bg-amber-200 border border-amber-300 px-2.5 py-1 rounded-lg transition cursor-pointer shrink-0"
      >
        <RefreshCw className="w-3 h-3" /> Retry
      </button>
    </div>
  );
}
