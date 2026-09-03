"use client";

import React, { useState, useRef, useEffect } from "react";
import { useDashboard } from "../DashboardContext";

interface ChatMessage {
  id: string;
  sender: "copilot" | "user";
  text: string;
  action?: {
    label: string;
    caseId?: string;
    type: "inspect_case" | "run_batch";
  };
}

export default function RecoveryCopilot() {
  const { cases, metrics, formatCurrencyINR, setSelectedCase, handleRunBatch } = useDashboard();
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init",
      sender: "copilot",
      text: "Hello! I am your Aurum Autonomous Recovery Copilot. Ask me anything about payment failures, recovery strategies, high-risk cohorts, or specific cases.",
    },
  ]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: query,
    };
    setMessages((prev) => [...prev, userMsg]);
    setInputQuery("");
    setIsTyping(true);

    setTimeout(() => {
      const lower = query.toLowerCase();
      let reply = "";
      let action: ChatMessage["action"] = undefined;

      // 1. Specific Case Query
      const matchCase = cases.find((c) => lower.includes(c.caseId.toLowerCase()));
      if (matchCase) {
        reply = `Case ${matchCase.caseId} (${matchCase.customerName}): Amount at risk is ${formatCurrencyINR(matchCase.amountMinor)}. Root cause diagnosed as "${matchCase.diagnosis || matchCase.failureReason}". Recommended strategy is ${matchCase.strategy || "DELAYED_RETRY"} (Confidence: ${Math.round((matchCase.confidence || 0.85) * 100)}%). Status: ${matchCase.status}.`;
        action = {
          label: `Open Case Inspector (${matchCase.caseId})`,
          caseId: matchCase.caseId,
          type: "inspect_case",
        };
      }
      // 2. Failure Reasons Query
      else if (lower.includes("failure") || lower.includes("reason") || lower.includes("decline") || lower.includes("top")) {
        const counts: Record<string, number> = {};
        cases.forEach((c) => {
          const r = c.failureReason || "unknown";
          counts[r] = (counts[r] || 0) + 1;
        });
        const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
        const topList = sorted.slice(0, 4).map(([r, n]) => `• ${r}: ${n} cases`).join("\n");
        reply = `Here are the top failure drivers across our portfolio:\n${topList}\n\nNSF and Gateway Timeouts represent our highest-recoverability clusters.`;
      }
      // 3. Human Review / Escalations Query
      else if (lower.includes("human") || lower.includes("approval") || lower.includes("escalat")) {
        const escalated = cases.filter((c) => c.status === "ESCALATED");
        if (escalated.length > 0) {
          reply = `We currently have ${escalated.length} case(s) escalated for human approval (e.g. ${escalated.slice(0, 2).map((c) => `${c.caseId} for ${formatCurrencyINR(c.amountMinor)}`).join(", ")}). These exceed our auto-execution guardrail limit of ₹50,000.`;
          action = {
            label: `Inspect ${escalated[0].caseId}`,
            caseId: escalated[0].caseId,
            type: "inspect_case",
          };
        } else {
          reply = "All active cases are currently within automated policy boundaries. Zero cases are blocked in human escalation.";
        }
      }
      // 4. Recovered Revenue / Metrics Query
      else if (lower.includes("recover") || lower.includes("yield") || lower.includes("rate") || lower.includes("metric") || lower.includes("money")) {
        const recoveredCases = cases.filter((c) => c.status === "RECOVERED");
        const recoveredAmount = recoveredCases.reduce((s, c) => s + (c.amountMinor || 0), 0) || metrics.revenueRecoveredMinor;
        const total = cases.reduce((s, c) => s + (c.amountMinor || 0), 0);
        const rate = total > 0 ? Math.round((recoveredAmount / total) * 100) : metrics.recoveryRate;
        reply = `Total Recovered: ${formatCurrencyINR(recoveredAmount)} across ${recoveredCases.length} accounts. Net recovery rate is ${rate}%. Our agent interventions represent an estimated +₹24.8L ARR churn preservation.`;
      }
      // 5. Run Recovery Action
      else if (lower.includes("run") || lower.includes("batch") || lower.includes("execute")) {
        reply = "You can trigger full autonomous batch recovery across all active cases. Would you like me to run the pipeline now?";
        action = {
          label: "Execute Batch AI Recovery Pipeline",
          type: "run_batch",
        };
      }
      // 6. Fallback General Intelligence
      else {
        reply = `I have analyzed our ${cases.length} active recovery cases. Our smart retry window is set to optimal bank liquidity hours (10:00 AM - 12:30 PM). Omnichannel payment links are yielding an 82% conversion rate on expired cards. How else can I assist?`;
      }

      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: "copilot",
          text: reply,
          action,
        },
      ]);
    }, 500);
  };

  const handleActionClick = (action: ChatMessage["action"]) => {
    if (!action) return;
    if (action.type === "inspect_case" && action.caseId) {
      const found = cases.find((c) => c.caseId === action.caseId);
      if (found) {
        setSelectedCase(found);
        setIsOpen(false);
      }
    } else if (action.type === "run_batch") {
      handleRunBatch();
      setIsOpen(false);
    }
  };

  return (
    <>
      {/* Floating Toggle Button */}
      <div className="fixed bottom-6 right-6 z-40">
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="relative p-3.5 rounded-full bg-gradient-to-r from-[#fbc162] to-[#dda64a] text-[#17130c] shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer flex items-center justify-center group"
          title="Ask Aurum AI Copilot"
        >
          <span className="material-symbols-outlined text-2xl">
            {isOpen ? "close" : "smart_toy"}
          </span>
          {!isOpen && (
            <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500" />
            </span>
          )}
        </button>
      </div>

      {/* Floating Chat Drawer */}
      {isOpen && (
        <div className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[520px] bg-[#1a150e] border-2 border-[#fbc162]/60 rounded-2xl shadow-2xl z-40 flex flex-col overflow-hidden font-mono text-xs animate-in slide-in-from-bottom-4 duration-200">
          {/* Header */}
          <div className="p-4 bg-[#241f18] border-b border-[#342D24] flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-full bg-[#fbc162]/20 border border-[#fbc162]/40 flex items-center justify-center text-[#fbc162]">
                <span className="material-symbols-outlined text-base">smart_toy</span>
              </div>
              <div>
                <h4 className="text-white font-bold text-xs uppercase tracking-wider">AURUM RECOVERY COPILOT</h4>
                <div className="flex items-center gap-1.5 text-[9px] text-[#a79f93]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Online · Groq / Llama-3.1-70b</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#a79f93] hover:text-white p-1 cursor-pointer"
            >
              <span className="material-symbols-outlined text-lg">close</span>
            </button>
          </div>

          {/* Messages Stream */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#17130c]/80">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`p-3 rounded-xl max-w-[85%] whitespace-pre-line leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#fbc162] text-[#17130c] font-medium"
                      : "bg-[#241f18] text-[#ebe1d6] border border-[#342D24]"
                  }`}
                >
                  {m.text}
                </div>

                {m.action && (
                  <button
                    onClick={() => handleActionClick(m.action)}
                    className="mt-1.5 px-3 py-1.5 rounded bg-[#342D24] hover:bg-[#443b30] text-[#fbc162] text-[10px] font-bold cursor-pointer flex items-center gap-1.5 transition-colors"
                  >
                    <span className="material-symbols-outlined text-xs">arrow_forward</span>
                    {m.action.label}
                  </button>
                )}
              </div>
            ))}

            {isTyping && (
              <div className="flex items-center gap-1 text-[#fbc162] p-2 bg-[#241f18] rounded-lg max-w-[100px] text-[10px]">
                <span className="material-symbols-outlined text-xs animate-spin">sync</span>
                <span>Thinking...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompt Chips */}
          <div className="p-2.5 bg-[#201b14] border-t border-[#342D24] flex gap-1.5 overflow-x-auto no-scrollbar">
            {[
              "Top failure reasons",
              "Cases needing human review",
              "Total recovered revenue",
              "Inspect RC-1001",
            ].map((chip) => (
              <button
                key={chip}
                onClick={() => handleSend(chip)}
                className="px-2.5 py-1 rounded bg-[#2a231a] hover:bg-[#342D24] text-[#d4c4b1] hover:text-[#fbc162] text-[10px] whitespace-nowrap cursor-pointer transition-colors border border-[#342D24]"
              >
                {chip}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-[#241f18] border-t border-[#342D24] flex gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask about cases, strategies, or failures..."
              className="flex-1 bg-[#17130c] border border-[#342D24] focus:border-[#fbc162] rounded-lg px-3 py-2 text-xs text-white outline-none"
            />
            <button
              onClick={() => handleSend()}
              className="px-3 rounded bg-[#fbc162] text-[#17130c] font-bold hover:bg-[#dda64a] cursor-pointer flex items-center justify-center transition-colors"
            >
              <span className="material-symbols-outlined text-base">send</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
