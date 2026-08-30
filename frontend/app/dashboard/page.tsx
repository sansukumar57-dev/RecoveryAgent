"use client";

import React from "react";
import { useDashboard } from "./DashboardContext";

export default function OverviewPage() {
  const { metrics, cases, formatCurrencyINR, setSelectedCase } = useDashboard();

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Executive Header */}
      <div className="flex justify-between items-end pb-4 border-b border-[#342D24]">
        <div>
          <h2 className="text-2xl font-extrabold font-mono text-white mb-1">RECOVERY COMMAND CENTER</h2>
          <p className="text-xs font-mono text-[#a79f93]">Your AI agent is monitoring revenue leakage across payments, checkouts, subscriptions, and receivables.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#241f18] border-2 border-[#fbc162] rounded-lg p-6 relative overflow-hidden">
          <div className="flex justify-between items-start mb-4">
            <span className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-wider">TOTAL RECOVERED REVENUE</span>
            <span className="material-symbols-outlined text-[#fbc162]">verified</span>
          </div>
          <div className="text-4xl font-extrabold font-mono bg-[#dda64a] text-[#5b3d00] px-3 py-1 inline-block">{formatCurrencyINR(metrics.revenueRecoveredMinor)}</div>
          <div className="mt-3 text-xs font-mono text-[#d4c4b1]"><span className="text-emerald-400 font-bold">+28.7%</span> vs baseline manual retries</div>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="font-mono text-xs text-[#a79f93] uppercase tracking-wider">REVENUE AT RISK</span>
            <span className="material-symbols-outlined text-rose-400">warning</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-white">{formatCurrencyINR(metrics.revenueAtRiskMinor)}</div>
          <div className="mt-3 text-xs font-mono text-[#a79f93]">Across {metrics.activeCases} active recovery cases</div>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] rounded-lg p-6">
          <div className="flex justify-between items-start mb-4">
            <span className="font-mono text-xs text-[#a79f93] uppercase tracking-wider">RECOVERY RATE</span>
            <span className="material-symbols-outlined text-emerald-400">trending_up</span>
          </div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400">{metrics.recoveryRate}%</div>
          <div className="mt-3 text-xs font-mono text-[#a79f93]">Expected recovery: {formatCurrencyINR(metrics.expectedRecoveryMinor)}</div>
        </div>
      </div>

      {/* Recovery Funnel */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
        <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">REVENUE RECOVERY FUNNEL</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 font-mono text-xs text-center">
          {[
            { label: "1. AT RISK", value: formatCurrencyINR(metrics.revenueAtRiskMinor), highlight: false },
            { label: "2. AI ELIGIBLE", value: "₹10.4L", highlight: false },
            { label: "3. WORKFLOW STARTED", value: "₹8.7L", highlight: false },
            { label: "4. INTERVENED", value: "₹8.1L", highlight: false },
            { label: "5. RECOVERED", value: formatCurrencyINR(metrics.revenueRecoveredMinor), highlight: true },
          ].map((s) => (
            <div key={s.label} className={`p-3 rounded ${s.highlight ? "bg-[#241f18] border-2 border-[#fbc162] bg-[#fbc162]/10" : "bg-[#241f18] border border-[#342D24]"}`}>
              <span className={`text-[10px] block ${s.highlight ? "text-[#fbc162] font-bold" : "text-[#a79f93]"}`}>{s.label}</span>
              <span className={`font-bold ${s.highlight ? "text-emerald-400" : "text-white"}`}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded font-mono text-xs">
          <span className="text-[#a79f93] block mb-1">Avg Recovery Time</span>
          <span className="text-xl font-bold text-white">{metrics.avgRecoveryTime}</span>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded font-mono text-xs">
          <span className="text-[#a79f93] block mb-1">Total Cases</span>
          <span className="text-xl font-bold text-white">{metrics.totalCasesCount}</span>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded font-mono text-xs">
          <span className="text-[#a79f93] block mb-1">Escalated</span>
          <span className="text-xl font-bold text-purple-300">{metrics.escalatedCases}</span>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded font-mono text-xs">
          <span className="text-[#a79f93] block mb-1">Policy Violations</span>
          <span className="text-xl font-bold text-emerald-400">{metrics.policyViolations}</span>
        </div>
      </div>

      {/* Cases Table */}
      <div className="bg-[#241f18] border border-[#342D24] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#342D24] flex justify-between items-center">
          <h3 className="font-mono text-xs text-[#fbc162] uppercase tracking-widest font-bold">PRIORITY RECOVERY QUEUE</h3>
        </div>
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="bg-[#1f1812] border-b border-[#342D24] text-[10px] text-[#a79f93] uppercase">
            <tr>
              <th className="p-3">Case ID</th><th className="p-3">Customer</th><th className="p-3">Risk Type</th>
              <th className="p-3">Amount</th><th className="p-3">AI Strategy</th><th className="p-3">Status</th>
              <th className="p-3 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#342D24]">
            {cases.slice(0, 6).map((c) => (
              <tr key={c.id} className="hover:bg-[#1f1812] transition-colors">
                <td className="p-3 font-bold text-[#fbc162]">{c.caseId}</td>
                <td className="p-3 text-white font-bold">{c.customerName}</td>
                <td className="p-3 text-[#d4c4b1]">{c.failureReason}</td>
                <td className="p-3 text-white font-bold">{formatCurrencyINR(c.amountMinor)}</td>
                <td className="p-3 text-[#d4c4b1]">{c.strategy}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.status === "RECOVERED" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" :
                    c.status === "ESCALATED" ? "bg-purple-950 text-purple-300 border border-purple-500/30" :
                    c.status === "STOPPED" ? "bg-rose-950 text-rose-400 border border-rose-500/30" :
                    "bg-[#fbc162]/20 text-[#fbc162] border border-[#fbc162]/40"
                  }`}>{c.status}</span>
                </td>
                <td className="p-3 text-right">
                  <button onClick={() => setSelectedCase(c)} className="px-2.5 py-1 rounded border border-[#342D24] text-[#d4c4b1] hover:border-[#fbc162] hover:text-[#fbc162] cursor-pointer">Inspect</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
