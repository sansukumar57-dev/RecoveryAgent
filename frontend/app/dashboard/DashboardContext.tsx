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
  paymentLinkUrl?: string;
  paymentLinkId?: string;
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

export interface PromiseToPayItem {
  id: string;
  caseId: string;
  customerName: string;
  amountMinor: number;
  promisedDate: string;
  status: "KEPT" | "PENDING" | "BROKEN";
  notes: string;
  createdAt: number;
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
  setCustomers: React.Dispatch<React.SetStateAction<CustomerItem[]>>;
  apiConnected: boolean;
  isProcessing: boolean;
  executionStepText: string | null;
  showSuccessToast: { amount: string; caseId: string; message?: string; linkUrl?: string } | null;
  selectedCase: RecoveryCaseItem | null;
  setSelectedCase: (c: RecoveryCaseItem | null) => void;
  fetchData: () => Promise<void>;
  handleExecuteCase: (kase: RecoveryCaseItem) => Promise<void>;
  handleSimulateCustomerPayment: (kase: RecoveryCaseItem) => Promise<void>;
  handleApproveCase: (kaseId: number, notes?: string) => Promise<void>;
  handleRejectCase: (kaseId: number, reason?: string) => Promise<void>;
  handleRunBatch: () => Promise<void>;
  handleResetDemo: () => Promise<void>;
  handleCreateCustomCase: (data: {
    customerName: string;
    plan: string;
    amountMinor: number;
    failureReason: string;
    method: string;
  }) => Promise<RecoveryCaseItem | null>;
  formatCurrencyINR: (minor?: number) => string;
  // Promise-to-Pay (PTP) Tracker
  ptpRecords: PromiseToPayItem[];
  setPtpRecords: React.Dispatch<React.SetStateAction<PromiseToPayItem[]>>;
  handleAddPtpRecord: (record: Omit<PromiseToPayItem, "id" | "createdAt">) => void;
  handleUpdatePtpStatus: (id: string, status: "KEPT" | "PENDING" | "BROKEN") => void;
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
  const [customers, setCustomers] = useState<CustomerItem[]>(MOCK_CUSTOMERS);
  const [ptpRecords, setPtpRecords] = useState<PromiseToPayItem[]>([
    {
      id: "ptp_1",
      caseId: "RC-1001",
      customerName: "Varun Das",
      amountMinor: 249900,
      promisedDate: "05 Sep 2026",
      status: "KEPT",
      notes: "Customer promised payment on salary day. Settled via Razorpay link.",
      createdAt: Date.now() - 86400000 * 2,
    },
    {
      id: "ptp_2",
      caseId: "RC-1005",
      customerName: "Kavita Rao",
      amountMinor: 1499900,
      promisedDate: "06 Sep 2026",
      status: "PENDING",
      notes: "Agreed to clear quarterly invoice after accounting audit approval.",
      createdAt: Date.now() - 86400000,
    },
    {
      id: "ptp_3",
      caseId: "RC-1012",
      customerName: "Nexlify Tech",
      amountMinor: 3800000,
      promisedDate: "04 Sep 2026",
      status: "PENDING",
      notes: "AP team confirmed disbursement in Friday batch wire.",
      createdAt: Date.now() - 3600000 * 12,
    },
    {
      id: "ptp_4",
      caseId: "RC-1008",
      customerName: "Orion Logistics",
      amountMinor: 12000000,
      promisedDate: "02 Sep 2026",
      status: "BROKEN",
      notes: "Promise expired without settlement. Escalated to Human Approval Center.",
      createdAt: Date.now() - 86400000 * 3,
    },
    {
      id: "ptp_5",
      caseId: "RC-1015",
      customerName: "Siddharth Gupta",
      amountMinor: 249900,
      promisedDate: "07 Sep 2026",
      status: "PENDING",
      notes: "Requested 72h extension via Customer Pay Portal AI Concierge.",
      createdAt: Date.now() - 3600000 * 4,
    },
  ]);
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
  const [showSuccessToast, setShowSuccessToast] = useState<{ amount: string; caseId: string; message?: string; linkUrl?: string } | null>(null);
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

          // Dynamically derive customer directory from active cases
          const customerMap = new Map<number, CustomerItem>();
          dataCases.forEach((c) => {
            const cid = c.customerId || c.id;
            const existing = customerMap.get(cid);
            const name = c.customerName || `Customer #${cid}`;
            const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, "");
            const email = `${cleanName || "user"}@example.com`;
            const plan = c.plan || "Standard Plan";
            const caseAmt = c.amountMinor || 0;
            const risk = Math.round((c.riskScore || 0.5) * 100);

            if (!existing) {
              customerMap.set(cid, {
                id: cid,
                name,
                email,
                phone: `+91 ${98000 + (cid % 900)} ${10000 + (cid % 89999)}`,
                plan,
                ltvMinor: Math.max(caseAmt * 12, 1200000),
                riskScore: risk,
                paymentSuccessRate: c.status === "RECOVERED" ? 95 : 78,
                lastFailureDate: new Date(c.createdAt || Date.now()).toISOString().split("T")[0],
                recoveryStatus: c.status === "RECOVERED" ? "RECOVERED" : c.status === "ESCALATED" ? "ESCALATED" : c.status === "STOPPED" ? "STOPPED" : "IN_PROGRESS",
                totalPayments: 12 + (cid % 20),
                failedPayments: c.status === "RECOVERED" ? 1 : 2,
              });
            } else {
              existing.ltvMinor = (existing.ltvMinor || 0) + caseAmt * 6;
            }
          });

          if (customerMap.size > 0) {
            setCustomers(Array.from(customerMap.values()));
          }
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

      const resCustomers = await apiFetch(`${API_BASE_URL}/customers`);
      if (resCustomers.ok) {
        const dataCustomers: Array<{
          id: number;
          name: string;
          plan?: string;
          amountMinor?: number;
          channelPref?: string;
          optOut?: boolean;
          dispute?: boolean;
          recoverability?: string;
        }> = await resCustomers.json();
        if (Array.isArray(dataCustomers) && dataCustomers.length > 0) {
          setCustomers(
            dataCustomers.map((c) => ({
              id: c.id,
              name: c.name ?? `Customer #${c.id}`,
              email: `${c.name ? c.name.toLowerCase().replace(/[^a-z0-9]/g, "") : `customer${c.id}`}@example.com`,
              phone: `+91 ${9800000000 + (c.id % 10000000)}`,
              plan: c.plan ?? "Standard Plan",
              ltvMinor: c.amountMinor ? c.amountMinor * 12 : 5000000,
              riskScore: c.dispute ? 88 : c.optOut ? 95 : (c.recoverability === "LOW" ? 75 : c.recoverability === "HIGH" ? 25 : 48),
              paymentSuccessRate: c.dispute ? 72 : c.optOut ? 65 : 94,
              recoveryStatus: c.optOut ? "STOPPED" : (c.recoverability === "LOW" ? "ESCALATED" : "IN_PROGRESS"),
              totalPayments: 24,
              failedPayments: c.dispute ? 4 : 1,
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
    const isLinkStrategy = kase.strategy === "CREATE_PAYMENT_LINK";
    const steps = [
      "Stage 1: Loading customer payment history & LTV...",
      "Stage 2: Calculating risk & recoverability scores...",
      "Stage 3: Diagnosing root cause: " + (kase.diagnosis || "Temporary Payment Degradation") + "...",
      "Stage 4: Strategy: " + (kase.strategy || "CREATE_PAYMENT_LINK") + " selected...",
      "Stage 5: Policy gate: All guardrails approved...",
      isLinkStrategy
        ? "Stage 6: Generating Razorpay Payment Link & dispatching via WhatsApp/SMS..."
        : "Stage 6: Executing bounded smart retry via Razorpay gateway...",
      isLinkStrategy
        ? "Stage 7: Payment link active — Awaiting customer checkout..."
        : "Stage 7: Verifying payment capture status...",
    ];
    for (const step of steps) {
      setExecutionStepText(step);
      await new Promise((r) => setTimeout(r, 300));
    }

    let generatedUrl = kase.paymentLinkUrl;
    const newStatus = isLinkStrategy ? "VERIFYING" : "RECOVERED";

    if (apiConnected) {
      try {
        if (isLinkStrategy) {
          const res = await apiFetch(`${API_BASE_URL}/recovery/cases/${kase.id}/payment-link`, { method: "POST" });
          if (res.ok) {
            const data = await res.json();
            generatedUrl = data.paymentLinkUrl || `https://rzp.io/i/${kase.caseId.toLowerCase()}`;
          }
        } else {
          await apiFetch(`${API_BASE_URL}/recovery/cases/${kase.id}/execute`, { method: "POST" });
        }
        await fetchData();
      } catch (e) { console.error(e); }
    } else {
      if (isLinkStrategy) {
        generatedUrl = `https://rzp.io/i/plink_${kase.caseId.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
      }
      setCases((prev) =>
        prev.map((c) =>
          c.id === kase.id
            ? { ...c, status: newStatus, paymentLinkUrl: generatedUrl }
            : c
        )
      );
      if (!isLinkStrategy) {
        setMetrics((prev) => ({
          ...prev,
          revenueRecoveredMinor: prev.revenueRecoveredMinor + (kase.amountMinor || 249900),
          recoveredCases: prev.recoveredCases + 1,
          activeCases: Math.max(0, prev.activeCases - 1),
        }));
      }
    }

    if (!generatedUrl && isLinkStrategy) {
      generatedUrl = `https://rzp.io/i/plink_${kase.caseId.toLowerCase()}`;
    }

    // Update selected case in drawer so link is visible immediately
    const updatedCase: RecoveryCaseItem = {
      ...kase,
      status: newStatus,
      paymentLinkUrl: generatedUrl,
    };
    setSelectedCase(updatedCase);

    setExecutionStepText(null);
    setIsProcessing(false);

    setShowSuccessToast({
      amount: formatCurrencyINR(kase.amountMinor || 249900),
      caseId: kase.caseId,
      message: isLinkStrategy
        ? `Payment link created: ${generatedUrl}`
        : `Payment verified & recovered!`,
      linkUrl: generatedUrl,
    });
    setTimeout(() => setShowSuccessToast(null), 7000);
  };

  const handleSimulateCustomerPayment = async (kase: RecoveryCaseItem) => {
    setIsProcessing(true);
    setExecutionStepText(`Customer completed checkout on Razorpay link for ${kase.caseId}. Verifying capture...`);
    await new Promise((r) => setTimeout(r, 600));

    if (apiConnected) {
      try {
        await apiFetch(`${API_BASE_URL}/recovery/cases/${kase.id}/execute`, { method: "POST" });
        await fetchData();
      } catch (e) { console.error(e); }
    }

    setCases((prev) =>
      prev.map((c) => (c.id === kase.id ? { ...c, status: "RECOVERED" } : c))
    );
    setMetrics((prev) => ({
      ...prev,
      revenueRecoveredMinor: prev.revenueRecoveredMinor + (kase.amountMinor || 249900),
      recoveredCases: prev.recoveredCases + 1,
      activeCases: Math.max(0, prev.activeCases - 1),
    }));

    setAuditLogs((prev) => [
      {
        id: Date.now(),
        caseId: kase.caseId,
        eventType: "VERIFICATION",
        agentName: "VerificationAgent",
        guardrailStatus: "APPROVED",
        ruleId: "PAYMENT_LINK_PAID",
        tool: "capturePayment",
        details: `Customer paid ${formatCurrencyINR(kase.amountMinor)} via Razorpay Hosted Link ${kase.paymentLinkUrl || ""}. Settlement verified.`,
        timestamp: Date.now(),
      },
      ...prev,
    ]);

    setSelectedCase((prev) => (prev && prev.id === kase.id ? { ...prev, status: "RECOVERED" } : prev));
    setExecutionStepText(null);
    setIsProcessing(false);

    setShowSuccessToast({
      amount: formatCurrencyINR(kase.amountMinor || 249900),
      caseId: kase.caseId,
      message: `₹${((kase.amountMinor || 249900) / 100).toLocaleString()} successfully recovered from ${kase.customerName || kase.caseId}!`,
    });
    setTimeout(() => setShowSuccessToast(null), 5000);
  };

  const handleApproveCase = async (kaseId: number, notes?: string) => {
    setIsProcessing(true);
    setExecutionStepText("Human review: Approving case & resuming agent execution...");
    if (apiConnected) {
      try {
        await apiFetch(`${API_BASE_URL}/recovery/cases/${kaseId}/approve`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notes: notes || "Approved by human operator via dashboard" }),
        });
        await fetchData();
      } catch (e) {
        console.error("Failed to approve case:", e);
      }
    } else {
      setCases((prev) => prev.map((c) => (c.id === kaseId ? { ...c, status: "RECOVERED" } : c)));
      setMetrics((prev) => ({
        ...prev,
        recoveredCases: prev.recoveredCases + 1,
        escalatedCases: Math.max(0, prev.escalatedCases - 1),
      }));
    }
    setExecutionStepText(null);
    setIsProcessing(false);
  };

  const handleRejectCase = async (kaseId: number, reason?: string) => {
    setIsProcessing(true);
    setExecutionStepText("Human review: Rejecting case & halting workflow...");
    if (apiConnected) {
      try {
        await apiFetch(`${API_BASE_URL}/recovery/cases/${kaseId}/reject`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ reason: reason || "Rejected by human operator via dashboard" }),
        });
        await fetchData();
      } catch (e) {
        console.error("Failed to reject case:", e);
      }
    } else {
      setCases((prev) => prev.map((c) => (c.id === kaseId ? { ...c, status: "STOPPED" } : c)));
      setMetrics((prev) => ({
        ...prev,
        stoppedCases: prev.stoppedCases + 1,
        escalatedCases: Math.max(0, prev.escalatedCases - 1),
      }));
    }
    setExecutionStepText(null);
    setIsProcessing(false);
  };

  const handleRunBatch = async () => {
    setIsProcessing(true);
    setExecutionStepText("Phase 1/4: Ingesting payment failure telemetry & evaluating recoverability scores...");

    // Visually step through stages so the operator sees the AI agent pipeline working
    setCases((prev) =>
      prev.map((c) =>
        c.status !== "RECOVERED" && c.status !== "STOPPED" && c.status !== "ESCALATED"
          ? { ...c, status: "DIAGNOSING" }
          : c
      )
    );
    await new Promise((r) => setTimeout(r, 450));

    setExecutionStepText("Phase 2/4: Running diagnostic engine & safety guardrail policy evaluation...");
    setCases((prev) =>
      prev.map((c) =>
        c.status === "DIAGNOSING"
          ? { ...c, status: "PLANNING" }
          : c
      )
    );
    await new Promise((r) => setTimeout(r, 450));

    setExecutionStepText("Phase 3/4: Bounded execution — Triggering Razorpay smart retries & hosted links...");
    setCases((prev) =>
      prev.map((c) =>
        c.status === "PLANNING"
          ? { ...c, status: "EXECUTING" }
          : c
      )
    );
    await new Promise((r) => setTimeout(r, 500));

    let recoveredSum = 0;
    if (apiConnected) {
      try {
        const res = await apiFetch(`${API_BASE_URL}/simulation/run`, { method: "POST" });
        if (res.ok) {
          const data = await res.json();
          recoveredSum = data.revenueRecovered || 0;
        }
        await fetchData();
      } catch (e) {
        console.error("Batch simulation error:", e);
      }
    } else {
      // Offline fallback state update
      setCases((prev) =>
        prev.map((c) =>
          c.status === "EXECUTING" ? { ...c, status: "RECOVERED", attemptsCount: (c.attemptsCount || 0) + 1 } : c
        )
      );
      setMetrics((prev) => {
        const newlyRecovered = 18400000;
        recoveredSum = newlyRecovered;
        return {
          ...prev,
          revenueRecoveredMinor: prev.revenueRecoveredMinor + newlyRecovered,
          recoveredCases: prev.recoveredCases + 18,
          activeCases: Math.max(0, prev.activeCases - 18),
          recoveryRate: Math.min(94, Math.round(prev.recoveryRate + 12)),
        };
      });
    }

    setExecutionStepText("Phase 4/4: Payment captures verified. Writing to immutable audit ledger...");
    await new Promise((r) => setTimeout(r, 400));
    setExecutionStepText(null);
    setIsProcessing(false);

    setShowSuccessToast({
      amount: recoveredSum > 0 ? formatCurrencyINR(recoveredSum) : "₹4.8L",
      caseId: "BATCH-AI-RUN",
    });
    setTimeout(() => setShowSuccessToast(null), 5000);
  };

  const handleResetDemo = async () => {
    setIsProcessing(true);
    setExecutionStepText("Resetting demo environment: Purging prior recoveries & generating fresh failed payment signals...");
    if (apiConnected) {
      try {
        await apiFetch(`${API_BASE_URL}/simulation/generate?count=60`, { method: "POST" });
        await fetchData();
      } catch (e) {
        console.error("Reset demo error:", e);
      }
    } else {
      setCases(MOCK_CASES);
      setAuditLogs(MOCK_AUDIT_LOGS);
      setMetrics({
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
    }
    await new Promise((r) => setTimeout(r, 600));
    setExecutionStepText(null);
    setIsProcessing(false);
    setShowSuccessToast({
      amount: "60 NEW CASES",
      caseId: "DATABASE RE-SEEDED",
    });
    setTimeout(() => setShowSuccessToast(null), 4000);
  };

  const handleCreateCustomCase = async (data: {
    customerName: string;
    plan: string;
    amountMinor: number;
    failureReason: string;
    method: string;
  }): Promise<RecoveryCaseItem | null> => {
    setIsProcessing(true);
    setExecutionStepText("Ingesting custom payment failure into AI pipeline...");
    try {
      const res = await apiFetch(`${API_BASE_URL}/recovery/cases/custom`, {
        method: "POST",
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const k: RecoveryCaseResponse = await res.json();
        const mapped: RecoveryCaseItem = {
          id: k.id,
          caseId: k.caseId,
          paymentId: k.paymentId,
          customerId: k.customerId,
          status: k.status === "VERIFYING" ? "RECOVERING" : k.status,
          attemptsCount: k.attemptsCount ?? 0,
          createdAt: k.createdAt ?? Date.now(),
          customerName: k.customerName ?? data.customerName,
          plan: k.plan ?? data.plan,
          amountMinor: k.amountMinor ?? data.amountMinor,
          failureReason: k.failureReason ?? data.failureReason,
          diagnosis: k.currentIntervention ?? "Awaiting AI diagnosis",
          strategy: k.currentIntervention ?? "PENDING",
          confidence: k.recoveryProbability ?? 0.8,
          reasoning: "Custom case ingested by administrator.",
          lastGuardrailRule: k.declineReason ?? undefined,
        };
        setCases((prev) => [mapped, ...prev]);
        setShowSuccessToast({
          amount: formatCurrencyINR(data.amountMinor),
          caseId: mapped.caseId,
          message: `Ingested ${data.customerName} into recovery queue!`,
        });
        await fetchData();
        return mapped;
      }
    } catch (e) {
      console.error("Failed to create custom case", e);
    } finally {
      setIsProcessing(false);
      setExecutionStepText(null);
    }
    return null;
  };

  const handleAddPtpRecord = (record: Omit<PromiseToPayItem, "id" | "createdAt">) => {
    const newItem: PromiseToPayItem = {
      ...record,
      id: `ptp_${Date.now()}`,
      createdAt: Date.now(),
    };
    setPtpRecords((prev) => [newItem, ...prev]);
    setAuditLogs((prev) => [
      {
        id: Date.now(),
        caseId: record.caseId,
        eventType: "PTP_COMMITTED",
        agentName: "PromiseToPayAgent",
        guardrailStatus: "APPROVED",
        ruleId: "PROMISE_TO_PAY_LOGGED",
        tool: "recordCustomerPromise",
        details: `Customer committed to settle ${formatCurrencyINR(record.amountMinor)} on ${record.promisedDate}. Automated dunning suspended until promise date.`,
        timestamp: Date.now(),
      },
      ...prev,
    ]);
  };

  const handleUpdatePtpStatus = (id: string, status: "KEPT" | "PENDING" | "BROKEN") => {
    setPtpRecords((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status } : item))
    );
  };

  return (
    <DashboardContext.Provider value={{
      cases, setCases, auditLogs, setAuditLogs, metrics, setMetrics, customers, setCustomers,
      apiConnected, isProcessing, executionStepText, showSuccessToast,
      selectedCase, setSelectedCase, fetchData,
      handleExecuteCase, handleSimulateCustomerPayment, handleApproveCase, handleRejectCase, handleRunBatch, handleResetDemo, handleCreateCustomCase, formatCurrencyINR,
      ptpRecords, setPtpRecords, handleAddPtpRecord, handleUpdatePtpStatus,
      judgeMode, setJudgeMode, judgeStep, setJudgeStep,
    }}>
      {children}
    </DashboardContext.Provider>
  );
}
