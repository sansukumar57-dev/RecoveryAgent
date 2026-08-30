"use client";

import React, { useState } from "react";
import { useDashboard } from "../DashboardContext";

export default function AnalyticsPage() {
  const { metrics, cases, formatCurrencyINR } = useDashboard();
  const [activeTab, setActiveTab] = useState<"funnel" | "trend" | "breakdown">("funnel");

  const weeklyData = [
    { week: "W1 Aug", recovered: 18000000, atRisk: 80000000 },
    { week: "W2 Aug", recovered: 34000000, atRisk: 72000000 },
    { week: "W3 Aug", recovered: 29000000, atRisk: 60000000 },
    { week: "W4 Aug", recovered: metrics.revenueRecoveredMinor, atRisk: metrics.revenueAtRiskMinor },
  ];
  const maxBar = Math.max(...weeklyData.map((d) => Math.max(d.recovered, d.atRisk)));

  const funnelSteps = [
    { label: "Revenue At Risk", value: metrics.revenueAtRiskMinor, pct: 100, color: "bg-rose-400/50" },
    { label: "Cases Opened", value: Math.round(metrics.revenueAtRiskMinor * 0.81), pct: 81, color: "bg-orange-400/60" },
    { label: "Agent Intervened", value: Math.round(metrics.revenueAtRiskMinor * 0.68), pct: 68, color: "bg-[#fbc162]/70" },
    { label: "Workflow Started", value: Math.round(metrics.revenueAtRiskMinor * 0.57), pct: 57, color: "bg-[#fbc162]" },
    { label: "Payment Attempted", value: Math.round(metrics.revenueAtRiskMinor * 0.45), pct: 45, color: "bg-cyan-400/70" },
    { label: "RECOVERED", value: metrics.revenueRecoveredMinor, pct: Math.round((metrics.revenueRecoveredMinor / metrics.revenueAtRiskMinor) * 100), color: "bg-emerald-400" },
  ];

  const caseStatusData = [
    { label: "RECOVERED", count: cases.filter((c) => c.status === "RECOVERED").length, color: "bg-emerald-400", textColor: "text-emerald-400", bg: "bg-emerald-950/40" },
    { label: "DETECTED", count: cases.filter((c) => c.status === "DETECTED").length, color: "bg-[#fbc162]", textColor: "text-[#fbc162]", bg: "bg-[#fbc162]/10" },
    { label: "ESCALATED", count: cases.filter((c) => c.status === "ESCALATED").length, color: "bg-purple-400", textColor: "text-purple-300", bg: "bg-purple-950/40" },
    { label: "STOPPED", count: cases.filter((c) => c.status === "STOPPED").length, color: "bg-rose-400", textColor: "text-rose-400", bg: "bg-rose-950/40" },
  ];

  const strategyBreakdown = [
    { strategy: "DELAYED_RETRY", recovered: 34, atRisk: 44, successRate: 77, color: "text-emerald-400" },
    { strategy: "CREATE_PAYMENT_LINK", recovered: 14, atRisk: 23, successRate: 61, color: "text-[#fbc162]" },
    { strategy: "IMMEDIATE_RETRY", recovered: 8, atRisk: 16, successRate: 50, color: "text-cyan-300" },
    { strategy: "ESCALATE_TO_HUMAN", recovered: 10, atRisk: 11, successRate: 91, color: "text-purple-300" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-[#342D24]">
        <div>
          <h2 className="text-2xl font-extrabold font-mono text-white">Recovery Intelligence</h2>
          <p className="text-xs font-mono text-[#a79f93] mt-1">
            Deep analytics on recovery performance, agent decisions, and revenue trends.
          </p>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#241f18] border border-[#fbc162]/30 p-5 rounded-lg font-mono">
          <span className="text-[10px] text-[#a79f93] block uppercase mb-2">Total Recovered</span>
          <span className="text-2xl font-extrabold text-[#fbc162]">{formatCurrencyINR(metrics.revenueRecoveredMinor)}</span>
          <span className="text-[11px] text-emerald-400 block mt-1">↑ 28.7% vs prev period</span>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] p-5 rounded-lg font-mono">
          <span className="text-[10px] text-[#a79f93] block uppercase mb-2">Avg Case Value</span>
          <span className="text-2xl font-extrabold text-white">{formatCurrencyINR(metrics.avgCaseValueMinor || 1500000)}</span>
          <span className="text-[11px] text-[#a79f93] block mt-1">{metrics.totalCasesCount.toLocaleString()} total cases</span>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] p-5 rounded-lg font-mono">
          <span className="text-[10px] text-[#a79f93] block uppercase mb-2">Recovery Rate</span>
          <span className="text-2xl font-extrabold text-emerald-400">{metrics.recoveryRate}%</span>
          <span className="text-[11px] text-emerald-400 block mt-1">↑ 4.2% vs baseline</span>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] p-5 rounded-lg font-mono">
          <span className="text-[10px] text-[#a79f93] block uppercase mb-2">Avg Recovery Time</span>
          <span className="text-2xl font-extrabold text-white">{metrics.avgRecoveryTime}</span>
          <span className="text-[11px] text-[#a79f93] block mt-1">Down from 6.2h manual</span>
        </div>
      </div>

      {/* Tab Navigator */}
      <div className="flex gap-2 border-b border-[#342D24] pb-0">
        {(["funnel", "trend", "breakdown"] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-mono text-xs font-bold uppercase rounded-t border-b-2 transition-colors cursor-pointer ${
              activeTab === tab
                ? "text-[#fbc162] border-[#fbc162] bg-[#fbc162]/5"
                : "text-[#a79f93] border-transparent hover:text-[#d4c4b1]"
            }`}
          >
            {tab === "funnel" ? "Recovery Funnel" : tab === "trend" ? "Weekly Trend" : "Strategy Breakdown"}
          </button>
        ))}
      </div>

      {/* Tab: Recovery Funnel */}
      {activeTab === "funnel" && (
        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">REVENUE RECOVERY FUNNEL</h3>
          <div className="space-y-3">
            {funnelSteps.map((step, i) => (
              <div key={step.label} className="space-y-1">
                <div className="flex justify-between font-mono text-xs">
                  <span className={i === funnelSteps.length - 1 ? "text-emerald-400 font-bold" : "text-[#d4c4b1]"}>
                    {step.label}
                  </span>
                  <span className={`font-bold ${i === funnelSteps.length - 1 ? "text-emerald-400" : "text-white"}`}>
                    {formatCurrencyINR(step.value)}{" "}
                    <span className="text-[#a79f93] font-normal">({step.pct}%)</span>
                  </span>
                </div>
                <div className="relative h-6 bg-[#17130c] rounded-full overflow-hidden">
                  <div
                    className={`h-full ${step.color} rounded-full transition-all duration-700 flex items-center justify-end pr-2`}
                    style={{ width: `${step.pct}%` }}
                  >
                    {step.pct > 15 && (
                      <span className="font-mono text-[9px] text-white font-bold">{step.pct}%</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-4 bg-emerald-950/40 border border-emerald-500/20 rounded-lg font-mono text-xs flex justify-between items-center">
            <span className="text-emerald-400 font-bold">Net Recovery Efficiency</span>
            <span className="text-emerald-400 font-extrabold text-lg">{metrics.recoveryRate}%</span>
          </div>
        </div>
      )}

      {/* Tab: Weekly Trend */}
      {activeTab === "trend" && (
        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">WEEKLY RECOVERY TREND — AUG 2026</h3>
          <div className="flex items-end gap-8 h-48 mt-4">
            {weeklyData.map((d) => (
              <div key={d.week} className="flex-1 flex flex-col justify-end gap-1 items-center">
                <div className="w-full flex gap-2 items-end justify-center h-40">
                  {/* At Risk Bar */}
                  <div className="flex-1 flex flex-col justify-end group relative">
                    <div
                      className="bg-rose-400/30 border border-rose-400/40 rounded-t w-full transition-all duration-700 hover:bg-rose-400/50"
                      style={{ height: `${(d.atRisk / maxBar) * 100}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-rose-400 whitespace-nowrap opacity-0 group-hover:opacity-100">
                      {formatCurrencyINR(d.atRisk)}
                    </div>
                  </div>
                  {/* Recovered Bar */}
                  <div className="flex-1 flex flex-col justify-end group relative">
                    <div
                      className="bg-[#fbc162] rounded-t w-full transition-all duration-700 hover:bg-[#dda64a]"
                      style={{ height: `${(d.recovered / maxBar) * 100}%` }}
                    />
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[9px] font-mono text-[#fbc162] whitespace-nowrap opacity-0 group-hover:opacity-100">
                      {formatCurrencyINR(d.recovered)}
                    </div>
                  </div>
                </div>
                <span className="font-mono text-[10px] text-[#a79f93] mt-1">{d.week}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-6 font-mono text-[10px] text-[#a79f93] mt-2">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-rose-400/40 border border-rose-400/50 rounded inline-block" />
              Revenue At Risk
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-2 bg-[#fbc162] rounded inline-block" />
              Revenue Recovered
            </div>
          </div>
        </div>
      )}

      {/* Tab: Strategy Breakdown */}
      {activeTab === "breakdown" && (
        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">STRATEGY PERFORMANCE BREAKDOWN</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-mono border-collapse">
              <thead className="text-[10px] text-[#a79f93] uppercase border-b border-[#342D24]">
                <tr>
                  <th className="text-left p-3">Strategy</th>
                  <th className="text-right p-3">Recovered</th>
                  <th className="text-right p-3">Attempted</th>
                  <th className="text-right p-3">Success Rate</th>
                  <th className="p-3">Rate Bar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#342D24]">
                {strategyBreakdown.map((s) => (
                  <tr key={s.strategy} className="hover:bg-[#241f18] transition-colors">
                    <td className={`p-3 font-bold ${s.color}`}>{s.strategy}</td>
                    <td className="p-3 text-right text-emerald-400 font-bold">{s.recovered}</td>
                    <td className="p-3 text-right text-white">{s.atRisk}</td>
                    <td className={`p-3 text-right font-bold ${s.color}`}>{s.successRate}%</td>
                    <td className="p-3 w-40">
                      <div className="h-2 bg-[#17130c] rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${s.color.replace("text-", "bg-").replace("/30", "").replace("/50", "")}`}
                          style={{ width: `${s.successRate}%` }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Case Status + Top Wins */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">CASE STATUS BREAKDOWN</h3>
          <div className="grid grid-cols-2 gap-3">
            {caseStatusData.map((s) => (
              <div key={s.label} className={`${s.bg} border border-[#342D24] p-3 rounded-lg font-mono text-xs`}>
                <span className={`font-bold block text-2xl ${s.textColor}`}>{s.count}</span>
                <span className="text-[#a79f93] text-[10px]">{s.label}</span>
                <div className="mt-2 h-1 bg-[#17130c] rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full`} style={{ width: `${cases.length > 0 ? (s.count / cases.length) * 100 : 0}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">TOP RECOVERY WINS</h3>
          <div className="space-y-3">
            {cases.filter((c) => c.status === "RECOVERED").slice(0, 5).map((c) => (
              <div key={c.id} className="flex justify-between items-center font-mono text-xs border-b border-[#342D24] pb-2.5">
                <div>
                  <span className="text-[#fbc162] font-bold block">{c.caseId}</span>
                  <span className="text-[#a79f93] text-[10px]">{c.customerName}</span>
                </div>
                <div className="text-right">
                  <span className="text-emerald-400 font-bold block">{formatCurrencyINR(c.amountMinor)}</span>
                  <span className="text-[#a79f93] text-[10px]">{c.strategy}</span>
                </div>
              </div>
            ))}
            {cases.filter((c) => c.status === "RECOVERED").length === 0 && (
              <div className="text-center py-6 text-[#a79f93] text-xs font-mono">
                <span className="material-symbols-outlined text-3xl block mb-2 text-[#342D24]">emoji_events</span>
                Run AI Recovery to generate wins
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
