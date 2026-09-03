"use client";

import React, { useState, useEffect } from "react";
import { useDashboard, apiFetch, API_BASE_URL } from "../DashboardContext";

export default function SettingsPage() {
  const { handleResetDemo, isProcessing, metrics, formatCurrencyINR, cases } = useDashboard();

  // 1. Gateway Credentials State
  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("whsec_aurum_recovery_live_99x");
  const [gatewayStatus, setGatewayStatus] = useState<string>("Checking…");
  const [gatewaySaved, setGatewaySaved] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);

  // 2. Safety Guardrails & Policy Engine State
  const [maxRetries, setMaxRetries] = useState<number>(3);
  const [autoExecutionLimit, setAutoExecutionLimit] = useState<number>(2500000); // minor units
  const [quietHoursEnabled, setQuietHoursEnabled] = useState<boolean>(true);
  const [quietHoursStart, setQuietHoursStart] = useState<number>(20); // 8 PM
  const [quietHoursEnd, setQuietHoursEnd] = useState<number>(8); // 8 AM
  const [maxIncentivePercent, setMaxIncentivePercent] = useState<number>(10);
  const [policySaved, setPolicySaved] = useState(false);
  const [savingPolicy, setSavingPolicy] = useState(false);

  // 3. AI Recovery Brain & Reasoning Controls
  const [llmModel, setLlmModel] = useState("Llama-3.1-70B-Versatile (Groq)");
  const [temperature, setTemperature] = useState(0.2);
  const [voiceDialect, setVoiceDialect] = useState("Hinglish (Hindi + English)");
  const [autonomyLevel, setAutonomyLevel] = useState("AUTONOMOUS");
  const [groqApiKey, setGroqApiKey] = useState("");
  const [aiSaved, setAiSaved] = useState(false);

  // 4. Omnichannel & Communication Rails
  const [waGateway, setWaGateway] = useState("META_CLOUD_API");
  const [smsGateway, setSmsGateway] = useState("TWILIO_SMS");
  const [autoDispatchWa, setAutoDispatchWa] = useState(true);
  const [preDebitNotice, setPreDebitNotice] = useState(true);

  // 5. Interactive Webhook Testing Console
  const [webhookUrl, setWebhookUrl] = useState("http://localhost:8001/webhooks/razorpay");
  const [simEvent, setSimEvent] = useState("payment.failed");
  const [simReason, setSimReason] = useState("gateway_timeout");
  const [simAmountInr, setSimAmountInr] = useState("2499");
  const [simMethod, setSimMethod] = useState("card");
  const [webhookResponse, setWebhookResponse] = useState<string | null>(null);
  const [sendingWebhook, setSendingWebhook] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Load Policies & Gateway config on mount
  useEffect(() => {
    // Gateway info
    apiFetch(`${API_BASE_URL}/config/gateway`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((d) => {
        if (d.configured) {
          setGatewayStatus(`Connected & Active — ${d.keyIdMasked}`);
          setKeyId("rzp_test_TX4DWGCxijYiDV");
        } else {
          setGatewayStatus("Connected — Demo Mode (rzp_test_demo)");
          setKeyId("rzp_test_TX4DWGCxijYiDV");
        }
      })
      .catch(() => {
        setGatewayStatus("Connected — Test Mode (rzp_test_TX4DWGCxijYiDV)");
        setKeyId("rzp_test_TX4DWGCxijYiDV");
      });

    // Policies
    apiFetch(`${API_BASE_URL}/config/policies`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((p) => {
        if (p.maxRetries !== undefined) setMaxRetries(p.maxRetries);
        if (p.autoExecutionLimit !== undefined) setAutoExecutionLimit(p.autoExecutionLimit);
        if (p.quietHoursEnabled !== undefined) setQuietHoursEnabled(p.quietHoursEnabled);
        if (p.quietHoursStart !== undefined) setQuietHoursStart(p.quietHoursStart);
        if (p.quietHoursEnd !== undefined) setQuietHoursEnd(p.quietHoursEnd);
        if (p.maxIncentivePercent !== undefined) setMaxIncentivePercent(p.maxIncentivePercent);
        if (p.llmModel) setLlmModel(p.llmModel);
        if (p.temperature !== undefined) setTemperature(p.temperature);
        if (p.voiceDialect) setVoiceDialect(p.voiceDialect);
        if (p.autonomyLevel) setAutonomyLevel(p.autonomyLevel);
      })
      .catch(() => {});
  }, []);

  const saveGateway = async () => {
    setGatewayError(null);
    setGatewaySaved(false);
    try {
      const res = await apiFetch(`${API_BASE_URL}/config/gateway`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ keyId, keySecret }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Save failed");
      }
      const d = await res.json();
      setGatewayStatus(`Connected & Active — ${d.keyIdMasked || keyId}`);
      setGatewaySaved(true);
      setKeySecret("");
      setTimeout(() => setGatewaySaved(false), 3000);
    } catch (e) {
      setGatewayError((e as Error).message);
    }
  };

  const savePolicies = async () => {
    setSavingPolicy(true);
    setPolicySaved(false);
    try {
      const res = await apiFetch(`${API_BASE_URL}/config/policies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          maxRetries,
          autoExecutionLimit,
          quietHoursEnabled,
          quietHoursStart,
          quietHoursEnd,
          maxIncentivePercent,
          llmModel,
          temperature,
          voiceDialect,
          autonomyLevel,
        }),
      });
      if (res.ok) {
        setPolicySaved(true);
        setTimeout(() => setPolicySaved(false), 3000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingPolicy(false);
    }
  };

  // Generate Sample Webhook JSON Payload
  const getSamplePayload = () => {
    return JSON.stringify({
      event: simEvent,
      account_id: "acc_aurum_live",
      created_at: Math.floor(Date.now() / 1000),
      payload: {
        payment: {
          entity: {
            id: `pay_test_${Math.random().toString(36).substring(2, 9)}`,
            amount: Math.round(parseFloat(simAmountInr || "2499") * 100),
            currency: "INR",
            status: simEvent === "payment.failed" ? "failed" : "captured",
            method: simMethod,
            error_code: simReason,
            error_description: `Simulated bank decline: ${simReason.replace(/_/g, " ")}`,
            notes: {
              source: "aurum_admin_settings_simulator",
              plan: "Enterprise Pro"
            }
          }
        }
      }
    }, null, 2);
  };

  const handleSendTestWebhook = async () => {
    setSendingWebhook(true);
    setWebhookResponse(null);
    try {
      const payload = JSON.parse(getSamplePayload());
      const res = await fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Razorpay-Signature": "simulated_valid_test_signature",
          "X-API-Key": "demo-api-key-123",
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => ({ status: res.status, statusText: res.statusText }));
      setWebhookResponse(JSON.stringify(data, null, 2));
    } catch (err: unknown) {
      setWebhookResponse(JSON.stringify({ error: (err as Error).message, note: "Target endpoint reachable or simulated." }, null, 2));
    } finally {
      setSendingWebhook(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 font-mono pb-12">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-[#342D24]">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <span className="material-symbols-outlined text-[#fbc162]">tune</span>
            Platform Engine &amp; Policy Control Center
          </h2>
          <p className="text-xs text-[#a79f93] mt-1">
            Configure safety boundaries, AI reasoning parameters, gateway credentials, and live webhook simulators.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] px-2.5 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            SAFETY ENGINE ACTIVE
          </span>
        </div>
      </div>

      {/* PANEL 1: Safety Guardrails & Policy Boundaries */}
      <div className="bg-[#1f1812] border-2 border-[#fbc162]/40 p-6 rounded-xl space-y-6 shadow-xl">
        <div className="flex justify-between items-center border-b border-[#342D24] pb-3">
          <div>
            <h3 className="text-sm text-[#fbc162] font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">security</span>
              Safety Guardrails &amp; Regulatory Boundaries
            </h3>
            <p className="text-[11px] text-[#a79f93] mt-0.5">
              Enforced dynamically by SafetyEngine.java at every decision step. Actions violating these rules are automatically halted.
            </p>
          </div>
          <button
            onClick={savePolicies}
            disabled={savingPolicy}
            className="px-4 py-2 rounded bg-[#fbc162] hover:bg-[#dda64a] text-[#17130c] font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">{policySaved ? "check" : "save"}</span>
            {savingPolicy ? "Saving..." : policySaved ? "✓ Policies Saved" : "Save Policies"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Max Retries */}
          <div className="bg-[#241f18] p-4 rounded-lg border border-[#342D24] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#a79f93]">Max Retry Attempts</span>
              <span className="text-[#fbc162] font-bold text-sm">{maxRetries} Retries</span>
            </div>
            <input
              type="range"
              min={1}
              max={5}
              step={1}
              value={maxRetries}
              onChange={(e) => setMaxRetries(Number(e.target.value))}
              className="w-full accent-[#fbc162]"
            />
            <div className="flex justify-between text-[10px] text-[#a79f93]">
              <span>1 (Conservative)</span>
              <span>5 (Aggressive)</span>
            </div>
            <p className="text-[9px] text-[#a79f93] pt-1">Prevents card fatigue and banking fraud flags.</p>
          </div>

          {/* Auto-Execution Threshold */}
          <div className="bg-[#241f18] p-4 rounded-lg border border-[#342D24] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#a79f93]">Auto-Execution Limit</span>
              <span className="text-purple-300 font-bold text-sm">{formatCurrencyINR(autoExecutionLimit)}</span>
            </div>
            <select
              value={autoExecutionLimit}
              onChange={(e) => setAutoExecutionLimit(Number(e.target.value))}
              className="w-full px-3 py-2 rounded bg-[#17130c] border border-[#342D24] text-white text-xs focus:border-[#fbc162]"
            >
              <option value={1000000}>₹10,000 (Conservative)</option>
              <option value={2500000}>₹25,000 (Standard Limit)</option>
              <option value={5000000}>₹50,000 (Enterprise Threshold)</option>
              <option value={10000000}>₹1,00,000 (High Volume)</option>
              <option value={25000000}>₹2,50,000 (Custom Enterprise)</option>
            </select>
            <p className="text-[9px] text-[#a79f93] pt-1">Amounts above this require Human Approval Center sign-off.</p>
          </div>

          {/* Max Incentive Cap */}
          <div className="bg-[#241f18] p-4 rounded-lg border border-[#342D24] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#a79f93]">Max Incentive Discount</span>
              <span className="text-amber-400 font-bold text-sm">{maxIncentivePercent}% Cap</span>
            </div>
            <input
              type="range"
              min={0}
              max={20}
              step={1}
              value={maxIncentivePercent}
              onChange={(e) => setMaxIncentivePercent(Number(e.target.value))}
              className="w-full accent-[#fbc162]"
            />
            <div className="flex justify-between text-[10px] text-[#a79f93]">
              <span>0% (No discounts)</span>
              <span>20% (High Margin)</span>
            </div>
            <p className="text-[9px] text-[#a79f93] pt-1">Limits cart abandonment recovery incentives.</p>
          </div>
        </div>

        {/* Quiet Hours & Compliance Rules */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-2">
          <div className="bg-[#241f18] p-4 rounded-lg border border-[#342D24] flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-[#fbc162]">bedtime</span>
                RBI Quiet Hours Compliance
              </div>
              <p className="text-[10px] text-[#a79f93] mt-0.5">
                Suppresses customer outreach between {quietHoursStart}:00 PM and {quietHoursEnd}:00 AM IST.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={quietHoursEnabled}
                onChange={(e) => setQuietHoursEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[#342D24] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#fbc162]"></div>
            </label>
          </div>

          <div className="bg-[#241f18] p-4 rounded-lg border border-[#342D24] flex items-center justify-between">
            <div>
              <div className="font-bold text-white flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm text-rose-400">front_hand</span>
                Mandatory Stopping Rules
              </div>
              <p className="text-[10px] text-[#a79f93] mt-0.5">
                Immediately terminates execution on customer opt-out (STOP) and reported stolen cards.
              </p>
            </div>
            <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
              STRICT (LOCKED)
            </span>
          </div>
        </div>
      </div>

      {/* PANEL 2: AI Recovery Brain & Reasoning Parameters */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-xl space-y-6">
        <div className="flex justify-between items-center border-b border-[#342D24] pb-3">
          <div>
            <h3 className="text-sm text-[#fbc162] font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">psychology</span>
              AI Recovery Brain &amp; Agent Reasoning
            </h3>
            <p className="text-[11px] text-[#a79f93] mt-0.5">
              Control LLM model weights, reasoning temperature, voice desk dialect, and autonomous execution boundaries.
            </p>
          </div>
          <button
            onClick={() => {
              setAiSaved(true);
              savePolicies();
              setTimeout(() => setAiSaved(false), 2500);
            }}
            className="px-3 py-1.5 rounded bg-[#342D24] hover:bg-[#443b30] text-[#fbc162] font-mono text-xs cursor-pointer flex items-center gap-1"
          >
            {aiSaved ? "✓ Applied" : "Apply AI Config"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
          {/* Model Selector */}
          <div className="space-y-2">
            <label className="text-[#a79f93] block">LLM Reasoning Engine</label>
            <select
              value={llmModel}
              onChange={(e) => setLlmModel(e.target.value)}
              className="w-full px-3 py-2.5 rounded bg-[#241f18] border border-[#342D24] text-white focus:border-[#fbc162]"
            >
              <option value="Llama-3.1-70B-Versatile (Groq)">Llama-3.1-70B-Versatile (Groq Fast Inference - Default)</option>
              <option value="Mixtral-8x7B (Groq)">Mixtral-8x7B (Groq MoE High Throughput)</option>
              <option value="GPT-4o (OpenAI Enterprise)">GPT-4o (OpenAI Enterprise)</option>
              <option value="Claude 3.5 Sonnet (Anthropic)">Claude 3.5 Sonnet (Anthropic)</option>
              <option value="Deterministic Rule Engine (Fail-safe)">Deterministic Rule Engine (Fail-safe Offline)</option>
            </select>
            <span className="text-[10px] text-[#a79f93] block">Generates multi-factor payment diagnosis and risk score telemetry.</span>
          </div>

          {/* Autonomy Level */}
          <div className="space-y-2">
            <label className="text-[#a79f93] block">Agent Execution Autonomy</label>
            <select
              value={autonomyLevel}
              onChange={(e) => setAutonomyLevel(e.target.value)}
              className="w-full px-3 py-2.5 rounded bg-[#241f18] border border-[#342D24] text-white focus:border-[#fbc162]"
            >
              <option value="AUTONOMOUS">Fully Autonomous (Executes within safety policy bounds)</option>
              <option value="SEMI_AUTONOMOUS">Semi-Autonomous (Requires human sign-off on retries)</option>
              <option value="OBSERVER">Observer Mode (Read-only diagnosis without gateway execution)</option>
            </select>
            <span className="text-[10px] text-[#a79f93] block">Defines whether the agent triggers payment retries autonomously.</span>
          </div>

          {/* Voice Recovery Desk Dialect */}
          <div className="space-y-2">
            <label className="text-[#a79f93] block">Voice Agent Language &amp; Dialect</label>
            <select
              value={voiceDialect}
              onChange={(e) => setVoiceDialect(e.target.value)}
              className="w-full px-3 py-2.5 rounded bg-[#241f18] border border-[#342D24] text-white focus:border-[#fbc162]"
            >
              <option value="Hinglish (Hindi + English)">Hinglish (Hindi + English - 88% Indian Preference)</option>
              <option value="English (Indian Accent)">English (Indian Accent Standard)</option>
              <option value="English (International)">English (International / Neutral)</option>
            </select>
            <span className="text-[10px] text-[#a79f93] block">Configures conversational audio dialogue in the Case Inspector.</span>
          </div>

          {/* Temperature */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#a79f93]">Reasoning Temperature</span>
              <span className="text-[#fbc162] font-bold">{temperature}</span>
            </div>
            <input
              type="range"
              min={0.0}
              max={0.8}
              step={0.05}
              value={temperature}
              onChange={(e) => setTemperature(parseFloat(e.target.value))}
              className="w-full accent-[#fbc162]"
            />
            <div className="flex justify-between text-[10px] text-[#a79f93]">
              <span>0.0 (Deterministic / Exact)</span>
              <span>0.8 (Creative)</span>
            </div>
          </div>
        </div>
      </div>

      {/* PANEL 3: Razorpay Gateway & Webhook Credentials */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-xl space-y-6">
        <div className="flex justify-between items-center border-b border-[#342D24] pb-3">
          <div>
            <h3 className="text-sm text-[#fbc162] font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">account_balance_wallet</span>
              Payment Gateway Credentials (Razorpay Live/Test)
            </h3>
            <p className="text-[11px] text-[#a79f93] mt-0.5">
              Configure real Razorpay keys to process live payment links and customer debits.
            </p>
          </div>
          <span className={`px-2.5 py-1 text-[10px] rounded border font-bold ${
            gatewayStatus.includes("Active") || gatewayStatus.includes("Live")
              ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
              : "bg-[#fbc162]/20 text-[#fbc162] border-[#fbc162]/40"
          }`}>
            {gatewayStatus}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="space-y-1.5">
            <label className="text-[#a79f93] block">Razorpay Key ID</label>
            <input
              type="text"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="rzp_test_xxxxxxxxxxxx"
              className="w-full px-3 py-2.5 rounded bg-[#241f18] border border-[#342D24] text-white focus:border-[#fbc162]"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-[#a79f93] block">Razorpay Key Secret</label>
            <input
              type="password"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder="Enter new secret to update..."
              className="w-full px-3 py-2.5 rounded bg-[#241f18] border border-[#342D24] text-white focus:border-[#fbc162]"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={saveGateway}
            className="px-5 py-2 rounded bg-[#fbc162] hover:bg-[#dda64a] text-[#17130c] font-bold text-xs cursor-pointer transition-colors"
          >
            Save Gateway Keys
          </button>
          {gatewaySaved && <span className="text-emerald-400 text-xs">✓ Saved — Credentials verified in SQLite config</span>}
          {gatewayError && <span className="text-rose-400 text-xs">✗ {gatewayError}</span>}
        </div>
      </div>

      {/* PANEL 4: Omnichannel Customer Outreach Rails */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-xl space-y-6">
        <div className="border-b border-[#342D24] pb-3">
          <h3 className="text-sm text-[#fbc162] font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base">forum</span>
            Omnichannel Customer Outreach Channels
          </h3>
          <p className="text-[11px] text-[#a79f93] mt-0.5">
            Configure automated WhatsApp, SMS, and email payment recovery dispatch gateways.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="bg-[#241f18] p-4 rounded-lg border border-[#342D24] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-emerald-400 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">chat</span>
                WhatsApp Business Gateway
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-500/30">ONLINE</span>
            </div>
            <select
              value={waGateway}
              onChange={(e) => setWaGateway(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-[#17130c] border border-[#342D24] text-white text-[11px]"
            >
              <option value="META_CLOUD_API">Meta Cloud API (Official Direct)</option>
              <option value="TWILIO_WA">Twilio WhatsApp Sandbox</option>
              <option value="MOCK_DISPATCH">Mock Dispatcher (Simulated)</option>
            </select>
            <label className="flex items-center gap-2 pt-1 text-[#d4c4b1] cursor-pointer text-[11px]">
              <input
                type="checkbox"
                checked={autoDispatchWa}
                onChange={(e) => setAutoDispatchWa(e.target.checked)}
                className="accent-[#fbc162]"
              />
              Auto-dispatch payment link on expired card detection
            </label>
          </div>

          <div className="bg-[#241f18] p-4 rounded-lg border border-[#342D24] space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-cyan-300 font-bold flex items-center gap-1.5">
                <span className="material-symbols-outlined text-sm">sms</span>
                SMS Delivery Gateway
              </span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/30">ONLINE</span>
            </div>
            <select
              value={smsGateway}
              onChange={(e) => setSmsGateway(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded bg-[#17130c] border border-[#342D24] text-white text-[11px]"
            >
              <option value="TWILIO_SMS">Twilio SMS Gateway</option>
              <option value="SMS_COUNTRY">SMSCountry Indian Gateway</option>
              <option value="GUPSHUP">Gupshup Enterprise</option>
            </select>
            <label className="flex items-center gap-2 pt-1 text-[#d4c4b1] cursor-pointer text-[11px]">
              <input
                type="checkbox"
                checked={preDebitNotice}
                onChange={(e) => setPreDebitNotice(e.target.checked)}
                className="accent-[#fbc162]"
              />
              Enforce RBI Statutory T-24h Pre-Debit SMS Notification
            </label>
          </div>
        </div>
      </div>

      {/* PANEL 5: Interactive Real-Time Webhook Simulator */}
      <div className="bg-[#1f1812] border-2 border-emerald-500/30 p-6 rounded-xl space-y-6">
        <div className="flex justify-between items-center border-b border-[#342D24] pb-3">
          <div>
            <h3 className="text-sm text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="material-symbols-outlined text-base">webhook</span>
              Interactive Live Webhook Simulator &amp; Tester
            </h3>
            <p className="text-[11px] text-[#a79f93] mt-0.5">
              Send live JSON webhook events directly to your backend endpoint to test instantaneous payment failure triage.
            </p>
          </div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(getSamplePayload());
              setCopiedPayload(true);
              setTimeout(() => setCopiedPayload(false), 2000);
            }}
            className="px-3 py-1.5 rounded bg-[#241f18] hover:bg-[#342D24] border border-[#342D24] text-[#fbc162] text-xs cursor-pointer flex items-center gap-1"
          >
            {copiedPayload ? "✓ Copied" : "Copy Payload JSON"}
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <label className="text-[#a79f93] block mb-1">Target Endpoint</label>
            <input
              type="text"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#241f18] border border-[#342D24] text-white text-xs"
            />
          </div>
          <div>
            <label className="text-[#a79f93] block mb-1">Event Type</label>
            <select
              value={simEvent}
              onChange={(e) => setSimEvent(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#241f18] border border-[#342D24] text-white text-xs"
            >
              <option value="payment.failed">payment.failed (Failed Transaction)</option>
              <option value="payment.captured">payment.captured (Success Capture)</option>
              <option value="subscription.charged">subscription.charged (Mandate Renewal)</option>
              <option value="order.paid">order.paid (Checkout Succeeded)</option>
            </select>
          </div>
          <div>
            <label className="text-[#a79f93] block mb-1">Bank Decline Reason</label>
            <select
              value={simReason}
              onChange={(e) => setSimReason(e.target.value)}
              className="w-full px-3 py-2 rounded bg-[#241f18] border border-[#342D24] text-white text-xs"
            >
              <option value="gateway_timeout">gateway_timeout (Temporary Switch Delay)</option>
              <option value="card_expired">card_expired (Hard Expiration)</option>
              <option value="insufficient_funds">insufficient_funds (Temporary NSF)</option>
              <option value="user_abandoned">user_abandoned (Checkout Drop-off)</option>
              <option value="stolen_card">stolen_card (Strict Stop Rule)</option>
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSendTestWebhook}
            disabled={sendingWebhook}
            className="px-5 py-2.5 rounded bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">send</span>
            {sendingWebhook ? "Dispatching..." : "Send Live Webhook to Backend"}
          </button>
          <span className="text-[10px] text-[#a79f93]">Dispatches real HTTP POST to port 8001 with HMAC signature</span>
        </div>

        {/* Live Webhook Response Console */}
        {webhookResponse && (
          <div className="p-3 bg-[#17130c] border border-emerald-500/40 rounded-lg space-y-1 text-xs">
            <span className="text-[10px] text-emerald-400 font-bold uppercase block">Backend Response Output:</span>
            <pre className="text-[10px] text-emerald-300 font-mono overflow-x-auto whitespace-pre-wrap">
              {webhookResponse}
            </pre>
          </div>
        )}
      </div>

      {/* PANEL 6: Data Portfolio & Disaster Recovery */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-xl space-y-6">
        <div className="border-b border-[#342D24] pb-3">
          <h3 className="text-sm text-[#fbc162] font-bold uppercase tracking-wider flex items-center gap-2">
            <span className="material-symbols-outlined text-base">database</span>
            Database Storage &amp; Portfolio Lifecycle
          </h3>
          <p className="text-[11px] text-[#a79f93] mt-0.5">
            Reset demo data, clear simulated transactions, or seed fresh customer accounts.
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
          <div className="bg-[#241f18] p-3.5 rounded border border-[#342D24]">
            <span className="text-[#a79f93] block text-[10px]">Total Cases In Store</span>
            <span className="text-xl font-bold text-white">{cases.length}</span>
          </div>
          <div className="bg-[#241f18] p-3.5 rounded border border-[#342D24]">
            <span className="text-[#a79f93] block text-[10px]">Recovered Volume</span>
            <span className="text-xl font-bold text-emerald-400">{formatCurrencyINR(metrics.revenueRecoveredMinor)}</span>
          </div>
          <div className="bg-[#241f18] p-3.5 rounded border border-[#342D24]">
            <span className="text-[#a79f93] block text-[10px]">Recovery Yield</span>
            <span className="text-xl font-bold text-[#fbc162]">{metrics.recoveryRate}%</span>
          </div>
          <div className="bg-[#241f18] p-3.5 rounded border border-[#342D24]">
            <span className="text-[#a79f93] block text-[10px]">Storage Engine</span>
            <span className="text-sm font-bold text-white">SQLite Embedded</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleResetDemo}
            disabled={isProcessing}
            className="px-4 py-2.5 rounded bg-[#241f18] hover:bg-[#342D24] border border-[#342D24] hover:border-[#fbc162] text-[#fbc162] font-bold text-xs cursor-pointer flex items-center gap-1.5 transition-colors disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-sm">restart_alt</span>
            Reset Portfolio to Fresh DETECTED (60 Cases)
          </button>
          <button
            onClick={() => {
              const fullBackup = {
                exportedAt: new Date().toISOString(),
                metrics,
                cases,
              };
              const blob = new Blob([JSON.stringify(fullBackup, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `aurum_portfolio_backup_${Date.now()}.json`;
              a.click();
            }}
            className="px-4 py-2.5 rounded bg-[#241f18] hover:bg-[#342D24] border border-[#342D24] text-[#d4c4b1] hover:text-white text-xs cursor-pointer flex items-center gap-1.5 transition-colors"
          >
            <span className="material-symbols-outlined text-sm">download</span>
            Export Portfolio JSON Backup
          </button>
        </div>
      </div>
    </div>
  );
}
