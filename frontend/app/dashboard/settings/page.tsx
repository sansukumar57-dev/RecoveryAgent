"use client";

import React, { useState, useEffect } from "react";
import { useDashboard, apiFetch, API_BASE_URL } from "../DashboardContext";

export default function SettingsPage() {
  const { handleRunBatch, handleResetDemo, isProcessing, metrics, formatCurrencyINR } = useDashboard();
  const [simulationCount, setSimulationCount] = useState(10);
  const [webhookUrl, setWebhookUrl] = useState("https://your-app.com/webhooks/razorpay");
  const [copied, setCopied] = useState(false);

  const [keyId, setKeyId] = useState("");
  const [keySecret, setKeySecret] = useState("");
  const [gatewayStatus, setGatewayStatus] = useState<string>("Checking…");
  const [gatewaySaved, setGatewaySaved] = useState(false);
  const [gatewayError, setGatewayError] = useState<string | null>(null);

  useEffect(() => {
    apiFetch(`${API_BASE_URL}/config/gateway`)
      .then((r) => r.json())
      .then((d) => {
        setKeyId(d.keyIdMasked && !String(d.keyIdMasked).includes("demo") ? "" : "");
        setGatewayStatus(d.configured ? `Live — ${d.keyIdMasked}` : "Demo mode (no key set)");
      })
      .catch(() => setGatewayStatus("Unable to reach backend"));
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
      setGatewayStatus(`Live — ${d.keyIdMasked}`);
      setGatewaySaved(true);
      setKeySecret("");
    } catch (e) {
      setGatewayError((e as Error).message);
    }
  };

  const sampleWebhookPayload = JSON.stringify({
    event: "payment.failed",
    account_id: "acc_razorpay_demo",
    payload: {
      payment: {
        entity: {
          id: "pay_DEMO123",
          amount: 2500000,
          currency: "INR",
          status: "failed",
          error_code: "BAD_REQUEST_ERROR",
          error_description: "Your payment didn't go through as it was declined by the bank. Try another payment method or contact your bank."
        }
      }
    }
  }, null, 2);

  const copyPayload = () => {
    navigator.clipboard.writeText(sampleWebhookPayload);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="pb-4 border-b border-[#342D24]">
        <h2 className="text-2xl font-extrabold font-mono text-white">Razorpay Gateway & Simulator</h2>
        <p className="text-xs font-mono text-[#a79f93] mt-1">Configure your Razorpay webhook, simulate test payments, and manage recovery policies.</p>
      </div>

      {/* Live Simulator Controls */}
      <div className="bg-[#241f18] border border-[#fbc162]/30 p-6 rounded-lg space-y-6">
        <div className="flex justify-between items-center">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">PAYMENT SIMULATOR</h3>
          <span className="px-2 py-1 bg-[#fbc162]/20 text-[#fbc162] font-mono text-[10px] rounded border border-[#fbc162]/40 font-bold">DEMO MODE</span>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="font-mono text-[11px] text-[#a79f93] block">Cases to Simulate</label>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={simulationCount}
              onChange={(e) => setSimulationCount(Number(e.target.value))}
              className="w-full accent-[#fbc162]"
            />
            <div className="flex justify-between font-mono text-[10px] text-[#a79f93]">
              <span>5</span>
              <span className="text-[#fbc162] font-bold">{simulationCount} cases</span>
              <span>50</span>
            </div>
          </div>
          <div className="space-y-3">
            <button
              onClick={handleRunBatch}
              disabled={isProcessing}
              className="w-full py-3 rounded bg-[#fbc162] text-[#17130c] font-mono text-xs font-bold uppercase cursor-pointer hover:bg-[#dda64a] disabled:opacity-50"
            >
              {isProcessing ? "Simulating..." : "Simulate Failed Payments"}
            </button>
            <button
              onClick={handleResetDemo}
              disabled={isProcessing}
              className="w-full py-3 rounded border border-[#342D24] text-[#d4c4b1] font-mono text-xs cursor-pointer hover:border-[#fbc162]"
            >
              Reset & Generate Fresh Data
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4 font-mono text-xs border-t border-[#342D24] pt-4">
          <div>
            <span className="text-[#a79f93] block mb-1">Cases Generated</span>
            <span className="text-xl font-bold text-white">{metrics.totalCasesCount}</span>
          </div>
          <div>
            <span className="text-[#a79f93] block mb-1">Revenue Recovered</span>
            <span className="text-xl font-bold text-emerald-400">{formatCurrencyINR(metrics.revenueRecoveredMinor)}</span>
          </div>
          <div>
            <span className="text-[#a79f93] block mb-1">Success Rate</span>
            <span className="text-xl font-bold text-[#fbc162]">{metrics.recoveryRate}%</span>
          </div>
        </div>
      </div>

      {/* Webhook Config */}
      <div className="bg-[#241f18] border border-[#342D24] p-6 rounded-lg space-y-4">
        <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">RAZORPAY WEBHOOK CONFIGURATION</h3>
        <div className="space-y-2">
          <label className="font-mono text-[11px] text-[#a79f93] block">Webhook URL</label>
          <input
            type="text"
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            className="w-full px-4 py-3 bg-[#1f1812] border border-[#342D24] rounded text-white font-mono text-xs focus:outline-none focus:border-[#fbc162]"
          />
        </div>
        <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
          <div className="bg-[#1f1812] p-3 rounded border border-[#342D24] space-y-2">
            <span className="text-[#a79f93] block uppercase text-[10px]">Events to Subscribe</span>
            {["payment.failed", "payment.captured", "subscription.charged", "order.paid", "refund.created"].map((e) => (
              <label key={e} className="flex items-center gap-2 text-[#d4c4b1] cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-[#fbc162]" />
                {e}
              </label>
            ))}
          </div>
          <div className="bg-[#1f1812] p-3 rounded border border-[#342D24] space-y-2">
            <span className="text-[#a79f93] block uppercase text-[10px]">Connection Status</span>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-emerald-400">Backend: Port 8001 Active</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" /><span className="text-emerald-400">Frontend: Port 3000 Active</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#fbc162] animate-pulse" /><span className="text-[#fbc162]">AI Agent: Polling Active</span></div>
            <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-[#a79f93]" /><span className="text-[#a79f93]">Razorpay API: Demo Mode</span></div>
          </div>
        </div>
      </div>

      {/* Razorpay Gateway Credentials */}
      <div className="bg-[#241f18] border border-[#fbc162]/30 p-6 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">RAZORPAY GATEWAY CREDENTIALS</h3>
          <span className={`px-2 py-1 font-mono text-[10px] rounded border ${gatewayStatus.includes("Live") ? "bg-emerald-950 text-emerald-400 border-emerald-500/30" : "bg-[#fbc162]/20 text-[#fbc162] border-[#fbc162]/40"} font-bold`}>
            {gatewayStatus}
          </span>
        </div>
        <p className="text-[10px] font-mono text-[#a79f93]">
          Keys are stored in the backend config store and written to a <code className="text-[#fbc162]">.env</code> file. Demo mode is used until a real key is supplied.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="font-mono text-[11px] text-[#a79f93] block">Key ID</label>
            <input
              type="text"
              value={keyId}
              onChange={(e) => setKeyId(e.target.value)}
              placeholder="rzp_test_xxxxxxxxxxxx"
              className="w-full px-4 py-3 bg-[#1f1812] border border-[#342D24] rounded text-white font-mono text-xs focus:outline-none focus:border-[#fbc162]"
            />
          </div>
          <div className="space-y-2">
            <label className="font-mono text-[11px] text-[#a79f93] block">Key Secret</label>
            <input
              type="password"
              value={keySecret}
              onChange={(e) => setKeySecret(e.target.value)}
              placeholder="••••••••••••••••"
              className="w-full px-4 py-3 bg-[#1f1812] border border-[#342D24] rounded text-white font-mono text-xs focus:outline-none focus:border-[#fbc162]"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={saveGateway}
            className="px-5 py-2.5 rounded bg-[#fbc162] text-[#17130c] font-mono text-xs font-bold uppercase cursor-pointer hover:bg-[#dda64a]"
          >
            Save Gateway Key
          </button>
          {gatewaySaved && <span className="text-emerald-400 font-mono text-xs">✓ Saved — live mode active</span>}
          {gatewayError && <span className="text-rose-400 font-mono text-xs">✗ {gatewayError}</span>}
        </div>
      </div>

      {/* Sample Webhook Payload */}
      <div className="bg-[#241f18] border border-[#342D24] p-6 rounded-lg space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">SAMPLE WEBHOOK PAYLOAD</h3>
          <button onClick={copyPayload} className="px-3 py-1.5 rounded border border-[#342D24] text-[#d4c4b1] font-mono text-[11px] hover:border-[#fbc162] cursor-pointer">
            {copied ? "✓ Copied!" : "Copy JSON"}
          </button>
        </div>
        <pre className="bg-[#1f1812] p-4 rounded border border-[#342D24] text-[11px] font-mono text-[#d4c4b1] overflow-x-auto whitespace-pre-wrap">
          {sampleWebhookPayload}
        </pre>
      </div>

      {/* Recovery Policy Config */}
      <div className="bg-[#241f18] border border-[#342D24] p-6 rounded-lg space-y-4">
        <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">SAFETY GUARDRAIL POLICIES</h3>
        <div className="grid grid-cols-2 gap-4 font-mono text-[11px]">
          {[
            { label: "Max Retry Attempts", value: "3", unit: "retries" },
            { label: "Auto-Execution Limit", value: "₹25,000", unit: "per case" },
            { label: "Quiet Hours", value: "10pm – 8am", unit: "IST" },
            { label: "Max Incentive Per Case", value: "₹500", unit: "discount" },
          ].map((p) => (
            <div key={p.label} className="bg-[#1f1812] p-4 rounded border border-[#342D24] flex justify-between items-center">
              <div>
                <span className="text-[#a79f93] block text-[10px]">{p.label}</span>
                <span className="text-white font-bold">{p.value}</span>
              </div>
              <span className="text-[#a79f93] text-[10px]">{p.unit}</span>
            </div>
          ))}
        </div>
        <p className="text-[10px] font-mono text-[#a79f93]">These guardrails are enforced by the Safety Engine at every step. No action is taken unless all policy gates pass.</p>
      </div>
    </div>
  );
}
