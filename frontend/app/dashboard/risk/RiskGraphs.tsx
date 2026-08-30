"use client";

import React, { useState } from "react";

/* ────────────────────────────────────────────────────────────────
   Types — mirror the payload of GET /api/risk/graph
   (RevenueRiskGraphTools.graphSummary() on the backend)
   ──────────────────────────────────────────────────────────────── */

export interface RiskTrendPoint {
  bucketStart: number;
  atRiskMinor: number;
  caseCount: number;
}

export interface DeclineReasonRow {
  reason: string;
  atRiskMinor: number;
  sharePct: number;
}

export interface RiskCluster {
  cohort: string;
  customerCount: number;
  atRiskMinor: number;
  avgRiskScore: number;
  shareOfTotalRisk: number;
  customerIds: number[];
}

export interface TopRiskCustomer {
  customerId: number;
  name: string;
  atRiskMinor: number;
  riskScore: number;
  declineReason: string;
  method: string;
  centrality: number;
}

export interface RiskConcentration {
  gini: number;
  totalAtRiskMinor: number;
  customerCount: number;
  top5SharePct: number;
  top10SharePct: number;
}

export interface RiskGraphSummary {
  nodeCount: number;
  edgeCount: number;
  clusterCount: number;
  totalAtRiskMinor: number;
  concentration: RiskConcentration;
  declineReasonDistribution: DeclineReasonRow[];
  clusters: RiskCluster[];
  topRiskCustomers: TopRiskCustomer[];
  riskTrend: RiskTrendPoint[];
}

export const RISK_PALETTE = [
  "#fb7185", // rose
  "#fbc162", // amber (brand)
  "#fb923c", // orange
  "#c084fc", // purple
  "#34d399", // emerald
  "#60a5fa", // blue
  "#f472b6", // pink
  "#d4c4b1", // sand
];

/* ────────────────────────────────────────────────────────────────
   Shared shell
   ──────────────────────────────────────────────────────────────── */

export function GraphCard({
  title,
  subtitle,
  right,
  children,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-[#1f1812] border border-[#342D24] p-6 rounded-lg space-y-4">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h3 className="font-mono text-xs text-[#fbc162] font-bold uppercase tracking-widest">{title}</h3>
          {subtitle && <p className="font-mono text-[10px] text-[#a79f93] mt-1">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

function EmptyGraph({ label }: { label: string }) {
  return (
    <div className="h-40 flex flex-col items-center justify-center gap-2 font-mono text-[11px] text-[#a79f93]">
      <span className="material-symbols-outlined text-2xl">bar_chart_off</span>
      {label}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   1. Risk trend — area + line chart over time buckets
   ──────────────────────────────────────────────────────────────── */

export function RiskTrendChart({
  points,
  format,
}: {
  points: RiskTrendPoint[];
  format: (minor?: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (!points.length) return <EmptyGraph label="No case history yet — run a simulation batch." />;

  const W = 660;
  const H = 200;
  const PAD = { l: 44, r: 12, t: 14, b: 26 };
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const max = Math.max(...points.map((p) => p.atRiskMinor), 1);
  const x = (i: number) => PAD.l + (i * innerW) / Math.max(points.length - 1, 1);
  const y = (v: number) => PAD.t + (1 - v / max) * innerH;

  const line = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i)},${y(p.atRiskMinor)}`).join(" ");
  const area = `${line} L${x(points.length - 1)},${PAD.t + innerH} L${x(0)},${PAD.t + innerH} Z`;

  const gridLines = [0, 0.25, 0.5, 0.75, 1];
  const active = hover !== null ? points[hover] : null;

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto overflow-visible" role="img" aria-label="Revenue at risk over time">
        <defs>
          <linearGradient id="riskTrendFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fb7185" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#fb7185" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines.map((g) => (
          <g key={g}>
            <line
              x1={PAD.l}
              x2={W - PAD.r}
              y1={PAD.t + g * innerH}
              y2={PAD.t + g * innerH}
              stroke="#342D24"
              strokeWidth="1"
              strokeDasharray={g === 1 ? "0" : "3 4"}
            />
            <text x={PAD.l - 8} y={PAD.t + g * innerH + 3} textAnchor="end" className="fill-[#a79f93]" style={{ fontSize: 9, fontFamily: "monospace" }}>
              {format(Math.round(max * (1 - g)))}
            </text>
          </g>
        ))}

        <path d={area} fill="url(#riskTrendFill)" />
        <path d={line} fill="none" stroke="#fb7185" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />

        {points.map((p, i) => (
          <g key={p.bucketStart}>
            <circle
              cx={x(i)}
              cy={y(p.atRiskMinor)}
              r={hover === i ? 5 : 3}
              fill={hover === i ? "#fbc162" : "#17130c"}
              stroke={hover === i ? "#fbc162" : "#fb7185"}
              strokeWidth="2"
            />
            {/* generous hover target */}
            <rect
              x={x(i) - innerW / (points.length * 2)}
              y={PAD.t}
              width={innerW / points.length}
              height={innerH}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
            />
          </g>
        ))}

        <text x={PAD.l} y={H - 8} className="fill-[#a79f93]" style={{ fontSize: 9, fontFamily: "monospace" }}>
          {new Date(points[0].bucketStart).toLocaleDateString()}
        </text>
        <text x={W - PAD.r} y={H - 8} textAnchor="end" className="fill-[#a79f93]" style={{ fontSize: 9, fontFamily: "monospace" }}>
          {new Date(points[points.length - 1].bucketStart).toLocaleDateString()}
        </text>
      </svg>

      <div className="flex justify-between font-mono text-[10px] text-[#a79f93] min-h-[16px]">
        {active ? (
          <>
            <span className="text-[#fbc162]">{new Date(active.bucketStart).toLocaleString()}</span>
            <span>
              <span className="text-rose-400 font-bold">{format(active.atRiskMinor)}</span> at risk ·{" "}
              <span className="text-white font-bold">{active.caseCount}</span> cases
            </span>
          </>
        ) : (
          <span>Hover a point to inspect the bucket · peak {format(max)}</span>
        )}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   2. Decline reason distribution — donut chart
   ──────────────────────────────────────────────────────────────── */

export function DeclineReasonDonut({
  rows,
  total,
  format,
}: {
  rows: DeclineReasonRow[];
  total: number;
  format: (minor?: number) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);

  if (!rows.length) return <EmptyGraph label="No failed payments to break down." />;

  const R = 52;
  const C = 2 * Math.PI * R;
  const segments = rows.map((r, i) => ({
    ...r,
    color: RISK_PALETTE[i % RISK_PALETTE.length],
    dash: (r.sharePct / 100) * C,
    // cumulative share of everything before this slice
    offset: (rows.slice(0, i).reduce((sum, prev) => sum + prev.sharePct, 0) / 100) * C,
  }));

  const active = hover !== null ? segments[hover] : null;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 140 140" className="w-36 h-36 shrink-0" role="img" aria-label="Decline reason distribution">
        <g transform="translate(70,70) rotate(-90)">
          <circle r={R} fill="none" stroke="#17130c" strokeWidth="18" />
          {segments.map((s, i) => (
            <circle
              key={s.reason}
              r={R}
              fill="none"
              stroke={s.color}
              strokeWidth={hover === i ? 22 : 18}
              strokeDasharray={`${s.dash} ${C - s.dash}`}
              strokeDashoffset={-s.offset}
              strokeLinecap="butt"
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              style={{ transition: "stroke-width 120ms", cursor: "pointer" }}
            />
          ))}
        </g>
        <text x="70" y="66" textAnchor="middle" className="fill-white" style={{ fontSize: 13, fontFamily: "monospace", fontWeight: 800 }}>
          {active ? `${active.sharePct}%` : format(total)}
        </text>
        <text x="70" y="80" textAnchor="middle" className="fill-[#a79f93]" style={{ fontSize: 8, fontFamily: "monospace" }}>
          {active ? active.reason.slice(0, 16) : "total at risk"}
        </text>
      </svg>

      <div className="flex-1 w-full space-y-2 font-mono text-[11px]">
        {segments.map((s, i) => (
          <div
            key={s.reason}
            onMouseEnter={() => setHover(i)}
            onMouseLeave={() => setHover(null)}
            className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer ${hover === i ? "bg-[#241f18]" : ""}`}
          >
            <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: s.color }} />
            <span className="text-[#d4c4b1] truncate flex-1">{s.reason}</span>
            <span className="text-white font-bold">{format(s.atRiskMinor)}</span>
            <span className="text-[#a79f93] w-10 text-right">{s.sharePct}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   3. Concentration — Gini gauge + top-N share bars
   ──────────────────────────────────────────────────────────────── */

export function ConcentrationGauge({ concentration }: { concentration: RiskConcentration }) {
  const gini = Math.max(0, Math.min(1, concentration.gini || 0));
  const R = 54;
  const cx = 80;
  const cy = 70;
  const arc = Math.PI * R; // half circle length
  const verdict = gini >= 0.6 ? "Highly concentrated" : gini >= 0.35 ? "Moderately concentrated" : "Well spread";
  const verdictColor = gini >= 0.6 ? "text-rose-400" : gini >= 0.35 ? "text-[#fbc162]" : "text-emerald-400";

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6">
      <svg viewBox="0 0 160 92" className="w-40 shrink-0" role="img" aria-label="Risk concentration gauge">
        <path d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`} fill="none" stroke="#17130c" strokeWidth="14" strokeLinecap="round" />
        <path
          d={`M ${cx - R} ${cy} A ${R} ${R} 0 0 1 ${cx + R} ${cy}`}
          fill="none"
          stroke={gini >= 0.6 ? "#fb7185" : gini >= 0.35 ? "#fbc162" : "#34d399"}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={`${gini * arc} ${arc}`}
          style={{ transition: "stroke-dasharray 700ms" }}
        />
        <text x={cx} y={cy - 8} textAnchor="middle" className="fill-white" style={{ fontSize: 22, fontFamily: "monospace", fontWeight: 800 }}>
          {gini.toFixed(2)}
        </text>
        <text x={cx} y={cy + 6} textAnchor="middle" className="fill-[#a79f93]" style={{ fontSize: 8, fontFamily: "monospace" }}>
          GINI
        </text>
        <text x={cx - R} y={cy + 18} textAnchor="middle" className="fill-[#a79f93]" style={{ fontSize: 8, fontFamily: "monospace" }}>
          0.0
        </text>
        <text x={cx + R} y={cy + 18} textAnchor="middle" className="fill-[#a79f93]" style={{ fontSize: 8, fontFamily: "monospace" }}>
          1.0
        </text>
      </svg>

      <div className="flex-1 w-full space-y-3 font-mono text-[11px]">
        <div className={`font-bold ${verdictColor}`}>{verdict}</div>
        {[
          { label: "Top 5 customers", pct: concentration.top5SharePct || 0, color: "bg-rose-400" },
          { label: "Top 10 customers", pct: concentration.top10SharePct || 0, color: "bg-[#fbc162]" },
        ].map((b) => (
          <div key={b.label} className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[#d4c4b1]">{b.label}</span>
              <span className="text-white font-bold">{b.pct}% of risk</span>
            </div>
            <div className="h-2 bg-[#17130c] rounded-full overflow-hidden">
              <div className={`h-full ${b.color} rounded-full`} style={{ width: `${Math.min(b.pct, 100)}%`, transition: "width 700ms" }} />
            </div>
          </div>
        ))}
        <div className="text-[10px] text-[#a79f93] pt-1 border-t border-[#342D24]">
          {concentration.customerCount} customers carry failed payments. A high Gini means a few accounts hold most of the
          exposure — chase those first.
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   4. Correlated-failure network graph (nodes = customers, edges = shared cohort)
   ──────────────────────────────────────────────────────────────── */

export function RiskNetworkGraph({
  clusters,
  format,
  maxClusters = 6,
}: {
  clusters: RiskCluster[];
  format: (minor?: number) => string;
  maxClusters?: number;
}) {
  const [hover, setHover] = useState<string | null>(null);

  const shown = clusters.slice(0, maxClusters);
  if (!shown.length) return <EmptyGraph label="No correlated-failure cohorts detected." />;

  const cols = Math.min(3, shown.length);
  const rows = Math.ceil(shown.length / cols);
  const CELL_W = 220;
  const CELL_H = 168;
  const W = cols * CELL_W;
  const H = rows * CELL_H;
  const maxAtRisk = Math.max(...shown.map((c) => c.atRiskMinor), 1);

  return (
    <div className="space-y-2">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" role="img" aria-label="Correlated failure risk network">
        {shown.map((cluster, ci) => {
          const color = RISK_PALETTE[ci % RISK_PALETTE.length];
          const cx = (ci % cols) * CELL_W + CELL_W / 2;
          const cy = Math.floor(ci / cols) * CELL_H + CELL_H / 2 - 6;
          const hubR = 9 + (cluster.atRiskMinor / maxAtRisk) * 11;
          const members = cluster.customerIds.slice(0, 9);
          const orbit = 52;
          const isHot = hover === cluster.cohort;

          return (
            <g
              key={cluster.cohort}
              onMouseEnter={() => setHover(cluster.cohort)}
              onMouseLeave={() => setHover(null)}
              style={{ cursor: "pointer" }}
              opacity={hover && !isHot ? 0.35 : 1}
            >
              {/* cohort boundary */}
              <circle cx={cx} cy={cy} r={orbit + 14} fill={color} fillOpacity={isHot ? 0.07 : 0.03} stroke={color} strokeOpacity="0.2" strokeDasharray="3 4" />

              {/* edges: hub -> member, plus a ring edge to show the cohort is fully connected */}
              {members.map((id, mi) => {
                const a = (mi / members.length) * Math.PI * 2 - Math.PI / 2;
                const mx = cx + Math.cos(a) * orbit;
                const my = cy + Math.sin(a) * orbit;
                const aNext = (((mi + 1) % members.length) / members.length) * Math.PI * 2 - Math.PI / 2;
                const nx = cx + Math.cos(aNext) * orbit;
                const ny = cy + Math.sin(aNext) * orbit;
                return (
                  <g key={id}>
                    <line x1={cx} y1={cy} x2={mx} y2={my} stroke={color} strokeOpacity={isHot ? 0.55 : 0.28} strokeWidth="1" />
                    {members.length > 2 && (
                      <line x1={mx} y1={my} x2={nx} y2={ny} stroke={color} strokeOpacity={isHot ? 0.3 : 0.14} strokeWidth="1" />
                    )}
                  </g>
                );
              })}

              {/* member nodes */}
              {members.map((id, mi) => {
                const a = (mi / members.length) * Math.PI * 2 - Math.PI / 2;
                const mx = cx + Math.cos(a) * orbit;
                const my = cy + Math.sin(a) * orbit;
                return (
                  <g key={`n-${id}`}>
                    <circle cx={mx} cy={my} r={4.5} fill="#17130c" stroke={color} strokeWidth="1.6" />
                    <title>{`Customer #${id} — ${cluster.cohort}`}</title>
                  </g>
                );
              })}

              {/* hub node */}
              <circle cx={cx} cy={cy} r={hubR} fill={color} fillOpacity="0.22" stroke={color} strokeWidth="2" />
              <text x={cx} y={cy + 3.5} textAnchor="middle" className="fill-white" style={{ fontSize: 10, fontFamily: "monospace", fontWeight: 800 }}>
                {cluster.customerCount}
              </text>

              {/* labels */}
              <text x={cx} y={cy + orbit + 32} textAnchor="middle" style={{ fontSize: 9, fontFamily: "monospace", fontWeight: 700, fill: color }}>
                {cluster.cohort.length > 30 ? `${cluster.cohort.slice(0, 29)}…` : cluster.cohort}
              </text>
              <text x={cx} y={cy + orbit + 44} textAnchor="middle" className="fill-[#a79f93]" style={{ fontSize: 8, fontFamily: "monospace" }}>
                {format(cluster.atRiskMinor)} · {cluster.shareOfTotalRisk}% · risk {cluster.avgRiskScore}
              </text>

              {cluster.customerIds.length > members.length && (
                <text x={cx} y={cy - orbit - 20} textAnchor="middle" className="fill-[#a79f93]" style={{ fontSize: 8, fontFamily: "monospace" }}>
                  +{cluster.customerIds.length - members.length} more
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <p className="font-mono text-[10px] text-[#a79f93]">
        Each ring is a correlated-failure cohort (same decline reason + same payment method). Hub size = rupees at risk,
        satellites = affected customers. Tightly connected rings usually mean one upstream cause — fix it once, recover many.
      </p>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   5. Top risk customers — ranked bars
   ──────────────────────────────────────────────────────────────── */

export function TopRiskCustomersChart({
  customers,
  format,
}: {
  customers: TopRiskCustomer[];
  format: (minor?: number) => string;
}) {
  if (!customers.length) return <EmptyGraph label="No at-risk customers yet." />;

  const max = Math.max(...customers.map((c) => c.atRiskMinor), 1);

  return (
    <div className="space-y-2.5 font-mono text-[11px]">
      {customers.map((c, i) => {
        const pct = (c.atRiskMinor / max) * 100;
        const color = RISK_PALETTE[i % RISK_PALETTE.length];
        return (
          <div key={c.customerId} className="group space-y-1">
            <div className="flex justify-between items-baseline gap-2">
              <span className="text-[#d4c4b1] truncate">
                <span className="text-[#a79f93] mr-1.5">{String(i + 1).padStart(2, "0")}</span>
                {c.name}
                <span className="text-[#a79f93] ml-1.5 text-[10px]">#{c.customerId}</span>
              </span>
              <span className="text-white font-bold shrink-0">{format(c.atRiskMinor)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-grow h-2.5 bg-[#17130c] rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: "width 700ms" }} />
              </div>
              <span className="text-[9px] text-[#a79f93] w-28 truncate text-right" title={`${c.declineReason} / ${c.method}`}>
                {c.declineReason} / {c.method}
              </span>
              <span
                className={`text-[9px] font-bold w-8 text-right ${
                  c.riskScore >= 0.7 ? "text-rose-400" : c.riskScore >= 0.4 ? "text-[#fbc162]" : "text-emerald-400"
                }`}
                title="Average AI risk score"
              >
                {c.riskScore}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────
   6. Graph stat strip
   ──────────────────────────────────────────────────────────────── */

export function GraphStats({ summary, format }: { summary: RiskGraphSummary; format: (minor?: number) => string }) {
  const stats = [
    { label: "Nodes (customers)", value: String(summary.nodeCount), icon: "scatter_plot", color: "text-white" },
    { label: "Edges (correlations)", value: String(summary.edgeCount), icon: "share", color: "text-[#fbc162]" },
    { label: "Failure cohorts", value: String(summary.clusterCount), icon: "hub", color: "text-purple-300" },
    { label: "Graph exposure", value: format(summary.totalAtRiskMinor), icon: "trending_down", color: "text-rose-400" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 font-mono text-xs">
      {stats.map((s) => (
        <div key={s.label} className="bg-[#241f18] border border-[#342D24] p-4 rounded-lg">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[#a79f93] text-[10px]">{s.label}</span>
            <span className={`material-symbols-outlined text-base ${s.color}`}>{s.icon}</span>
          </div>
          <span className={`text-2xl font-extrabold ${s.color}`}>{s.value}</span>
        </div>
      ))}
    </div>
  );
}
