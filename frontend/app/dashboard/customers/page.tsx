"use client";

import React, { useState } from "react";
import { useDashboard } from "../DashboardContext";

export default function CustomersPage() {
  const { customers, cases, formatCurrencyINR } = useDashboard();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("ALL");

  const statusOptions = ["ALL", "IN_PROGRESS", "RECOVERED", "ESCALATED", "STOPPED"];

  const filtered = customers.filter((c) => {
    const matchSearch =
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      c.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus = filterStatus === "ALL" || c.recoveryStatus === filterStatus;
    return matchSearch && matchStatus;
  });

  const getCasesForCustomer = (customerId: number) =>
    cases.filter((c) => c.customerId === customerId);

  const totalLTV = customers.reduce((a, c) => a + (c.ltvMinor || 0), 0);
  const avgLTV = customers.length > 0 ? Math.round(totalLTV / customers.length) : 0;

  const statusBadge = (status: string | undefined) => {
    switch (status) {
      case "RECOVERED": return "bg-emerald-950 text-emerald-400 border border-emerald-500/30";
      case "ESCALATED": return "bg-purple-950 text-purple-300 border border-purple-500/30";
      case "STOPPED": return "bg-rose-950 text-rose-400 border border-rose-500/30";
      default: return "bg-[#fbc162]/20 text-[#fbc162] border border-[#fbc162]/40";
    }
  };

  const riskColor = (score: number | undefined) => {
    if (!score) return "text-[#a79f93]";
    if (score > 70) return "text-rose-400";
    if (score > 40) return "text-[#fbc162]";
    return "text-emerald-400";
  };

  const riskBar = (score: number | undefined) => {
    if (!score) return "bg-[#342D24]";
    if (score > 70) return "bg-rose-400";
    if (score > 40) return "bg-[#fbc162]";
    return "bg-emerald-400";
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-[#342D24]">
        <div>
          <h2 className="text-2xl font-extrabold font-mono text-white">Customer Financial Context</h2>
          <p className="text-xs font-mono text-[#a79f93] mt-1">
            {customers.length} tracked customers — LTV, risk scores, payment history, and active recovery cases.
          </p>
        </div>
        <div className="font-mono text-xs text-right">
          <span className="text-[#a79f93] block">Portfolio LTV</span>
          <span className="text-[#fbc162] font-bold text-lg">{formatCurrencyINR(totalLTV)}</span>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded-lg">
          <span className="text-[#a79f93] block mb-1">Total Customers</span>
          <span className="text-2xl font-bold text-white">{customers.length}</span>
          <span className="text-[10px] text-[#a79f93] mt-1 block">across all plans</span>
        </div>
        <div className="bg-[#241f18] border border-[#342D24] p-4 rounded-lg">
          <span className="text-[#a79f93] block mb-1">Avg LTV</span>
          <span className="text-2xl font-bold text-[#fbc162]">{formatCurrencyINR(avgLTV)}</span>
          <span className="text-[10px] text-[#a79f93] mt-1 block">per customer</span>
        </div>
        <div className="bg-[#241f18] border border-emerald-500/20 p-4 rounded-lg">
          <span className="text-[#a79f93] block mb-1">Recovered</span>
          <span className="text-2xl font-bold text-emerald-400">
            {customers.filter((c) => c.recoveryStatus === "RECOVERED").length}
          </span>
          <span className="text-[10px] text-emerald-400/60 mt-1 block">payments reinstated</span>
        </div>
        <div className="bg-[#241f18] border border-rose-500/20 p-4 rounded-lg">
          <span className="text-[#a79f93] block mb-1">At Risk</span>
          <span className="text-2xl font-bold text-rose-400">
            {customers.filter((c) => c.recoveryStatus === "IN_PROGRESS" || c.recoveryStatus === "ESCALATED").length}
          </span>
          <span className="text-[10px] text-rose-400/60 mt-1 block">active recovery</span>
        </div>
      </div>

      {/* Search + Filter Row */}
      <div className="flex gap-3">
        <div className="relative flex-grow">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-[#a79f93] text-lg">search</span>
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#241f18] border border-[#342D24] rounded-lg text-white font-mono text-xs placeholder-[#a79f93] focus:outline-none focus:border-[#fbc162] transition-colors"
          />
        </div>
        <div className="flex gap-1.5">
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`px-3 py-2 rounded border font-mono text-[10px] font-bold transition-colors cursor-pointer whitespace-nowrap ${
                filterStatus === s
                  ? "bg-[#fbc162] border-[#fbc162] text-[#17130c]"
                  : "bg-[#241f18] border-[#342D24] text-[#a79f93] hover:border-[#fbc162]/40"
              }`}
            >
              {s === "ALL" ? "All" : s.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Customer Table */}
      {filtered.length === 0 ? (
        <div className="bg-[#241f18] border border-[#342D24] rounded-lg p-16 text-center font-mono">
          <span className="material-symbols-outlined text-5xl text-[#342D24] block mb-3">person_search</span>
          <h3 className="text-white font-bold text-sm mb-1">No customers match your filter</h3>
          <p className="text-[#a79f93] text-xs">Try adjusting the search or status filter.</p>
        </div>
      ) : (
        <div className="bg-[#241f18] border border-[#342D24] rounded-lg overflow-hidden">
          <table className="w-full text-left border-collapse text-xs font-mono">
            <thead className="bg-[#1f1812] border-b border-[#342D24] text-[10px] text-[#a79f93] uppercase">
              <tr>
                <th className="p-3">Customer</th>
                <th className="p-3">Plan</th>
                <th className="p-3">LTV</th>
                <th className="p-3">Risk Score</th>
                <th className="p-3">Success Rate</th>
                <th className="p-3">Last Failure</th>
                <th className="p-3">Recovery Status</th>
                <th className="p-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#342D24]">
              {filtered.map((cust) => (
                <React.Fragment key={cust.id}>
                  <tr
                    className="hover:bg-[#1f1812] transition-colors cursor-pointer"
                    onClick={() => setExpandedId(expandedId === cust.id ? null : cust.id)}
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-7 h-7 rounded-full bg-[#342D24] flex items-center justify-center text-[#fbc162] font-bold text-[11px] shrink-0"
                          aria-hidden
                        >
                          {cust.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-white font-bold">{cust.name}</div>
                          <div className="text-[10px] text-[#a79f93]">{cust.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className="px-2 py-0.5 rounded border border-[#342D24] text-[#d4c4b1] text-[10px]">{cust.plan}</span>
                    </td>
                    <td className="p-3 text-[#fbc162] font-bold">{formatCurrencyINR(cust.ltvMinor)}</td>
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <div className="w-14 h-1.5 bg-[#17130c] rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${riskBar(cust.riskScore)}`}
                            style={{ width: `${cust.riskScore}%` }}
                          />
                        </div>
                        <span className={`font-bold ${riskColor(cust.riskScore)}`}>{cust.riskScore}</span>
                      </div>
                    </td>
                    <td className="p-3">
                      <span className={`font-bold ${(cust.paymentSuccessRate || 0) > 90 ? "text-emerald-400" : "text-[#fbc162]"}`}>
                        {cust.paymentSuccessRate}%
                      </span>
                    </td>
                    <td className="p-3 text-[#d4c4b1]">{cust.lastFailureDate || "—"}</td>
                    <td className="p-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${statusBadge(cust.recoveryStatus)}`}>
                        {cust.recoveryStatus || "UNKNOWN"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-[#fbc162] transition-transform inline-block ${expandedId === cust.id ? "rotate-90" : ""}`}>
                        ▶
                      </span>
                    </td>
                  </tr>

                  {/* Expanded Detail Row */}
                  {expandedId === cust.id && (
                    <tr>
                      <td colSpan={8} className="p-5 bg-[#1a1610] border-t border-[#fbc162]/20">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          {/* Payment History Sparkline */}
                          <div className="space-y-2">
                            <span className="text-[10px] text-[#fbc162] font-bold block uppercase">12-Month Payment History</span>
                            <div className="flex items-end gap-0.5 h-14 bg-[#17130c] p-2 rounded">
                              {[85, 100, 100, 100, 70, 100, 100, 0, 100, 100, 60, 100].map((pct, i) => (
                                <div key={i} className="flex-1 flex flex-col justify-end h-full">
                                  <div
                                    className={`rounded-sm ${pct === 100 ? "bg-emerald-400" : pct === 0 ? "bg-rose-400" : "bg-[#fbc162]"}`}
                                    style={{ height: `${Math.max(pct, 8)}%` }}
                                    title={pct === 100 ? "Paid" : pct === 0 ? "Failed" : "Partial"}
                                  />
                                </div>
                              ))}
                            </div>
                            <div className="flex justify-between text-[9px] text-[#a79f93]">
                              <span>12 months ago</span><span>Now</span>
                            </div>
                            <div className="flex gap-3 text-[9px] font-mono">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-400 inline-block" />Paid</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-[#fbc162] inline-block" />Partial</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-400 inline-block" />Failed</span>
                            </div>
                          </div>

                          {/* Account Details */}
                          <div className="space-y-2">
                            <span className="text-[10px] text-[#fbc162] font-bold block uppercase">Account Details</span>
                            <div className="bg-[#241f18] p-3 rounded border border-[#342D24] space-y-1.5 text-[11px] text-[#d4c4b1]">
                              <div className="flex justify-between">
                                <span className="text-[#a79f93]">Phone</span>
                                <span>{cust.phone || "N/A"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#a79f93]">Total Payments</span>
                                <span className="text-white font-bold">{cust.totalPayments || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#a79f93]">Failed Payments</span>
                                <span className="text-rose-400 font-bold">{cust.failedPayments || 0}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#a79f93]">Account Health</span>
                                <span className={`font-bold ${(cust.paymentSuccessRate || 0) > 90 ? "text-emerald-400" : "text-[#fbc162]"}`}>
                                  {(cust.paymentSuccessRate || 0) > 90 ? "Good" : "At Risk"}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-[#a79f93]">LTV</span>
                                <span className="text-[#fbc162] font-bold">{formatCurrencyINR(cust.ltvMinor)}</span>
                              </div>
                            </div>
                          </div>

                          {/* Recovery Cases */}
                          <div className="space-y-2">
                            <span className="text-[10px] text-[#fbc162] font-bold block uppercase">Recovery Cases</span>
                            {getCasesForCustomer(cust.id).length > 0 ? (
                              <div className="space-y-1.5">
                                {getCasesForCustomer(cust.id).map((rc) => (
                                  <div
                                    key={rc.id}
                                    className="bg-[#241f18] p-2.5 rounded border border-[#342D24] text-[11px] font-mono"
                                  >
                                    <div className="flex justify-between mb-1">
                                      <span className="text-[#fbc162] font-bold">{rc.caseId}</span>
                                      <span className="text-white font-bold">{formatCurrencyINR(rc.amountMinor)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-[#a79f93]">{rc.failureReason}</span>
                                      <span className={`font-bold text-[10px] ${rc.status === "RECOVERED" ? "text-emerald-400" : rc.status === "ESCALATED" ? "text-purple-300" : "text-[#fbc162]"}`}>
                                        {rc.status}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-[#241f18] p-4 rounded border border-[#342D24] text-center text-[#a79f93] text-[11px] font-mono">
                                <span className="material-symbols-outlined text-2xl block mb-1 text-[#342D24]">check_circle</span>
                                No active recovery cases
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
