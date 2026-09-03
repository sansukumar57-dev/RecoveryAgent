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
│ ③ DATA — SQLite (JPA tables)            │
│   append-only audit_log                  │
└───────────────┬─────────────────────────┘
                ▼
┌─────────────────────────────────────────┐
│ ④ DASHBOARD — Next.js                   │
│   Command Center | Agent | Risk | Audit │
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
# Server starts on http://localhost:8001
```

### Frontend (Next.js)

```bash
cd frontend
npm install
npm run dev
# Dashboard on http://localhost:3000
```

### Authentication Header

All `/api/*` endpoints (except `/actuator/health` and `/webhooks/*`) require the API key header:
```http
X-API-Key: demo-api-key-123
```

### Demo Flow

1. Open http://localhost:3000/dashboard
2. Click **"Run Batch (120)"** or trigger `POST /api/simulation/generate` to seed synthetic failure events.
3. Step through the 8-step walkthrough by clicking **"Judge Mode"** in the top navigation bar.
4. Check **"Revenue Risk"** (`/dashboard/risk`) to view failure clusters and network graph.
5. Check **"AI Agent"** (`/dashboard/agent`) for real-time multi-agent decision traces.
6. Check **"Audit Trail"** (`/dashboard/audit`) for the full immutable audit log with rule evaluations.

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/webhooks/razorpay` | Razorpay webhook receiver (HMAC verified) |
| GET | `/api/dashboard` or `/api/recovery/metrics` | Executive KPI & recovery metrics summary |
| GET | `/api/recovery/cases` | List all recovery cases |
| GET | `/api/recovery/cases/{id}` | Get specific case details & history |
| POST | `/api/recovery/cases/{id}/execute` | Execute single recovery step cycle |
| POST | `/api/recovery/cases/{id}/retry` | Manually trigger payment retry |
| POST | `/api/recovery/cases/{id}/payment-link` | Generate Razorpay payment link |
| POST | `/api/recovery/cases/{id}/escalate` | Escalate case to human review |
| POST | `/api/recovery/run` | Execute batch recovery across active cases |
| GET | `/api/recovery/audit/{caseId}` | Audit log for case (use `all` for full log) |
| GET | `/api/customers` | List customer financial profiles |
| GET | `/api/payments` | List payment records |
| POST | `/api/simulation/generate?count=100` | Seed synthetic customer and payment data |
| POST | `/api/simulation/run` | Run autonomous batch simulation |
| POST | `/api/simulation/demo/reset` | Reset simulator state |
| GET | `/api/risk/graph` | Revenue-risk graph summary (nodes, edges, clusters, concentration) |
| GET | `/api/risk/graph/clusters` | Correlated-failure cohorts with at-risk share |
| GET | `/api/risk/graph/concentration` | Gini coefficient & top-N at-risk concentration |
| GET | `/api/risk/graph/distribution` | At-risk revenue broken down by decline reason |
| GET | `/api/risk/graph/trend?buckets=12` | Time-bucketed at-risk trend |
| GET | `/api/risk/graph/top?n=10` | Top at-risk customers and centrality |
| GET | `/api/risk/graph/context?paymentId=` | Agent graph context for a specific payment |

## Tech Stack

- **Backend:** Spring Boot 3.3 + Java 17 + Maven + SQLite + JPA
- **Frontend:** Next.js 16 App Router + TypeScript + Tailwind CSS
- **LLM:** OpenRouter → Groq fallback → rule-based (never crashes)
- **Payments:** Razorpay test mode (raw OkHttp, no SDK)
- **Sim:** Seeded RNG, 14-day window, deterministic evaluation

## THE BAR

- ₹ recovered across batch (exact, minor units)
- Recovery rate: recovered ÷ at-risk
- Compliance violations: target 0
- Full audit trail: every detect → diagnose → decide → act step logged

## License

Built for Razorpay Buildathon — Track 03.

