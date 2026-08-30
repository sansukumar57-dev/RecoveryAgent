# AI Revenue Recovery — Razorpay Track 03

An autonomous agent that detects revenue at risk via Razorpay webhooks, diagnoses root causes, executes bounded recovery workflows, and proves exactly how much money it recovered — with guardrails, compliance, and a full audit trail.

## Architecture

```
Razorpay (test mode)
       │ webhooks
       ▼
┌─────────────────────────────────────────┐
│ ① INGESTION — WebhookController         │
│   HMAC verify → idempotency → normalize │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ ② AGENT CORE                            │
│   Diagnose → GuardrailEngine → Actuator │
│   (OpenRouter → Groq → rule fallback)   │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ ③ DATA — SQLite (6 JPA tables)          │
│   append-only audit_log                  │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ ④ DASHBOARD — Next.js                   │
│   Overview | A/B Results | Runs | Audit │
└─────────────────────────────────────────┘
```

## Guardrails (R1–R7)

| Rule | Behavior |
|------|----------|
| R1 | Quiet hours 20:00–08:00 → defer to 09:30 |
| R2 | Max 3 contacts per rolling 7 days |
| R3 | Hard-decline ban (expired/stolen cards) |
| R4 | Consent stop (opt-out/dispute → zero contact) |
| R5 | Discount bound (< ₹2,000 + soft decline) |
| R6 | High-value route (> ₹25,000 → human owner) |
| R7 | Fraud route (stolen card → human only) |

## Quick Start

### Backend (Spring Boot + Maven)

```bash
cd backend
mvn spring-boot:run
# Server starts on http://localhost:8080
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# Dashboard on http://localhost:3000
```

### Demo Flow

1. Open http://localhost:3000/overview
2. Click "Generate Batch" to seed 120 synthetic events
3. Click "Run Evaluation" to run A/B comparison
4. Check "A/B Results" for THE BAR — net ₹ recovered, rate, violations = 0
5. Check "Audit Trail" for the full append-only log with rule_id overrides

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/razorpay` | Razorpay webhook receiver |
| GET | `/api/v1/summary` | KPI summary |
| POST | `/api/v1/generate-batch` | Generate synthetic events |
| POST | `/api/v1/run-evaluation` | Run A/B simulation |
| GET | `/api/v1/ab-report` | A/B comparison report |
| GET | `/api/v1/runs` | List agent runs |
| GET | `/api/v1/runs/{id}/timeline` | Per-customer timeline |
| GET | `/api/v1/audit` | Audit log (filterable) |
| GET | `/api/risk/graph` | Revenue-risk graph summary (nodes, edges, clusters, concentration, trend) |
| GET | `/api/risk/graph/clusters` | Correlated-failure cohorts with at-risk share |
| GET | `/api/risk/graph/concentration` | Gini + top-N at-risk concentration |
| GET | `/api/risk/graph/distribution` | At-risk revenue by decline reason |
| GET | `/api/risk/graph/trend?buckets=12` | Time-bucketed at-risk trend |
| GET | `/api/risk/graph/top?n=10` | Top at-risk customers + centrality |
| GET | `/api/risk/graph/context?paymentId=` | Agent graph context for a payment |

## Tech Stack

- **Backend:** Spring Boot 3.3 + Java 17 + Maven + SQLite + JPA
- **Frontend:** Next.js 14 App Router + TypeScript + Tailwind CSS
- **LLM:** OpenRouter → Groq fallback → rule-based (never crashes)
- **Payments:** Razorpay test mode (raw OkHttp, no SDK)
- **Sim:** Seeded RNG, 14-day window, deterministic A/B

## THE BAR

- ₹ recovered across batch (exact, minor units)
- Recovery rate: recovered ÷ at-risk
- Compliance violations: target 0
- Full audit trail: every detect → diagnose → decide → act step logged

## License

Built for Razorpay Buildathon — Track 03.
