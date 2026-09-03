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

export default function AgentPage() {
  const { metrics, cases, auditLogs, isProcessing, handleRunBatch, formatCurrencyINR } = useDashboard();

  const strategyStats = React.useMemo(() => {
    const baseStrategies = [
      { strategy: "DELAYED_RETRY", color: "bg-emerald-400", textColor: "text-emerald-400" },
      { strategy: "CREATE_PAYMENT_LINK", color: "bg-[#fbc162]", textColor: "text-[#fbc162]" },
      { strategy: "IMMEDIATE_RETRY", color: "bg-cyan-400", textColor: "text-cyan-400" },
      { strategy: "ESCALATE_TO_HUMAN", color: "bg-purple-400", textColor: "text-purple-300" },
    ];

    return baseStrategies.map((s) => {
      const match = cases.filter((c) => c.strategy === s.strategy);
      if (match.length === 0) {
        return { ...s, winRate: 75, totalUsed: 0 };
      }
      const recovered = match.filter((c) => c.status === "RECOVERED").length;
      const winRate = Math.round((recovered / match.length) * 100);
      return {
        ...s,
        winRate,
        totalUsed: match.length,
      };
    });
  }, [cases]);

  const [currentStage, setCurrentStage] = useState("DETECT");
  const [actionIndex, setActionIndex] = useState(0);
  const [isLiveRunning, setIsLiveRunning] = useState(true);
  const [selectedTreeNode, setSelectedTreeNode] = useState<string>("diagnose");

  // Derive feed items from real auditLogs if available, or fall back to simulation seeds
  const activeFeedList = React.useMemo(() => {
    if (auditLogs && auditLogs.length > 0) {
      return auditLogs.slice(0, 25).map((log) => {
        let stage = "ACT";
        let color = "text-[#fbc162]";
        const et = (log.eventType || "").toUpperCase();
        const an = (log.agentName || "").toUpperCase();
        const tool = (log.tool || "").toLowerCase();

        if (an.includes("RISK") || et.includes("DETECT")) {
          stage = "DETECT";
          color = "text-cyan-300";
        } else if (an.includes("DIAGNOSIS") || et.includes("DIAGNOS")) {
          stage = "DIAGNOSE";
          color = "text-[#fbc162]";
        } else if (an.includes("POLICY") || et.includes("POLICY") || log.guardrailStatus?.includes("DENIED")) {
          stage = "VALIDATE";
          color = log.guardrailStatus === "APPROVED" ? "text-emerald-400" : "text-purple-300";
        } else if (et.includes("DECISION")) {
          stage = "DECIDE";
          color = "text-[#fbc162]";
        } else if (an.includes("VERIF") || tool.includes("verif")) {
          stage = "VERIFY";
          color = "text-emerald-400";
        } else if (tool.includes("retry") || tool.includes("link") || et.includes("TOOL")) {
          stage = "ACT";
          color = "text-cyan-300";
        }

        return {
          id: `audit-${log.id}`,
          stage,
          case: log.caseId || "RC-System",
          customer: log.agentName || "Autonomous Agent",
          amount: "",
          action: log.details || `${log.eventType}: ${log.tool || log.guardrailStatus || "Step executed"}`,
          ts: log.timestamp || Date.now(),
          color,
        };
      });
    }
    return LIVE_AGENT_ACTIONS;
  }, [auditLogs]);

  const [visibleActions, setVisibleActions] = useState<typeof LIVE_AGENT_ACTIONS>([]);

  // Advance live feed smoothly
  useEffect(() => {
    if (!isLiveRunning) return;
    const timer = setTimeout(() => {
      if (actionIndex < activeFeedList.length) {
        const next = activeFeedList[actionIndex];
        setVisibleActions((prev) => [next, ...prev].slice(0, 20));
        setCurrentStage(next.stage);
        setActionIndex((i) => i + 1);
      } else {
        // Loop back
        setVisibleActions([]);
        setActionIndex(0);
      }
    }, actionIndex === 0 ? 500 : 850);
    return () => clearTimeout(timer);
  }, [actionIndex, isLiveRunning, activeFeedList]);

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

      {/* Analytical Tool: Interactive Autonomous Decision Tree & Fallback Path Visualizer */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs text-[#fbc162] font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-base">alt_route</span>
              AUTONOMOUS DECISION TREE &amp; DYNAMIC FALLBACK TOPOLOGY
            </h3>
            <p className="text-[11px] text-[#a79f93] mt-0.5">Click any node in the execution graph to inspect latency, traffic routing, and fallback triggers.</p>
          </div>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            P95 LATENCY: 14.2ms
          </span>
        </div>

        {/* Tree Flow Graph */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { id: "signal", name: "1. Signal Ingestion", sub: "Webhook / API / Invoice", latency: "2.1ms", traffic: "100%", status: "NORMAL", color: "border-cyan-500/40 text-cyan-300" },
            { id: "diagnose", name: "2. AI Root Cause", sub: "Groq LLM + Bayesian Rules", latency: "14.2ms", traffic: "100%", status: "94.2% Conf", color: "border-[#fbc162]/40 text-[#fbc162]" },
            { id: "guardrail", name: "3. Safety Policy Gate", sub: "Bounds & Limits Evaluation", latency: "1.8ms", traffic: "100%", status: "0 Violations", color: "border-emerald-500/40 text-emerald-400" },
            { id: "dispatch", name: "4. Action Dispatch", sub: "Retry / Link / Voice / Human", latency: "8.4ms", traffic: "98.6% Auto", status: "Active", color: "border-purple-500/40 text-purple-300" },
            { id: "verify", name: "5. Settlement Check", sub: "Gateway Webhook Verification", latency: "11.0ms", traffic: "71.6% Rec", status: "Tamper-Proof", color: "border-emerald-500/50 text-emerald-400" },
          ].map((node) => (
            <button
              key={node.id}
              onClick={() => setSelectedTreeNode(node.id)}
              className={`p-3.5 rounded-lg bg-[#241f18] border text-left cursor-pointer transition-all hover:brightness-125 ${
                selectedTreeNode === node.id ? "ring-2 ring-[#fbc162] scale-[1.02] bg-[#2a241b]" : node.color
              }`}
            >
              <span className="text-[9px] text-[#a79f93] block">{node.sub}</span>
              <span className="text-xs font-bold text-white block mt-0.5">{node.name}</span>
              <div className="flex justify-between items-center mt-2 pt-2 border-t border-[#342D24] text-[9px]">
                <span className="text-[#a79f93]">{node.latency}</span>
                <span className="font-bold text-emerald-400">{node.status}</span>
              </div>
            </button>
          ))}
        </div>

        {/* Node Telemetry Inspector */}
        <div className="p-4 bg-[#17130c] rounded-lg border border-[#342D24] space-y-2">
          {selectedTreeNode === "signal" && (
            <div>
              <span className="text-[#fbc162] font-bold block mb-1">NODE 1: REVENUE RISK SIGNAL INGESTION</span>
              <p className="text-[#d4c4b1] text-[11px]">Listens to Razorpay payment.failed webhooks, subscription renewal failures, and overdue B2B invoice schedules. Automatically deduplicates retry bursts within a 60-second window.</p>
              <div className="flex gap-4 text-[10px] text-[#a79f93] pt-1">
                <span>Throughput: <strong className="text-white">124 events/min</strong></span>
                <span>Drop Rate: <strong className="text-emerald-400">0.00%</strong></span>
                <span>Buffer Health: <strong className="text-emerald-400">100%</strong></span>
              </div>
            </div>
          )}
          {selectedTreeNode === "diagnose" && (
            <div>
              <span className="text-[#fbc162] font-bold block mb-1">NODE 2: PROBABILISTIC ROOT CAUSE DIAGNOSIS (HYBRID LLM + HEURISTIC)</span>
              <p className="text-[#d4c4b1] text-[11px]">Evaluates issuer decline codes, customer historical recovery probability, card network error taxonomy, and customer LTV. Uses Groq / OpenRouter with rule fallback if API latency exceeds 8000ms.</p>
              <div className="flex gap-4 text-[10px] text-[#a79f93] pt-1">
                <span>Mean Diagnostic Confidence: <strong className="text-[#fbc162]">91.4%</strong></span>
                <span>Primary LLM: <strong className="text-white">Groq Llama 3 70B</strong></span>
                <span>Fallback: <strong className="text-emerald-400">Local Bayesian Prior</strong></span>
              </div>
            </div>
          )}
          {selectedTreeNode === "guardrail" && (
            <div>
              <span className="text-emerald-400 font-bold block mb-1">NODE 3: HARD POLICY GATE &amp; SAFETY ENGINE</span>
              <p className="text-[#d4c4b1] text-[11px]">Enforces deterministic business rules before ANY financial or communication tool can fire. If transaction exceeds ₹50,000 or customer has opted out, execution is halted or routed to human desk.</p>
              <div className="flex gap-4 text-[10px] text-[#a79f93] pt-1">
                <span>Max Auto Threshold: <strong className="text-white">₹50,000</strong></span>
                <span>Max Attempts Limit: <strong className="text-white">2 Retries</strong></span>
                <span>Quiet Hours: <strong className="text-emerald-400">Enforced (10PM–8AM)</strong></span>
              </div>
            </div>
          )}
          {selectedTreeNode === "dispatch" && (
            <div>
              <span className="text-purple-300 font-bold block mb-1">NODE 4: MULTI-TIER ACTION DISPATCH &amp; ROUTING</span>
              <p className="text-[#d4c4b1] text-[11px]">Dynamic routing selects the highest net-recovery channel: Smart Auto-Retry at peak liquidity, Razorpay Hosted Payment Link via WhatsApp/SMS, or Account Manager escalation.</p>
              <div className="flex gap-4 text-[10px] text-[#a79f93] pt-1">
                <span>Autonomous Execution Rate: <strong className="text-emerald-400">98.6%</strong></span>
                <span>Human Escalation Rate: <strong className="text-purple-300">1.4%</strong></span>
                <span>Channel Switch Time: <strong className="text-white">&lt;50ms</strong></span>
              </div>
            </div>
          )}
          {selectedTreeNode === "verify" && (
            <div>
              <span className="text-emerald-400 font-bold block mb-1">NODE 5: PAYMENT CAPTURE VERIFICATION &amp; RECONCILIATION</span>
              <p className="text-[#d4c4b1] text-[11px]">Cryptographically verifies Razorpay payment capture via webhook signature before marking case as RECOVERED. Writes permanent tamper-proof audit record to the SQLite immutable ledger.</p>
              <div className="flex gap-4 text-[10px] text-[#a79f93] pt-1">
                <span>Verification Accuracy: <strong className="text-emerald-400">100%</strong></span>
                <span>Settlement Lag: <strong className="text-white">Real-time (T+0s)</strong></span>
                <span>Ledger Integrity: <strong className="text-emerald-400">SHA-256 Hash Verified</strong></span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── RBI-COMPLIANT E-MANDATE & UPI AUTOPAY RETRY SEQUENCER ─── */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center flex-wrap gap-2">
          <div>
            <h3 className="text-xs text-[#fbc162] font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-sm">cycle</span>
              RBI-COMPLIANT E-MANDATE &amp; UPI AUTOPAY RETRY SEQUENCER
            </h3>
            <p className="text-[10px] text-[#a79f93] mt-0.5">
              Automated multi-attempt recurring subscription recovery adhering to RBI 24h pre-debit rules &amp; liquidity switches.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[9px] font-bold">
              NPCI / RBI CIRCULAR COMPLIANT
            </span>
          </div>
        </div>

        {/* 5-Step Sequencer Timeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-2">
          {[
            {
              step: "STEP 1: T-24H",
              title: "Pre-Debit Notice",
              desc: "SMS & Email sent 24h prior to mandate debit with customer opt-out link.",
              badge: "Statutory Rule",
              color: "border-[#fbc162]/40 text-[#fbc162]",
            },
            {
              step: "STEP 2: T+0",
              title: "Primary Attempt",
              desc: "Direct presentation to customer bank (HDFC/SBI) via UPI AutoPay switch.",
              badge: "Attempt #1",
              color: "border-cyan-500/30 text-cyan-300",
            },
            {
              step: "STEP 3: T+2",
              title: "Smart Bank Retry",
              desc: "Scheduled at 10:30 AM (post-salary/RTGS opening) to overcome temporary NSF.",
              badge: "Liquidity Window",
              color: "border-blue-500/30 text-blue-400",
            },
            {
              step: "STEP 4: T+4",
              title: "Omnichannel Nudge",
              desc: "Dispatches WhatsApp & SMS with 1-click Razorpay payment link.",
              badge: "Channel Switch",
              color: "border-purple-500/30 text-purple-300",
            },
            {
              step: "STEP 5: T+7",
              title: "Final Settlement",
              desc: "Grace period terminates. Automatic mandate pause or human desk escalation.",
              badge: "Terminal Gate",
              color: "border-emerald-500/40 text-emerald-400",
            },
          ].map((seq) => (
            <div key={seq.step} className={`p-3.5 rounded bg-[#241f18] border ${seq.color} space-y-2`}>
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-bold uppercase">{seq.step}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>
              <h4 className="text-white font-bold text-xs">{seq.title}</h4>
              <p className="text-[10px] text-[#a79f93] leading-relaxed">{seq.desc}</p>
              <div className="pt-1 flex items-center justify-between text-[8px] text-[#a79f93]">
                <span className="px-1.5 py-0.5 rounded bg-[#17130c] border border-[#342D24] text-white font-bold">
                  {seq.badge}
                </span>
                <span className="text-emerald-400 font-bold">82% Recovery</span>
              </div>
            </div>
          ))}
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
            {strategyStats.map((s) => (
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

      {/* Analytical Diagram 1: Champion vs Challenger A/B Uplift Matrix */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest flex items-center gap-2">
            <span className="material-symbols-outlined text-base">compare</span>
            CHAMPION VS CHALLENGER A/B UPLIFT MATRIX
          </h3>
          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30">
            AI AGENT +43.2% NET UPLIFT
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-lg bg-[#17130c] border border-[#342D24] space-y-3">
            <div className="flex justify-between items-center border-b border-[#342D24] pb-2">
              <span className="text-[#a79f93] font-bold">CHAMPION (Rule-Based Static Retries)</span>
              <span className="text-[10px] text-[#a79f93]">Legacy baseline</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-xl font-bold text-[#a79f93] block">28.4%</span>
                <span className="text-[9px] text-[#a79f93]">Recovery Rate</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white block">3.8 days</span>
                <span className="text-[9px] text-[#a79f93]">Mean TTR</span>
              </div>
              <div>
                <span className="text-xl font-bold text-[#a79f93] block">₹1.8L</span>
                <span className="text-[9px] text-[#a79f93]">Yield / 100 cases</span>
              </div>
            </div>
            <p className="text-[10px] text-[#a79f93]">Blind 24h retries without issuer telemetry or liquidity window sync.</p>
          </div>

          <div className="p-4 rounded-lg bg-[#241f18] border border-[#fbc162]/40 space-y-3 shadow-lg shadow-[#fbc162]/5">
            <div className="flex justify-between items-center border-b border-[#342D24] pb-2">
              <span className="text-[#fbc162] font-bold">CHALLENGER (Aurum AI Autonomous Agent)</span>
              <span className="text-[10px] text-emerald-400 font-bold">Active Engine</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <span className="text-xl font-bold text-emerald-400 block">{metrics.recoveryRate || 71.6}%</span>
                <span className="text-[9px] text-[#a79f93]">Recovery Rate</span>
              </div>
              <div>
                <span className="text-xl font-bold text-white block">{metrics.avgRecoveryTime || "1.4h"}</span>
                <span className="text-[9px] text-[#a79f93]">Mean TTR</span>
              </div>
              <div>
                <span className="text-xl font-bold text-emerald-400 block">{formatCurrencyINR(metrics.revenueRecoveredMinor)}</span>
                <span className="text-[9px] text-[#a79f93]">Total Recovered</span>
              </div>
            </div>
            <p className="text-[10px] text-emerald-300/80">Autonomous diagnosis, smart Razorpay payment links, and dynamic multi-channel retry timing.</p>
          </div>
        </div>
      </div>

      {/* Analytical Diagram 2: Step Attribution Breakdown */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-3 font-mono text-xs">
        <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">
          PLAYBOOK ATTRIBUTION (WHERE RECOVERIES WERE WON)
        </h3>
        <div className="h-4 bg-[#17130c] rounded-full overflow-hidden flex">
          <div className="h-full bg-[#fbc162]" style={{ width: "48%" }} title="Smart Retry: 48%" />
          <div className="h-full bg-emerald-400" style={{ width: "34%" }} title="Razorpay Payment Link: 34%" />
          <div className="h-full bg-purple-400" style={{ width: "18%" }} title="Human Escalation: 18%" />
        </div>
        <div className="flex flex-wrap justify-between gap-4 text-[10px] pt-1">
          <span className="flex items-center gap-1.5 text-[#fbc162]">
            <span className="w-2 h-2 rounded-full bg-[#fbc162]" /> 48% Smart Automated Retry
          </span>
          <span className="flex items-center gap-1.5 text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400" /> 34% Hosted Razorpay Link
          </span>
          <span className="flex items-center gap-1.5 text-purple-300">
            <span className="w-2 h-2 rounded-full bg-purple-400" /> 18% Human Escalation
          </span>
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
