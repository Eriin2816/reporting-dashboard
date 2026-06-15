import React, { useState, useEffect, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, Users, MousePointerClick, RefreshCw,
  LinkIcon, Unlink, ChevronDown, AlertCircle, CheckCircle2, ExternalLink
} from 'lucide-react';
import { IntegrationStatus, GA4Report } from '../types';

interface GA4Property {
  propertyId: string;
  displayName: string;
  accountName: string;
}

interface GoogleAnalyticsPanelProps {
  integration: IntegrationStatus | null;
  ga4Report: GA4Report | null;
  isLoading: boolean;
  token?: string;
  onRefresh: () => void;
}

const GA4_CHANNEL_COLORS: Record<string, string> = {
  'Organic Search': '#1D4ED8',
  'Direct': '#0891B2',
  'Paid Search': '#7C3AED',
  'Social': '#DB2777',
  'Email': '#D97706',
  'Referral': '#059669',
  'Unassigned': '#94A3B8',
};
function channelColor(ch: string) {
  return GA4_CHANNEL_COLORS[ch] || '#64748B';
}

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-5">
      <div className="flex justify-between items-start mb-3">
        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl border border-blue-100">{icon}</div>
      </div>
      <span className="text-[#64748B] text-xs font-bold block uppercase tracking-wider mb-1">{label}</span>
      <div className="text-2xl font-extrabold text-[#0F172A] tracking-tight">{value}</div>
      {sub && <span className="text-[10px] text-[#64748B] block mt-1 font-semibold">{sub}</span>}
    </div>
  );
}

export default function GoogleAnalyticsPanel({ integration, ga4Report, isLoading, token, onRefresh }: GoogleAnalyticsPanelProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [properties, setProperties] = useState<GA4Property[] | null>(null);
  const [isFetchingProps, setIsFetchingProps] = useState(false);
  const [selectedPropId, setSelectedPropId] = useState('');
  const [isSavingProp, setIsSavingProp] = useState(false);
  const [propError, setPropError] = useState<string | null>(null);
  const popupRef = useRef<Window | null>(null);
  const pollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const statusPollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const connectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeToken = token || localStorage.getItem('saas_token') || '';
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json', 'x-auth-token': activeToken };

  const isConnected = integration?.status === 'CONNECTED';
  const hasProperty = isConnected && !!integration?.propertyId;

  // Cleanup all timers on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
      if (statusPollRef.current) clearInterval(statusPollRef.current);
      if (connectTimeoutRef.current) clearTimeout(connectTimeoutRef.current);
    };
  }, []);

  // Fetch properties when connected but no property selected yet
  useEffect(() => {
    if (!isConnected || hasProperty || isFetchingProps || properties) return;
    setIsFetchingProps(true);
    fetch(`/api/integrations/google/properties?_t=${Date.now()}`, {
      headers: { 'x-auth-token': activeToken },
      cache: 'no-store'
    })
      .then(r => r.json())
      .then(d => {
        if (d.status === 'success') setProperties(d.properties || []);
        else setPropError(d.error || 'Failed to load properties.');
      })
      .catch(() => setPropError('Failed to load GA4 properties.'))
      .finally(() => setIsFetchingProps(false));
  }, [isConnected, hasProperty]);

  // Poll backend for CONNECTED status — works even when window.opener is null (GHL iframe)
  const startStatusPolling = () => {
    if (statusPollRef.current) clearInterval(statusPollRef.current);
    statusPollRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/integrations/status?_t=${Date.now()}`, {
          headers: { 'x-auth-token': activeToken },
          cache: 'no-store'
        });
        if (!res.ok) return;
        const data = await res.json();
        const ga4 = (data.integrations || []).find((i: any) => i.provider === 'google_analytics');
        if (ga4?.status === 'CONNECTED') {
          stopConnect();
          onRefresh();
        }
      } catch { /* continue polling */ }
    }, 2000);
  };

  const stopConnect = () => {
    setIsConnecting(false);
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null; }
    if (statusPollRef.current) { clearInterval(statusPollRef.current); statusPollRef.current = null; }
    if (connectTimeoutRef.current) { clearTimeout(connectTimeoutRef.current); connectTimeoutRef.current = null; }
    try { popupRef.current?.close(); } catch {}
  };

  const handleConnect = async () => {
    setIsConnecting(true);
    setConnectError(null);
    try {
      const res = await fetch('/api/integrations/google/auth', { headers: authHeaders, cache: 'no-store' });
      const data = await res.json();
      if (!res.ok || !data.authUrl) {
        setIsConnecting(false);
        setConnectError(data.error || 'Failed to get authorization URL. Check server configuration.');
        return;
      }

      const popup = window.open(data.authUrl, 'ga4_auth', 'width=600,height=700');
      popupRef.current = popup;

      if (!popup) {
        setIsConnecting(false);
        setConnectError('Popup was blocked. Allow popups for this site and try again.');
        return;
      }

      // Fast-path: postMessage (works on standalone URL; may be null in GHL iframe)
      const msgHandler = (e: MessageEvent) => {
        if (e.data?.type === 'ga4_connected') {
          window.removeEventListener('message', msgHandler);
          stopConnect();
          onRefresh();
        } else if (e.data?.type === 'ga4_error') {
          window.removeEventListener('message', msgHandler);
          stopConnect();
          setConnectError(`Connection failed: ${e.data.error || 'Unknown error'}`);
        }
      };
      window.addEventListener('message', msgHandler);

      // Reliable path: poll backend status every 2s — works regardless of postMessage/opener
      startStatusPolling();

      // Detect popup closed without completing (user cancelled)
      pollIntervalRef.current = setInterval(() => {
        if (popup.closed) {
          clearInterval(pollIntervalRef.current!);
          pollIntervalRef.current = null;
          window.removeEventListener('message', msgHandler);
          // Give status poll one extra cycle to catch a just-completed flow
          setTimeout(() => {
            if (statusPollRef.current) {
              // Still polling = not yet connected; do one final check then give up
              fetch(`/api/integrations/status?_t=${Date.now()}`, {
                headers: { 'x-auth-token': activeToken }, cache: 'no-store'
              })
                .then(r => r.json())
                .then(d => {
                  const ga4 = (d.integrations || []).find((i: any) => i.provider === 'google_analytics');
                  if (ga4?.status === 'CONNECTED') {
                    stopConnect();
                    onRefresh();
                  } else {
                    stopConnect();
                    // Popup closed without connecting — silent cancel, no error shown
                  }
                })
                .catch(() => stopConnect());
            }
          }, 1500);
        }
      }, 500);

      // Hard timeout after 5 minutes
      connectTimeoutRef.current = setTimeout(() => {
        window.removeEventListener('message', msgHandler);
        stopConnect();
        setConnectError('Connection timed out. Please try again.');
      }, 5 * 60 * 1000);

    } catch {
      setIsConnecting(false);
      setConnectError('Failed to start Google OAuth flow. Please try again.');
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Google Analytics? This will remove the stored tokens and you will need to reconnect.')) return;
    setIsDisconnecting(true);
    try {
      await fetch('/api/integrations/google', { method: 'DELETE', headers: authHeaders });
      onRefresh();
    } catch {
      alert('Failed to disconnect.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const handleSaveProperty = async () => {
    if (!selectedPropId) return;
    setIsSavingProp(true);
    try {
      const chosen = properties?.find(p => p.propertyId === selectedPropId);
      await fetch('/api/integrations/google/property', {
        method: 'POST', headers: authHeaders,
        body: JSON.stringify({ propertyId: selectedPropId, propertyName: chosen?.displayName || selectedPropId })
      });
      onRefresh();
    } catch {
      alert('Failed to save property.');
    } finally {
      setIsSavingProp(false);
    }
  };

  // ── Section header (shared across all states) ──────────────────────────────
  const SectionHeader = () => (
    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
      <div className="flex items-center gap-3">
        {/* GA4 logo-color accent */}
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs"
          style={{ background: 'linear-gradient(135deg,#E37400 0%,#FBBC04 100%)' }}>
          G
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#0F172A]">Google Analytics 4</h3>
          <p className="text-[10px] text-[#64748B] font-medium">Website traffic &amp; conversion data from your GA4 property</p>
        </div>
        {isConnected && (
          <span className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="w-3 h-3" /> Connected
          </span>
        )}
      </div>
      {isConnected && (
        <button
          onClick={handleDisconnect}
          disabled={isDisconnecting}
          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 px-2.5 py-1 rounded-lg transition cursor-pointer"
        >
          <Unlink className="w-3 h-3" />
          {isDisconnecting ? 'Disconnecting...' : 'Disconnect'}
        </button>
      )}
    </div>
  );

  // ── NOT CONNECTED ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6" id="ga4-integration-panel">
        <SectionHeader />

        {/* Error banner */}
        {connectError && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{connectError}</span>
            <button onClick={() => setConnectError(null)} className="ml-auto text-red-400 hover:text-red-600 font-black cursor-pointer">×</button>
          </div>
        )}

        {/* Connecting progress banner */}
        {isConnecting && (
          <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-200 text-blue-800 rounded-lg p-3 mb-4 text-xs font-semibold">
            <RefreshCw className="w-4 h-4 shrink-0 animate-spin text-blue-500" />
            <span>Waiting for Google authorization… Complete the sign-in in the popup window.</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
          <div className="flex-1 space-y-3">
            <p className="text-sm text-slate-700 font-semibold leading-relaxed">
              Connect your GA4 property to see website sessions, users, channel breakdowns, and top landing pages — all scoped to the same date range as your other dashboards.
            </p>
            <ul className="text-xs text-slate-500 space-y-1 font-medium">
              <li className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> Sessions, users &amp; new users</li>
              <li className="flex items-center gap-1.5"><MousePointerClick className="w-3.5 h-3.5 text-blue-500" /> Conversion events</li>
              <li className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-500" /> Channel &amp; source breakdown</li>
              <li className="flex items-center gap-1.5"><ExternalLink className="w-3.5 h-3.5 text-blue-500" /> Top landing pages with bounce rate</li>
            </ul>
          </div>
          <button
            onClick={isConnecting ? stopConnect : handleConnect}
            className={`shrink-0 flex items-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition cursor-pointer ${
              isConnecting
                ? 'bg-slate-200 text-slate-600 hover:bg-slate-300 shadow-none'
                : 'bg-[#1D4ED8] hover:bg-[#1e40af] text-white shadow-blue-500/20'
            }`}
          >
            {isConnecting ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Cancel</>
            ) : (
              <><LinkIcon className="w-4 h-4" /> Connect Google Analytics</>
            )}
          </button>
        </div>
      </div>
    );
  }

  // ── CONNECTED, NO PROPERTY ────────────────────────────────────────────────
  if (!hasProperty) {
    return (
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6" id="ga4-integration-panel">
        <SectionHeader />
        <div className="space-y-4 max-w-lg">
          <p className="text-sm text-slate-700 font-semibold">
            Select the GA4 property to pull data from.
          </p>
          {propError && (
            <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              {propError}
            </div>
          )}
          {isFetchingProps ? (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
              Loading your GA4 properties…
            </div>
          ) : properties && properties.length > 0 ? (
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <select
                  value={selectedPropId}
                  onChange={e => setSelectedPropId(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 rounded-lg py-2 px-3 pr-8 text-xs font-semibold text-slate-700 focus:outline-none appearance-none cursor-pointer"
                >
                  <option value="">— Choose a property —</option>
                  {properties.map(p => (
                    <option key={p.propertyId} value={p.propertyId}>
                      {p.displayName} ({p.accountName}) · ID: {p.propertyId}
                    </option>
                  ))}
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
              </div>
              <button
                onClick={handleSaveProperty}
                disabled={!selectedPropId || isSavingProp}
                className="shrink-0 bg-[#1D4ED8] hover:bg-[#1e40af] disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold px-4 py-2 rounded-lg text-xs transition cursor-pointer"
              >
                {isSavingProp ? 'Saving…' : 'Use This Property'}
              </button>
            </div>
          ) : properties?.length === 0 ? (
            <div className="text-xs text-slate-500 bg-slate-50 border border-slate-200 p-3 rounded-lg">
              No GA4 properties found for the connected Google account. Make sure the account has at least one GA4 property.
            </div>
          ) : null}
        </div>
      </div>
    );
  }

  // ── CONNECTED + PROPERTY SELECTED ─────────────────────────────────────────
  const report = ga4Report;

  if (isLoading || !report) {
    return (
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6" id="ga4-integration-panel">
        <SectionHeader />
        <div className="flex items-center gap-3 py-12 justify-center">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading GA4 data…</span>
        </div>
      </div>
    );
  }

  const maxSessions = Math.max(...report.channelBreakdown.map(c => c.sessions), 1);

  return (
    <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6 space-y-6" id="ga4-integration-panel">
      <SectionHeader />

      {/* Source / property badge row */}
      <div className="flex flex-wrap items-center gap-2 -mt-2">
        <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
          report.source === 'live'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${report.source === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {report.source === 'live' ? 'Live GA4 Data' : 'Sample Data'}
        </span>
        <span className="text-[10px] text-slate-400 font-mono">
          Property: {integration?.propertyName || integration?.propertyId}
        </span>
        {report.warnings?.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            {report.warnings[0]}
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Sessions" value={report.sessions.toLocaleString()} sub="Total website sessions" />
        <KpiCard icon={<Users className="w-5 h-5" />} label="Users" value={report.users.toLocaleString()} sub="Total unique users" />
        <KpiCard icon={<ExternalLink className="w-5 h-5" />} label="New Users" value={report.newUsers.toLocaleString()} sub={`${report.users > 0 ? Math.round((report.newUsers / report.users) * 100) : 0}% of total users`} />
        <KpiCard icon={<MousePointerClick className="w-5 h-5" />} label="Conversions" value={report.conversions.toLocaleString()} sub={`${report.sessions > 0 ? ((report.conversions / report.sessions) * 100).toFixed(1) : 0}% conversion rate`} />
      </div>

      {/* Channel breakdown chart + top pages */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Channel bar chart */}
        <div className="lg:col-span-3 bg-[#F8FAFC] border border-slate-200 rounded-xl p-5">
          <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-4">Sessions by Channel</h4>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={report.channelBreakdown}
                layout="vertical"
                margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
                <XAxis type="number" stroke="#94A3B8" fontSize={9} tickLine={false} />
                <YAxis type="category" dataKey="channel" stroke="#64748B" fontSize={9} tickLine={false} width={95} />
                <Tooltip
                  contentStyle={{ fontSize: 11, border: '1px solid #E2E8F0', borderRadius: 8 }}
                  formatter={(val: any, name: string) => [val.toLocaleString(), name]}
                />
                <Bar dataKey="sessions" name="Sessions" radius={[0, 4, 4, 0]}
                  fill="#1D4ED8"
                  label={{ position: 'right', fontSize: 9, fill: '#64748B', formatter: (v: number) => v > 0 ? v.toLocaleString() : '' }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          {/* Channel legend dots */}
          <div className="flex flex-wrap gap-2 mt-3">
            {report.channelBreakdown.map(c => (
              <span key={c.channel} className="flex items-center gap-1 text-[9px] text-slate-600 font-semibold">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: channelColor(c.channel) }} />
                {c.channel}
              </span>
            ))}
          </div>
        </div>

        {/* Top landing pages */}
        <div className="lg:col-span-2 bg-[#F8FAFC] border border-slate-200 rounded-xl p-5">
          <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-4">Top Landing Pages</h4>
          <div className="space-y-2.5">
            {report.topLandingPages.slice(0, 8).map((pg, i) => {
              const pct = Math.round((pg.sessions / maxSessions) * 100);
              return (
                <div key={i} className="space-y-0.5">
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-semibold text-slate-700 truncate max-w-[150px]" title={pg.page}>{pg.page}</span>
                    <span className="font-mono text-slate-500 shrink-0 ml-2">{pg.sessions.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0 w-10 text-right">
                      {(pg.bounceRate * 100).toFixed(0)}% br
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
          <p className="text-[9px] text-slate-400 mt-3 font-medium">br = bounce rate</p>
        </div>
      </div>

      {/* Channel conversion table */}
      {/* Mobile cards */}
      <div className="sm:hidden rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {report.channelBreakdown.map((ch, i) => (
          <div key={i} className="p-3.5 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: channelColor(ch.channel) }} />
                <span className="font-semibold text-slate-700 text-xs">{ch.channel}</span>
              </div>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ch.conversions > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'}`}>
                {ch.sessions > 0 ? ((ch.conversions / ch.sessions) * 100).toFixed(1) : '0.0'}% conv.
              </span>
            </div>
            <div className="grid grid-cols-3 gap-1 text-[11px]">
              <div className="flex justify-between"><span className="text-slate-500">Sessions</span><span className="font-mono text-slate-700">{ch.sessions.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Users</span><span className="font-mono text-slate-500">{ch.users.toLocaleString()}</span></div>
              <div className="flex justify-between"><span className="text-slate-500">Conv.</span><span className="font-mono font-bold text-slate-700">{ch.conversions.toLocaleString()}</span></div>
            </div>
          </div>
        ))}
      </div>
      {/* Desktop table */}
      <div className="hidden sm:block overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-extrabold uppercase tracking-wider text-[9px]">
              <th className="py-2.5 px-4">Channel</th>
              <th className="py-2.5 px-4 text-right">Sessions</th>
              <th className="py-2.5 px-4 text-right">Users</th>
              <th className="py-2.5 px-4 text-right">Conversions</th>
              <th className="py-2.5 px-4 text-right">Conv. Rate</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {report.channelBreakdown.map((ch, i) => (
              <tr key={i} className="hover:bg-slate-50 transition">
                <td className="py-2.5 px-4">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ background: channelColor(ch.channel) }} />
                    <span className="font-semibold text-slate-700">{ch.channel}</span>
                  </div>
                </td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-700">{ch.sessions.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-500">{ch.users.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-right font-mono text-slate-700 font-bold">{ch.conversions.toLocaleString()}</td>
                <td className="py-2.5 px-4 text-right">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${ch.conversions > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'}`}>
                    {ch.sessions > 0 ? ((ch.conversions / ch.sessions) * 100).toFixed(1) : '0.0'}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
