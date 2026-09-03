"use client";

import React from "react";
import { useDashboard } from "../DashboardContext";
import { exportCasesToCSV } from "../../utils/exportData";

export default function QueuePage() {
  const { cases, isProcessing, handleExecuteCase, handleRunBatch, handleCreateCustomCase, setSelectedCase, formatCurrencyINR } = useDashboard();
  const [filterStatus, setFilterStatus] = React.useState("ALL");
  const [showIngestModal, setShowIngestModal] = React.useState(false);
  const [custName, setCustName] = React.useState("");
  const [amountInr, setAmountInr] = React.useState("2499");
  const [planChoice, setPlanChoice] = React.useState("Premium Plan");
  const [reasonChoice, setReasonChoice] = React.useState("gateway_timeout");
  const [methodChoice, setMethodChoice] = React.useState("card");
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const totalCases = cases.length;
  const filteredCases = filterStatus === "ALL"
    ? cases
    : filterStatus === "CHECKOUT_DROP_OFF"
    ? cases.filter((c) => c.failureReason?.includes("abandon") || c.failureReason?.includes("drop") || c.diagnosis?.includes("abandon") || c.strategy === "CREATE_PAYMENT_LINK")
    : cases.filter((c) => c.status === filterStatus);

  // Calculate Pipeline Stage metrics
  const stages = [
    { key: "DETECTED", label: "1. DETECTED", count: cases.filter((c) => c.status === "DETECTED").length, color: "text-[#fbc162]", bg: "border-[#fbc162]/40" },
    { key: "DIAGNOSING", label: "2. DIAGNOSING", count: cases.filter((c) => c.status === "DIAGNOSING").length, color: "text-cyan-300", bg: "border-cyan-500/30" },
    { key: "PLANNING", label: "3. PLANNING", count: cases.filter((c) => c.status === "PLANNING").length, color: "text-blue-400", bg: "border-blue-500/30" },
    { key: "POLICY_CHECK", label: "4. POLICY CHECK", count: cases.filter((c) => c.status === "POLICY_CHECK").length, color: "text-purple-300", bg: "border-purple-500/30" },
    { key: "EXECUTING", label: "5. EXECUTING", count: cases.filter((c) => c.status === "EXECUTING").length, color: "text-orange-400", bg: "border-orange-500/30" },
    { key: "VERIFYING", label: "6. VERIFYING", count: cases.filter((c) => c.status === "VERIFYING").length, color: "text-emerald-300", bg: "border-emerald-500/30" },
    { key: "RECOVERED", label: "7. RECOVERED", count: cases.filter((c) => c.status === "RECOVERED").length, color: "text-emerald-400", bg: "border-emerald-500/50" },
    { key: "ESCALATED", label: "8. ESCALATED", count: cases.filter((c) => c.status === "ESCALATED").length, color: "text-purple-400", bg: "border-purple-500/40" },
    { key: "STOPPED", label: "9. STOPPED", count: cases.filter((c) => c.status === "STOPPED").length, color: "text-rose-400", bg: "border-rose-500/40" },
  ];

  // Attempt Distribution
  const attempts0 = cases.filter((c) => c.attemptsCount === 0).length;
  const attempts1 = cases.filter((c) => c.attemptsCount === 1).length;
  const attempts2 = cases.filter((c) => c.attemptsCount === 2).length;
  const attempts3Plus = cases.filter((c) => c.attemptsCount >= 3).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-[#342D24] pb-4">
        <div>
          <h2 className="text-2xl font-extrabold font-mono text-white">Autonomous Recovery Pipeline & Queue</h2>
          <p className="text-xs font-mono text-[#a79f93] mt-0.5">Real-time triage, lifecycle stage machine, and bounded execution queue.</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowIngestModal(true)}
            className="px-3.5 py-2 rounded bg-gradient-to-r from-[#fbc162]/20 to-amber-500/20 border border-[#fbc162] text-[#fbc162] hover:bg-[#fbc162] hover:text-[#17130c] font-mono text-xs font-bold cursor-pointer flex items-center gap-1.5 transition-all shadow-sm"
            title="Manually inject a custom failed payment into the recovery pipeline"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            + Ingest Custom Case
          </button>
          <button
            onClick={() => exportCasesToCSV(cases)}
            className="px-3 py-2 rounded border border-[#342D24] text-[#d4c4b1] hover:text-[#fbc162] hover:border-[#fbc162] font-mono text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
            title="Download full cases ledger as CSV"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export CSV
          </button>
          <button
            onClick={handleRunBatch}
            disabled={isProcessing}
            className="px-4 py-2 rounded bg-[#fbc162] text-[#17130c] font-mono text-xs font-bold uppercase cursor-pointer hover:bg-[#dda64a] transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">play_arrow</span>
            {isProcessing ? "Executing Sequence..." : "Execute Batch Sequence"}
          </button>
        </div>
      </div>

      {/* Analytical Diagram 1: Workflow Pipeline Stage Flow */}
      <div className="bg-[#1f1812] border border-[#342D24] p-5 rounded-lg space-y-3 font-mono text-xs">
        <div className="flex justify-between items-center">
          <h3 className="text-xs text-[#fbc162] font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base">account_tree</span>
            PIPELINE STAGE MACHINE
          </h3>
          <span className="text-[10px] text-[#a79f93]">Click stage to filter queue</span>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
          {stages.map((st) => (
            <button
              key={st.key}
              onClick={() => setFilterStatus(filterStatus === st.key ? "ALL" : st.key)}
              className={`p-2.5 rounded bg-[#241f18] border ${st.bg} text-left cursor-pointer transition-all hover:brightness-125 ${
                filterStatus === st.key ? "ring-2 ring-[#fbc162]" : ""
              }`}
            >
              <span className="text-[9px] text-[#a79f93] block truncate">{st.label}</span>
              <span className={`text-lg font-extrabold block ${st.color}`}>{st.count}</span>
              <span className="text-[8px] text-[#a79f93] block mt-0.5">
                {totalCases > 0 ? `${Math.round((st.count / totalCases) * 100)}%` : "0%"}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Analytical Diagram 2: Retry Attempts Histogram & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded-lg md:col-span-2 space-y-2">
          <div className="flex justify-between items-center">
            <h3 className="text-[10px] text-[#fbc162] font-bold uppercase">RETRY ATTEMPTS DISTRIBUTION</h3>
            <span className="text-[10px] text-[#a79f93]">Max retry guardrail: 3 attempts</span>
          </div>
          <div className="grid grid-cols-4 gap-2 text-center pt-1">
            <div className="p-2 bg-[#17130c] rounded border border-[#342D24]">
              <span className="text-white font-extrabold text-base block">{attempts0}</span>
              <span className="text-[#a79f93] text-[9px]">0 attempts (New)</span>
            </div>
            <div className="p-2 bg-[#17130c] rounded border border-[#342D24]">
              <span className="text-cyan-300 font-extrabold text-base block">{attempts1}</span>
              <span className="text-[#a79f93] text-[9px]">1st retry</span>
            </div>
            <div className="p-2 bg-[#17130c] rounded border border-[#342D24]">
              <span className="text-[#fbc162] font-extrabold text-base block">{attempts2}</span>
              <span className="text-[#a79f93] text-[9px]">2nd retry</span>
            </div>
            <div className="p-2 bg-[#17130c] rounded border border-rose-500/30">
              <span className="text-rose-400 font-extrabold text-base block">{attempts3Plus}</span>
              <span className="text-[#a79f93] text-[9px]">3+ (Near Limit)</span>
            </div>
          </div>
        </div>

        <div className="bg-[#241f18] border border-emerald-500/20 p-4 rounded-lg space-y-1">
          <span className="text-[10px] text-[#a79f93] block uppercase">Pipeline Health</span>
          <span className="text-2xl font-extrabold text-emerald-400">
            {totalCases > 0 ? `${Math.round(((cases.filter((c) => c.status === "RECOVERED").length) / totalCases) * 100)}%` : "100%"}
          </span>
          <span className="text-[10px] text-white block">Net Recovery Conversion</span>
          <span className="text-[9px] text-[#a79f93] block pt-1">
            {cases.filter((c) => c.status === "ESCALATED").length} escalated · {cases.filter((c) => c.status === "STOPPED").length} stopped
          </span>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 border-b border-[#342D24] pb-2 font-mono text-xs overflow-x-auto">
        {[
          { key: "ALL", label: "ALL" },
          { key: "CHECKOUT_DROP_OFF", label: "🛒 CHECKOUT DROP-OFFS" },
          { key: "DETECTED", label: "DETECTED" },
          { key: "ESCALATED", label: "ESCALATED" },
          { key: "RECOVERED", label: "RECOVERED" },
          { key: "STOPPED", label: "STOPPED" },
        ].map((tab) => {
          const count = tab.key === "ALL"
            ? totalCases
            : tab.key === "CHECKOUT_DROP_OFF"
            ? cases.filter((c) => c.failureReason?.includes("abandon") || c.failureReason?.includes("drop") || c.diagnosis?.includes("abandon") || c.strategy === "CREATE_PAYMENT_LINK").length
            : cases.filter((c) => c.status === tab.key).length;
          return (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key)}
              className={`px-3 py-1 rounded cursor-pointer transition-colors whitespace-nowrap ${
                filterStatus === tab.key
                  ? "bg-[#fbc162] text-[#17130c] font-bold"
                  : "bg-[#241f18] text-[#a79f93] hover:text-white border border-[#342D24]"
              }`}
            >
              {tab.label} ({count})
            </button>
          );
        })}
      </div>

      {filterStatus === "CHECKOUT_DROP_OFF" && (
        <div className="p-3.5 bg-orange-950/40 border border-orange-500/40 rounded-lg font-mono text-xs text-orange-200 flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-orange-400">shopping_cart_checkout</span>
            <span>
              <strong>Checkout Drop-off Recovery:</strong> Abandoned checkout sessions detected. AI agent automatically provisions dynamic cart recovery tokens with a 2-hour decaying 5% discount incentive.
            </span>
          </div>
          <span className="text-[10px] bg-orange-500/20 text-orange-300 px-2 py-0.5 rounded border border-orange-500/30 font-bold">
            HIGH CONVERSION INTENT
          </span>
        </div>
      )}

      {/* Full Queue Table */}
      <div className="bg-[#241f18] border border-[#342D24] rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="bg-[#1f1812] border-b border-[#342D24] text-[10px] text-[#a79f93] uppercase">
            <tr>
              <th className="p-3">Case ID</th><th className="p-3">Customer Entity</th>
              <th className="p-3">Failure Reason</th><th className="p-3">Amount</th>
              <th className="p-3">Strategy</th><th className="p-3">Attempts</th>
              <th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#342D24]">
            {filteredCases.map((c) => (
              <tr key={c.id} className="hover:bg-[#1f1812] transition-colors">
                <td className="p-3 font-bold text-[#fbc162]">{c.caseId}</td>
                <td className="p-3 text-white font-bold">{c.customerName}</td>
                <td className="p-3 text-[#d4c4b1]">{c.failureReason}</td>
                <td className="p-3 text-white font-bold">{formatCurrencyINR(c.amountMinor)}</td>
                <td className="p-3 text-[#d4c4b1]">{c.strategy}</td>
                <td className="p-3 text-[#d4c4b1]">{c.attemptsCount}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    c.status === "RECOVERED" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" :
                    c.status === "ESCALATED" ? "bg-purple-950 text-purple-300 border border-purple-500/30" :
                    c.status === "STOPPED" ? "bg-rose-950 text-rose-400 border border-rose-500/30" :
                    "bg-[#fbc162]/20 text-[#fbc162] border border-[#fbc162]/40"
                  }`}>{c.status}</span>
                </td>
                <td className="p-3 text-right flex justify-end gap-2">
                  <button onClick={() => handleExecuteCase(c)} disabled={isProcessing || c.status === "RECOVERED" || c.status === "STOPPED"} className="px-3 py-1 rounded bg-[#fbc162] text-[#17130c] font-bold text-[11px] cursor-pointer hover:bg-[#dda64a] disabled:opacity-40">Run AI Flow</button>
                  <button onClick={() => setSelectedCase(c)} className="px-2 py-1 rounded border border-[#342D24] text-[#d4c4b1] text-[11px] cursor-pointer hover:border-[#fbc162]">Inspect</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Ingest Custom Case Modal */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-in fade-in duration-150">
          <div className="bg-[#1f1812] border-2 border-[#fbc162]/60 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 font-mono">
            <div className="flex justify-between items-start border-b border-[#342D24] pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#fbc162]">add_card</span>
                  Ingest Custom Payment Failure
                </h3>
                <p className="text-[11px] text-[#a79f93] mt-0.5">
                  Inject any custom customer, invoice amount, or bank decline scenario into the AI recovery agent pipeline.
                </p>
              </div>
              <button
                onClick={() => setShowIngestModal(false)}
                className="text-[#a79f93] hover:text-white cursor-pointer p-1 text-base"
              >
                ✕
              </button>
            </div>

            {/* Quick Test Presets */}
            <div className="space-y-1.5">
              <label className="text-[10px] text-[#fbc162] font-bold uppercase tracking-wider block">
                Scenario Presets (1-Click Fill):
              </label>
              <div className="grid grid-cols-2 gap-2 text-[10px]">
                <button
                  type="button"
                  onClick={() => {
                    setCustName("Tata Consultancy Services");
                    setAmountInr("75000");
                    setPlanChoice("Enterprise Annual");
                    setReasonChoice("gateway_timeout");
                    setMethodChoice("card");
                  }}
                  className="p-2 text-left rounded bg-[#241f18] hover:bg-[#342D24] border border-[#342D24] text-[#d4c4b1] cursor-pointer"
                >
                  <div className="font-bold text-purple-300">🏢 High-Value B2B (&gt;₹50K)</div>
                  <div className="text-[9px] text-[#a79f93]">Tests Human Escalation policy</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustName("Priya Sharma");
                    setAmountInr("2499");
                    setPlanChoice("Premium Plan");
                    setReasonChoice("card_expired");
                    setMethodChoice("card");
                  }}
                  className="p-2 text-left rounded bg-[#241f18] hover:bg-[#342D24] border border-[#342D24] text-[#d4c4b1] cursor-pointer"
                >
                  <div className="font-bold text-[#fbc162]">💳 Expired Card</div>
                  <div className="text-[9px] text-[#a79f93]">Tests Payment Link &amp; Voice desk</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustName("Rahul Verma");
                    setAmountInr("4999");
                    setPlanChoice("Pro Monthly");
                    setReasonChoice("user_abandoned");
                    setMethodChoice("upi");
                  }}
                  className="p-2 text-left rounded bg-[#241f18] hover:bg-[#342D24] border border-[#342D24] text-[#d4c4b1] cursor-pointer"
                >
                  <div className="font-bold text-amber-400">🛒 Cart Abandonment</div>
                  <div className="text-[9px] text-[#a79f93]">Tests Checkout Drop-Off recovery</div>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustName("Aditya Mehta");
                    setAmountInr("1499");
                    setPlanChoice("Basic Plan");
                    setReasonChoice("insufficient_funds");
                    setMethodChoice("upi");
                  }}
                  className="p-2 text-left rounded bg-[#241f18] hover:bg-[#342D24] border border-[#342D24] text-[#d4c4b1] cursor-pointer"
                >
                  <div className="font-bold text-emerald-400">⚡ Temporary NSF</div>
                  <div className="text-[9px] text-[#a79f93]">Tests e-Mandate Smart Retry</div>
                </button>
              </div>
            </div>

            {/* Custom Input Form */}
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-[#d4c4b1] text-[11px] block mb-1">Customer / Entity Name:</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Infosys Ltd or Rajesh Nair"
                  value={custName}
                  onChange={(e) => setCustName(e.target.value)}
                  className="w-full px-3 py-2 rounded bg-[#241f18] border border-[#342D24] text-white focus:outline-none focus:border-[#fbc162]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#d4c4b1] text-[11px] block mb-1">Amount (₹ INR):</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g. 2499"
                    value={amountInr}
                    onChange={(e) => setAmountInr(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#241f18] border border-[#342D24] text-[#fbc162] font-bold focus:outline-none focus:border-[#fbc162]"
                  />
                </div>
                <div>
                  <label className="text-[#d4c4b1] text-[11px] block mb-1">Plan Tier:</label>
                  <select
                    value={planChoice}
                    onChange={(e) => setPlanChoice(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#241f18] border border-[#342D24] text-white focus:outline-none focus:border-[#fbc162]"
                  >
                    <option value="Enterprise Annual">Enterprise Annual</option>
                    <option value="Enterprise Plan">Enterprise Plan</option>
                    <option value="Premium Plan">Premium Plan</option>
                    <option value="Standard Plan">Standard Plan</option>
                    <option value="Basic Plan">Basic Plan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[#d4c4b1] text-[11px] block mb-1">Failure Reason Code:</label>
                  <select
                    value={reasonChoice}
                    onChange={(e) => setReasonChoice(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#241f18] border border-[#342D24] text-white focus:outline-none focus:border-[#fbc162]"
                  >
                    <option value="gateway_timeout">gateway_timeout (Soft Network Lag)</option>
                    <option value="card_expired">card_expired (Hard Card Decay)</option>
                    <option value="insufficient_funds">insufficient_funds (Temporary NSF)</option>
                    <option value="user_abandoned">user_abandoned (Checkout Drop-off)</option>
                    <option value="do_not_honour">do_not_honour (Bank Security Hold)</option>
                    <option value="stolen_card">stolen_card (Strict Stop Rule)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[#d4c4b1] text-[11px] block mb-1">Payment Instrument:</label>
                  <select
                    value={methodChoice}
                    onChange={(e) => setMethodChoice(e.target.value)}
                    className="w-full px-3 py-2 rounded bg-[#241f18] border border-[#342D24] text-white focus:outline-none focus:border-[#fbc162]"
                  >
                    <option value="card">Credit / Debit Card</option>
                    <option value="upi">UPI AutoPay</option>
                    <option value="netbanking">NetBanking</option>
                    <option value="wallet">Digital Wallet</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 border-t border-[#342D24] pt-3">
              <button
                type="button"
                onClick={() => setShowIngestModal(false)}
                className="px-4 py-2 rounded border border-[#342D24] text-[#a79f93] hover:text-white text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting || !custName.trim() || !amountInr}
                onClick={async () => {
                  setIsSubmitting(true);
                  try {
                    const parsedMinor = Math.round(parseFloat(amountInr) * 100);
                    const newCase = await handleCreateCustomCase({
                      customerName: custName.trim(),
                      plan: planChoice,
                      amountMinor: parsedMinor,
                      failureReason: reasonChoice,
                      method: methodChoice,
                    });
                    setShowIngestModal(false);
                    if (newCase) {
                      setSelectedCase(newCase);
                    }
                  } finally {
                    setIsSubmitting(false);
                  }
                }}
                className="px-5 py-2 rounded bg-[#fbc162] hover:bg-[#dda64a] text-[#17130c] font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-sm">rocket_launch</span>
                {isSubmitting ? "Ingesting..." : "Inject into AI Recovery Pipeline"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
