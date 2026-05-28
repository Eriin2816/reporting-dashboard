/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  CreditCard, 
  Check, 
  Sparkles, 
  ShieldCheck, 
  Users, 
  Smartphone,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';

export default function BillingView() {
  const currentPlan = "Command Enterprise";
  const seatsUsed = 4;
  const seatsMax = 10;

  const features = [
    "Full GHL V2 API Live synchronization stream",
    "Ad Spend Return Attribution on UTM Campaigns",
    "Owner speed-to-lead and conversion SLA analytics matrices",
    "Continuous webhook integration simulation logs on sandbox",
    "Unlimited CSV exports on high-impact closer records",
    "No-Show and Leakage diagnostics alert trackers"
  ];

  return (
    <div className="space-y-6" id="billing-view-panel">
      {/* Visual Title Header */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight text-[#0F172A] mb-1">
          Subscription & Billing Console
        </h2>
        <p className="text-slate-500 text-sm">
          Manage Showtime sub-account developer plans, verify GHL seat allocations, and configure active credentials limit options.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Side: Current plan specifics card */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Card */}
          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6 space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center pb-4 border-b border-slate-100 gap-4">
              <div className="flex items-start gap-3.5">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl border border-blue-105 shrink-0">
                  <CreditCard className="w-6 h-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold tracking-widest text-[#64748B] block mb-0.5">Active Level Plan</span>
                  <div className="flex items-center gap-2">
                    <h3 className="text-slate-850 font-black text-lg block">{currentPlan}</h3>
                    <span className="bg-emerald-50 text-emerald-700 text-[9px] font-bold px-2 py-0.5 border border-emerald-200 rounded-full flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5" /> ACTIVE SUITE
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-left sm:text-right">
                <span className="text-[#64748B] text-xs font-semibold block">Monthly Subscription Charge</span>
                <span className="text-3xl font-extrabold text-[#0B2A5B] tracking-tight">$299<span className="text-xs text-slate-400 font-semibold font-sans">/mo billed yearly</span></span>
              </div>
            </div>

            {/* Matrix details */}
            <div className="space-y-3.5">
              <span className="text-xs font-bold text-slate-800 tracking-wide block uppercase">Included Premium Platform Features:</span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
                {features.map((feat, index) => (
                  <div key={index} className="flex items-start gap-2 text-xs text-slate-650 font-medium leading-normal">
                    <Check className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Custom Interactive SLA seating widget */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 pt-3.5">
              <div className="flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-blue-600" />
                    Location Seat Allocations
                  </span>
                  <span className="text-[#64748B] text-[10px] font-medium block mt-0.5">Active closer seats synced with developer private key</span>
                </div>
                
                <span className="font-mono text-slate-800 font-bold">{seatsUsed} / {seatsMax} GHL Seats filled</span>
              </div>

              {/* Graphical slider display */}
              <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                <div className="h-full bg-blue-600 rounded-full" style={{ width: `${(seatsUsed / seatsMax) * 100}%` }} />
              </div>
              <p className="text-[10px] text-slate-500 leading-normal">
                💡 Need extra closer reps or sub-account managers? Contact the Showtime developer platform team to scale up active integrations constraints.
              </p>
            </div>
          </div>

        </div>

        {/* Right Side: Seat pricing matrix information info boxes */}
        <div className="lg:col-span-1 space-y-6">
          
          <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-5 space-y-4">
            <h3 className="font-bold text-[#0F172A] text-sm pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-500" />
              Company Billing Contact
            </h3>

            <div className="space-y-3.5 text-xs text-slate-650 font-medium">
              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Integrations Sub-Account Owner</span>
                <span className="text-slate-800 font-bold block">Showtime Pool Mechanics</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Operations Email Address</span>
                <span className="font-mono text-slate-705 block truncate max-w-[190px]">operations@showtimepoolmechanics.com</span>
              </div>

              <div className="space-y-0.5">
                <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold block">Next Invoice Date</span>
                <span className="text-slate-800 font-bold block flex items-center gap-1.5">
                  May 28, 2027
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 px-1.5 py-0.5 border border-emerald-250 rounded">AUTO-RENEW</span>
                </span>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-150 border-dashed rounded-xl p-4 text-xs text-amber-800 space-y-1.5 leading-normal">
            <h4 className="font-bold flex items-center gap-1">
              <ShieldCheck className="w-4 h-4 text-amber-600" />
              Enterprise SLA Guarantee
            </h4>
            <p className="opacity-95 text-[11px] font-medium leading-relaxed">
              Our private integrations guarantee 99.9% uptime. Synchronizations are monitored server-side without reporting delay limits.
            </p>
          </div>

        </div>

      </div>
    </div>
  );
}
