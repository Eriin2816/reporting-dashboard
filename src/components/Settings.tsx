/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Key, 
  ToggleLeft, 
  ToggleRight, 
  Info, 
  RefreshCw, 
  Copy, 
  Check, 
  Send, 
  ShieldCheck, 
  HelpCircle,
  Clock,
  Database,
  Play,
  Trash2,
  AlertTriangle,
  FileCheck,
  Building,
  Lock,
  Eye,
  Server
} from 'lucide-react';
import { GHLAppConfig, UserRole } from '../types';

interface SettingsProps {
  config: GHLAppConfig;
  webhookLogs: { timestamp: string; source: string; event: string; payload: any }[];
  isSaving: boolean;
  onSaveConfig: (updated: Partial<GHLAppConfig>) => Promise<boolean>;
  onTriggerMockWebhook: (event: string) => Promise<void>;
  onRefresh: () => void;
  role?: string;
  token?: string;
}

export default function Settings({
  config: initialConfig,
  webhookLogs,
  isSaving,
  onSaveConfig,
  onTriggerMockWebhook,
  onRefresh,
  role = 'READ_ONLY',
  token
}: SettingsProps) {
  // Config loaded dynamically from backend to support workspace variables & diagnostics
  const [loadingConfig, setLoadingConfig] = useState(true);
  const [backendConfig, setBackendConfig] = useState<any>(null);
  
  // Local form inputs
  const [dataSourceMode, setDataSourceMode] = useState<'MOCK' | 'LIVE'>('MOCK');
  const [apiKey, setApiKey] = useState<string>('');
  const [locationId, setLocationId] = useState<string>('');
  const [cacheTtl, setCacheTtl] = useState<number>(15);
  const [allowAdminManageGHL, setAllowAdminManageGHL] = useState<boolean>(true);

  // Connection testing states
  const [testingConnection, setTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ status: 'success' | 'error'; message: string; details?: any } | null>(null);

  // Mode switching state
  const [switchingMode, setSwitchingMode] = useState(false);
  // Disconnect credentials state
  const [disconnecting, setDisconnecting] = useState(false);

  // Interface visual alerts
  const [copied, setCopied] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [activeEventMock, setActiveEventMock] = useState('contact.create');

  // Load backend configurations
  const loadGhlBackendConfig = async () => {
    setLoadingConfig(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['x-auth-token'] = token;
      }
      const res = await fetch('/api/ghl/config', { headers });
      if (res.ok) {
        const payload = await res.json();
        if (payload.status === 'success') {
          setBackendConfig(payload.data);
          // Update inputs
          setDataSourceMode(payload.data.dataSourceMode || 'MOCK');
          setApiKey(payload.data.apiKey || '');
          setLocationId(payload.data.locationId || '');
          setCacheTtl(payload.data.cacheTtlMinutes || 15);
          setAllowAdminManageGHL(payload.data.allowAdminManageGHL !== false);
        }
      }
    } catch (err) {
      console.error('Error fetching dynamic GHL settings:', err);
    } finally {
      setLoadingConfig(false);
    }
  };

  useEffect(() => {
    loadGhlBackendConfig();
  }, [token]);

  // Determine permissions
  const canUserManage = backendConfig?.canManage ?? (
    role === UserRole.SUPER_ADMIN || 
    role === UserRole.WORKSPACE_OWNER || 
    (role === UserRole.ADMIN && allowAdminManageGHL)
  );

  const handleCopyWebhook = () => {
    const url = backendConfig?.webhookUrl || initialConfig.webhookUrl;
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Switch mode directly
  const handleSwitchMode = async (mode: 'MOCK' | 'LIVE') => {
    if (!canUserManage) return;
    setSwitchingMode(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-auth-token'] = token;

      const res = await fetch('/api/ghl/switch-mode', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode })
      });
      if (res.ok) {
        setDataSourceMode(mode);
        await loadGhlBackendConfig();
        onRefresh(); // refresh reporting metric context
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSwitchingMode(false);
    }
  };

  // Test live connection API
  const handleTestConnection = async () => {
    setTestingConnection(true);
    setTestResult(null);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-auth-token'] = token;

      const res = await fetch('/api/ghl/test-connection', {
        method: 'POST',
        headers,
        body: JSON.stringify({ apiKey, locationId })
      });

      const payload = await res.json();
      if (res.ok && payload.status === 'success') {
        setTestResult({
          status: 'success',
          message: payload.message,
          details: payload.details
        });
      } else {
        setTestResult({
          status: 'error',
          message: payload.error || 'Connection Failed to respond.'
        });
      }
    } catch (err: any) {
      setTestResult({
        status: 'error',
        message: err.message || 'Network Timeout communicating with server and API gateway.'
      });
    } finally {
      setTestingConnection(false);
    }
  };

  // Disconnect settings securely
  const handleDisconnect = async () => {
    if (!window.confirm('Are you absolutely sure you want to delete GHL token coordinates? This will instantly revert reporting mode to mock data.')) {
      return;
    }
    setDisconnecting(true);
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-auth-token'] = token;

      const res = await fetch('/api/ghl/disconnect', {
        method: 'POST',
        headers
      });
      if (res.ok) {
        setApiKey('');
        setLocationId('');
        setDataSourceMode('MOCK');
        setTestResult(null);
        await loadGhlBackendConfig();
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setDisconnecting(false);
    }
  };

  // Submit Save credentials
  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canUserManage) return;
    setSaveError(null);
    
    try {
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['x-auth-token'] = token;

      // Call save connection
      const saveRes = await fetch('/api/ghl/save-connection', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          apiKey,
          locationId,
          allowAdminManageGHL
        })
      });

      if (!saveRes.ok) {
        const errPayload = await saveRes.json();
        throw new Error(errPayload.error || 'Failed to update credentials.');
      }

      // Update source mode as well
      const modeRes = await fetch('/api/ghl/switch-mode', {
        method: 'POST',
        headers,
        body: JSON.stringify({ mode: dataSourceMode })
      });

      // Update TTL cache
      const ttlRes = await fetch('/api/ghl/update-cache-ttl', {
        method: 'POST',
        headers,
        body: JSON.stringify({ cacheTtlMinutes: cacheTtl })
      });

      setSaveSuccess(true);
      await loadGhlBackendConfig();
      onRefresh();
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err: any) {
      setSaveError(err.message || 'Failed saving workspace configuration.');
    }
  };

  if (loadingConfig) {
    return (
      <div className="flex flex-col items-center justify-center p-24 space-y-4">
        <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
        <p className="text-slate-500 text-sm font-medium">Resolving tenant GHL encryption profiles...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6" id="settings-tab-panel">
      {/* Top Profile Banner Header */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-850 p-6 rounded-2xl text-white shadow-md relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="z-10 space-y-1">
          <span className="p-1 px-2.2 rounded bg-blue-500/25 border border-blue-400/20 text-[10px] text-blue-300 tracking-wider font-extrabold uppercase inline-block">
            HighLevel Connection Hub
          </span>
          <h2 className="text-2xl font-bold tracking-tight">
            GHL V2 Integration Config
          </h2>
          <p className="text-slate-350 text-xs font-medium max-w-xl">
            Configure GHL scopes for reporting. Manage, test, and audit live GoHighLevel / HighLevel OAuth connections and Private API Tokens securely.
          </p>
        </div>
        <div className="z-10 flex gap-2">
          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-center min-w-[120px]">
            <span className="text-[9px] font-bold text-slate-300 block uppercase">Reporting Mode</span>
            <span className={`text-xs font-extrabold flex items-center justify-center gap-1.5 mt-1 ${dataSourceMode === 'LIVE' ? 'text-emerald-400' : 'text-amber-400'}`}>
              <Database className="w-3.5 h-3.5" />
              {dataSourceMode}
            </span>
          </div>

          <div className="bg-white/10 backdrop-blur-xs p-3 rounded-xl border border-white/10 text-center min-w-[120px]">
            <span className="text-[9px] font-bold text-slate-300 block uppercase">Health Status</span>
            <span className={`text-xs font-extrabold flex items-center justify-center gap-1.5 mt-1 ${backendConfig?.connectionStatus === 'CONNECTED' ? 'text-emerald-400' : 'text-rose-400'}`}>
              <Server className="w-3.5 h-3.5" />
              {backendConfig?.connectionStatus || 'DISCONNECTED'}
            </span>
          </div>
        </div>
      </div>

      {/* Role-based restriction alert or explanation */}
      {!canUserManage && (
        <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl flex items-start gap-3">
          <Lock className="w-5 h-5 text-indigo-600 shrink-0 mt-0.5" />
          <div>
            <span className="text-xs font-bold text-indigo-800 block">Read-Only Agent Privilege Active ({role})</span>
            <p className="text-[11px] text-indigo-600 leading-relaxed font-semibold mt-0.5">
              Your registered member account is authorized for read-only diagnostics view. Only Workspace Owners or authenticated Admins can redefine custom endpoint credentials and secrets tokens.
            </p>
          </div>
        </div>
      )}

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2-Span width): Core operational switcher and configurations form */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Integrated operational Switcher Mode block */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Play className="w-4 h-4 text-blue-600" />
              operational Reporting Engine
            </h3>
            <p className="text-slate-500 text-[11px]">
              Flip the dashboard pipeline selector. Choose between offline high-fidelity demo values, or hook up your actual HighLevel business coordinates.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 pt-1">
              {/* Mock Selector */}
              <button
                type="button"
                disabled={switchingMode || !canUserManage}
                onClick={() => handleSwitchMode('MOCK')}
                className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                  dataSourceMode === 'MOCK'
                    ? 'bg-amber-50/50 border-amber-500 ring-2 ring-amber-500/10'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                } ${(!canUserManage || switchingMode) ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">High-Fidelity MOCK</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${dataSourceMode === 'MOCK' ? 'bg-amber-500' : 'bg-slate-300'}`} />
                </div>
                <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                  Loads rapid, localized multi-timeframe analytics charts. Recommended for quick demos and scoping sandbox trials.
                </p>
              </button>

              {/* Live Selector */}
              <button
                type="button"
                disabled={switchingMode || !canUserManage}
                onClick={() => handleSwitchMode('LIVE')}
                className={`flex-1 p-4 rounded-xl border text-left transition-all ${
                  dataSourceMode === 'LIVE'
                    ? 'bg-emerald-50/40 border-emerald-500 ring-2 ring-emerald-500/10'
                    : 'bg-white border-slate-200 hover:bg-slate-50'
                } ${(!canUserManage || switchingMode) ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">LIVE GHL API V2</span>
                  <span className={`w-2.5 h-2.5 rounded-full ${dataSourceMode === 'LIVE' ? 'bg-emerald-505 bg-emerald-500' : 'bg-slate-300'}`} />
                </div>
                <p className="text-slate-500 text-[10px] leading-relaxed font-semibold">
                  Polls Contacts counts, Opportunity stages, and staff members calendars from LeadConnector GHL APIs dynamically.
                </p>
              </button>
            </div>
          </div>

          {/* Credentials Forms Block */}
          <form onSubmit={handleSaveCredentials} className="bg-white border border-slate-200 rounded-xl p-5 space-y-5 shadow-sm">
            <div className="flex justify-between items-center pb-2.5 border-b border-slate-200">
              <span className="flex items-center gap-2 text-slate-800 font-bold text-sm">
                <Database className="w-4 h-4 text-blue-600" />
                Integration Vault Inputs
              </span>
              <button
                type="button"
                onClick={loadGhlBackendConfig}
                className="p-1 px-2.5 text-[10px] bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded font-bold text-slate-600 transition-colors cursor-pointer"
              >
                Reload Active Config
              </button>
            </div>

            {/* Warnings Container of credentials */}
            {backendConfig?.warnings && backendConfig.warnings.length > 0 && (
              <div className="space-y-2">
                {backendConfig.warnings.map((warn: string, idx: number) => (
                  <div key={idx} className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-800 leading-relaxed font-semibold">
                      {warn}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Fields Container */}
            <div className="space-y-4">
              
              {/* API Key input line */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 flex justify-between items-center">
                  <span>LeadConnector API Private Key / Auth Token</span>
                  <span className="text-[10px] text-slate-400 font-medium">Starts with ghl_*</span>
                </label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                  <input
                    type="password"
                    disabled={!canUserManage}
                    placeholder={canUserManage ? "Enter GHL Private Token..." : "Locked Secure credentials"}
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 pl-10 pr-3 py-3 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>
              </div>

              {/* Coordinates line (Location and Cache TTL) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">GoHighLevel Location ID</label>
                  <input
                    type="text"
                    disabled={!canUserManage}
                    placeholder="e.g. loc_ghl_9x82d"
                    value={locationId}
                    onChange={(e) => setLocationId(e.target.value)}
                    className="w-full bg-white border border-slate-200 disabled:bg-slate-50 disabled:text-slate-400 px-3 py-3 rounded-lg text-xs font-mono text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Cache Timeout Frequency</label>
                  <select
                    disabled={!canUserManage}
                    value={cacheTtl}
                    onChange={(e) => setCacheTtl(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 disabled:bg-slate-50 rounded-lg px-3 py-3 text-xs text-slate-800 focus:outline-none focus:border-blue-500 shadow-xs cursor-pointer"
                  >
                    <option value="5">5 Minutes</option>
                    <option value="15">15 Minutes (Suggested limit)</option>
                    <option value="30">30 Minutes</option>
                    <option value="60">60 Minutes / 1 Hour</option>
                  </select>
                </div>
              </div>

              {/* Security Admin Permissions switcher */}
              {(role === UserRole.SUPER_ADMIN || role === UserRole.WORKSPACE_OWNER) && (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-800 block">Workspace Admin Permissions</span>
                    <span className="text-[10px] text-slate-500 font-semibold leading-normal mt-0.5 block">
                      Enable administrators (ADMIN) to update and modify GHL Private token parameters securely.
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setAllowAdminManageGHL(!allowAdminManageGHL)}
                    className="p-1 px-3 text-[10px] font-bold bg-white border border-slate-200 rounded cursor-pointer transition shadow-xs flex items-center gap-1.5"
                  >
                    {allowAdminManageGHL ? (
                      <>
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        Enabled Manage
                      </>
                    ) : (
                      <>
                        <span className="w-2 h-2 rounded-full bg-rose-500" />
                        Disabled Manage
                      </>
                    )}
                  </button>
                </div>
              )}

            </div>

            {/* Error alerts or save responses */}
            {saveSuccess && (
              <span className="p-2 px-3 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 font-bold text-xs flex items-center gap-1.5 animate-pulse">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Integration coordinates mapped and validated. Workspace cache refreshed.
              </span>
            )}
            {saveError && (
              <span className="p-2 px-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 font-bold text-xs block">
                Error: {saveError}
              </span>
            )}

            {/* Form actions and active verification */}
            <div className="pt-4 border-t border-slate-100 flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                {/* Connection Test button */}
                <button
                  type="button"
                  disabled={testingConnection}
                  onClick={handleTestConnection}
                  className="px-4 py-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {testingConnection ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      Testing connection...
                    </>
                  ) : (
                    <>
                      <FileCheck className="w-3.5 h-3.5 text-blue-600" />
                      Test Connection
                    </>
                  )}
                </button>

                {/* Secure severing button */}
                {backendConfig?.apiConnectedSince && canUserManage && (
                  <button
                    type="button"
                    disabled={disconnecting}
                    onClick={handleDisconnect}
                    className="px-4 py-2.5 rounded-lg bg-rose-50 hover:bg-rose-100 disabled:opacity-50 text-rose-700 text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Drop Credentials
                  </button>
                )}
              </div>

              {canUserManage && (
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-slate-100 text-white text-xs font-bold transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Save Setup Configuration'}
                </button>
              )}
            </div>

            {/* Connection Test diagnostics window overlay display */}
            {testResult && (
              <div className={`p-4 rounded-xl border mt-3 transition-all ${
                testResult.status === 'success' ? 'bg-emerald-50/50 border-emerald-200' : 'bg-rose-50/50 border-rose-200'
              }`}>
                <div className="flex items-center gap-2 mb-1">
                  {testResult.status === 'success' ? (
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-rose-600" />
                  )}
                  <span className={`text-xs font-extrabold capitalize ${testResult.status === 'success' ? 'text-emerald-800' : 'text-rose-800'}`}>
                    API Connection Test Result: {testResult.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 font-medium leading-relaxed">
                  {testResult.message}
                </p>

                {testResult.details && (
                  <div className="mt-3 grid grid-cols-2 gap-2 max-w-md">
                    <div className="bg-white/80 p-2 rounded-md border border-slate-100">
                      <span className="text-[9px] font-extrabold text-slate-400 block uppercase">Response Time</span>
                      <span className="text-xs font-extrabold text-slate-700">{testResult.details.responseTimeMs} ms</span>
                    </div>
                    <div className="bg-white/80 p-2 rounded-md border border-slate-100">
                      <span className="text-[9px] font-extrabold text-slate-400 block uppercase">IP Remaining Rates</span>
                      <span className="text-xs font-extrabold text-slate-700">
                        {testResult.details.rateLimits?.remaining} / {testResult.details.rateLimits?.limit}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </form>

          {/* Webhooks Logs sandboxing */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Workspace Intake Webhook URL</h3>
              <p className="text-[11px] text-slate-500 leading-normal block mt-0.5">
                Deliver dynamic CRM changes directly into the Reporting suite. Map the intake address on the GoHighLevel Developers portal.
              </p>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                readOnly
                value={backendConfig?.webhookUrl || initialConfig.webhookUrl}
                className="bg-slate-50 border border-slate-200 font-mono text-slate-500 p-2.5 rounded-lg text-xs flex-1 outline-none select-all"
              />
              <button
                type="button"
                onClick={handleCopyWebhook}
                className="bg-white border border-slate-200 hover:bg-slate-50 p-2.5 rounded-lg text-xs font-bold transition shadow-xs flex items-center justify-center min-w-[40px] cursor-pointer"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
              </button>
            </div>

            {/* Inflow simulation sandbox widget */}
            <div className="bg-slate-50 p-4 border border-slate-150 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-800">Dynamic UI Webhook Simulator</span>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Flipping events here notifies client dashboards instantly.
                  </p>
                </div>

                <div className="flex gap-2 truncate">
                  <select
                    value={activeEventMock}
                    onChange={(e) => setActiveEventMock(e.target.value)}
                    className="bg-white border border-slate-200 p-1.5 text-[10px] font-bold text-slate-800 rounded outline-none shadow-xs cursor-pointer"
                  >
                    <option value="contact.create">contact.create (New Lead)</option>
                    <option value="opportunity.update">opportunity.update (Won Lead)</option>
                    <option value="appointment.show">appointment.show (Show Rate)</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => onTriggerMockWebhook(activeEventMock)}
                    className="p-1.5 px-3 text-[10px] font-bold bg-blue-600 hover:bg-blue-700 text-white rounded cursor-pointer transition shadow-xs flex items-center gap-1 shrink-0"
                  >
                    <Send className="w-3 h-3" />
                    Fire Webhook
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* SUPER_ADMIN Workspace Master Feed dashboard */}
          {role === UserRole.SUPER_ADMIN && backendConfig?.allWorkspaceConnections && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
              <div className="flex justify-between items-center pb-2.5 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Super Admin Dashboard Connection Audit</h3>
                  <p className="text-[10px] text-slate-400">Systemwide diagnostic status overview across customer accounts database.</p>
                </div>
                <span className="bg-slate-100 text-slate-700 p-1 px-2.5 text-[10px] rounded font-extrabold uppercase">
                  Workspace Monitor count: {backendConfig.allWorkspaceConnections.length}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-medium text-slate-600 border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-100 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="p-3">Workspace Name</th>
                      <th className="p-3">Location ID</th>
                      <th className="p-3">operational Engine</th>
                      <th className="p-3 text-right">Integrations State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backendConfig.allWorkspaceConnections.map((conn: any, idx: number) => (
                      <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50/50">
                        <td className="p-3 font-bold text-slate-800 flex items-center gap-1.5">
                          <Building className="w-3.5 h-3.5 text-slate-400" />
                          {conn.workspaceName}
                        </td>
                        <td className="p-3 font-mono text-[10px] text-slate-500">
                          {conn.locationId || 'N/A Override'}
                        </td>
                        <td className="p-3">
                          <span className={`p-0.5 px-2 rounded text-[9px] font-extrabold uppercase inline-block ${
                            conn.mode === 'LIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {conn.mode}
                          </span>
                        </td>
                        <td className="p-3 text-right font-semibold">
                          <span className={`inline-block w-2.5 h-2.5 rounded-full mr-1.5 ${
                            conn.connectionStatus === 'CONNECTED' ? 'bg-emerald-500' : 'bg-slate-300'
                          }`} />
                          <span className="capitalize">{conn.connectionStatus}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right side educational checklist/ Webhook inflow log panel */}
        <div className="lg:col-span-1 space-y-6 animate-fade-in">
          
          {/* Active Diagnostic Status scopes display */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 shadow-sm">
            <h3 className="font-bold text-slate-900 text-sm pb-2 border-b border-slate-100">
              API Scope Diagnostics Check
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between items-center font-semibold">
                <span className="text-slate-500 flex items-center gap-1">
                  API Protocol
                </span>
                <span className="font-mono text-blue-700 bg-blue-50 border border-blue-100 p-0.5 px-2 rounded text-[10px] font-extrabold uppercase">
                  REST V2 API
                </span>
              </div>

              <div className="flex justify-between items-center font-semibold">
                <span className="text-slate-500">Last Sync Time</span>
                <span className="font-mono text-slate-700 text-right text-[10px]">
                  {backendConfig?.lastSyncTime ? new Date(backendConfig.lastSyncTime).toLocaleDateString() : 'Never Sync'}
                </span>
              </div>

              <div className="flex justify-between items-center font-semibold">
                <span className="text-slate-500">Limits Remaining</span>
                <span className="font-mono text-slate-700 text-[10px]">
                  {backendConfig?.rateLimitStatus?.remaining || '98'} / {backendConfig?.rateLimitStatus?.limit || '100'} (OK)
                </span>
              </div>

              {/* Scope Checklist Checkbox widgets */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[10px] font-extrabold text-slate-400 block uppercase">Permissions Verified</span>
                
                {backendConfig?.scopeChecks && Object.entries(backendConfig.scopeChecks).map(([scope, isOk]: any) => (
                  <div key={scope} className="flex justify-between items-center text-[11px] font-semibold">
                    <span className="font-mono text-slate-650">{scope}</span>
                    {isOk ? (
                      <span className="text-emerald-600 bg-emerald-50 border border-emerald-100 p-0.5 px-1.5 rounded text-[9px] font-extrabold uppercase flex items-center gap-0.5">
                        <Check className="w-3 h-3" />
                        Pass
                      </span>
                    ) : (
                      <span className="text-slate-400 bg-slate-50 border border-slate-100 p-0.5 px-1.5 rounded text-[9px] font-extrabold uppercase">
                        Untested
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Webhook Streamers Feed */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 shadow-sm">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Webhooks Stream Logs</h3>
                <p className="text-[9px] text-slate-400 leading-normal">Live streaming data received on this workspace endpoint.</p>
              </div>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping shrink-0" />
            </div>

            <div className="space-y-2 max-h-[350px] overflow-y-auto pr-1">
              {webhookLogs && webhookLogs.length > 0 ? (
                webhookLogs.map((log, idx) => (
                  <div key={idx} className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-[10px] font-semibold space-y-1 text-slate-750">
                    <div className="flex justify-between font-extrabold">
                      <span className="text-blue-600 truncate max-w-[120px]">{log.event}</span>
                      <span className="text-slate-400 font-mono text-[9px] font-bold">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                    <div className="text-slate-500 font-mono text-[8px] bg-white border border-slate-100 p-1.5 rounded truncate">
                      {JSON.stringify(log.payload)}
                    </div>
                    <div className="text-[9px] text-slate-400 text-right truncate italic font-medium">{log.source}</div>
                  </div>
                ))
              ) : (
                <div className="text-xs text-slate-500 text-center py-10">
                  Waiting for webhook flows. Trigger active simulator above to test notification stream cards.
                </div>
              )}
            </div>
          </div>

          {/* Step Guide Panel */}
          <div className="bg-slate-55 bg-gradient-to-br from-slate-50 to-slate-50/50 border border-slate-205 border-dashed rounded-xl p-5 space-y-3 shadow-xs">
            <h4 className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
              <HelpCircle className="w-4 h-4 text-slate-500" />
              API Settings Guide
            </h4>
            <ol className="list-decimal pl-4 space-y-2 text-slate-600 text-[11px] leading-relaxed font-bold font-medium">
              <li>Log in to your <strong>HighLevel developers marketplace</strong> profile.</li>
              <li>Navigate to registered Sub-Account Settings &gt; Private Integration Keys.</li>
              <li>Provide access for read scopes including <code className="text-[10px] bg-slate-100 p-0.5 rounded font-mono text-blue-600">contacts</code> and <code className="text-[10px] bg-slate-100 p-0.5 rounded font-mono text-blue-600">opportunities</code>.</li>
              <li>Generate a <strong>Private Integration Key Bearer Key</strong> and map coordinates into connection forms.</li>
            </ol>
          </div>

        </div>

      </div>

    </div>
  );
}
