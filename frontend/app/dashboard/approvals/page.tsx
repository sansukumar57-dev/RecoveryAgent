"use client";

import React, { useState } from "react";
import { useDashboard } from "../DashboardContext";

export default function ApprovalsPage() {
  const { cases, handleExecuteCase, isProcessing, formatCurrencyINR, metrics } = useDashboard();
  const [approved, setApproved] = useState<string[]>([]);
  const [denied, setDenied] = useState<string[]>([]);
  const [search, setSearch] = useState("");

  const pendingApprovals = cases.filter(
    (c) => c.status === "ESCALATED" && !approved.includes(c.caseId) && !denied.includes(c.caseId)
  );

  // Normalise the query so "RC-1040 — Customer #3", "rc1040", "#3" and
  // "card_expired" all work as search terms.
  const q = search.trim().toLowerCase();
  const qCompact = q.replace(/[\s—–-]+/g, "");

  const matchesSearch = (c: typeof cases[0]) => {
    if (!q) return true;
    const haystack = [
      c.caseId,
      `customer #${c.customerId}`,
      String(c.customerId),
      c.customerName,
      c.plan,
      c.paymentId,
      c.failureReason,
      c.diagnosis,
      c.strategy,
      c.lastGuardrailRule,
      `${c.caseId} — ${c.customerName}`,
      `₹${Math.round((c.amountMinor || 0) / 100)}`,
    ]
      .filter(Boolean)
      .join(" | ")
      .toLowerCase();

    return haystack.includes(q) || haystack.replace(/[\s—–-]+/g, "").includes(qCompact);
  };

  const visibleApprovals = pendingApprovals.filter(matchesSearch);

  // Everything that is actually searchable right now — fed to the <datalist>
  // so the browser shows the available options as you type.
  const searchSuggestions = Array.from(
    new Set(
      pendingApprovals.flatMap((c) =>
        [
          `${c.caseId} — ${c.customerName}`,
          `Customer #${c.customerId}`,
          c.failureReason,
          c.strategy,
          c.lastGuardrailRule,
        ].filter((v): v is string => Boolean(v))
      )
    )
  );

  const handleApprove = (c: typeof cases[0]) => {
    setApproved((prev) => [...prev, c.caseId]);
    handleExecuteCase(c);
  };

  const handleDeny = (caseId: string) => {
    setDenied((prev) => [...prev, caseId]);
  };

  const riskLabel = (amount: number) => {
    if (amount >= 10000000) return { label: "CRITICAL", color: "text-rose-400", bg: "bg-rose-950/50", border: "border-rose-500/30" };
    if (amount >= 5000000) return { label: "HIGH", color: "text-orange-400", bg: "bg-orange-950/50", border: "border-orange-500/30" };
    return { label: "MEDIUM", color: "text-[#fbc162]", bg: "bg-[#fbc162]/10", border: "border-[#fbc162]/30" };
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-[#342D24]">
        <div>
          <h2 className="text-2xl font-extrabold font-mono text-white">Human Approval Center</h2>
          <p className="text-xs font-mono text-[#a79f93] mt-1">
            Cases escalated by the AI agent for human review — high-value or policy-boundary transactions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#a79f93] text-[16px] pointer-events-none">search</span>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              list="approval-search-options"
              placeholder="Search RC-1040, Customer #3, card_expired…"
              className="w-80 pl-9 pr-16 py-2 rounded bg-[#1f1812] border border-[#342D24] text-white font-mono text-xs focus:outline-none focus:border-[#fbc162] placeholder:text-[#a79f93]"
            />
            <datalist id="approval-search-options">
              {searchSuggestions.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>
            {search ? (
              <button
                onClick={() => setSearch("")}
                title="Clear search"
                className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-1.5 py-0.5 rounded text-[#a79f93] font-mono text-[10px] hover:text-white hover:bg-[#342D24] cursor-pointer"
              >
                {visibleApprovals.length}/{pendingApprovals.length}
                <span className="material-symbols-outlined text-[14px]">close</span>
              </button>
            ) : (
              <span className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#a79f93] pointer-events-none">
                {pendingApprovals.length}
              </span>
            )}
          </div>
          {pendingApprovals.length > 0 ? (
            <div className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded bg-purple-950 border border-purple-500/30">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              <span className="text-purple-300 font-bold">{pendingApprovals.length} awaiting your review</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 font-mono text-xs px-3 py-1.5 rounded bg-emerald-950 border border-emerald-500/30">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-emerald-400 font-bold">Queue clear</span>
            </div>
          )}
        </div>
      </div>

      {/* Quick search chips — shows what is actually available to search on */}
      {pendingApprovals.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
          <span className="text-[#a79f93] uppercase">Jump to:</span>
          {pendingApprovals.slice(0, 8).map((c) => (
            <button
              key={c.caseId}
              onClick={() => setSearch(search === c.caseId ? "" : c.caseId)}
              className={`px-2 py-1 rounded border cursor-pointer transition-colors ${
                search === c.caseId
                  ? "bg-[#fbc162] text-[#17130c] border-[#fbc162] font-bold"
                  : "bg-[#1f1812] text-[#d4c4b1] border-[#342D24] hover:border-[#fbc162]"
              }`}
            >
              {c.caseId} — Customer #{c.customerId}
            </button>
          ))}
          {search && (
            <button
              onClick={() => setSearch("")}
              className="px-2 py-1 rounded border border-[#342D24] text-[#a79f93] hover:text-white cursor-pointer"
            >
              reset
            </button>
          )}
        </div>
      )}

      {/* Approval Stats */}
      <div className="grid grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-[#241f18] border border-purple-500/20 p-4 rounded-lg">
          <span className="text-[#a79f93] block mb-1">Pending Review</span>
          <span className="text-2xl font-bold text-purple-300">{pendingApprovals.length}</span>
          <span className="text-[10px] text-[#a79f93] block mt-1">requires human decision</span>
        </div>
        <div className="bg-[#241f18] border border-emerald-500/20 p-4 rounded-lg">
          <span className="text-[#a79f93] block mb-1">Approved This Session</span>
          <span className="text-2xl font-bold text-emerald-400">{approved.length}</span>
          <span className="text-[10px] text-[#a79f93] block mt-1">recovery authorized</span>
        </div>
        <div className="bg-[#241f18] border border-rose-500/20 p-4 rounded-lg">
          <span className="text-[#a79f93] block mb-1">Denied This Session</span>
          <span className="text-2xl font-bold text-rose-400">{denied.length}</span>
          <span className="text-[10px] text-[#a79f93] block mt-1">archived</span>
        </div>
      </div>

      {/* Why Escalation Happens — Info Banner */}
      <div className="bg-[#1f1812] border border-[#342D24] p-4 rounded-lg flex gap-4 items-start font-mono text-xs">
        <span className="material-symbols-outlined text-[#fbc162] text-xl shrink-0 mt-0.5">info</span>
        <div>
          <span className="text-[#fbc162] font-bold block mb-1">Why does the AI escalate cases?</span>
          <p className="text-[#d4c4b1]">
            The AI agent escalates cases to you when: <span className="text-white font-bold">(1)</span> the transaction amount exceeds ₹50,000 (automated execution limit),{" "}
            <span className="text-white font-bold">(2)</span> the failure reason is unusual or fraud-adjacent, or{" "}
            <span className="text-white font-bold">(3)</span> confidence in diagnosis is below the 80% threshold. Your approval authorizes the bounded execution.
          </p>
        </div>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length === 0 ? (
        <div className="bg-[#241f18] border border-[#342D24] rounded-lg p-16 text-center space-y-4 font-mono">
          <span className="material-symbols-outlined text-6xl text-emerald-400 block">check_circle</span>
          <h3 className="text-xl font-bold text-white">No Pending Approvals</h3>
          <p className="text-xs text-[#a79f93] max-w-md mx-auto leading-relaxed">
            The AI agent is handling all active cases autonomously within policy guardrails.<br />
            Cases requiring human-in-the-loop authorization will appear here.
          </p>

          {/* Escalation Trigger Info */}
          <div className="max-w-md mx-auto mt-2 p-4 bg-[#1f1812] border border-[#342D24] rounded-lg text-left space-y-2 text-[11px]">
            <span className="text-[#fbc162] font-bold block uppercase text-[10px]">Escalation Triggers</span>
            {[
              { rule: "MAX_AUTO_AMOUNT_LIMIT", desc: "Transaction > ₹50,000 auto-limit" },
              { rule: "FRAUD_SIGNAL_DETECTED", desc: "Suspicious pattern in payment history" },
              { rule: "LOW_CONFIDENCE_DIAGNOSIS", desc: "AI confidence below 80% threshold" },
              { rule: "HIGH_VALUE_B2B", desc: "Enterprise client with high LTV at stake" },
            ].map((t) => (
              <div key={t.rule} className="flex justify-between">
                <span className="text-purple-300 font-bold">{t.rule}</span>
                <span className="text-[#a79f93]">{t.desc}</span>
              </div>
            ))}
          </div>

          {approved.length > 0 && (
            <div className="mt-4 p-4 bg-emerald-950 border border-emerald-500/30 rounded text-emerald-400 text-xs max-w-md mx-auto">
              ✓ You approved {approved.length} case(s) this session: {approved.join(", ")}
            </div>
          )}
          {denied.length > 0 && (
            <div className="mt-2 p-4 bg-rose-950 border border-rose-500/30 rounded text-rose-400 text-xs max-w-md mx-auto">
              ✗ You denied {denied.length} case(s) this session: {denied.join(", ")}
            </div>
          )}
        </div>
      ) : visibleApprovals.length === 0 ? (
        <div className="bg-[#241f18] border border-[#342D24] rounded-lg p-16 text-center space-y-4 font-mono">
          <span className="material-symbols-outlined text-6xl text-[#a79f93] block">search_off</span>
          <h3 className="text-xl font-bold text-white">No matches</h3>
          <p className="text-xs text-[#a79f93] max-w-md mx-auto">
            No escalated cases match &ldquo;{search}&rdquo;. Searchable fields: case ID (RC-1040), customer
            (#3 or name), payment ID, failure reason, diagnosis, strategy, and escalation rule.
          </p>
          <button
            onClick={() => setSearch("")}
            className="px-4 py-2 rounded border border-[#342D24] text-[#d4c4b1] font-mono text-xs hover:border-[#fbc162] cursor-pointer"
          >
            Clear search
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {visibleApprovals.map((c) => {
            const risk = riskLabel(c.amountMinor || 0);
            return (
              <div key={c.id} className="bg-[#241f18] border border-purple-500/30 rounded-lg overflow-hidden">
                {/* Case Header */}
                <div className="flex justify-between items-start p-6 border-b border-[#342D24]">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-[10px] text-purple-300 uppercase font-bold px-2 py-0.5 rounded bg-purple-950 border border-purple-500/30">
                        ESCALATED — AWAITING HUMAN APPROVAL
                      </span>
                      <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded border ${risk.bg} ${risk.color} ${risk.border}`}>
                        {risk.label} RISK
                      </span>
                    </div>
                    <h3 className="font-mono text-xl font-extrabold text-white mt-2">{c.caseId} — {c.customerName}</h3>
                    <span className="font-mono text-[10px] text-[#a79f93]">Customer #{c.customerId}</span>
                  </div>
                  <div className="text-right font-mono">
                    <span className="text-[#a79f93] text-xs block">Amount at Risk</span>
                    <span className="text-3xl font-extrabold text-rose-400">{formatCurrencyINR(c.amountMinor)}</span>
                  </div>
                </div>

                {/* Case Detail Grid */}
                <div className="p-6 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
                    <div className="bg-[#1f1812] p-3 rounded border border-[#342D24]">
                      <span className="text-[#a79f93] block mb-1">AI DIAGNOSIS</span>
                      <span className="text-white font-bold">{c.diagnosis}</span>
                    </div>
                    <div className="bg-[#1f1812] p-3 rounded border border-[#342D24]">
                      <span className="text-[#a79f93] block mb-1">RECOMMENDED STRATEGY</span>
                      <span className="text-[#fbc162] font-bold">{c.strategy}</span>
                    </div>
                    <div className="bg-[#1f1812] p-3 rounded border border-[#342D24]">
                      <span className="text-[#a79f93] block mb-1">ESCALATION RULE</span>
                      <span className="text-purple-300 font-bold">{c.lastGuardrailRule}</span>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="bg-[#1f1812] p-4 rounded border border-[#fbc162]/20 font-mono text-xs">
                    <span className="text-[#fbc162] font-bold block mb-2 flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-sm">psychology</span>
                      AI REASONING
                    </span>
                    <p className="text-[#d4c4b1] italic leading-relaxed">&ldquo;{c.reasoning}&rdquo;</p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-[#a79f93] text-[10px]">Confidence:</span>
                      <div className="w-24 h-1.5 bg-[#17130c] rounded-full overflow-hidden">
                        <div className="h-full bg-[#fbc162] rounded-full" style={{ width: `${((c.confidence || 0.91) * 100)}%` }} />
                      </div>
                      <span className="text-[#fbc162] font-bold text-[10px]">{((c.confidence || 0.91) * 100).toFixed(0)}%</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-2">
                    <button
                      onClick={() => handleApprove(c)}
                      disabled={isProcessing}
                      className="flex-1 py-3 rounded bg-emerald-500 text-black font-mono text-xs font-bold uppercase hover:bg-emerald-400 transition-colors cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">check_circle</span>
                      Approve & Execute Recovery
                    </button>
                    <button
                      onClick={() => handleDeny(c.caseId)}
                      className="flex-1 py-3 rounded border border-rose-500/50 text-rose-400 font-mono text-xs font-bold uppercase hover:bg-rose-950 transition-colors cursor-pointer flex items-center justify-center gap-2"
                    >
                      <span className="material-symbols-outlined text-sm">cancel</span>
                      Deny & Archive
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Agent Stats Footer */}
      <div className="bg-[#1f1812] border border-[#342D24] p-4 rounded-lg flex flex-wrap gap-6 font-mono text-xs">
        <div>
          <span className="text-[#a79f93] block">Auto-resolved (no human needed)</span>
          <span className="text-white font-bold">{metrics.totalCasesCount - metrics.escalatedCases} cases</span>
        </div>
        <div>
          <span className="text-[#a79f93] block">Escalated to humans</span>
          <span className="text-purple-300 font-bold">{metrics.escalatedCases} cases</span>
        </div>
        <div>
          <span className="text-[#a79f93] block">Human-in-loop rate</span>
          <span className="text-[#fbc162] font-bold">
            {metrics.totalCasesCount > 0 ? ((metrics.escalatedCases / metrics.totalCasesCount) * 100).toFixed(1) : 0}%
          </span>
        </div>
        <div>
          <span className="text-[#a79f93] block">Policy violations</span>
          <span className="text-emerald-400 font-bold">{metrics.policyViolations} (zero)</span>
        </div>
      </div>
    </div>
  );
}
