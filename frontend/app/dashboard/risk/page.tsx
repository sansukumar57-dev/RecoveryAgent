"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useDashboard, apiFetch, API_BASE_URL } from "../DashboardContext";
import {
  ConcentrationGauge,
  DeclineReasonDonut,
  GraphCard,
  GraphStats,
  RiskNetworkGraph,
  RiskTrendChart,
  TopRiskCustomersChart,
  type RiskGraphSummary,
} from "./RiskGraphs";

export default function RiskPage() {
  const { metrics, formatCurrencyINR } = useDashboard();

  const [graph, setGraph] = useState<RiskGraphSummary | null>(null);
  const [graphState, setGraphState] = useState<"loading" | "ready" | "offline">("loading");
  const [trendBuckets, setTrendBuckets] = useState(12);

  const loadGraph = useCallback(async () => {
    try {
      const res = await apiFetch(`${API_BASE_URL}/risk/graph`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: RiskGraphSummary = await res.json();
      setGraph(data);
      setGraphState(data.nodeCount > 0 ? "ready" : "offline");
    } catch {
      setGraphState("offline");
    }
  }, []);

  useEffect(() => {
    // Initial load + 15s refresh. This project has no data-fetching library, so the
    // mount fetch happens here (same pattern as DashboardContext.fetchData).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadGraph();
    const t = setInterval(loadGraph, 15000);
    return () => clearInterval(t);
  }, [loadGraph]);

  // Re-fetch just the trend when the bucket count changes.
  useEffect(() => {
    if (graphState !== "ready") return;
    let cancelled = false;
    apiFetch(`${API_BASE_URL}/risk/graph/trend?buckets=${trendBuckets}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error("trend failed"))))
      .then((riskTrend) => {
        if (!cancelled) setGraph((g) => (g ? { ...g, riskTrend } : g));
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [trendBuckets, graphState]);

  const riskCategories = [
    {
      label: "Payment Failures",
      amount: "₹4.8L",
      amountMinor: 48000000,
      count: 84,
      descriptor: "affected customers",
      icon: "credit_card_off",
      color: "text-rose-400",
      borderColor: "border-rose-500/30",
      bgColor: "bg-rose-950/30",
      barColor: "bg-rose-400",
      pct: 37.5,
    },
    {
      label: "Checkout Abandonment",
      amount: "₹2.7L",
      amountMinor: 27000000,
      count: 132,
      descriptor: "sessions",
      icon: "shopping_cart",
      color: "text-amber-400",
      borderColor: "border-amber-500/30",
      bgColor: "bg-amber-950/30",
      barColor: "bg-amber-400",
      pct: 21.1,
    },
    {
      label: "Failed Subscriptions",
      amount: "₹1.9L",
      amountMinor: 19000000,
      count: 37,
      descriptor: "accounts",
      icon: "autorenew",
      color: "text-orange-400",
      borderColor: "border-orange-500/30",
      bgColor: "bg-orange-950/30",
      barColor: "bg-orange-400",
      pct: 14.8,
    },
    {
      label: "Overdue Receivables",
      amount: "₹3.4L",
      amountMinor: 34000000,
      count: 29,
      descriptor: "invoices",
      icon: "receipt_long",
      color: "text-purple-400",
      borderColor: "border-purple-500/30",
      bgColor: "bg-purple-950/30",
      barColor: "bg-purple-400",
      pct: 26.6,
    },
  ];

  const totalAtRisk = riskCategories.reduce((a, c) => a + c.amountMinor, 0);

  const FALLBACK_FAILURE_REASONS = [
    { reason: "insufficient_funds", pct: 42, color: "bg-rose-400" },
    { reason: "card_expired", pct: 24, color: "bg-[#fbc162]" },
    { reason: "gateway_timeout", pct: 18, color: "bg-orange-400" },
    { reason: "do_not_honour", pct: 11, color: "bg-purple-400" },
    { reason: "user_abandoned", pct: 5, color: "bg-[#d4c4b1]" },
  ];

  // Prefer the real graph distribution; fall back to the demo numbers offline.
  const BAR_COLORS = ["bg-rose-400", "bg-[#fbc162]", "bg-orange-400", "bg-purple-400", "bg-[#d4c4b1]"];
  const failureReasons =
    graph && graph.declineReasonDistribution.length > 0
      ? graph.declineReasonDistribution.slice(0, 5).map((r, i) => ({
          reason: r.reason,
          pct: r.sharePct,
          color: BAR_COLORS[i % BAR_COLORS.length],
        }))
      : FALLBACK_FAILURE_REASONS;

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex justify-between items-end pb-4 border-b border-[#342D24]">
        <div>
          <h2 className="text-2xl font-extrabold font-mono text-white">Where Revenue is Slipping</h2>
          <p className="text-xs font-mono text-[#a79f93] mt-1">
            Total at-risk: {formatCurrencyINR(metrics.revenueAtRiskMinor)} across {metrics.activeCases} active cases
          </p>
        </div>
        <div className="font-mono text-xs text-right">
          <span className="text-[#a79f93] block">AI Expected Recovery</span>
          <span className="text-emerald-400 font-bold text-lg">{formatCurrencyINR(metrics.expectedRecoveryMinor)}</span>
          <span className="text-[10px] text-[#a79f93] block mt-0.5">in next 24–48h</span>
        </div>
      </div>

      {/* Risk Summary Bar */}
      <div className="bg-[#1f1812] border border-[#342D24] p-4 rounded-lg">
        <div className="flex justify-between items-center mb-3 font-mono text-[10px] text-[#a79f93] uppercase">
          <span>Revenue Risk Distribution</span>
          <span>Total: {formatCurrencyINR(totalAtRisk)}</span>
        </div>
        <div className="h-4 rounded-full overflow-hidden flex gap-0.5">
          {riskCategories.map((cat) => (
            <div
              key={cat.label}
              className={`h-full ${cat.barColor} transition-all duration-700`}
              style={{ width: `${cat.pct}%` }}
              title={`${cat.label}: ${cat.amount} (${cat.pct}%)`}
            />
          ))}
        </div>
        <div className="flex gap-4 mt-2 font-mono text-[9px]">
          {riskCategories.map((cat) => (
            <span key={cat.label} className={`flex items-center gap-1 ${cat.color}`}>
              <span className={`w-2 h-2 rounded-full inline-block ${cat.barColor}`} />
              {cat.pct}%
            </span>
          ))}
        </div>
      </div>

      {/* Risk Category Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {riskCategories.map((cat) => (
          <div
            key={cat.label}
            className={`${cat.bgColor} border ${cat.borderColor} p-5 rounded-lg group hover:brightness-110 transition-all`}
          >
            <div className="flex justify-between items-start mb-4">
              <span className={`material-symbols-outlined text-3xl ${cat.color}`}>{cat.icon}</span>
              <span className="font-mono text-[10px] text-[#a79f93] bg-[#17130c] px-2 py-0.5 rounded">{cat.pct}% of total</span>
            </div>
            <div className="text-xs font-mono text-[#a79f93] mb-1">{cat.label}</div>
            <div className={`text-3xl font-extrabold font-mono ${cat.color}`}>{cat.amount}</div>
            <div className="text-[11px] text-[#d4c4b1] mt-2 font-mono">
              <span className="font-bold text-white">{cat.count}</span> {cat.descriptor}
            </div>
            {/* Mini progress bar */}
            <div className="mt-4 h-1.5 bg-[#17130c] rounded-full overflow-hidden">
              <div className={`h-full ${cat.barColor} rounded-full transition-all duration-700`} style={{ width: `${cat.pct}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* ───────── Graph Intelligence (live from /api/risk/graph) ───────── */}
      <div className="space-y-6">
        <div className="flex justify-between items-end pb-2 border-b border-[#342D24]">
          <div>
            <h3 className="text-lg font-extrabold font-mono text-white flex items-center gap-2">
              <span className="material-symbols-outlined text-[#fbc162]">hub</span>
              Risk Graph Tools
            </h3>
            <p className="text-[10px] font-mono text-[#a79f93] mt-0.5">
              Failed payments modelled as a graph — customers are nodes, shared failure causes are edges.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`font-mono text-[10px] px-2 py-1 rounded border flex items-center gap-1.5 ${
                graphState === "ready"
                  ? "bg-emerald-950 text-emerald-400 border-emerald-500/30"
                  : graphState === "loading"
                  ? "bg-[#fbc162]/10 text-[#fbc162] border-[#fbc162]/30"
                  : "bg-[#241f18] text-[#a79f93] border-[#342D24]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  graphState === "ready" ? "bg-emerald-400" : graphState === "loading" ? "bg-[#fbc162] animate-pulse" : "bg-[#a79f93]"
                }`}
              />
              {graphState === "ready" ? "live graph" : graphState === "loading" ? "loading…" : "no graph data"}
            </span>
            <button
              onClick={loadGraph}
              className="font-mono text-[10px] px-2 py-1 rounded border border-[#342D24] text-[#d4c4b1] hover:border-[#fbc162] cursor-pointer flex items-center gap-1"
            >
              <span className="material-symbols-outlined text-[13px]">refresh</span>
              refresh
            </button>
          </div>
        </div>

        {graphState === "ready" && graph ? (
          <>
            <GraphStats summary={graph} format={formatCurrencyINR} />

            <GraphCard
              title="At-Risk Revenue Trend"
              subtitle="Rupees at risk per time bucket, derived from case creation timestamps"
              right={
                <div className="flex gap-1">
                  {[6, 12, 24].map((b) => (
                    <button
                      key={b}
                      onClick={() => setTrendBuckets(b)}
                      className={`font-mono text-[10px] px-2 py-1 rounded border cursor-pointer ${
                        trendBuckets === b
                          ? "bg-[#fbc162] text-[#17130c] border-[#fbc162] font-bold"
                          : "bg-[#241f18] text-[#a79f93] border-[#342D24] hover:border-[#fbc162]"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              }
            >
              <RiskTrendChart points={graph.riskTrend} format={formatCurrencyINR} />
            </GraphCard>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <GraphCard title="Decline Reason Distribution" subtitle="Share of at-risk revenue by failure cause">
                <DeclineReasonDonut
                  rows={graph.declineReasonDistribution}
                  total={graph.totalAtRiskMinor}
                  format={formatCurrencyINR}
                />
              </GraphCard>

              <GraphCard title="Risk Concentration" subtitle="Gini coefficient across at-risk customers">
                <ConcentrationGauge concentration={graph.concentration} />
              </GraphCard>
            </div>

            <GraphCard
              title="Correlated Failure Network"
              subtitle={`${graph.clusterCount} cohorts · ${graph.edgeCount} correlation edges`}
            >
              <RiskNetworkGraph clusters={graph.clusters} format={formatCurrencyINR} />
            </GraphCard>

            <GraphCard title="Top Risk Nodes" subtitle="Highest at-risk customers ranked by exposure">
              <TopRiskCustomersChart customers={graph.topRiskCustomers} format={formatCurrencyINR} />
            </GraphCard>
          </>
        ) : (
          <div className="bg-[#1f1812] border border-[#342D24] rounded-lg p-10 text-center space-y-3 font-mono">
            <span className="material-symbols-outlined text-4xl text-[#a79f93] block">
              {graphState === "loading" ? "hourglass_top" : "hub"}
            </span>
            <h4 className="text-sm font-bold text-white">
              {graphState === "loading" ? "Building the risk graph…" : "No graph data yet"}
            </h4>
            <p className="text-[11px] text-[#a79f93] max-w-lg mx-auto leading-relaxed">
              {graphState === "loading" ? (
                <>Querying <code className="text-[#fbc162]">GET /api/risk/graph</code>.</>
              ) : (
                <>
                  The graph is built from failed payments in the database. Start the backend on port 8001, then generate data
                  from <span className="text-[#fbc162]">Settings → Simulate Failed Payments</span>. Endpoints:{" "}
                  <code className="text-[#fbc162]">/api/risk/graph</code>,{" "}
                  <code className="text-[#fbc162]">/clusters</code>, <code className="text-[#fbc162]">/concentration</code>,{" "}
                  <code className="text-[#fbc162]">/distribution</code>, <code className="text-[#fbc162]">/trend</code>,{" "}
                  <code className="text-[#fbc162]">/top</code>.
                </>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Risk Severity Distribution */}
      <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
        <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">RISK SEVERITY DISTRIBUTION</h3>
        <div className="grid grid-cols-3 gap-4 font-mono text-xs">
          <div className="bg-[#241f18] p-5 rounded-lg border border-rose-500/20 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-rose-400 font-bold text-[10px] uppercase">Critical (&gt;₹50K)</span>
              <span className="material-symbols-outlined text-rose-400 text-lg">crisis_alert</span>
            </div>
            <span className="text-3xl font-extrabold text-white block">18</span>
            <span className="text-[#a79f93] block">cases · ₹4.2L at risk</span>
            <div className="h-1 bg-[#17130c] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-rose-400 rounded-full" style={{ width: "55%" }} />
            </div>
          </div>
          <div className="bg-[#241f18] p-5 rounded-lg border border-[#fbc162]/20 space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[#fbc162] font-bold text-[10px] uppercase">High (₹10K–₹50K)</span>
              <span className="material-symbols-outlined text-[#fbc162] text-lg">warning</span>
            </div>
            <span className="text-3xl font-extrabold text-white block">47</span>
            <span className="text-[#a79f93] block">cases · ₹5.8L at risk</span>
            <div className="h-1 bg-[#17130c] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-[#fbc162] rounded-full" style={{ width: "37%" }} />
            </div>
          </div>
          <div className="bg-[#241f18] p-5 rounded-lg border border-[#342D24] space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-[#d4c4b1] font-bold text-[10px] uppercase">Medium (&lt;₹10K)</span>
              <span className="material-symbols-outlined text-[#a79f93] text-lg">info</span>
            </div>
            <span className="text-3xl font-extrabold text-white block">61</span>
            <span className="text-[#a79f93] block">cases · ₹2.8L at risk</span>
            <div className="h-1 bg-[#17130c] rounded-full overflow-hidden mt-1">
              <div className="h-full bg-[#d4c4b1] rounded-full" style={{ width: "22%" }} />
            </div>
          </div>
        </div>
      </div>

      {/* Failure Reasons + AI Recovery Forecast */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">TOP FAILURE REASONS</h3>
          <div className="space-y-4 font-mono text-xs">
            {failureReasons.map((r) => (
              <div key={r.reason} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[#d4c4b1]">{r.reason}</span>
                  <span className="text-white font-bold">{r.pct}%</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-grow h-2 bg-[#17130c] rounded-full overflow-hidden">
                    <div className={`h-full ${r.color} rounded-full transition-all duration-700`} style={{ width: `${r.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">AI RECOVERY FORECAST</h3>
          <div className="space-y-3 font-mono text-xs">
            {[
              { label: "High recovery probability (>80%)", count: 42, pct: 78, color: "text-emerald-400", bar: "bg-emerald-400" },
              { label: "Medium recovery (50–80%)", count: 29, pct: 54, color: "text-[#fbc162]", bar: "bg-[#fbc162]" },
              { label: "Low recovery (<50%)", count: 15, pct: 28, color: "text-rose-400", bar: "bg-rose-400" },
              { label: "Requires escalation", count: 18, pct: 33, color: "text-purple-300", bar: "bg-purple-400" },
            ].map((item) => (
              <div key={item.label} className="space-y-1">
                <div className="flex justify-between">
                  <span className={item.color}>{item.label}</span>
                  <span className="text-white font-bold">{item.count} cases</span>
                </div>
                <div className="h-2 bg-[#17130c] rounded-full overflow-hidden">
                  <div className={`h-full ${item.bar} rounded-full transition-all duration-700`} style={{ width: `${item.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="pt-2 border-t border-[#342D24]">
            <div className="flex justify-between font-mono text-xs">
              <span className="text-[#a79f93]">Expected recovery this cycle</span>
              <span className="text-emerald-400 font-bold">{formatCurrencyINR(metrics.expectedRecoveryMinor)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
