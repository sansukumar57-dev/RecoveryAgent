"use client";

import React from "react";
import { useDashboard } from "../DashboardContext";

export default function QueuePage() {
  const { cases, isProcessing, handleExecuteCase, handleRunBatch, setSelectedCase, formatCurrencyINR } = useDashboard();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center border-b border-[#342D24] pb-4">
        <h2 className="text-2xl font-extrabold font-mono text-white">Active Interventions Queue</h2>
        <button onClick={handleRunBatch} disabled={isProcessing} className="px-4 py-2 rounded bg-[#fbc162] text-[#17130c] font-mono text-xs font-bold uppercase cursor-pointer hover:bg-[#dda64a]">Execute Batch Sequence</button>
      </div>

      {/* Status Summary */}
      <div className="grid grid-cols-4 gap-4 font-mono text-xs">
        <div className="bg-[#241f18] border border-[#fbc162]/30 p-3 rounded flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-[#fbc162] animate-pulse" />
          <div><span className="text-[#a79f93] block">Detected</span><span className="text-white font-bold">{cases.filter((c) => c.status === "DETECTED").length}</span></div>
        </div>
        <div className="bg-[#241f18] border border-emerald-500/30 p-3 rounded flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
          <div><span className="text-[#a79f93] block">Recovered</span><span className="text-emerald-400 font-bold">{cases.filter((c) => c.status === "RECOVERED").length}</span></div>
        </div>
        <div className="bg-[#241f18] border border-purple-500/30 p-3 rounded flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-purple-400" />
          <div><span className="text-[#a79f93] block">Escalated</span><span className="text-purple-300 font-bold">{cases.filter((c) => c.status === "ESCALATED").length}</span></div>
        </div>
        <div className="bg-[#241f18] border border-rose-500/30 p-3 rounded flex items-center gap-3">
          <span className="w-3 h-3 rounded-full bg-rose-400" />
          <div><span className="text-[#a79f93] block">Stopped</span><span className="text-rose-400 font-bold">{cases.filter((c) => c.status === "STOPPED").length}</span></div>
        </div>
      </div>

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
            {cases.map((c) => (
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
    </div>
  );
}
