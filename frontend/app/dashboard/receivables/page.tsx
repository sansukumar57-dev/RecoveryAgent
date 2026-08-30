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
  const { formatCurrencyINR } = useDashboard();
  const [selectedInv, setSelectedInv] = useState<string | null>(null);
  const [actionFired, setActionFired] = useState<Record<string, string>>({});
  const [bucketFilter, setBucketFilter] = useState("ALL");

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
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-[#342D24]">
        <div>
          <h2 className="text-2xl font-extrabold font-mono text-white">B2B Receivables Chaser</h2>
          <p className="text-xs font-mono text-[#a79f93] mt-1">
            Track overdue invoices, aging buckets, and AI-driven automated chase workflows.
          </p>
        </div>
        <div className="font-mono text-xs text-right">
          <span className="text-[#a79f93] block">Total Overdue Portfolio</span>
          <span className="text-rose-400 font-bold text-2xl">{formatCurrencyINR(totalOverdue)}</span>
          <span className="text-[10px] text-[#a79f93] block mt-0.5">{MOCK_INVOICES.length} invoices</span>
        </div>
      </div>

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
        <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">AGING DISTRIBUTION</h3>
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
        <div className="flex gap-6 font-mono text-[10px]">
          {buckets.filter((b) => b.key !== "ALL").map((b) => {
            const pct = totalOverdue > 0 ? (b.amount / totalOverdue) * 100 : 0;
            return (
              <span key={b.key} className={`flex items-center gap-1.5 ${b.textColor}`}>
                <span className={`w-2 h-2 rounded-full inline-block ${b.key === "0-30d" ? "bg-[#fbc162]" : b.key === "30-60d" ? "bg-orange-400" : b.key === "60-90d" ? "bg-rose-400" : "bg-red-600"}`} />
                {b.label}: {pct.toFixed(0)}%
              </span>
            );
          })}
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
    </div>
  );
}
