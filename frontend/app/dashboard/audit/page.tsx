"use client";

import React from "react";
import { useDashboard } from "../DashboardContext";

export default function AuditPage() {
  const { auditLogs } = useDashboard();

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end pb-4 border-b border-[#342D24]">
        <div>
          <h2 className="text-2xl font-extrabold font-mono text-white">Immutable Audit Trail</h2>
          <p className="text-xs font-mono text-[#a79f93] mt-1">Every agent decision, tool execution, policy check, and recovery event is logged permanently.</p>
        </div>
        <span className="px-3 py-1 bg-emerald-950 border border-emerald-500/30 text-emerald-400 font-mono text-[10px] font-bold rounded uppercase">TAMPER-PROOF LOG</span>
      </div>

      <div className="bg-[#241f18] border border-[#342D24] rounded-lg overflow-hidden">
        <table className="w-full text-left border-collapse text-xs font-mono">
          <thead className="bg-[#1f1812] border-b border-[#342D24] text-[10px] text-[#a79f93] uppercase">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Case ID</th>
              <th className="p-3">Event Type</th>
              <th className="p-3">Action Taken</th>
              <th className="p-3">Policy Result</th>
              <th className="p-3">Recovery Δ</th>
              <th className="p-3">Confidence</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#342D24]">
            {auditLogs.map((log) => (
              <tr key={log.id} className="hover:bg-[#1f1812] transition-colors">
                <td className="p-3 text-[#a79f93]">{new Date(log.timestamp).toLocaleString()}</td>
                <td className="p-3 text-[#fbc162] font-bold">{log.caseId}</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    log.eventType === "DECISION" ? "bg-[#fbc162]/20 text-[#fbc162] border border-[#fbc162]/40" :
                    log.eventType === "TOOL_EXECUTION" ? "bg-cyan-950 text-cyan-300 border border-cyan-500/30" :
                    log.eventType === "VERIFICATION" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" :
                    "bg-purple-950 text-purple-300 border border-purple-500/30"
                  }`}>{log.eventType}</span>
                </td>
                <td className="p-3 text-[#d4c4b1] max-w-[220px] truncate">{log.details}</td>
                <td className="p-3">
                  <span className={`font-bold ${
                    log.guardrailStatus === "APPROVED" ? "text-emerald-400" :
                    log.guardrailStatus === "DENIED_ESCALATE" ? "text-purple-300" :
                    "text-rose-400"
                  }`}>{log.guardrailStatus}</span>
                </td>
                <td className="p-3 text-emerald-400 font-bold">{log.recoveryDelta || "—"}</td>
                <td className="p-3 text-white">{log.confidence ? `${(log.confidence * 100).toFixed(0)}%` : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {auditLogs.length === 0 && (
          <div className="p-12 text-center font-mono text-xs text-[#a79f93]">
            No audit events yet. Run the AI Recovery Agent to generate log entries.
          </div>
        )}
      </div>
    </div>
  );
}
