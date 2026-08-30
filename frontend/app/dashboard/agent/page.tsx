"use client";

import React, { useState, useEffect } from "react";
import { useDashboard } from "../DashboardContext";

// Simulated live agent activity feed
const LIVE_AGENT_ACTIONS = [
  { id: "a1", stage: "DETECT", case: "RC-1007", customer: "Vertex Payments", amount: "₹38,000", action: "Payment failure signal detected — gateway timeout", ts: 0, color: "text-cyan-300" },
  { id: "a2", stage: "DIAGNOSE", case: "RC-1007", customer: "Vertex Payments", amount: "₹38,000", action: "Root cause: card_expired (91% confidence)", ts: 800, color: "text-[#fbc162]" },
  { id: "a3", stage: "PRIORITIZE", case: "RC-1007", customer: "Vertex Payments", amount: "₹38,000", action: "Risk Score: 74 | Recoverability: 86 | LTV: ₹2.1L", ts: 1600, color: "text-purple-300" },
  { id: "a4", stage: "DECIDE", case: "RC-1007", customer: "Vertex Payments", amount: "₹38,000", action: "Strategy selected: CREATE_PAYMENT_LINK (win rate 61%)", ts: 2400, color: "text-[#fbc162]" },
  { id: "a5", stage: "VALIDATE", case: "RC-1007", customer: "Vertex Payments", amount: "₹38,000", action: "Policy gate PASSED — all guardrails cleared", ts: 3200, color: "text-emerald-400" },
  { id: "a6", stage: "ACT", case: "RC-1007", customer: "Vertex Payments", amount: "₹38,000", action: "Payment link plink_7f92b generated & dispatched via SMS", ts: 4000, color: "text-cyan-300" },
  { id: "a7", stage: "VERIFY", case: "RC-1007", customer: "Vertex Payments", amount: "₹38,000", action: "Gateway confirmed: payment captured successfully", ts: 4800, color: "text-emerald-400" },
  { id: "a8", stage: "RECOVER", case: "RC-1007", customer: "Vertex Payments", amount: "₹38,000", action: "₹38,000 revenue recovered. Case closed → RESOLVED", ts: 5600, color: "text-emerald-400" },
  { id: "a9", stage: "AUDIT", case: "RC-1007", customer: "Vertex Payments", amount: "₹38,000", action: "Immutable audit log created (hash: 7a3f...d91e)", ts: 6400, color: "text-[#a79f93]" },
  { id: "b1", stage: "DETECT", case: "RC-1008", customer: "Orion Logistics", amount: "₹1,20,000", action: "Subscription renewal failure: insufficient_funds", ts: 7200, color: "text-cyan-300" },
  { id: "b2", stage: "DIAGNOSE", case: "RC-1008", customer: "Orion Logistics", amount: "₹1,20,000", action: "Root cause: month-end liquidity dip (89% confidence)", ts: 8000, color: "text-[#fbc162]" },
  { id: "b3", stage: "PRIORITIZE", case: "RC-1008", customer: "Orion Logistics", amount: "₹1,20,000", action: "Risk Score: 82 | Recoverability: 79 | LTV: ₹8.4L", ts: 8800, color: "text-purple-300" },
  { id: "b4", stage: "DECIDE", case: "RC-1008", customer: "Orion Logistics", amount: "₹1,20,000", action: "Strategy: DELAYED_RETRY @ +4h (win rate 78%)", ts: 9600, color: "text-[#fbc162]" },
  { id: "b5", stage: "VALIDATE", case: "RC-1008", customer: "Orion Logistics", amount: "₹1,20,000", action: "Policy gate: AMOUNT EXCEEDS ₹50K — ESCALATING", ts: 10400, color: "text-purple-300" },
  { id: "b6", stage: "ACT", case: "RC-1008", customer: "Orion Logistics", amount: "₹1,20,000", action: "Escalation packet sent to Account Manager (Priya S.)", ts: 11200, color: "text-purple-300" },
];

const PIPELINE_STAGES = [
  { label: "DETECT", desc: "Revenue risk signals", icon: "radar", key: "DETECT" },
  { label: "DIAGNOSE", desc: "Root cause analysis", icon: "biotech", key: "DIAGNOSE" },
  { label: "PRIORITIZE", desc: "Risk & recoverability", icon: "sort", key: "PRIORITIZE" },
  { label: "DECIDE", desc: "Strategy selection", icon: "compare_arrows", key: "DECIDE" },
  { label: "VALIDATE", desc: "Policy engine gate", icon: "shield", key: "VALIDATE" },
  { label: "ACT", desc: "Bounded execution", icon: "bolt", key: "ACT" },
  { label: "VERIFY", desc: "Gateway confirmation", icon: "verified", key: "VERIFY" },
  { label: "RECOVER", desc: "Measured ₹ impact", icon: "payments", key: "RECOVER" },
  { label: "AUDIT", desc: "Immutable log", icon: "history", key: "AUDIT" },
];

const STRATEGY_STATS = [
  { strategy: "DELAYED_RETRY", winRate: 78, totalUsed: 31, color: "bg-emerald-400", textColor: "text-emerald-400" },
  { strategy: "CREATE_PAYMENT_LINK", winRate: 61, totalUsed: 14, color: "bg-[#fbc162]", textColor: "text-[#fbc162]" },
  { strategy: "IMMEDIATE_RETRY", winRate: 49, totalUsed: 8, color: "bg-cyan-400", textColor: "text-cyan-400" },
  { strategy: "ESCALATE_TO_HUMAN", winRate: 92, totalUsed: 10, color: "bg-purple-400", textColor: "text-purple-300" },
];

export default function AgentPage() {
  const { metrics, auditLogs, isProcessing, handleRunBatch, formatCurrencyINR } = useDashboard();

  const [visibleActions, setVisibleActions] = useState<typeof LIVE_AGENT_ACTIONS>([]);
  const [currentStage, setCurrentStage] = useState("DETECT");
  const [actionIndex, setActionIndex] = useState(0);
  const [isLiveRunning, setIsLiveRunning] = useState(true);

  // Auto-advance live agent feed
  useEffect(() => {
    if (!isLiveRunning) return;
    const timer = setTimeout(() => {
      if (actionIndex < LIVE_AGENT_ACTIONS.length) {
        const next = LIVE_AGENT_ACTIONS[actionIndex];
        setVisibleActions((prev) => [next, ...prev].slice(0, 20));
        setCurrentStage(next.stage);
        setActionIndex((i) => i + 1);
      } else {
        // Loop
        setVisibleActions([]);
        setActionIndex(0);
      }
    }, actionIndex === 0 ? 600 : 900);
    return () => clearTimeout(timer);
  }, [actionIndex, isLiveRunning]);

  const recentDecisions = auditLogs.slice(0, 6);

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-[#342D24]">
        <div>
          <h2 className="text-2xl font-extrabold font-mono text-white">AI Recovery Agent Cockpit</h2>
          <p className="text-xs font-mono text-[#a79f93] mt-1">
            Real-time view of the autonomous agentic pipeline — detect → diagnose → decide → act → verify → recover.
          </p>
        </div>
        <div className="flex items-center gap-3 font-mono text-xs">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded bg-emerald-950 border border-emerald-500/30">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-emerald-400 font-bold">AGENT ONLINE</span>
          </div>
          <span className="text-[#a79f93]">Uptime: 99.7%</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded-lg font-mono text-xs">
          <span className="text-[#a79f93] block mb-1">Cases Analyzed</span>
          <span className="text-2xl font-bold text-white">{metrics.totalCasesCount.toLocaleString()}</span>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded-lg font-mono text-xs">
          <span className="text-[#a79f93] block mb-1">Decisions Made</span>
          <span className="text-2xl font-bold text-white">{Math.round(metrics.totalCasesCount * 0.71).toLocaleString()}</span>
        </div>
        <div className="bg-[#241f18] border border-emerald-500/20 p-4 rounded-lg font-mono text-xs">
          <span className="text-[#a79f93] block mb-1">Successful Recoveries</span>
          <span className="text-2xl font-bold text-emerald-400">{metrics.recoveredCases}</span>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded-lg font-mono text-xs">
          <span className="text-[#a79f93] block mb-1">Avg Confidence</span>
          <span className="text-2xl font-bold text-[#fbc162]">93.4%</span>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded-lg font-mono text-xs">
          <span className="text-[#a79f93] block mb-1">Policy Violations</span>
          <span className="text-2xl font-bold text-emerald-400">{metrics.policyViolations}</span>
        </div>
      </div>

      {/* Agentic Pipeline — Live State Machine */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">
            AGENTIC PIPELINE — LIVE STATE MACHINE
          </h3>
          <div className="flex items-center gap-2 font-mono text-[10px]">
            <span className="w-2 h-2 rounded-full bg-[#fbc162] animate-pulse" />
            <span className="text-[#fbc162]">ACTIVE STAGE: {currentStage}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {PIPELINE_STAGES.map((stage, i) => {
            const isActive = stage.key === currentStage;
            const isPast = PIPELINE_STAGES.findIndex((s) => s.key === currentStage) > i;
            return (
              <React.Fragment key={stage.label}>
                <div className={`shrink-0 px-3 py-3 rounded text-center font-mono text-[10px] min-w-[90px] border transition-all duration-500 ${
                  isActive
                    ? "bg-[#fbc162]/20 border-[#fbc162] text-[#fbc162] scale-105 shadow-lg shadow-[#fbc162]/10"
                    : isPast
                    ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-400"
                    : "bg-[#241f18] border-[#342D24] text-[#a79f93]"
                }`}>
                  <span className="material-symbols-outlined text-sm block mb-1">{stage.icon}</span>
                  <span className="font-bold block">{stage.label}</span>
                  <span className="text-[9px] opacity-70">{stage.desc}</span>
                  {isActive && <span className="block mt-1 w-1.5 h-1.5 rounded-full bg-[#fbc162] mx-auto animate-pulse" />}
                  {isPast && <span className="material-symbols-outlined text-[10px] text-emerald-400 mt-0.5 block">check</span>}
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <span className={`text-sm shrink-0 transition-colors duration-500 ${isPast || isActive ? "text-[#fbc162]" : "text-[#342D24]"}`}>→</span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Live Agent Execution Feed + Strategy Effectiveness */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* Live Autonomous Execution Feed */}
        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">
              AUTONOMOUS EXECUTION FEED
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLiveRunning((v) => !v)}
                className={`px-2 py-1 rounded border font-mono text-[10px] cursor-pointer transition-colors ${
                  isLiveRunning
                    ? "border-[#fbc162]/40 text-[#fbc162] bg-[#fbc162]/10"
                    : "border-[#342D24] text-[#a79f93] hover:border-[#fbc162]/40"
                }`}
              >
                {isLiveRunning ? "⏸ Pause" : "▶ Resume"}
              </button>
            </div>
          </div>
          <div className="space-y-2 max-h-80 overflow-y-auto font-mono text-[11px]">
            {visibleActions.length === 0 ? (
              <div className="text-center py-8 text-[#a79f93] animate-pulse">
                <span className="material-symbols-outlined text-2xl block mb-2">smart_toy</span>
                AI Agent initializing pipeline...
              </div>
            ) : (
              visibleActions.map((action, idx) => (
                <div
                  key={action.id + idx}
                  className={`flex gap-3 border-b border-[#342D24] pb-2 transition-all duration-300 ${idx === 0 ? "opacity-100" : "opacity-70"}`}
                >
                  <span className={`shrink-0 px-1.5 py-0.5 rounded text-[9px] font-bold border self-start mt-0.5 ${
                    action.stage === "VALIDATE" && action.action.includes("EXCEEDS")
                      ? "bg-purple-950 border-purple-500/30 text-purple-300"
                      : action.stage === "RECOVER" || action.stage === "VERIFY"
                      ? "bg-emerald-950 border-emerald-500/30 text-emerald-400"
                      : "bg-[#241f18] border-[#342D24] text-[#a79f93]"
                  }`}>
                    {action.stage}
                  </span>
                  <div className="flex-grow min-w-0">
                    <div className="flex justify-between mb-0.5">
                      <span className="text-[#fbc162] font-bold">{action.case}</span>
                      <span className="text-[#a79f93] text-[9px]">{action.customer}</span>
                    </div>
                    <p className={`${action.color} text-[10px]`}>{action.action}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          {/* Run Batch Button */}
          <button
            onClick={handleRunBatch}
            disabled={isProcessing}
            className="w-full py-2.5 rounded bg-[#fbc162] text-[#17130c] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#dda64a] transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            {isProcessing ? "Executing Recovery Batch..." : "Run AI Recovery Batch (All Active Cases)"}
          </button>
        </div>

        {/* Strategy Effectiveness */}
        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">STRATEGY EFFECTIVENESS</h3>
          <div className="space-y-5">
            {STRATEGY_STATS.map((s) => (
              <div key={s.strategy} className="space-y-1.5">
                <div className="flex justify-between font-mono text-xs">
                  <span className="text-[#d4c4b1]">{s.strategy}</span>
                  <span className="text-white font-bold">
                    {s.winRate}% <span className="text-[#a79f93] font-normal">({s.totalUsed} cases)</span>
                  </span>
                </div>
                <div className="h-2 bg-[#17130c] rounded-full overflow-hidden">
                  <div className={`h-full ${s.color} rounded-full transition-all duration-1000`} style={{ width: `${s.winRate}%` }} />
                </div>
                <div className="flex justify-between text-[9px] font-mono text-[#a79f93]">
                  <span>0%</span><span className={`font-bold ${s.textColor}`}>{s.winRate}% win rate</span><span>100%</span>
                </div>
              </div>
            ))}
          </div>

          {/* Agent Guardrail Summary */}
          <div className="mt-4 pt-4 border-t border-[#342D24] space-y-2">
            <span className="font-mono text-[10px] text-[#fbc162] font-bold uppercase">GUARDRAIL SUMMARY (THIS SESSION)</span>
            <div className="grid grid-cols-3 gap-2 font-mono text-[10px]">
              <div className="bg-emerald-950/40 border border-emerald-500/20 p-2 rounded text-center">
                <span className="text-emerald-400 font-bold block text-lg">{Math.round(metrics.totalCasesCount * 0.71)}</span>
                <span className="text-[#a79f93]">Approved</span>
              </div>
              <div className="bg-purple-950/40 border border-purple-500/20 p-2 rounded text-center">
                <span className="text-purple-300 font-bold block text-lg">{metrics.escalatedCases}</span>
                <span className="text-[#a79f93]">Escalated</span>
              </div>
              <div className="bg-rose-950/40 border border-rose-500/20 p-2 rounded text-center">
                <span className="text-rose-400 font-bold block text-lg">{metrics.stoppedCases}</span>
                <span className="text-[#a79f93]">Stopped</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Decision Stream from real audit logs */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
        <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">LIVE DECISION STREAM — AGENT AUDIT LOG</h3>
        <div className="space-y-3 max-h-72 overflow-y-auto">
          {recentDecisions.length > 0 ? recentDecisions.map((log) => (
            <div key={log.id} className="flex gap-3 text-xs font-mono border-b border-[#342D24] pb-3">
              <span className={`material-symbols-outlined text-sm mt-0.5 ${
                log.eventType === "DECISION" ? "text-[#fbc162]" :
                log.eventType === "TOOL_EXECUTION" ? "text-cyan-300" :
                log.eventType === "VERIFICATION" ? "text-emerald-400" :
                "text-purple-300"
              }`}>
                {log.eventType === "DECISION" ? "psychology" :
                 log.eventType === "TOOL_EXECUTION" ? "build" :
                 log.eventType === "VERIFICATION" ? "check_circle" : "shield"}
              </span>
              <div className="flex-grow min-w-0">
                <div className="flex justify-between">
                  <span className="text-white font-bold">{log.caseId}</span>
                  <span className="text-[#a79f93] text-[10px]" suppressHydrationWarning>{new Date(log.timestamp).toLocaleTimeString()}</span>
                </div>
                <p className="text-[#d4c4b1] text-[11px] mt-0.5">{log.details}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                    log.guardrailStatus === "APPROVED" ? "bg-emerald-950 text-emerald-400" :
                    log.guardrailStatus === "DENIED_ESCALATE" ? "bg-purple-950 text-purple-300" :
                    "bg-rose-950 text-rose-400"
                  }`}>{log.guardrailStatus}</span>
                  {log.tool && <span className="text-[#a79f93] text-[9px]">tool: {log.tool}</span>}
                </div>
              </div>
            </div>
          )) : (
            <div className="text-center py-8 font-mono text-xs text-[#a79f93]">
              <span className="material-symbols-outlined text-3xl block mb-2 text-[#342D24]">history</span>
              No audit events yet. Run AI Recovery to generate decisions.
            </div>
          )}
        </div>
      </div>

      {/* Revenue recovered by agent */}
      <div className="bg-[#241f18] border border-[#fbc162]/20 p-6 rounded-lg">
        <div className="flex justify-between items-center">
          <div className="font-mono">
            <span className="text-[10px] text-[#a79f93] uppercase block mb-1">Total Revenue Recovered by AI Agent</span>
            <span className="text-3xl font-extrabold text-[#fbc162]">{formatCurrencyINR(metrics.revenueRecoveredMinor)}</span>
            <span className="text-xs text-emerald-400 block mt-1">↑ {metrics.recoveryRate}% recovery rate</span>
          </div>
          <div className="text-right font-mono">
            <span className="text-[10px] text-[#a79f93] uppercase block mb-1">Expected Further Recovery</span>
            <span className="text-2xl font-extrabold text-white">{formatCurrencyINR(metrics.expectedRecoveryMinor)}</span>
            <span className="text-xs text-[#a79f93] block mt-1">Avg: {metrics.avgRecoveryTime} per case</span>
          </div>
        </div>
      </div>
    </div>
  );
}
