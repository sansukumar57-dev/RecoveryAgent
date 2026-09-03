"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import Logo from "../components/Logo";
import RecoveryCopilot from "./components/RecoveryCopilot";

const NAV_ITEMS = [
  { id: "overview", href: "/dashboard", label: "Overview", icon: "dashboard" },
  { id: "risk", href: "/dashboard/risk", label: "Revenue Risk", icon: "warning" },
  { id: "queue", href: "/dashboard/queue", label: "Recovery Queue", icon: "assignment_late" },
  { id: "agent", href: "/dashboard/agent", label: "AI Agent", icon: "smart_toy" },
  { id: "customers", href: "/dashboard/customers", label: "Customers", icon: "group" },
  { id: "receivables", href: "/dashboard/receivables", label: "Receivables", icon: "account_balance_wallet" },
  { id: "analytics", href: "/dashboard/analytics", label: "Analytics", icon: "analytics" },
  { id: "audit", href: "/dashboard/audit", label: "Audit Trail", icon: "history" },
  { id: "approvals", href: "/dashboard/approvals", label: "Approvals", icon: "verified_user" },
  { id: "settings", href: "/dashboard/settings", label: "Settings & Policies", icon: "tune" },
];

function getPageTitle(pathname: string): string {
  const seg = pathname.replace("/dashboard", "").replace("/", "") || "overview";
  const titles: Record<string, string> = {
    overview: "RECOVERY COMMAND CENTER",
    risk: "REVENUE RISK MATRIX",
    queue: "RECOVERY QUEUE",
    agent: "AI RECOVERY AGENT COCKPIT",
    customers: "CUSTOMER FINANCIAL CONTEXT",
    receivables: "B2B RECEIVABLES CHASER",
    analytics: "RECOVERY INTELLIGENCE",
    audit: "IMMUTABLE AUDIT TRAIL",
    approvals: "HUMAN APPROVAL CENTER",
    settings: "PLATFORM ENGINE & POLICY CONTROL CENTER",
  };
  return titles[seg] || "RECOVERY COMMAND CENTER";
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    isProcessing, executionStepText, showSuccessToast,
    handleRunBatch, handleResetDemo,
    cases, setCases,
    selectedCase, setSelectedCase, handleExecuteCase, handleSimulateCustomerPayment,
    setAuditLogs,
    formatCurrencyINR,
    ptpRecords, handleAddPtpRecord,
    judgeMode, setJudgeMode, judgeStep, setJudgeStep,
  } = useDashboard();
  const [showNotifications, setShowNotifications] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [sendingWa, setSendingWa] = useState(false);
  const [waSent, setWaSent] = useState(false);
  const [sendingSms, setSendingSms] = useState(false);
  const [smsSent, setSmsSent] = useState(false);
  const [callingVoice, setCallingVoice] = useState(false);
  const [voiceCallStep, setVoiceCallStep] = useState(0);
  const [voiceLanguage, setVoiceLanguage] = useState<"EN" | "HINGLISH">("HINGLISH");
  const [showPtpForm, setShowPtpForm] = useState(false);
  const [ptpDateChoice, setPtpDateChoice] = useState("06 Sep 2026 (Salary Day)");
  const [ptpLoggedForCase, setPtpLoggedForCase] = useState(false);

  return (
    <div className="flex h-screen bg-[#17130c] text-[#ebe1d6] overflow-hidden font-sans selection:bg-[#fbc162]/30 selection:text-[#fbc162]">
      {/* ─── JUDGE MODE OVERLAY ─── */}
      {judgeMode && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 p-8 flex flex-col justify-between">
          <div className="flex justify-between items-center border-b border-[#342D24] pb-4">
            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded bg-[#fbc162] text-[#17130c] font-mono font-bold text-xs uppercase">JUDGE MODE</span>
              <span className="font-mono text-xs text-[#d4c4b1]">Step {judgeStep} of 8</span>
            </div>
            <button onClick={() => setJudgeMode(false)} className="text-[#a79f93] hover:text-white font-mono text-xs px-3 py-1 border border-[#342D24] rounded cursor-pointer">Exit Judge Mode</button>
          </div>
          <div className="max-w-3xl mx-auto my-auto text-center space-y-6">
            {judgeStep === 1 && (<div className="space-y-4"><span className="font-mono text-xs text-[#fbc162] block">STEP 1: REVENUE RISK DETECTION</span><h2 className="text-4xl font-mono font-extrabold text-white">₹12.8L Revenue at Risk</h2><p className="text-sm text-[#d4c4b1]">System detected 84 failed payments, 132 abandoned checkouts, 37 failed subscriptions, and ₹3.4L overdue receivables.</p></div>)}
            {judgeStep === 2 && (<div className="space-y-4"><span className="font-mono text-xs text-[#fbc162] block">STEP 2: HIGHEST VALUE RECOVERABLE CASE</span><h2 className="text-3xl font-mono font-extrabold text-white">Acme Technologies — ₹48,000</h2><div className="flex justify-center gap-6 font-mono text-xs"><div>Risk Score: <span className="text-rose-400 font-bold">92/100</span></div><div>Recoverability: <span className="text-emerald-400 font-bold">81/100</span></div><div>LTV: <span className="text-[#fbc162] font-bold">₹8.4L</span></div></div></div>)}
            {judgeStep === 3 && (<div className="space-y-4"><span className="font-mono text-xs text-[#fbc162] block">STEP 3: AI DIAGNOSIS ENGINE</span><h2 className="text-2xl font-mono font-extrabold text-white">Temporary Payment Degradation (94% Confidence)</h2><p className="text-xs text-[#d4c4b1]">Evidence: 96% historical payment reliability. Issuer response indicates temporary liquidity constraint during salary cycle.</p></div>)}
            {judgeStep === 4 && (<div className="space-y-4"><span className="font-mono text-xs text-[#fbc162] block">STEP 4: STRATEGY COMPARISON</span><h2 className="text-2xl font-mono font-extrabold text-[#fbc162]">Recommended Strategy: DELAYED RETRY</h2><p className="text-xs text-[#d4c4b1]">Evaluated: Immediate Retry (49%), Payment Link (61%), Delayed Retry (78% success, ₹0.50 cost). Selected highest expected recovery.</p></div>)}
            {judgeStep === 5 && (<div className="space-y-4"><span className="font-mono text-xs text-emerald-400 block">STEP 5: POLICY GATE & SAFETY ENGINE</span><h2 className="text-2xl font-mono font-extrabold text-white">Status: APPROVED BY POLICY ENGINE</h2><p className="text-xs text-[#d4c4b1]">Passed rules: Max Retries ≤ 2, Quiet Hours Check, Amount ≤ ₹50,000, Fraud Check = Clear, Opt-Out = False.</p></div>)}
            {judgeStep === 6 && (<div className="space-y-4"><span className="font-mono text-xs text-[#fbc162] block">STEP 6: BOUNDED WORKFLOW EXECUTION</span><h2 className="text-2xl font-mono font-extrabold text-white">Executing Payment Retry via Gateway</h2><div className="animate-pulse font-mono text-xs text-cyan-300">Calling Razorpay gateway attempt att_87f92a...</div></div>)}
            {judgeStep === 7 && (<div className="space-y-4"><span className="font-mono text-xs text-emerald-400 block">STEP 7: PAYMENT VERIFICATION</span><h2 className="text-4xl font-mono font-extrabold text-emerald-400">₹48,000 RECOVERED</h2><p className="text-xs text-[#d4c4b1]">Payment capture verified. Revenue ledger updated. Case state transitioned to RESOLVED.</p></div>)}
            {judgeStep === 8 && (<div className="space-y-4"><span className="font-mono text-xs text-[#fbc162] block">STEP 8: IMMUTABLE AUDIT TRAIL</span><h2 className="text-2xl font-mono font-extrabold text-white">100% Auditable Record Created</h2><p className="text-xs text-[#d4c4b1]">Logged timestamp, case ID, decision factors, rule evaluations, gateway attempt ID, and recovered rupee impact.</p></div>)}
          </div>
          <div className="flex justify-between items-center border-t border-[#342D24] pt-4">
            <button onClick={() => setJudgeStep(Math.max(1, judgeStep - 1))} disabled={judgeStep === 1} className="px-4 py-2 rounded border border-[#342D24] text-xs font-mono disabled:opacity-50 cursor-pointer">Previous Step</button>
            {judgeStep < 8 ? (
              <button onClick={() => setJudgeStep(judgeStep + 1)} className="px-6 py-2 rounded bg-[#fbc162] text-[#17130c] font-mono text-xs font-bold uppercase cursor-pointer">Next Step ({judgeStep}/8)</button>
            ) : (
              <button onClick={() => setJudgeMode(false)} className="px-6 py-2 rounded bg-emerald-400 text-black font-mono text-xs font-bold uppercase cursor-pointer">Complete Demo &amp; Open Command Center</button>
            )}
          </div>
        </div>
      )}

      {/* ─── INTERACTIVE SUCCESS TOAST ─── */}
      {showSuccessToast && (
        <div
          onClick={() => {
            const found = cases.find((c) => c.caseId === showSuccessToast.caseId);
            if (found) setSelectedCase(found);
          }}
          className="fixed top-6 right-6 z-50 bg-[#1f1812] border-2 border-[#fbc162] hover:border-emerald-400 p-4 rounded-lg shadow-2xl animate-bounce flex items-center gap-3 cursor-pointer group transition-all"
        >
          <span className="material-symbols-outlined text-emerald-400 text-2xl group-hover:scale-110 transition-transform">
            check_circle
          </span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-emerald-400 block uppercase">
                {showSuccessToast.amount} · {showSuccessToast.caseId}
              </span>
              <span className="text-[9px] bg-[#fbc162]/20 text-[#fbc162] px-1.5 py-0.5 rounded font-mono">
                Click to inspect →
              </span>
            </div>
            <span className="text-[11px] text-[#d4c4b1] font-mono block mt-0.5">
              {showSuccessToast.message || `Case ${showSuccessToast.caseId} payment verified!`}
            </span>
          </div>
        </div>
      )}

      {/* ─── LEFT SIDEBAR ─── */}
      <aside className="hidden md:flex flex-col h-screen py-6 px-4 bg-[#17130f] border-r border-[#342D24] w-64 shrink-0 z-20">
        <div className="mb-8 px-2 flex items-center justify-between">
          <Link href="/dashboard">
            <Logo size="sm" />
          </Link>
          <Link href="/" className="text-[10px] font-mono text-[#a79f93] hover:text-[#fbc162] transition-colors">
            Landing
          </Link>
        </div>

        <div className="mb-6 px-3 py-2 rounded bg-[#201b14] border border-[#342D24] flex items-center gap-2 font-mono text-[11px]">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[#d4c4b1]">AI AGENT</span>
          <span className="text-emerald-400 font-bold ml-auto">ACTIVE</span>
        </div>

        <ul className="flex-grow space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/dashboard"
              ? pathname === "/dashboard"
              : pathname.startsWith(item.href);
            return (
              <li key={item.id}>
                <Link
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded text-left transition-colors font-mono text-xs ${
                    isActive
                      ? "text-[#fbc162] border-r-2 border-[#fbc162] bg-[#241f18] font-bold"
                      : "text-[#d4c4b1] hover:bg-[#201b14]"
                  }`}
                >
                  <span className="material-symbols-outlined text-[18px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="pt-4 border-t border-[#342D24] space-y-2">
          <button
            onClick={() => setJudgeMode(true)}
            className="w-full py-2 px-3 rounded border border-[#fbc162]/40 text-[#fbc162] font-mono text-[11px] hover:bg-[#fbc162]/10 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
          >
            <span className="material-symbols-outlined text-[14px]">play_circle</span>
            Run 60s Demo Mode
          </button>
        </div>
      </aside>

      {/* ─── MAIN CONTENT AREA ─── */}
      <div className="flex-grow flex flex-col min-w-0 overflow-hidden bg-[#17130c]">
        {/* Top Bar */}
        <header className="flex justify-between items-center h-16 px-6 bg-[#17130c] border-b border-[#342D24] shrink-0 z-10">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-bold text-white font-mono tracking-tight uppercase">
              {getPageTitle(pathname)}
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {/* Notification Bell Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications((v: boolean) => !v)}
                className="relative p-2 rounded border border-[#342D24] text-[#d4c4b1] hover:text-[#fbc162] hover:border-[#fbc162] cursor-pointer transition-colors"
                title="Recent Case Alerts"
              >
                <span className="material-symbols-outlined text-base">notifications</span>
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#fbc162] text-[#17130c] font-mono text-[9px] font-bold flex items-center justify-center">
                  {cases.filter((c) => c.status !== "STOPPED").slice(0, 5).length}
                </span>
              </button>

              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 bg-[#1f1812] border border-[#342D24] rounded-lg shadow-2xl p-3 z-50 space-y-2 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-[#342D24] pb-2">
                    <span className="font-bold text-[#fbc162] uppercase tracking-wider text-[10px]">
                      LIVE RECOVERY ALERTS
                    </span>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-[#a79f93] hover:text-white cursor-pointer"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="max-h-72 overflow-y-auto space-y-1.5">
                    {cases.slice(0, 8).map((c) => (
                      <div
                        key={c.caseId}
                        onClick={() => {
                          setSelectedCase(c);
                          setShowNotifications(false);
                        }}
                        className="p-2 rounded bg-[#241f18] hover:bg-[#2a241b] border border-[#342D24] hover:border-[#fbc162]/50 cursor-pointer transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white text-[11px]">{c.caseId}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${
                            c.status === "RECOVERED" ? "bg-emerald-950 text-emerald-400" : "bg-[#fbc162]/10 text-[#fbc162]"
                          }`}>
                            {c.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#a79f93] mt-0.5">{c.customerName} · {formatCurrencyINR(c.amountMinor)}</div>
                        <span className="text-[9px] text-[#fbc162] block mt-1">Strategy: {c.strategy || "CREATE_PAYMENT_LINK"} →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <span className="px-2.5 py-1 rounded border border-[#fbc162] text-[#fbc162] font-mono text-[10px] font-bold uppercase">DEMO MODE</span>
            <button onClick={handleResetDemo} disabled={isProcessing} className="px-3 py-1.5 rounded border border-[#342D24] text-[#d4c4b1] font-mono text-xs hover:border-[#fbc162] cursor-pointer">Reset Data</button>
            <button onClick={handleRunBatch} disabled={isProcessing} className="px-4 py-1.5 rounded bg-[#fbc162] text-[#17130c] font-mono text-xs font-bold uppercase tracking-wider hover:bg-[#dda64a] cursor-pointer shadow">
              {isProcessing ? "Processing..." : "Run AI Recovery"}
            </button>
          </div>
        </header>

        {/* Processing Banner */}
        {executionStepText && (
          <div className="bg-[#241f18] border-b border-[#fbc162] px-6 py-2 font-mono text-xs text-[#fbc162] flex items-center gap-3 animate-pulse">
            <span className="material-symbols-outlined text-sm">sync</span>
            <span>{executionStepText}</span>
          </div>
        )}

        {/* Page Content */}
        <main className="flex-grow overflow-y-auto p-6 space-y-8">
          {children}
        </main>
      </div>

      {/* ─── FLOATING RECOVERY COPILOT ─── */}
      <RecoveryCopilot />

      {/* ─── CASE INSPECTOR DRAWER ─── */}
      {selectedCase && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex justify-end">
          <div className="w-full max-w-xl bg-[#241f18] border-l border-[#342D24] h-full p-6 overflow-y-auto space-y-6 font-mono text-xs">
            <div className="flex justify-between items-center border-b border-[#342D24] pb-4">
              <div>
                <span className="text-[10px] text-[#fbc162] block uppercase font-bold">CASE INSPECTOR</span>
                <h3 className="text-xl font-bold text-white">{selectedCase.caseId} ({selectedCase.customerName})</h3>
              </div>
              <button onClick={() => setSelectedCase(null)} className="text-[#a79f93] hover:text-white p-1">
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="bg-[#1f1812] p-4 rounded border border-[#fbc162]/40 space-y-2">
              <span className="text-xs text-[#fbc162] font-bold block">AI DIAGNOSIS</span>
              <div className="text-sm font-bold text-white">{selectedCase.diagnosis}</div>
              <p className="text-xs text-[#d4c4b1] italic">&ldquo;{selectedCase.reasoning}&rdquo;</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#17130c] p-3 rounded border border-[#342D24]">
                <span className="text-[#a79f93] block text-[10px]">AMOUNT AT RISK</span>
                <span className="text-sm font-bold text-white">{formatCurrencyINR(selectedCase.amountMinor)}</span>
              </div>
              <div className="bg-[#17130c] p-3 rounded border border-[#342D24]">
                <span className="text-[#a79f93] block text-[10px]">CONFIDENCE</span>
                <span className="text-sm font-bold text-emerald-400">{((selectedCase.confidence || 0.94) * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-[#17130c] p-3 rounded border border-[#342D24]">
                <span className="text-[#a79f93] block text-[10px]">STRATEGY</span>
                <span className="text-sm font-bold text-[#fbc162]">{selectedCase.strategy}</span>
              </div>
              <div className="bg-[#17130c] p-3 rounded border border-[#342D24]">
                <span className="text-[#a79f93] block text-[10px]">GUARDRAIL RULE</span>
                <span className="text-sm font-bold text-cyan-300">{selectedCase.lastGuardrailRule}</span>
              </div>
            </div>

            {/* Razorpay Payment Link Hub Card */}
            {(selectedCase.strategy === "CREATE_PAYMENT_LINK" || selectedCase.paymentLinkUrl) && (
              <div className="bg-[#1a150e] border-2 border-[#fbc162]/60 p-4 rounded-lg space-y-3">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-[#fbc162] text-lg">link</span>
                    <span className="font-bold text-xs text-[#fbc162] uppercase tracking-wider">
                      RAZORPAY HOSTED PAYMENT LINK
                    </span>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                    selectedCase.status === "RECOVERED"
                      ? "bg-emerald-950 text-emerald-400 border-emerald-500/40"
                      : "bg-[#fbc162]/20 text-[#fbc162] border-[#fbc162]/40 animate-pulse"
                  }`}>
                    {selectedCase.status === "RECOVERED" ? "PAID & SETTLED" : "ACTIVE LINK"}
                  </span>
                </div>

                <div className="p-2.5 bg-[#241f18] rounded border border-[#342D24] flex items-center justify-between gap-2">
                  <div className="truncate font-mono text-[11px] text-white">
                    {selectedCase.paymentLinkUrl || `https://rzp.io/i/plink_${selectedCase.caseId.toLowerCase().replace(/[^a-z0-9]/g, "")}`}
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => {
                        const url = selectedCase.paymentLinkUrl || `https://rzp.io/i/plink_${selectedCase.caseId.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
                        navigator.clipboard.writeText(url);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2500);
                      }}
                      className="px-2.5 py-1 rounded bg-[#342D24] hover:bg-[#443b30] text-[#fbc162] font-mono text-[10px] cursor-pointer flex items-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xs">
                        {linkCopied ? "check" : "content_copy"}
                      </span>
                      {linkCopied ? "Copied!" : "Copy"}
                    </button>

                    <Link
                      href={`/pay/${selectedCase.caseId.toLowerCase()}`}
                      target="_blank"
                      className="px-2.5 py-1 rounded bg-[#fbc162] text-[#17130c] font-mono text-[10px] font-bold hover:bg-[#dda64a] cursor-pointer flex items-center gap-1"
                      title="Open Branded Customer Resolution Portal"
                    >
                      Pay Portal ↗
                    </Link>
                  </div>
                </div>

                {/* Channel Delivery & Interactive Dispatch Controls */}
                <div className="space-y-2 pt-1">
                  <div className="flex justify-between items-center text-[10px] text-[#a79f93]">
                    <span className="uppercase font-bold tracking-wider">Omnichannel Customer Outreach:</span>
                    <span className="text-[#fbc162]">Live Delivery Gateway</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {/* WhatsApp Dispatch Card */}
                    <div className="p-2.5 rounded bg-[#201b14] border border-[#342D24] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-400 font-bold text-[11px]">
                          <span className="material-symbols-outlined text-sm">chat</span>
                          WhatsApp
                        </span>
                        <span className={`text-[9px] px-1 rounded font-bold ${
                          waSent ? "bg-emerald-950 text-emerald-400 border border-emerald-500/30" : "bg-[#17130c] text-[#a79f93]"
                        }`}>
                          {waSent ? "✓ Delivered" : "Ready"}
                        </span>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setSendingWa(true);
                            setTimeout(() => {
                              setSendingWa(false);
                              setWaSent(true);
                              setAuditLogs((prev) => [
                                {
                                  id: Date.now(),
                                  caseId: selectedCase.caseId,
                                  eventType: "CUSTOMER_OUTREACH",
                                  agentName: "CommunicationAgent",
                                  guardrailStatus: "APPROVED",
                                  ruleId: "WHATSAPP_NUDGE_SENT",
                                  tool: "sendWhatsAppMessage",
                                  details: `Dispatched WhatsApp payment recovery link (${selectedCase.paymentLinkUrl || `https://rzp.io/i/plink_${selectedCase.caseId.toLowerCase()}`}) to ${selectedCase.customerName}.`,
                                  timestamp: Date.now(),
                                },
                                ...prev,
                              ]);
                            }, 700);
                          }}
                          disabled={sendingWa}
                          className="flex-1 py-1.5 px-2 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                        >
                          <span className="material-symbols-outlined text-xs">{sendingWa ? "sync" : "send"}</span>
                          {sendingWa ? "Sending..." : waSent ? "Resend WhatsApp" : "Send WhatsApp"}
                        </button>
                        <a
                          href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Dear ${selectedCase.customerName || "Customer"}, your payment of ${formatCurrencyINR(selectedCase.amountMinor)} for Aurum subscription is due. Complete it securely via Razorpay: ${selectedCase.paymentLinkUrl || `https://rzp.io/i/plink_${selectedCase.caseId.toLowerCase().replace(/[^a-z0-9]/g, "")}`}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-1.5 px-2 rounded bg-[#342D24] hover:bg-[#443b30] text-[#d4c4b1] hover:text-white text-[10px] cursor-pointer flex items-center justify-center font-bold"
                          title="Open in WhatsApp Web"
                        >
                          ↗
                        </a>
                      </div>
                    </div>

                    {/* SMS Dispatch Card */}
                    <div className="p-2.5 rounded bg-[#201b14] border border-[#342D24] space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="flex items-center gap-1 text-cyan-300 font-bold text-[11px]">
                          <span className="material-symbols-outlined text-sm">sms</span>
                          SMS Gateway
                        </span>
                        <span className={`text-[9px] px-1 rounded font-bold ${
                          smsSent ? "bg-cyan-950 text-cyan-300 border border-cyan-500/30" : "bg-[#17130c] text-[#a79f93]"
                        }`}>
                          {smsSent ? "✓ Sent (T+0s)" : "Ready"}
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setSendingSms(true);
                          setTimeout(() => {
                            setSendingSms(false);
                            setSmsSent(true);
                            setAuditLogs((prev) => [
                              {
                                id: Date.now(),
                                caseId: selectedCase.caseId,
                                eventType: "CUSTOMER_OUTREACH",
                                agentName: "CommunicationAgent",
                                guardrailStatus: "APPROVED",
                                ruleId: "SMS_LINK_DISPATCHED",
                                tool: "sendSmsGateway",
                                details: `Dispatched SMS payment link to ${selectedCase.customerName} via gateway.`,
                                timestamp: Date.now(),
                              },
                              ...prev,
                            ]);
                          }, 700);
                        }}
                        disabled={sendingSms}
                        className="w-full py-1.5 px-2 rounded bg-cyan-600 hover:bg-cyan-500 text-black font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1 transition-all disabled:opacity-50"
                      >
                        <span className="material-symbols-outlined text-xs">{sendingSms ? "sync" : "send"}</span>
                        {sendingSms ? "Dispatching..." : smsSent ? "Resend SMS" : "Send SMS Link"}
                      </button>
                    </div>
                  </div>

                  {/* AI Voice Call Outreach Card (Hinglish & English) */}
                  <div className="p-2.5 rounded bg-[#201b14] border border-[#342D24] space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined text-sm text-purple-300">ring_volume</span>
                        <span className="text-purple-300 font-bold text-[11px]">
                          Autonomous Voice Agent
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {/* Language Selector */}
                        <div className="flex bg-[#17130c] p-0.5 rounded border border-[#342D24] text-[9px] font-bold">
                          <button
                            onClick={() => setVoiceLanguage("HINGLISH")}
                            className={`px-1.5 py-0.5 rounded transition-colors ${
                              voiceLanguage === "HINGLISH" ? "bg-[#fbc162] text-black" : "text-[#a79f93] hover:text-white"
                            }`}
                          >
                            Hinglish
                          </button>
                          <button
                            onClick={() => setVoiceLanguage("EN")}
                            className={`px-1.5 py-0.5 rounded transition-colors ${
                              voiceLanguage === "EN" ? "bg-[#fbc162] text-black" : "text-[#a79f93] hover:text-white"
                            }`}
                          >
                            EN
                          </button>
                        </div>
                        <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                          voiceCallStep === 3
                            ? "bg-purple-950 text-purple-300 border border-purple-500/30"
                            : voiceCallStep > 0
                            ? "bg-[#fbc162]/20 text-[#fbc162] animate-pulse"
                            : "bg-[#17130c] text-[#a79f93]"
                        }`}>
                          {voiceCallStep === 3 ? "✓ Call Done" : voiceCallStep > 0 ? "In Call..." : "Ready"}
                        </span>
                      </div>
                    </div>

                    {voiceCallStep === 0 ? (
                      <button
                        onClick={() => {
                          setCallingVoice(true);
                          setVoiceCallStep(1);
                          setTimeout(() => setVoiceCallStep(2), 1200);
                          setTimeout(() => {
                            setVoiceCallStep(3);
                            setCallingVoice(false);
                            setWaSent(true);
                            setAuditLogs((prev) => [
                              {
                                id: Date.now(),
                                caseId: selectedCase.caseId,
                                eventType: "HINGLISH_VOICE_OUTREACH",
                                agentName: "HinglishVoiceAgent",
                                guardrailStatus: "APPROVED",
                                ruleId: "AI_PHONE_DISPATCH",
                                tool: "initiateVoiceCall",
                                details: `${voiceLanguage === "HINGLISH" ? "Bilingual Hinglish" : "English"} voice call completed with ${selectedCase.customerName} AP Desk (+91 98765 43210). Customer agreed; WhatsApp payment link delivered.`,
                                timestamp: Date.now(),
                              },
                              ...prev,
                            ]);
                          }, 4200);
                        }}
                        disabled={callingVoice}
                        className="w-full py-1.5 px-3 rounded bg-purple-600 hover:bg-purple-500 text-white font-bold text-[10px] cursor-pointer flex items-center justify-center gap-1.5 transition-all"
                      >
                        <span className="material-symbols-outlined text-xs">phone_in_talk</span>
                        {voiceLanguage === "HINGLISH"
                          ? "Call AP Desk (Hinglish Voice Agent)"
                          : "Call Accounts Payable Desk (AI Voice)"}
                      </button>
                    ) : (
                      <div className="bg-[#17130c] p-2.5 rounded border border-purple-500/30 text-[10px] space-y-2">
                        {voiceCallStep === 1 && (
                          <div className="flex items-center gap-2 text-[#fbc162] animate-pulse">
                            <span className="material-symbols-outlined text-sm animate-spin">sync</span>
                            <span>Dialing {selectedCase.customerName} (+91 98765 43210) [{voiceLanguage}]...</span>
                          </div>
                        )}

                        {voiceCallStep >= 2 && (
                          <div className="space-y-1.5">
                            {/* Waveform visualizer */}
                            <div className="flex items-center justify-center gap-1 h-5 py-1">
                              {[8, 16, 24, 12, 28, 18, 10, 22, 14, 26, 12].map((h, i) => (
                                <span
                                  key={i}
                                  className="w-1 bg-purple-400 rounded-full animate-bounce"
                                  style={{ height: `${h}px`, animationDelay: `${i * 0.08}s` }}
                                />
                              ))}
                            </div>

                            {voiceLanguage === "HINGLISH" ? (
                              <>
                                <div className="text-[#ebe1d6] italic border-t border-[#342D24] pt-1">
                                  AI Agent: &ldquo;Namaste {selectedCase.customerName} ji! Aurum billing team se bol rahe hain. Aapka {formatCurrencyINR(selectedCase.amountMinor)} ka invoice bank decline ki wajah se pending hai. Kya hum aapko instant payment link WhatsApp pe bhej dein?&rdquo;
                                </div>
                                <div className="text-emerald-400 font-bold">
                                  Customer: &ldquo;Haan please WhatsApp par send kar dijiye, main abhi UPI se settle kar deta hoon.&rdquo;
                                </div>
                                <div className="text-[#fbc162] italic text-[9px]">
                                  AI Agent: &ldquo;Bahut dhanyawaad {selectedCase.customerName} ji! Link WhatsApp par bhej diya hai.&rdquo;
                                </div>
                              </>
                            ) : (
                              <>
                                <div className="text-[#ebe1d6] italic border-t border-[#342D24] pt-1">
                                  AI Agent: &ldquo;Hello {selectedCase.customerName}! This is Aurum billing desk. We noticed invoice {formatCurrencyINR(selectedCase.amountMinor)} failed at your bank. May we dispatch an instant payment link to your WhatsApp?&rdquo;
                                </div>
                                <div className="text-emerald-400 font-bold">
                                  Customer: &ldquo;Yes please, send it over right away.&rdquo;
                                </div>
                              </>
                            )}

                            {voiceCallStep === 3 && (
                              <div className="text-[9px] text-[#fbc162] font-bold">
                                ✓ Call finished · WhatsApp payment link delivered
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Promise-to-Pay (PTP) Commitment Logger */}
                  <div className="p-2.5 rounded bg-[#201b14] border border-[#342D24] space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1 text-[#fbc162] font-bold text-[11px]">
                        <span className="material-symbols-outlined text-sm">handshake</span>
                        Promise-to-Pay (PTP) Tracker
                      </span>
                      {ptpLoggedForCase ? (
                        <span className="text-[9px] px-1.5 py-0.5 rounded font-bold bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                          ✓ PTP Active
                        </span>
                      ) : (
                        <button
                          onClick={() => setShowPtpForm((v) => !v)}
                          className="text-[9px] text-[#fbc162] hover:underline cursor-pointer font-bold"
                        >
                          {showPtpForm ? "Cancel" : "+ Record Promise"}
                        </button>
                      )}
                    </div>

                    {ptpLoggedForCase ? (
                      <div className="p-2 bg-[#17130c] rounded border border-emerald-500/30 text-[10px] space-y-1">
                        <div className="flex justify-between text-emerald-400 font-bold">
                          <span>Promise Due Date:</span>
                          <span>{ptpDateChoice}</span>
                        </div>
                        <p className="text-[#a79f93] text-[9px]">
                          Automated dunning is paused until {ptpDateChoice}. Friendly reminder scheduled for T-1 day.
                        </p>
                      </div>
                    ) : showPtpForm ? (
                      <div className="p-2 bg-[#17130c] rounded border border-[#342D24] text-[10px] space-y-2">
                        <div className="text-[#d4c4b1] font-medium">Select Promised Settlement Date:</div>
                        <div className="grid grid-cols-3 gap-1.5 text-[9px]">
                          {[
                            "05 Sep (Salary Day)",
                            "07 Sep (+4 Days)",
                            "10 Sep (Next Week)",
                          ].map((d) => (
                            <button
                              key={d}
                              onClick={() => setPtpDateChoice(d)}
                              className={`p-1.5 rounded border text-center cursor-pointer transition-colors ${
                                ptpDateChoice === d
                                  ? "bg-[#fbc162] text-black font-bold border-[#fbc162]"
                                  : "bg-[#241f18] text-[#a79f93] border-[#342D24] hover:text-white"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                        <button
                          onClick={() => {
                            handleAddPtpRecord({
                              caseId: selectedCase.caseId,
                              customerName: selectedCase.customerName || "Customer",
                              amountMinor: selectedCase.amountMinor || 249900,
                              promisedDate: ptpDateChoice,
                              status: "PENDING",
                              notes: `Customer committed to settle ${formatCurrencyINR(selectedCase.amountMinor)} on ${ptpDateChoice}.`,
                            });
                            setPtpLoggedForCase(true);
                            setShowPtpForm(false);
                          }}
                          className="w-full py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-black font-bold text-[10px] cursor-pointer transition-colors flex items-center justify-center gap-1"
                        >
                          <span className="material-symbols-outlined text-xs">check</span>
                          Lock In Promise-to-Pay Commitment
                        </button>
                      </div>
                    ) : (
                      <div className="text-[10px] text-[#a79f93]">
                        Customer asked for time? Log a formal Promise-to-Pay to pause dunning and protect customer goodwill.
                      </div>
                    )}
                  </div>
                </div>

                {/* Simulate Customer Payment Action */}
                {selectedCase.status !== "RECOVERED" && (
                  <button
                    onClick={() => handleSimulateCustomerPayment(selectedCase)}
                    disabled={isProcessing}
                    className="w-full py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-mono font-bold text-xs uppercase cursor-pointer flex items-center justify-center gap-2 shadow"
                  >
                    <span className="material-symbols-outlined text-base">verified</span>
                    Simulate Customer Payment &amp; Verify Capture
                  </button>
                )}
              </div>
            )}

            <div className="border-t border-[#342D24] pt-4 space-y-2">
              {selectedCase.status === "RECOVERED" ? (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/40 rounded text-center space-y-2">
                  <span className="text-emerald-400 font-bold text-xs flex items-center justify-center gap-1">
                    <span className="material-symbols-outlined text-base">check_circle</span>
                    REVENUE RECOVERED ({formatCurrencyINR(selectedCase.amountMinor)})
                  </span>
                  <span className="text-[10px] text-[#a79f93] block">
                    Settlement verified · Duplicate debits locked by safety guardrail
                  </span>
                  <button
                    onClick={() => {
                      const updated = { ...selectedCase, status: "DETECTED" };
                      setSelectedCase(updated);
                      setCases((prev) => prev.map((c) => (c.id === selectedCase.id ? updated : c)));
                    }}
                    className="text-[10px] text-[#fbc162] hover:underline cursor-pointer font-bold block mx-auto pt-1"
                  >
                    ↺ Re-test: Reset this case to DETECTED
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => handleExecuteCase(selectedCase)}
                  disabled={isProcessing || selectedCase.status === "STOPPED"}
                  className="w-full py-3 rounded bg-[#fbc162] text-[#17130c] font-bold text-xs uppercase cursor-pointer disabled:opacity-50 hover:bg-[#dda64a] transition-colors"
                >
                  {isProcessing ? "Executing Pipeline..." : "Execute Recovery Flow"}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardProvider>
      <DashboardShell>{children}</DashboardShell>
    </DashboardProvider>
  );
}
