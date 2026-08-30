package com.recovery.service.simulation;

import com.recovery.domain.*;
import com.recovery.repository.*;
import com.recovery.service.actuator.RecoveryExecutorTools;
import com.recovery.service.diagnosis.CustomerCommunicationAgent;
import com.recovery.service.diagnosis.PaymentDiagnosisAgent;
import com.recovery.service.policy.SafetyEngine;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class RecoveryOrchestrator {
    private static final Logger log = LoggerFactory.getLogger(RecoveryOrchestrator.class);

    private final RecoveryCaseRepository caseRepo;
    private final PaymentRepository paymentRepo;
    private final CustomerRepository customerRepo;
    private final OrderRepository orderRepo;
    private final PaymentDiagnosisAgent diagnosisAgent;
    private final CustomerCommunicationAgent commsAgent;
    private final SafetyEngine safetyEngine;
    private final RecoveryExecutorTools tools;
    private final RecoveryMonitor monitor;

    public RecoveryOrchestrator(RecoveryCaseRepository caseRepo, PaymentRepository paymentRepo,
                                CustomerRepository customerRepo, OrderRepository orderRepo,
                                PaymentDiagnosisAgent diagnosisAgent, CustomerCommunicationAgent commsAgent,
                                SafetyEngine safetyEngine, RecoveryExecutorTools tools, RecoveryMonitor monitor) {
        this.caseRepo = caseRepo;
        this.paymentRepo = paymentRepo;
        this.customerRepo = customerRepo;
        this.orderRepo = orderRepo;
        this.diagnosisAgent = diagnosisAgent;
        this.commsAgent = commsAgent;
        this.safetyEngine = safetyEngine;
        this.tools = tools;
        this.monitor = monitor;
    }

    public RecoveryCase stepCase(String caseId) {
        RecoveryCase kase = caseRepo.findByCaseId(caseId).orElse(null);
        if (kase == null) return null;

        String oldStatus = kase.getStatus();
        if ("RECOVERED".equals(oldStatus) || "ESCALATED".equals(oldStatus) || "STOPPED".equals(oldStatus) || "FAILED".equals(oldStatus)) {
            // Already in a terminal state
            return kase;
        }

        Payment payment = paymentRepo.findByPaymentId(kase.getPaymentId()).orElse(null);
        Customer customer = customerRepo.findById(kase.getCustomerId()).orElse(null);

        if (payment == null || customer == null) {
            kase.setStatus("FAILED");
            kase.setDateUpdated(System.currentTimeMillis());
            caseRepo.save(kase);
            tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "FAILED", "Missing payment or customer context.", "APPROVED", "EXECUTED");
            return kase;
        }

        try {
            switch (oldStatus) {
                case "DETECTED":
                    kase.setStatus("DIAGNOSING");
                    tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "DIAGNOSING", "Transitioning to diagnosing phase.", "APPROVED", "EXECUTED");
                    break;

                case "DIAGNOSING":
                    PaymentDiagnosisAgent.DiagnosisResult diag = diagnosisAgent.diagnose(payment);
                    kase.setDeclineReason(diag.diagnosis());
                    kase.setRecoveryProbability(diag.confidence());
                    kase.setCurrentIntervention(diag.recommendedStrategy());
                    kase.setStatus("PLANNING");
                    
                    // Audit the diagnosis decision (Section 14: AI Explainability)
                    tools.recordAuditEvent(caseId, "DiagnosisAgent", "DECISION", diag.recommendedStrategy(), 
                            "Diagnosis: " + diag.diagnosis() + " (" + diag.confidence() + " confidence). Reason: " + diag.reasoning(), "APPROVED", "EXECUTED");
                    tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "PLANNING", "Transitioning to planning phase.", "APPROVED", "EXECUTED");
                    break;

                case "PLANNING":
                    // Setup initial proposal
                    String proposed = kase.getCurrentIntervention();
                    if (proposed == null || proposed.isBlank()) {
                        proposed = "RETRY_PAYMENT";
                    }
                    kase.setStatus("POLICY_CHECK");
                    tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "POLICY_CHECK", "Transitioning to policy check phase with action: " + proposed, "APPROVED", "EXECUTED");
                    break;

                case "POLICY_CHECK":
                    String plan = kase.getCurrentIntervention();
                    if (plan == null) plan = "RETRY_PAYMENT";
                    
                    SafetyEngine.SafetyResult safety = safetyEngine.evaluate(kase, plan, 0);
                    
                    tools.recordAuditEvent(caseId, "PolicyEngine", "POLICY_CHECK", plan, 
                            "Proposed action check. Safety engine evaluation result: " + safety.reason() + " (Rule ID: " + safety.ruleId() + ")", 
                            safety.approved() ? "APPROVED" : "DENIED", "EXECUTED");

                    if (safety.approved()) {
                        kase.setStatus("EXECUTING");
                        tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "EXECUTING", "Policy check approved. Proceeding to execution.", "APPROVED", "EXECUTED");
                    } else {
                        String nextAct = safety.finalAction();
                        if ("STOP".equals(nextAct)) {
                            kase.setStatus("STOPPED");
                            tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "STOPPED", "Policy engine blocked execution: " + safety.reason(), "DENIED", "EXECUTED");
                        } else if ("ESCALATE".equals(nextAct)) {
                            kase.setStatus("ESCALATED");
                            tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "ESCALATED", "Policy engine routed to escalation: " + safety.reason(), "DENIED", "EXECUTED");
                            tools.escalateToHuman(caseId, safety.reason());
                        } else if ("RETRY_LATER".equals(nextAct)) {
                            kase.setStatus("RETRY_PENDING");
                            tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "RETRY_PENDING", "Policy engine deferred action: " + safety.reason(), "DENIED", "EXECUTED");
                        } else {
                            // Safety engine modified the action (e.g. switches to Payment Link)
                            kase.setCurrentIntervention(nextAct);
                            kase.setStatus("EXECUTING");
                            tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "EXECUTING", "Policy engine modified action to: " + nextAct + ". Reason: " + safety.reason(), "APPROVED", "EXECUTED");
                        }
                    }
                    break;

                case "EXECUTING":
                    String actionToRun = kase.getCurrentIntervention();
                    kase.setAttemptsCount(kase.getAttemptsCount() + 1);

                    if ("RETRY_PAYMENT".equals(actionToRun)) {
                        tools.retryPayment(caseId, kase.getPaymentId());
                    } else if ("CREATE_PAYMENT_LINK".equals(actionToRun)) {
                        // Create a payment order first if needed, otherwise use payment order
                        String orderId = payment.getOrderId();
                        if (orderId == null) {
                            orderId = "order_" + UUID.randomUUID().toString().substring(0, 8);
                            payment.setOrderId(orderId);
                            paymentRepo.save(payment);
                            
                            Order order = new Order();
                            order.setOrderId(orderId);
                            order.setCustomerId(kase.getCustomerId());
                            order.setAmountMinor(payment.getAmountMinor());
                            order.setStatus("created");
                            orderRepo.save(order);
                        }
                        tools.createPaymentLink(caseId, orderId);
                    } else if ("SEND_MESSAGE".equals(actionToRun)) {
                        CustomerCommunicationAgent.MessageResult msg = commsAgent.generateMessage(customer, payment, null);
                        tools.sendRecoveryMessage(caseId, kase.getCustomerId(), msg.messageText(), "email", msg.language());
                    }

                    kase.setStatus("VERIFYING");
                    tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "VERIFYING", "Execution completed. Verifying payment status.", "APPROVED", "EXECUTED");
                    break;

                case "VERIFYING":
                    boolean recovered = monitor.verifyAndSyncStatus(kase);
                    if (recovered) {
                        // Status is updated to RECOVERED by the monitor
                        log.info("Case {} successfully recovered!", caseId);
                    } else {
                        // Check if we hit limits
                        if (kase.getAttemptsCount() >= 3) {
                            kase.setStatus("ESCALATED");
                            caseRepo.save(kase);
                            tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "ESCALATED", "Maximum retry attempts (3) exceeded. Escalating to human support.", "APPROVED", "EXECUTED");
                            tools.escalateToHuman(caseId, "Retry attempts limit exceeded");
                        } else {
                            kase.setStatus("RETRY_PENDING");
                            caseRepo.save(kase);
                            tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "RETRY_PENDING", "Verification check completed. Payment still pending. Transitioning to Retry Pending.", "APPROVED", "EXECUTED");
                        }
                    }
                    break;

                case "RETRY_PENDING":
                    // Simulates timer ticking or manual restart. We reset state to DIAGNOSING for a fresh plan cycle.
                    kase.setStatus("DIAGNOSING");
                    tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "DIAGNOSING", "Retry schedule triggered. Starting new diagnostic cycle.", "APPROVED", "EXECUTED");
                    break;

                default:
                    break;
            }
        } catch (Exception e) {
            log.error("Error stepping case: {}", e.getMessage());
            kase.setStatus("FAILED");
            caseRepo.save(kase);
            tools.recordAuditEvent(caseId, "Orchestrator", "STATE_TRANSITION", "FAILED", "Orchestrator exception: " + e.getMessage(), "APPROVED", "EXECUTED");
        }

        kase.setDateUpdated(System.currentTimeMillis());
        return caseRepo.save(kase);
    }

    public void runCaseToTermination(String caseId) {
        RecoveryCase kase = caseRepo.findByCaseId(caseId).orElse(null);
        if (kase == null) return;

        int safetyCounter = 0;
        while (safetyCounter < 20) {
            String status = kase.getStatus();
            if ("RECOVERED".equals(status) || "ESCALATED".equals(status) || "STOPPED".equals(status) || "FAILED".equals(status)) {
                break;
            }
            kase = stepCase(caseId);
            safetyCounter++;
        }
    }
}
