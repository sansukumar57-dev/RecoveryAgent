"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { DashboardProvider, useDashboard } from "./DashboardContext";
import Logo from "../components/Logo";

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
  { id: "settings", href: "/dashboard/settings", label: "Settings & Webhooks", icon: "settings" },
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
    settings: "RAZORPAY GATEWAY & SIMULATOR",
  };
  return titles[seg] || "RECOVERY COMMAND CENTER";
}

function DashboardShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const {
    isProcessing, executionStepText, showSuccessToast,
    handleRunBatch, handleResetDemo,
    selectedCase, setSelectedCase, handleExecuteCase,
    formatCurrencyINR,
    judgeMode, setJudgeMode, judgeStep, setJudgeStep,
  } = useDashboard();

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

      {/* ─── SUCCESS TOAST ─── */}
      {showSuccessToast && (
        <div className="fixed top-6 right-6 z-50 bg-[#1f1812] border-2 border-emerald-400 p-4 rounded shadow-2xl animate-bounce flex items-center gap-3">
          <span className="material-symbols-outlined text-emerald-400 text-2xl">check_circle</span>
          <div>
            <span className="font-mono text-xs font-bold text-emerald-400 block uppercase">RECOVERED {showSuccessToast.amount}</span>
            <span className="text-[11px] text-[#d4c4b1] font-mono">Case {showSuccessToast.caseId} payment verified!</span>
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

            <div className="border-t border-[#342D24] pt-4 space-y-2">
              <button
                onClick={() => { handleExecuteCase(selectedCase); setSelectedCase(null); }}
                disabled={isProcessing || selectedCase.status === "RECOVERED" || selectedCase.status === "STOPPED"}
                className="w-full py-3 rounded bg-[#fbc162] text-[#17130c] font-bold text-xs uppercase cursor-pointer disabled:opacity-50"
              >
                Execute Recovery Flow
              </button>
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
