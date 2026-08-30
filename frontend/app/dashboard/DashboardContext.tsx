"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

/** Backend base URL — override with NEXT_PUBLIC_API_URL in .env.local */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001/api";
export const API_KEY = process.env.NEXT_PUBLIC_API_KEY || "demo-api-key-123";

/** Authenticated fetch — attaches the API key header required by the backend. */
export async function apiFetch(url: string, options: RequestInit = {}) {
  return fetch(url, {
    ...options,
    headers: { ...(options.headers || {}), "X-API-Key": API_KEY },
  });
}

// ──────────── Types ────────────

export interface RecoveryCaseItem {
  id: number;
  caseId: string;
  paymentId: string;
  customerId: number;
  status: string;
  attemptsCount: number;
  createdAt: number;
  customerName?: string;
  plan?: string;
  amountMinor?: number;
  failureReason?: string;
  diagnosis?: string;
  strategy?: string;
  confidence?: number;
  reasoning?: string;
  lastGuardrailRule?: string;
}

export interface AuditLogItem {
  id: number;
  caseId: string;
  eventType: string;
  agentName: string;
  guardrailStatus: string;
  ruleId?: string;
  tool?: string;
  details?: string;
  timestamp: number;
  recoveryDelta?: string;
  confidence?: number;
}

export interface MetricsData {
  hasData?: boolean;
  revenueAtRiskMinor: number;
  revenueRecoveredMinor: number;
  recoveryRate: number;
  activeCases: number;
  recoveredCases: number;
  escalatedCases: number;
  stoppedCases: number;
  totalCasesCount: number;
  expectedRecoveryMinor: number;
  avgRecoveryTime: string;
  agentStatus: string;
  policyViolations: number;
  avgCaseValueMinor?: number;
  actionDistribution?: Record<string, number>;
}

/** Shape returned by GET /api/recovery/cases (RecoveryCaseDTO) */
interface RecoveryCaseResponse {
  id: number;
  caseId: string;
  paymentId: string;
  customerId: number;
  status: string;
  attemptsCount?: number;
  createdAt?: number;
  updatedAt?: number;
  riskScore?: number;
  recoveryProbability?: number;
  declineReason?: string;
  currentIntervention?: string;
  customerName?: string;
  plan?: string;
  amountMinor?: number;
  currency?: string;
  failureReason?: string;
  method?: string;
}

/** Shape returned by GET /api/recovery/audit/all (AuditLogDTO) */
interface AuditLogResponse {
  id: number;
  caseId: string;
  timestamp?: number;
  agentName?: string;
  eventType?: string;
  guardrailStatus?: string;
  ruleId?: string;
  tool?: string;
  decision?: string;
  details?: string;
  status?: string;
}

/** Shape returned by GET /api/dashboard (MetricsDTO) */
interface MetricsResponse {
  hasData?: boolean;
  revenueAtRiskMinor?: number;
  revenueRecoveredMinor?: number;
  recoveryRate?: number;
  activeCases?: number;
  recoveredCases?: number;
  escalatedCases?: number;
  stoppedCases?: number;
  totalCasesCount?: number;
  expectedRecoveryMinor?: number;
  avgCaseValueMinor?: number;
  avgRecoveryTime?: string;
  agentStatus?: string;
  policyViolations?: number;
  actionDistribution?: Record<string, number>;
}

export interface CustomerItem {
  id: number;
  name: string;
  email: string;
  phone?: string;
  plan?: string;
  ltvMinor?: number;
  riskScore?: number;
  paymentSuccessRate?: number;
  lastFailureDate?: string;
  recoveryStatus?: string;
  totalPayments?: number;
  failedPayments?: number;
}

// ──────────── Mock Seeds ────────────

const MOCK_CASES: RecoveryCaseItem[] = [
  {
    id: 1, caseId: "RC-1001", paymentId: "pay_8a9f21b", customerId: 101,
    status: "DETECTED", attemptsCount: 0, createdAt: Date.now() - 3600000,
    customerName: "Acme Technologies", plan: "Enterprise Plan",
    amountMinor: 4800000, failureReason: "insufficient_funds",
    diagnosis: "Temporary Payment Degradation", strategy: "DELAYED_RETRY",
    confidence: 0.94, reasoning: "High payment history reliability (96% success). Issuer response indicates temporary liquidity constraint during salary processing window.",
    lastGuardrailRule: "AUTO_RETRY_ALLOWED",
  },
  {
    id: 2, caseId: "RC-1002", paymentId: "pay_4f87c91", customerId: 102,
    status: "RECOVERED", attemptsCount: 1, createdAt: Date.now() - 7200000,
    customerName: "Nova Retail Sub_9xY", plan: "Standard Plan",
    amountMinor: 1250000, failureReason: "card_expired",
    diagnosis: "Expired Payment Method", strategy: "CREATE_PAYMENT_LINK",
    confidence: 0.96, reasoning: "Card expired on 08/26. Automated payment update link delivered via SMS & Email. Customer updated card and completed payment.",
    lastGuardrailRule: "EXPIRED_CARD_LINK",
  },
  {
    id: 3, caseId: "RC-1003", paymentId: "pay_9b31d2e", customerId: 103,
    status: "ESCALATED", attemptsCount: 1, createdAt: Date.now() - 900000,
    customerName: "TechFlow Ltd", plan: "Enterprise Plan",
    amountMinor: 24000000, failureReason: "do_not_honour",
    diagnosis: "High Value B2B Receivable Overdue", strategy: "ESCALATE_TO_HUMAN",
    confidence: 0.91, reasoning: "Transaction exceeds auto-execution limit (₹50,000). Escalated to B2B Account Manager for human-in-the-loop approval.",
    lastGuardrailRule: "MAX_AUTO_AMOUNT_LIMIT",
  },
  {
    id: 4, caseId: "RC-1004", paymentId: "pay_1c54e02", customerId: 104,
    status: "STOPPED", attemptsCount: 0, createdAt: Date.now() - 14400000,
    customerName: "Cyberdyne Systems", plan: "Standard Plan",
    amountMinor: 249900, failureReason: "user_abandoned",
    diagnosis: "Customer Opt-Out Detected", strategy: "HALT_WORKFLOW",
    confidence: 0.99, reasoning: "Customer explicitly opted out of recovery messages (Opt-Out = True). Safety policy halted all automated outreach.",
    lastGuardrailRule: "STOP_OPT_OUT",
  },
  {
    id: 5, caseId: "RC-1005", paymentId: "pay_6d82a44", customerId: 105,
    status: "DETECTED", attemptsCount: 0, createdAt: Date.now() - 1800000,
    customerName: "Meridian Exports", plan: "Enterprise Plan",
    amountMinor: 7500000, failureReason: "gateway_timeout",
    diagnosis: "Gateway Infrastructure Issue", strategy: "IMMEDIATE_RETRY",
    confidence: 0.88, reasoning: "Razorpay gateway returned timeout (504). Server-side issue, not customer fault. Immediate retry recommended.",
    lastGuardrailRule: "AUTO_RETRY_ALLOWED",
  },
  {
    id: 6, caseId: "RC-1006", paymentId: "pay_a3f1e07", customerId: 106,
    status: "RECOVERED", attemptsCount: 2, createdAt: Date.now() - 10800000,
    customerName: "Pinnacle SaaS Inc", plan: "Pro Plan",
    amountMinor: 1999900, failureReason: "insufficient_funds",
    diagnosis: "Temporary Liquidity Issue", strategy: "DELAYED_RETRY",
    confidence: 0.92, reasoning: "Second retry after 4-hour delay succeeded. Customer balance restored post salary credit.",
    lastGuardrailRule: "AUTO_RETRY_ALLOWED",
  },
];

const MOCK_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 1, caseId: "RC-1001", eventType: "DECISION", agentName: "PaymentDiagnosisAgent",
    guardrailStatus: "APPROVED", ruleId: "AUTO_RETRY_ALLOWED", tool: "selectStrategy",
    details: "Diagnosed failure: Temporary payment degradation (94% confidence). Selected DELAYED_RETRY strategy.",
    timestamp: Date.now() - 3600000,
  },
  {
    id: 2, caseId: "RC-1002", eventType: "TOOL_EXECUTION", agentName: "RecoveryExecutorTools",
    guardrailStatus: "APPROVED", ruleId: "EXPIRED_CARD_LINK", tool: "createPaymentLink",
    details: "Generated Razorpay payment update link plink_87f91a. Outcome: RECOVERED ₹12,500.",
    timestamp: Date.now() - 7200000,
  },
  {
    id: 3, caseId: "RC-1003", eventType: "POLICY_CHECK", agentName: "SafetyEngine",
    guardrailStatus: "DENIED_ESCALATE", ruleId: "MAX_AUTO_AMOUNT_LIMIT", tool: "escalateToHuman",
    details: "Transaction amount ₹2,40,000 exceeds automated threshold ₹50,000. Escalated case to human account owner.",
    timestamp: Date.now() - 900000,
  },
  {
    id: 4, caseId: "RC-1004", eventType: "POLICY_CHECK", agentName: "SafetyEngine",
    guardrailStatus: "DENIED_STOP", ruleId: "STOP_OPT_OUT", tool: "haltWorkflow",
    details: "Customer has opt-out flag set. All recovery workflows halted per compliance policy.",
    timestamp: Date.now() - 14400000,
  },
  {
    id: 5, caseId: "RC-1006", eventType: "VERIFICATION", agentName: "VerificationAgent",
    guardrailStatus: "APPROVED", ruleId: "AUTO_RETRY_ALLOWED", tool: "retryPayment",
    details: "Payment capture confirmed on 2nd retry. Revenue recovered: ₹19,999.",
    timestamp: Date.now() - 10800000,
  },
];

const MOCK_CUSTOMERS: CustomerItem[] = [
  { id: 101, name: "Acme Technologies", email: "billing@acmetech.in", phone: "+91 98765 43210", plan: "Enterprise Plan", ltvMinor: 84000000, riskScore: 92, paymentSuccessRate: 96, lastFailureDate: "2026-08-29", recoveryStatus: "IN_PROGRESS", totalPayments: 48, failedPayments: 2 },
  { id: 102, name: "Nova Retail Sub_9xY", email: "finance@novaretail.com", phone: "+91 87654 32109", plan: "Standard Plan", ltvMinor: 15000000, riskScore: 45, paymentSuccessRate: 91, lastFailureDate: "2026-08-28", recoveryStatus: "RECOVERED", totalPayments: 24, failedPayments: 3 },
  { id: 103, name: "TechFlow Ltd", email: "accounts@techflow.io", phone: "+91 76543 21098", plan: "Enterprise Plan", ltvMinor: 240000000, riskScore: 78, paymentSuccessRate: 88, lastFailureDate: "2026-08-30", recoveryStatus: "ESCALATED", totalPayments: 36, failedPayments: 4 },
  { id: 104, name: "Cyberdyne Systems", email: "pay@cyberdyne.co", phone: "+91 65432 10987", plan: "Standard Plan", ltvMinor: 3600000, riskScore: 15, paymentSuccessRate: 98, lastFailureDate: "2026-08-26", recoveryStatus: "STOPPED", totalPayments: 12, failedPayments: 1 },
  { id: 105, name: "Meridian Exports", email: "treasury@meridian.in", phone: "+91 99887 76655", plan: "Enterprise Plan", ltvMinor: 56000000, riskScore: 67, paymentSuccessRate: 93, lastFailureDate: "2026-08-30", recoveryStatus: "IN_PROGRESS", totalPayments: 60, failedPayments: 4 },
  { id: 106, name: "Pinnacle SaaS Inc", email: "billing@pinnacle.dev", phone: "+91 88776 65544", plan: "Pro Plan", ltvMinor: 28000000, riskScore: 38, paymentSuccessRate: 94, lastFailureDate: "2026-08-29", recoveryStatus: "RECOVERED", totalPayments: 30, failedPayments: 2 },
  { id: 107, name: "Orion Logistics", email: "finance@orionlog.com", phone: "+91 77665 54433", plan: "Enterprise Plan", ltvMinor: 120000000, riskScore: 55, paymentSuccessRate: 90, lastFailureDate: "2026-08-27", recoveryStatus: "RECOVERED", totalPayments: 42, failedPayments: 5 },
  { id: 108, name: "Zenith Healthcare", email: "accounts@zenithhealth.in", phone: "+91 66554 43322", plan: "Pro Plan", ltvMinor: 45000000, riskScore: 72, paymentSuccessRate: 87, lastFailureDate: "2026-08-30", recoveryStatus: "IN_PROGRESS", totalPayments: 18, failedPayments: 3 },
];

// ──────────── Context ────────────

interface DashboardContextType {
  cases: RecoveryCaseItem[];
  setCases: React.Dispatch<React.SetStateAction<RecoveryCaseItem[]>>;
  auditLogs: AuditLogItem[];
  setAuditLogs: React.Dispatch<React.SetStateAction<AuditLogItem[]>>;
  metrics: MetricsData;
  setMetrics: React.Dispatch<React.SetStateAction<MetricsData>>;
  customers: CustomerItem[];
  apiConnected: boolean;
  isProcessing: boolean;
  executionStepText: string | null;
  showSuccessToast: { amount: string; caseId: string } | null;
  selectedCase: RecoveryCaseItem | null;
  setSelectedCase: (c: RecoveryCaseItem | null) => void;
  fetchData: () => Promise<void>;
  handleExecuteCase: (kase: RecoveryCaseItem) => Promise<void>;
  handleRunBatch: () => Promise<void>;
  handleResetDemo: () => Promise<void>;
  formatCurrencyINR: (minor?: number) => string;
  // Judge Mode
  judgeMode: boolean;
  setJudgeMode: (v: boolean) => void;
  judgeStep: number;
  setJudgeStep: (v: number) => void;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export function useDashboard() {
  const ctx = useContext(DashboardContext);
  if (!ctx) throw new Error("useDashboard must be used within DashboardProvider");
  return ctx;
}

// ──────────── Provider ────────────

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [cases, setCases] = useState<RecoveryCaseItem[]>(MOCK_CASES);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>(MOCK_AUDIT_LOGS);
  const [customers] = useState<CustomerItem[]>(MOCK_CUSTOMERS);
  const [metrics, setMetrics] = useState<MetricsData>({
    revenueAtRiskMinor: 128000000,
    revenueRecoveredMinor: 74000000,
    recoveryRate: 57.8,
    activeCases: 126,
    recoveredCases: 418,
    escalatedCases: 18,
    stoppedCases: 4,
    totalCasesCount: 1284,
    expectedRecoveryMinor: 104000000,
    avgRecoveryTime: "8h 42m",
    agentStatus: "ACTIVE",
    policyViolations: 0,
  });

  const [apiConnected, setApiConnected] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [executionStepText, setExecutionStepText] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState<{ amount: string; caseId: string } | null>(null);
  const [selectedCase, setSelectedCase] = useState<RecoveryCaseItem | null>(null);
  const [judgeMode, setJudgeMode] = useState(false);
  const [judgeStep, setJudgeStep] = useState(1);

  function formatCurrencyINR(minor: number = 0) {
    const rupees = Math.round(minor / 100);
    if (rupees >= 100000) return `₹${(rupees / 100000).toFixed(1)}L`;
    return `₹${rupees.toLocaleString()}`;
  }

  const fetchData = useCallback(async () => {
    try {
      const resCases = await apiFetch(`${API_BASE_URL}/recovery/cases`);
      if (resCases.ok) {
        const dataCases: RecoveryCaseResponse[] = await resCases.json();
        if (Array.isArray(dataCases) && dataCases.length > 0) {
          // The backend DTO now supplies customerName / amountMinor / failureReason
          // from a real join, so these are no longer invented on the client.
          const mapped: RecoveryCaseItem[] = dataCases.map((c) => ({
            id: c.id,
            caseId: c.caseId,
            paymentId: c.paymentId,
            customerId: c.customerId,
            status: c.status === "VERIFYING" ? "RECOVERING" : c.status,
            attemptsCount: c.attemptsCount ?? 0,
            createdAt: c.createdAt ?? Date.now(),
            customerName: c.customerName ?? `Customer #${c.customerId}`,
            plan: c.plan,
            amountMinor: c.amountMinor ?? 0,
            failureReason: c.failureReason ?? c.declineReason ?? "unknown",
            diagnosis: c.currentIntervention ?? "Awaiting diagnosis",
            strategy: c.currentIntervention ?? "PENDING",
            confidence: c.recoveryProbability,
            reasoning: c.currentIntervention
              ? `Agent selected ${c.currentIntervention} (risk ${c.riskScore ?? "n/a"}).`
              : "Diagnosed via AI agent pipeline.",
            lastGuardrailRule: c.declineReason ?? undefined,
          }));
          setCases(mapped);
          setApiConnected(true);
        }
      }

      const resMetrics = await apiFetch(`${API_BASE_URL}/dashboard`);
      if (resMetrics.ok) {
        const m: MetricsResponse = await resMetrics.json();
        // Use ?? not || so a real zero is shown as zero instead of falling back
        // to fabricated demo revenue.
        setMetrics({
          hasData: m.hasData ?? true,
          revenueAtRiskMinor: m.revenueAtRiskMinor ?? 0,
          revenueRecoveredMinor: m.revenueRecoveredMinor ?? 0,
          recoveryRate: m.recoveryRate ?? 0,
          activeCases: m.activeCases ?? 0,
          recoveredCases: m.recoveredCases ?? 0,
          escalatedCases: m.escalatedCases ?? 0,
          stoppedCases: m.stoppedCases ?? 0,
          totalCasesCount: m.totalCasesCount ?? 0,
          expectedRecoveryMinor: m.expectedRecoveryMinor ?? 0,
          avgCaseValueMinor: m.avgCaseValueMinor ?? 0,
          avgRecoveryTime: m.avgRecoveryTime ?? "—",
          agentStatus: m.agentStatus ?? "IDLE",
          policyViolations: m.policyViolations ?? 0,
          actionDistribution: m.actionDistribution,
        });
      }

      const resAudit = await apiFetch(`${API_BASE_URL}/recovery/audit/all`);
      if (resAudit.ok) {
        const dataAudit: AuditLogResponse[] = await resAudit.json();
        if (Array.isArray(dataAudit) && dataAudit.length > 0) {
          setAuditLogs(
            dataAudit.map((l) => ({
              id: l.id,
              caseId: l.caseId,
              eventType: l.eventType ?? "DECISION",
              agentName: l.agentName ?? "RecoveryAgent",
              guardrailStatus: l.guardrailStatus ?? "APPROVED",
              ruleId: l.ruleId,
              tool: l.tool ?? l.decision,
              details: l.details,
              timestamp: l.timestamp ?? Date.now(),
            }))
          );
        }
      }
    } catch {
      setApiConnected(false);
    }
  }, []);

  // Initial load. There is no data-fetching library in this project, so the
  // mount fetch lives here; the 10s refresh below reuses the same function.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchData();
  }, [fetchData]);

  // Auto-refresh every 10s
  useEffect(() => {
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleExecuteCase = async (kase: RecoveryCaseItem) => {
    setIsProcessing(true);
    const steps = [
      "Stage 1: Loading customer payment history & LTV...",
      "Stage 2: Calculating risk (92/100) & recoverability (81/100)...",
      "Stage 3: Diagnosing root cause: " + (kase.diagnosis || "Temporary Payment Degradation") + "...",
      "Stage 4: Comparing strategies — " + (kase.strategy || "DELAYED_RETRY") + " selected...",
      "Stage 5: Validating policy & safety engine...",
      "Stage 6: Executing bounded recovery action via Razorpay gateway...",
      "Stage 7: Verifying payment status...",
    ];
    for (const step of steps) {
      setExecutionStepText(step);
      await new Promise((r) => setTimeout(r, 400));
    }

    if (apiConnected) {
      try {
        await apiFetch(`${API_BASE_URL}/recovery/cases/${kase.id}/execute`, { method: "POST" });
        await fetchData();
      } catch (e) { console.error(e); }
    } else {
      setCases((prev) => prev.map((c) => (c.id === kase.id ? { ...c, status: "RECOVERED" } : c)));
      setMetrics((prev) => ({
        ...prev,
        revenueRecoveredMinor: prev.revenueRecoveredMinor + (kase.amountMinor || 4800000),
        recoveredCases: prev.recoveredCases + 1,
        activeCases: Math.max(0, prev.activeCases - 1),
      }));
      setAuditLogs((prev) => [
        {
          id: prev.length + 1, caseId: kase.caseId, eventType: "VERIFICATION",
          agentName: "VerificationAgent", guardrailStatus: "APPROVED",
          ruleId: "AUTO_RETRY_ALLOWED", tool: "retryPayment",
          details: `Payment captured. Recovered ₹${((kase.amountMinor || 4800000) / 100).toLocaleString()}.`,
          timestamp: Date.now(),
        },
        ...prev,
      ]);
    }

    setExecutionStepText(null);
    setIsProcessing(false);
    setShowSuccessToast({ amount: formatCurrencyINR(kase.amountMinor || 4800000), caseId: kase.caseId });
    setTimeout(() => setShowSuccessToast(null), 5000);
  };

  const handleRunBatch = async () => {
    setIsProcessing(true);
    setExecutionStepText("Executing autonomous AI recovery batch across all active cases...");
    await new Promise((r) => setTimeout(r, 600));
    if (apiConnected) {
      try {
        await apiFetch(`${API_BASE_URL}/simulation/run`, { method: "POST" });
        await fetchData();
      } catch (e) { console.error(e); }
    } else {
      setCases((prev) => prev.map((c) => (c.status !== "STOPPED" && c.status !== "ESCALATED" ? { ...c, status: "RECOVERED" } : c)));
      setMetrics((prev) => ({
        ...prev,
        revenueRecoveredMinor: prev.revenueRecoveredMinor + 12000000,
        recoveredCases: prev.recoveredCases + 24,
        activeCases: 12,
      }));
    }
    setExecutionStepText(null);
    setIsProcessing(false);
  };

  const handleResetDemo = async () => {
    setIsProcessing(true);
    if (apiConnected) {
      try {
        await apiFetch(`${API_BASE_URL}/simulation/generate?count=100`, { method: "POST" });
        await fetchData();
      } catch (e) { console.error(e); }
    } else {
      setCases(MOCK_CASES);
      setAuditLogs(MOCK_AUDIT_LOGS);
      setMetrics({
        revenueAtRiskMinor: 128000000, revenueRecoveredMinor: 74000000,
        recoveryRate: 57.8, activeCases: 126, recoveredCases: 418,
        escalatedCases: 18, stoppedCases: 4, totalCasesCount: 1284,
        expectedRecoveryMinor: 104000000, avgRecoveryTime: "8h 42m",
        agentStatus: "ACTIVE", policyViolations: 0,
      });
    }
    setIsProcessing(false);
  };

  return (
    <DashboardContext.Provider value={{
      cases, setCases, auditLogs, setAuditLogs, metrics, setMetrics, customers,
      apiConnected, isProcessing, executionStepText, showSuccessToast,
      selectedCase, setSelectedCase, fetchData,
      handleExecuteCase, handleRunBatch, handleResetDemo, formatCurrencyINR,
      judgeMode, setJudgeMode, judgeStep, setJudgeStep,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
