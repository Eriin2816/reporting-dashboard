import React, { useState } from 'react';
import {
  DollarSign, Eye, MousePointerClick, TrendingUp,
  RefreshCw, LinkIcon, Unlink, AlertCircle, CheckCircle2, Users
} from 'lucide-react';
import { IntegrationStatus, MetaAdsReport } from '../types';

interface MetaAdsPanelProps {
  integration: IntegrationStatus | null;
  metaReport: MetaAdsReport | null;
  isLoading: boolean;
  token?: string;
  onRefresh: () => void;
}

function fmt$(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n.toFixed(2)}`; }
function fmtN(n: number) { return n >= 1000000 ? `${(n / 1000000).toFixed(1)}M` : n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n); }

function KpiCard({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
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

export default function MetaAdsPanel({ integration, metaReport, isLoading, token, onRefresh }: MetaAdsPanelProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [accountIdInput, setAccountIdInput] = useState('');

  const activeToken = token || localStorage.getItem('saas_token') || '';
  const authHeaders: Record<string, string> = { 'Content-Type': 'application/json', 'x-auth-token': activeToken };

  const isConnected = integration?.status === 'CONNECTED';

  const handleConnect = async () => {
    if (!tokenInput.trim() || !accountIdInput.trim()) {
      setConnectError('Both the System User Token and Ad Account ID are required.');
      return;
    }
    setIsConnecting(true);
    setConnectError(null);
    try {
      const res = await fetch('/api/integrations/meta/connect', {
        method: 'POST',
        headers: authHeaders,
        body: JSON.stringify({ accessToken: tokenInput.trim(), adAccountId: accountIdInput.trim() }),
      });
      const data = await res.json();
      if (!res.ok || data.status !== 'success') {
        setConnectError(data.error || 'Connection failed. Check your token and account ID.');
        return;
      }
      setTokenInput('');
      setAccountIdInput('');
      onRefresh();
    } catch {
      setConnectError('Network error. Please try again.');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Disconnect Meta Ads? The stored token will be removed and you will need to reconnect.')) return;
    setIsDisconnecting(true);
    try {
      await fetch('/api/integrations/meta', { method: 'DELETE', headers: authHeaders });
      onRefresh();
    } catch {
      alert('Failed to disconnect.');
    } finally {
      setIsDisconnecting(false);
    }
  };

  const SectionHeader = () => (
    <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-5">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center font-black text-white text-xs"
          style={{ background: 'linear-gradient(135deg,#1877F2 0%,#0166D6 100%)' }}>
          f
        </div>
        <div>
          <h3 className="text-sm font-extrabold text-[#0F172A]">Meta Ads</h3>
          <p className="text-[10px] text-[#64748B] font-medium">Facebook &amp; Instagram ad spend, reach, and campaign performance</p>
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
          {isDisconnecting ? 'Disconnecting…' : 'Disconnect'}
        </button>
      )}
    </div>
  );

  // ── NOT CONNECTED ──────────────────────────────────────────────────────────
  if (!isConnected) {
    return (
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6" id="meta-ads-panel">
        <SectionHeader />

        {connectError && (
          <div className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-800 rounded-lg p-3 mb-4 text-xs font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
            <span>{connectError}</span>
            <button onClick={() => setConnectError(null)} className="ml-auto text-red-400 hover:text-red-600 font-black cursor-pointer">×</button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 space-y-3">
            <p className="text-sm text-slate-700 font-semibold leading-relaxed">
              Connect your Meta Ads account to see spend, impressions, CTR, ROAS, and per-campaign breakdowns — scoped to the same date range as your other dashboards.
            </p>
            <ul className="text-xs text-slate-500 space-y-1 font-medium">
              <li className="flex items-center gap-1.5"><DollarSign className="w-3.5 h-3.5 text-blue-500" /> Total spend, CPC, CPM</li>
              <li className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-blue-500" /> Impressions &amp; reach</li>
              <li className="flex items-center gap-1.5"><TrendingUp className="w-3.5 h-3.5 text-blue-500" /> ROAS &amp; cost per result</li>
              <li className="flex items-center gap-1.5"><MousePointerClick className="w-3.5 h-3.5 text-blue-500" /> Clicks &amp; CTR</li>
            </ul>
            <div className="text-[10px] text-slate-400 bg-slate-50 border border-slate-200 rounded-lg p-2.5 leading-relaxed">
              Requires a <strong className="text-slate-600">Meta System User token</strong> with <code className="text-blue-600">ads_read</code> permission and your Ad Account ID.
              Create one in <strong className="text-slate-600">Business Settings → System Users</strong>.
            </div>
          </div>

          <div className="lg:w-80 space-y-3">
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">System User Token</label>
              <input
                type="password"
                value={tokenInput}
                onChange={e => setTokenInput(e.target.value)}
                placeholder="EAAxxxxxxxxxxxxxxx..."
                className="w-full bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:outline-none rounded-lg py-2 px-3 text-xs font-mono text-slate-700 transition"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 block">Ad Account ID</label>
              <input
                type="text"
                value={accountIdInput}
                onChange={e => setAccountIdInput(e.target.value)}
                placeholder="123456789 or act_123456789"
                className="w-full bg-[#F8FAFC] border border-slate-200 hover:border-slate-300 focus:border-blue-400 focus:outline-none rounded-lg py-2 px-3 text-xs font-mono text-slate-700 transition"
              />
            </div>
            <button
              onClick={handleConnect}
              disabled={isConnecting || !tokenInput.trim() || !accountIdInput.trim()}
              className="w-full flex items-center justify-center gap-2 font-bold px-5 py-2.5 rounded-xl text-sm shadow-md transition cursor-pointer bg-[#1877F2] hover:bg-[#0d65d8] disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none text-white shadow-blue-500/20"
            >
              {isConnecting
                ? <><RefreshCw className="w-4 h-4 animate-spin" /> Connecting…</>
                : <><LinkIcon className="w-4 h-4" /> Connect Meta Ads</>}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── LOADING ────────────────────────────────────────────────────────────────
  if (isLoading || !metaReport) {
    return (
      <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6" id="meta-ads-panel">
        <SectionHeader />
        <div className="flex items-center gap-3 py-12 justify-center">
          <RefreshCw className="w-6 h-6 text-blue-600 animate-spin" />
          <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Loading Meta Ads data…</span>
        </div>
      </div>
    );
  }

  // ── CONNECTED + DATA ───────────────────────────────────────────────────────
  const r = metaReport;

  return (
    <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6 space-y-6" id="meta-ads-panel">
      <SectionHeader />

      {/* Source / account badge row */}
      <div className="flex flex-wrap items-center gap-2 -mt-2">
        <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border ${
          r.source === 'live'
            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
            : 'bg-amber-50 text-amber-700 border-amber-200'
        }`}>
          <span className={`w-1.5 h-1.5 rounded-full ${r.source === 'live' ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
          {r.source === 'live' ? 'Live Meta Data' : 'Sample Data'}
        </span>
        {r.adAccountName && (
          <span className="text-[10px] text-slate-400 font-mono">
            Account: {r.adAccountName}{r.adAccountId ? ` (act_${r.adAccountId})` : ''}
          </span>
        )}
        {r.warnings?.length > 0 && (
          <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
            <AlertCircle className="w-3 h-3" />
            {r.warnings[0]}
          </span>
        )}
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard icon={<DollarSign className="w-5 h-5" />} label="Total Spend" value={fmt$(r.spend)} sub={`$${r.cpc.toFixed(2)} CPC · $${r.cpm.toFixed(2)} CPM`} />
        <KpiCard icon={<Eye className="w-5 h-5" />} label="Impressions" value={fmtN(r.impressions)} sub={`${fmtN(r.reach)} reach · ${r.ctr.toFixed(2)}% CTR`} />
        <KpiCard icon={<MousePointerClick className="w-5 h-5" />} label="Conversions" value={String(r.conversions)} sub={r.conversions > 0 ? `$${r.costPerResult.toFixed(2)} cost/result` : 'No conversions tracked'} />
        <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="ROAS" value={`${r.roas.toFixed(2)}×`} sub={`$${r.spend > 0 ? (r.roas * r.spend).toFixed(0) : '0'} attributed revenue`} />
      </div>

      {/* Campaign breakdown table */}
      {r.campaigns.length > 0 && (
        <div>
          <h4 className="text-xs font-extrabold text-[#0F172A] uppercase tracking-wider mb-3">Campaign Performance</h4>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-[#E2E8F0] text-[#64748B] font-extrabold uppercase tracking-wider text-[9px]">
                  <th className="py-2.5 px-4">Campaign</th>
                  <th className="py-2.5 px-4 text-right">Spend</th>
                  <th className="py-2.5 px-4 text-right">Impressions</th>
                  <th className="py-2.5 px-4 text-right">Clicks</th>
                  <th className="py-2.5 px-4 text-right">CTR</th>
                  <th className="py-2.5 px-4 text-right">CPC</th>
                  <th className="py-2.5 px-4 text-right">Conv.</th>
                  <th className="py-2.5 px-4 text-right">ROAS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {r.campaigns.map((c, i) => (
                  <tr key={c.id || i} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 font-semibold text-slate-700 max-w-[200px] truncate">{c.name}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-700 font-bold">{fmt$(c.spend)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-500">{fmtN(c.impressions)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-600">{fmtN(c.clicks)}</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-500">{c.ctr.toFixed(2)}%</td>
                    <td className="py-2.5 px-4 text-right font-mono text-slate-500">${c.cpc.toFixed(2)}</td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.conversions > 0 ? 'bg-emerald-50 text-emerald-700' : 'text-slate-400'}`}>
                        {c.conversions}
                      </span>
                    </td>
                    <td className="py-2.5 px-4 text-right">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${c.roas >= 2 ? 'bg-blue-50 text-blue-700' : c.roas > 0 ? 'bg-amber-50 text-amber-700' : 'text-slate-400'}`}>
                        {c.roas > 0 ? `${c.roas.toFixed(2)}×` : '—'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
