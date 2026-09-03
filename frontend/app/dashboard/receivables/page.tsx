"use client";

import React, { useState } from "react";
import { useDashboard } from "../DashboardContext";

const MOCK_INVOICES = [
  { id: "INV-4201", customer: "TechFlow Ltd", amountMinor: 24000000, dueDate: "2026-08-15", daysOverdue: 15, bucket: "0-30d", chaseStatus: "ESCALATED", lastAction: "Human escalation sent to Account Manager", attempts: 2, email: "accounts@techflow.io" },
  { id: "INV-4178", customer: "Meridian Exports", amountMinor: 7500000, dueDate: "2026-07-28", daysOverdue: 33, bucket: "30-60d", chaseStatus: "CHASING", lastAction: "Reminder email #2 sent via AI agent", attempts: 3, email: "treasury@meridian.in" },
  { id: "INV-4156", customer: "Orion Logistics", amountMinor: 12000000, dueDate: "2026-07-10", daysOverdue: 51, bucket: "30-60d", chaseStatus: "CHASING", lastAction: "Razorpay payment link generated (plink_4b7c)", attempts: 4, email: "finance@orionlog.com" },
  { id: "INV-4102", customer: "Zenith Healthcare", amountMinor: 4500000, dueDate: "2026-06-20", daysOverdue: 71, bucket: "60-90d", chaseStatus: "CRITICAL", lastAction: "Final notice issued — escalation imminent", attempts: 5, email: "accounts@zenithhealth.in" },
  { id: "INV-4089", customer: "Atlas Mining Corp", amountMinor: 18000000, dueDate: "2026-05-15", daysOverdue: 107, bucket: "90+d", chaseStatus: "LEGAL_REVIEW", lastAction: "Case forwarded to legal team for review", attempts: 6, email: "legal@atlas.in" },
  { id: "INV-4215", customer: "Pinnacle SaaS Inc", amountMinor: 1999900, dueDate: "2026-08-25", daysOverdue: 5, bucket: "0-30d", chaseStatus: "PENDING", lastAction: "Auto-reminder scheduled by AI agent", attempts: 1, email: "billing@pinnacle.dev" },
  { id: "INV-4190", customer: "Acme Technologies", amountMinor: 4800000, dueDate: "2026-08-10", daysOverdue: 20, bucket: "0-30d", chaseStatus: "CHASING", lastAction: "Payment link dispatched via SMS & Email", attempts: 2, email: "billing@acmetech.in" },
];

const STATUS_CONFIG: Record<string, { label: string; bg: string; text: string; border: string }> = {
  PENDING: { label: "PENDING", bg: "bg-[#241f18]", text: "text-[#a79f93]", border: "border-[#342D24]" },
  CHASING: { label: "CHASING", bg: "bg-[#fbc162]/10", text: "text-[#fbc162]", border: "border-[#fbc162]/30" },
  ESCALATED: { label: "ESCALATED", bg: "bg-purple-950/50", text: "text-purple-300", border: "border-purple-500/30" },
  CRITICAL: { label: "CRITICAL", bg: "bg-rose-950/50", text: "text-rose-400", border: "border-rose-500/30" },
  LEGAL_REVIEW: { label: "LEGAL REVIEW", bg: "bg-red-950/50", text: "text-red-400", border: "border-red-500/30" },
};

const AGENT_ACTIONS = [
  { id: "reminder", label: "Send AI Reminder", icon: "mail", desc: "Personalized reminder via email & SMS" },
  { id: "link", label: "Generate Payment Link", icon: "link", desc: "Razorpay hosted payment page" },
  { id: "escalate", label: "Escalate to Human", icon: "person", desc: "Flag for Account Manager review" },
  { id: "legal", label: "Send Legal Notice", icon: "gavel", desc: "Formal notice with 7-day deadline" },
];

export default function ReceivablesPage() {
  const { formatCurrencyINR, ptpRecords, handleUpdatePtpStatus } = useDashboard();
  const [activeTab, setActiveTab] = useState<"INVOICES" | "PTP_TRACKER">("INVOICES");
  const [selectedInv, setSelectedInv] = useState<string | null>(null);
  const [actionFired, setActionFired] = useState<Record<string, string>>({});
  const [bucketFilter, setBucketFilter] = useState("ALL");
  const [targetDso, setTargetDso] = useState(21);

  const baselineDso = 38;
  const annualCreditVolume = 5000000000;
  const unlockedCapital = Math.max(0, Math.round((annualCreditVolume / 365) * (baselineDso - targetDso)));
  const interestSaved = Math.round(unlockedCapital * 0.115);

  const buckets = [
    { key: "ALL", label: "All Invoices", color: "border-[#342D24]", textColor: "text-white", count: MOCK_INVOICES.length, amount: MOCK_INVOICES.reduce((a, i) => a + i.amountMinor, 0) },
    { key: "0-30d", label: "0–30 Days", color: "border-[#fbc162]/30", textColor: "text-[#fbc162]", count: MOCK_INVOICES.filter((i) => i.bucket === "0-30d").length, amount: MOCK_INVOICES.filter((i) => i.bucket === "0-30d").reduce((a, i) => a + i.amountMinor, 0) },
    { key: "30-60d", label: "30–60 Days", color: "border-orange-500/30", textColor: "text-orange-400", count: MOCK_INVOICES.filter((i) => i.bucket === "30-60d").length, amount: MOCK_INVOICES.filter((i) => i.bucket === "30-60d").reduce((a, i) => a + i.amountMinor, 0) },
    { key: "60-90d", label: "60–90 Days", color: "border-rose-500/30", textColor: "text-rose-400", count: MOCK_INVOICES.filter((i) => i.bucket === "60-90d").length, amount: MOCK_INVOICES.filter((i) => i.bucket === "60-90d").reduce((a, i) => a + i.amountMinor, 0) },
    { key: "90+d", label: "90+ Days", color: "border-red-700/30", textColor: "text-red-400", count: MOCK_INVOICES.filter((i) => i.bucket === "90+d").length, amount: MOCK_INVOICES.filter((i) => i.bucket === "90+d").reduce((a, i) => a + i.amountMinor, 0) },
  ];

  const totalOverdue = MOCK_INVOICES.reduce((a, i) => a + i.amountMinor, 0);
  const filtered = bucketFilter === "ALL" ? MOCK_INVOICES : MOCK_INVOICES.filter((i) => i.bucket === bucketFilter);

  const fireAction = (invId: string, actionId: string) => {
    setActionFired((prev) => ({ ...prev, [invId]: actionId }));
    setTimeout(() => setActionFired((prev) => { const n = { ...prev }; delete n[invId]; return n; }), 3000);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header & Sub-Tab Switcher */}
      <div className="flex justify-between items-end pb-4 border-b border-[#342D24] flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-extrabold font-mono text-white">B2B Receivables &amp; Cash Acceleration</h2>
          <p className="text-xs font-mono text-[#a79f93] mt-1">
            Track overdue invoices, aging buckets, and Promise-to-Pay (PTP) customer commitments.
          </p>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs">
          <button
            onClick={() => setActiveTab("INVOICES")}
            className={`px-3.5 py-2 rounded font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === "INVOICES"
                ? "bg-[#fbc162] text-[#17130c]"
                : "bg-[#241f18] text-[#a79f93] hover:text-white border border-[#342D24]"
            }`}
          >
            <span className="material-symbols-outlined text-sm">receipt_long</span>
            Invoices &amp; DSO Optimizer
          </button>
          <button
            onClick={() => setActiveTab("PTP_TRACKER")}
            className={`px-3.5 py-2 rounded font-bold cursor-pointer transition-colors flex items-center gap-1.5 ${
              activeTab === "PTP_TRACKER"
                ? "bg-[#fbc162] text-[#17130c]"
                : "bg-[#241f18] text-[#a79f93] hover:text-white border border-[#342D24]"
            }`}
          >
            <span className="material-symbols-outlined text-sm">handshake</span>
            Promise-to-Pay (PTP) Tracker
            <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-black/40 text-current">
              {ptpRecords.length}
            </span>
          </button>
        </div>
      </div>

      {activeTab === "PTP_TRACKER" && (
        <div className="space-y-6 font-mono">
          {/* PTP Metrics Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#241f18] border border-[#342D24] p-4 rounded-lg">
              <span className="text-[10px] text-[#a79f93] uppercase block">Total Promised Volume</span>
              <span className="text-2xl font-extrabold text-white">
                {formatCurrencyINR(ptpRecords.reduce((s, p) => s + p.amountMinor, 0))}
              </span>
              <span className="text-[9px] text-[#a79f93] block mt-1">{ptpRecords.length} active commitments</span>
            </div>
            <div className="bg-[#241f18] border border-emerald-500/30 p-4 rounded-lg">
              <span className="text-[10px] text-[#a79f93] uppercase block">Kept Commitment Rate</span>
              <span className="text-2xl font-extrabold text-emerald-400">
                {ptpRecords.length > 0
                  ? `${Math.round(
                      (ptpRecords.filter((p) => p.status === "KEPT").length / ptpRecords.length) * 100
                    )}%`
                  : "84%"}
              </span>
              <span className="text-[9px] text-emerald-400/80 block mt-1">Settled on or before promised date</span>
            </div>
            <div className="bg-[#241f18] border border-[#fbc162]/30 p-4 rounded-lg">
              <span className="text-[10px] text-[#a79f93] uppercase block">Pending Commitments</span>
              <span className="text-2xl font-extrabold text-[#fbc162]">
                {ptpRecords.filter((p) => p.status === "PENDING").length}
              </span>
              <span className="text-[9px] text-[#a79f93] block mt-1">Dunning paused; awaiting due date</span>
            </div>
            <div className="bg-[#241f18] border border-rose-500/30 p-4 rounded-lg">
              <span className="text-[10px] text-[#a79f93] uppercase block">Broken Commitments</span>
              <span className="text-2xl font-extrabold text-rose-400">
                {ptpRecords.filter((p) => p.status === "BROKEN").length}
              </span>
              <span className="text-[9px] text-rose-400/80 block mt-1">Escalated to Human Approval Center</span>
            </div>
          </div>

          {/* PTP Commitments Table */}
          <div className="bg-[#1f1812] border border-[#342D24] rounded-lg overflow-hidden">
            <div className="p-4 border-b border-[#342D24] flex justify-between items-center">
              <div>
                <h3 className="text-xs font-bold text-[#fbc162] uppercase tracking-wider flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">event_available</span>
                  Active Promise-to-Pay (PTP) Registry
                </h3>
                <p className="text-[10px] text-[#a79f93] mt-0.5">
                  Automated dunning pauses while commitments remain in good standing.
                </p>
              </div>
              <span className="text-[10px] text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                RBI Compliant Grace Tracker
              </span>
            </div>

            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-[#241f18] border-b border-[#342D24] text-[10px] text-[#a79f93] uppercase">
                <tr>
                  <th className="p-3">Case ID</th>
                  <th className="p-3">Customer</th>
                  <th className="p-3">Committed Amount</th>
                  <th className="p-3">Promised Date</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Agent Notes</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#342D24]">
                {ptpRecords.map((ptp) => (
                  <tr key={ptp.id} className="hover:bg-[#241f18] transition-colors">
                    <td className="p-3 font-bold text-[#fbc162]">{ptp.caseId}</td>
                    <td className="p-3 text-white font-medium">{ptp.customerName}</td>
                    <td className="p-3 font-bold text-white">{formatCurrencyINR(ptp.amountMinor)}</td>
                    <td className="p-3 text-cyan-300 font-medium">{ptp.promisedDate}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          ptp.status === "KEPT"
                            ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30"
                            : ptp.status === "PENDING"
                            ? "bg-[#fbc162]/20 text-[#fbc162] border border-[#fbc162]/40"
                            : "bg-rose-950 text-rose-400 border border-rose-500/30"
                        }`}
                      >
                        {ptp.status}
                      </span>
                    </td>
                    <td className="p-3 text-[#d4c4b1] text-[11px] max-w-[280px] truncate">{ptp.notes}</td>
                    <td className="p-3 text-right">
                      {ptp.status === "PENDING" ? (
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => handleUpdatePtpStatus(ptp.id, "KEPT")}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-black text-[9px] font-bold rounded cursor-pointer"
                          >
                            Mark Kept
                          </button>
                          <button
                            onClick={() => handleUpdatePtpStatus(ptp.id, "BROKEN")}
                            className="px-2 py-1 bg-rose-950 hover:bg-rose-900 border border-rose-500/40 text-rose-400 text-[9px] font-bold rounded cursor-pointer"
                          >
                            Mark Broken
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-[#a79f93]">Resolved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "INVOICES" && (
        <>

      {/* Aging Bucket Cards — clickable filter */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {buckets.filter((b) => b.key !== "ALL").map((b) => (
          <button
            key={b.key}
            onClick={() => setBucketFilter(bucketFilter === b.key ? "ALL" : b.key)}
            className={`bg-[#241f18] border ${b.color} p-5 rounded-lg text-left transition-all cursor-pointer hover:brightness-110 ${bucketFilter === b.key ? "ring-1 ring-[#fbc162]" : ""}`}
          >
            <span className="font-mono text-[10px] text-[#a79f93] uppercase block mb-2">{b.label}</span>
            <div className={`text-2xl font-extrabold font-mono ${b.textColor}`}>{formatCurrencyINR(b.amount)}</div>
            <div className="text-[11px] font-mono text-[#d4c4b1] mt-1">{b.count} invoice{b.count !== 1 ? "s" : ""}</div>
          </button>
        ))}
      </div>

      {/* Aging Distribution Bar */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">PORTFOLIO AGING DISTRIBUTION & RECOVERY DECAY</h3>
          <span className="text-[11px] font-mono text-emerald-400">Mean DSO: 24.5 days (↓14.2d via AI Agent)</span>
        </div>
        <div className="h-5 bg-[#17130c] rounded-full overflow-hidden flex gap-0.5">
          {buckets.filter((b) => b.key !== "ALL").map((b) => {
            const pct = totalOverdue > 0 ? (b.amount / totalOverdue) * 100 : 0;
            const bgColors: Record<string, string> = { "0-30d": "bg-[#fbc162]", "30-60d": "bg-orange-400", "60-90d": "bg-rose-400", "90+d": "bg-red-600" };
            return (
              <div
                key={b.key}
                className={`h-full ${bgColors[b.key] || "bg-[#342D24]"} transition-all duration-700 first:rounded-l-full last:rounded-r-full`}
                style={{ width: `${pct}%` }}
                title={`${b.label}: ${formatCurrencyINR(b.amount)} (${pct.toFixed(1)}%)`}
              />
            );
          })}
        </div>
        <div className="flex flex-wrap justify-between gap-4 font-mono text-[10px] pt-1">
          {buckets.filter((b) => b.key !== "ALL").map((b) => {
            const pct = totalOverdue > 0 ? (b.amount / totalOverdue) * 100 : 0;
            const decayRates: Record<string, string> = { "0-30d": "89% yield", "30-60d": "64% yield", "60-90d": "38% yield", "90+d": "15% yield" };
            return (
              <span key={b.key} className={`flex items-center gap-1.5 ${b.textColor}`}>
                <span className={`w-2 h-2 rounded-full inline-block ${b.key === "0-30d" ? "bg-[#fbc162]" : b.key === "30-60d" ? "bg-orange-400" : b.key === "60-90d" ? "bg-rose-400" : "bg-red-600"}`} />
                {b.label}: {pct.toFixed(0)}% · <span className="text-[#a79f93]">{decayRates[b.key]}</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* Analytical Tool: Vintage Recovery Yield Waterfall */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 font-mono text-xs">
        {[
          { range: "0–30 Days (Early Chase)", yieldRate: "89%", strategy: "Smart Automated Payment Links", action: "Low friction auto-nudges", color: "text-[#fbc162]", bg: "border-[#fbc162]/30" },
          { range: "30–60 Days (Mid Delinquency)", yieldRate: "64%", strategy: "Personalized SMS + Email Sequence", action: "Multi-channel escalation", color: "text-orange-400", bg: "border-orange-500/30" },
          { range: "60–90 Days (Late Delinquency)", yieldRate: "38%", strategy: "Account Executive Human Nudge", action: "Commercial renegotiation", color: "text-rose-400", bg: "border-rose-500/30" },
          { range: "90+ Days (Pre-Writeoff)", yieldRate: "15%", strategy: "Structured Settlement / Legal Gate", action: "Formal demand notice", color: "text-red-400", bg: "border-red-700/30" },
        ].map((v) => (
          <div key={v.range} className={`bg-[#1f1812] border ${v.bg} p-4 rounded-lg space-y-2`}>
            <span className="text-[#a79f93] block text-[10px] uppercase font-bold">{v.range}</span>
            <div className={`text-xl font-extrabold ${v.color}`}>{v.yieldRate} <span className="text-[10px] text-[#a79f93] font-normal">recovery prob.</span></div>
            <p className="text-[#d4c4b1] text-[11px] font-bold">{v.strategy}</p>
            <span className="text-[9px] text-[#a79f93] block">{v.action}</span>
          </div>
        ))}
      </div>

      {/* Analytical Tool: Working Capital & DSO Acceleration Calculator */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4 font-mono text-xs">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-xs text-[#fbc162] font-bold uppercase tracking-widest flex items-center gap-2">
              <span className="material-symbols-outlined text-base">calculate</span>
              DSO VELOCITY &amp; WORKING CAPITAL LIQUIDITY CALCULATOR
            </h3>
            <p className="text-[11px] text-[#a79f93] mt-0.5">Simulate cash flow unlocked across your enterprise portfolio by accelerating debtor collections.</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-[#a79f93] block uppercase">Working Capital Unlocked</span>
            <span className="text-2xl font-extrabold text-emerald-400">{formatCurrencyINR(unlockedCapital)}</span>
            <span className="text-[10px] text-[#fbc162] block">+{formatCurrencyINR(interestSaved)}/yr debt servicing saved</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          <div className="p-4 bg-[#241f18] rounded border border-[#342D24] space-y-2">
            <span className="text-[#a79f93] text-[10px] uppercase block">Current Baseline DSO</span>
            <div className="text-xl font-bold text-rose-400">{baselineDso} Days</div>
            <span className="text-[10px] text-[#a79f93] block">Manual accounts receivable cycle</span>
          </div>

          <div className="p-4 bg-[#241f18] rounded border border-[#342D24] space-y-2">
            <span className="text-[#a79f93] text-[10px] uppercase block">AI Automated DSO Target</span>
            <div className="text-xl font-bold text-[#fbc162]">{targetDso} Days</div>
            <input
              type="range"
              min="14"
              max="35"
              step="1"
              value={targetDso}
              onChange={(e) => setTargetDso(Number(e.target.value))}
              className="w-full accent-[#fbc162] cursor-pointer"
            />
            <span className="text-[10px] text-[#a79f93] block">{baselineDso - targetDso} days faster cash recapture</span>
          </div>

          <div className="p-4 bg-[#241f18] rounded border border-emerald-500/30 space-y-2 bg-emerald-950/20">
            <span className="text-[#a79f93] text-[10px] uppercase block">Liquidity Acceleration</span>
            <div className="text-xl font-bold text-emerald-400">+{(((baselineDso - targetDso) / baselineDso) * 100).toFixed(1)}%</div>
            <span className="text-[10px] text-emerald-400/80 block">Direct addition to corporate free cash flow</span>
          </div>
        </div>
      </div>

      {/* Invoice Table */}
      <div className="bg-[#241f18] border border-[#342D24] rounded-lg overflow-hidden">
        <div className="p-4 border-b border-[#342D24] flex justify-between items-center">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">
            OVERDUE INVOICES {bucketFilter !== "ALL" ? `— ${buckets.find((b) => b.key === bucketFilter)?.label}` : ""}
          </h3>
          <span className="font-mono text-[10px] text-[#a79f93]">{filtered.length} records</span>
        </div>
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="bg-[#1f1812] border-b border-[#342D24] text-[10px] text-[#a79f93] uppercase">
            <tr>
              <th className="p-3">Invoice</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Due Date</th>
              <th className="p-3">Overdue</th>
              <th className="p-3">Status</th>
              <th className="p-3">Attempts</th>
              <th className="p-3">Last Action</th>
              <th className="p-3 text-right">AI Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#342D24]">
            {filtered.map((inv) => {
              const st = STATUS_CONFIG[inv.chaseStatus] || STATUS_CONFIG.PENDING;
              const isSelected = selectedInv === inv.id;
              const fired = actionFired[inv.id];
              return (
                <React.Fragment key={inv.id}>
                  <tr className="hover:bg-[#1f1812] transition-colors">
                    <td className="p-3 text-[#fbc162] font-bold">{inv.id}</td>
                    <td className="p-3">
                      <div className="text-white font-bold">{inv.customer}</div>
                      <div className="text-[10px] text-[#a79f93]">{inv.email}</div>
                    </td>
                    <td className="p-3 text-white font-bold">{formatCurrencyINR(inv.amountMinor)}</td>
                    <td className="p-3 text-[#d4c4b1]">{inv.dueDate}</td>
                    <td className="p-3">
                      <span className={`font-bold ${inv.daysOverdue > 60 ? "text-rose-400" : inv.daysOverdue > 30 ? "text-orange-400" : "text-[#fbc162]"}`}>
                        {inv.daysOverdue}d
                      </span>
                    </td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${st.bg} ${st.text} ${st.border}`}>
                        {st.label}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-0.5">
                        {Array.from({ length: Math.min(inv.attempts, 6) }).map((_, i) => (
                          <span key={i} className={`w-2 h-2 rounded-full ${i < inv.attempts ? "bg-[#fbc162]" : "bg-[#342D24]"}`} />
                        ))}
                      </div>
                      <span className="text-[#a79f93] text-[9px]">{inv.attempts} sent</span>
                    </td>
                    <td className="p-3 text-[#d4c4b1] max-w-[160px] truncate">{inv.lastAction}</td>
                    <td className="p-3 text-right">
                      {fired ? (
                        <span className="text-emerald-400 font-mono text-[10px] font-bold animate-pulse">✓ Sent!</span>
                      ) : (
                        <button
                          onClick={() => setSelectedInv(isSelected ? null : inv.id)}
                          className={`px-2.5 py-1 rounded border font-mono text-[10px] cursor-pointer transition-colors ${
                            isSelected
                              ? "border-[#fbc162] text-[#fbc162] bg-[#fbc162]/10"
                              : "border-[#342D24] text-[#d4c4b1] hover:border-[#fbc162]/40 hover:text-[#fbc162]"
                          }`}
                        >
                          <span className="material-symbols-outlined text-[12px] align-middle">smart_toy</span> Act
                        </button>
                      )}
                    </td>
                  </tr>
                  {/* AI Actions Panel */}
                  {isSelected && (
                    <tr>
                      <td colSpan={9} className="p-4 bg-[#1a1610] border-t border-[#fbc162]/20">
                        <div className="space-y-3">
                          <span className="font-mono text-[10px] text-[#fbc162] font-bold uppercase block">
                            AI Agent Actions for {inv.id} — {inv.customer}
                          </span>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {AGENT_ACTIONS.map((action) => (
                              <button
                                key={action.id}
                                onClick={() => { fireAction(inv.id, action.id); setSelectedInv(null); }}
                                className="bg-[#241f18] border border-[#342D24] p-3 rounded text-left hover:border-[#fbc162]/50 hover:bg-[#241f18]/80 transition-all cursor-pointer group"
                              >
                                <span className="material-symbols-outlined text-[#fbc162] text-lg block mb-1.5">{action.icon}</span>
                                <span className="font-mono text-[11px] text-white font-bold block group-hover:text-[#fbc162] transition-colors">{action.label}</span>
                                <span className="font-mono text-[9px] text-[#a79f93] block mt-0.5">{action.desc}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Chase Activity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">CHASE STATUS BREAKDOWN</h3>
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = MOCK_INVOICES.filter((i) => i.chaseStatus === key).length;
            const pct = MOCK_INVOICES.length > 0 ? (count / MOCK_INVOICES.length) * 100 : 0;
            return (
              <div key={key} className="flex items-center gap-3 font-mono text-xs">
                <span className={`w-24 shrink-0 ${cfg.text}`}>{cfg.label}</span>
                <div className="flex-grow h-2 bg-[#17130c] rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-700 ${cfg.text.replace("text-", "bg-").replace("/30", "").replace("/50", "")}`} style={{ width: `${pct}%` }} />
                </div>
                <span className="text-white font-bold w-5 text-right">{count}</span>
              </div>
            );
          })}
        </div>

        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">AI AGENT ACTIVITY</h3>
          <div className="space-y-2 font-mono text-xs">
            {[
              { label: "Auto-reminders sent", value: "12", icon: "mail", color: "text-[#fbc162]" },
              { label: "Payment links generated", value: "7", icon: "link", color: "text-cyan-300" },
              { label: "Human escalations", value: "3", icon: "person", color: "text-purple-300" },
              { label: "Legal notices dispatched", value: "1", icon: "gavel", color: "text-rose-400" },
              { label: "Avg days to first contact", value: "0.8d", icon: "schedule", color: "text-emerald-400" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between border-b border-[#342D24] pb-2">
                <div className="flex items-center gap-2">
                  <span className={`material-symbols-outlined text-sm ${item.color}`}>{item.icon}</span>
                  <span className="text-[#d4c4b1]">{item.label}</span>
                </div>
                <span className={`font-bold ${item.color}`}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      )}
    </div>
  );
}
