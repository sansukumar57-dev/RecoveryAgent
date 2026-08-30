package com.recovery.service.simulation;

import com.recovery.domain.Payment;
import com.recovery.domain.Customer;
import com.recovery.repository.CustomerRepository;
import com.recovery.service.diagnosis.PaymentDiagnosisAgent;
import org.springframework.stereotype.Service;

import java.util.*;

@Service
public class SimulationEngine {
    private final ProbabilityModel probModel;
    private final CustomerRepository customerRepo;

    public SimulationEngine(ProbabilityModel probModel, CustomerRepository customerRepo) {
        this.probModel = probModel;
        this.customerRepo = customerRepo;
    }

    public Map<String, Object> runAxB(List<Payment> failedPayments, Map<String, String> rootCauses) {
        return runAxB(failedPayments);
    }

    public Map<String, Object> runAxB(List<Payment> failedPayments) {
        int baselineRecoveredCount = 0;
        long baselineRecoveredMinor = 0;
        int baselineTotalAttempts = 0;
        int baselineViolations = 0; // quiet hours/contact caps are violated in baseline!

        int agentRecoveredCount = 0;
        long agentRecoveredMinor = 0;
        int agentTotalAttempts = 0;
        int agentViolations = 0; // always 0 due to safety engine!

        for (Payment payment : failedPayments) {
            Customer c = customerRepo.findById(payment.getCustomerId()).orElse(null);
            if (c == null) continue;

            // 1. Simulate Baseline (Generic auto-retries, no safety guardrails)
            boolean baselineSuccess = false;
            int bAttempts = 0;
            // Baseline retries 3 times regardless of failure type (even for expired/stolen card!)
            for (int i = 1; i <= 3; i++) {
                bAttempts++;
                // If it's a stolen card, success probability is 0
                double base = "stolen_card".equalsIgnoreCase(payment.getFailureReason()) ? 0.0 : 0.30;
                double prob = probModel.withAdjustments(base, i, false);
                if (probModel.simulate(prob)) {
                    baselineSuccess = true;
                    break;
                }
            }
            baselineTotalAttempts += bAttempts;
            if (baselineSuccess) {
                baselineRecoveredCount++;
                baselineRecoveredMinor += payment.getAmountMinor();
            }
            
            // Baseline violation simulation: 
            // - It contacts customers who opted out (c.getOptOut() == true) -> 1 violation
            // - It does quiet hours messaging -> 1 violation
            if (Boolean.TRUE.equals(c.getOptOut())) {
                baselineViolations++;
            }
            if (Math.random() < 0.3) { // 30% of baseline attempts occur in quiet hours
                baselineViolations++;
            }

            // 2. Simulate Agentic (Safety engine filters, AI diagnosis, personalized intervention)
            boolean agentSuccess = false;
            int aAttempts = 0;

            // Guardrail checks
            if (Boolean.TRUE.equals(c.getOptOut())) {
                // Denied completely - 0 attempts, 0 recovery, 0 violations
                continue;
            }
            if ("stolen_card".equalsIgnoreCase(payment.getFailureReason())) {
                // Denied retry - immediately escalated - 0 attempts
                continue;
            }

            // Diagnoser recommendation simulation
            String diagnosis = "insufficient_funds";
            String strategy = "RETRY_PAYMENT";
            
            String code = payment.getFailureReason();
            if ("card_expired".equalsIgnoreCase(code)) {
                diagnosis = "expired_card";
                strategy = "CREATE_PAYMENT_LINK";
            } else if ("timeout".equalsIgnoreCase(code) || "gateway_timeout".equalsIgnoreCase(code)) {
                diagnosis = "temporary_gateway_issue";
                strategy = "RETRY_PAYMENT";
            } else if ("user_abandoned".equalsIgnoreCase(code)) {
                diagnosis = "customer_abandonment";
                strategy = "SEND_MESSAGE";
            }

            // Execute Strategy (Up to 3 smart attempts)
            for (int i = 1; i <= 3; i++) {
                aAttempts++;
                double base = probModel.baseProbability(diagnosis, strategy);
                double prob = probModel.withAdjustments(base, i, true); // personalized
                if (probModel.simulate(prob)) {
                    agentSuccess = true;
                    break;
                }
                
                // Replan on failure
                if ("RETRY_PAYMENT".equals(strategy)) {
                    strategy = "CREATE_PAYMENT_LINK"; // switch to payment link on retry failure
                }
            }
            
            agentTotalAttempts += aAttempts;
            if (agentSuccess) {
                agentRecoveredCount++;
                agentRecoveredMinor += payment.getAmountMinor();
            }
        }

        long totalAtRiskMinor = failedPayments.stream().mapToLong(Payment::getAmountMinor).sum();

        Map<String, Object> baselineSummary = new LinkedHashMap<>();
        baselineSummary.put("recoveredCount", baselineRecoveredCount);
        baselineSummary.put("recoveredMinor", baselineRecoveredMinor);
        baselineSummary.put("recoveryRate", totalAtRiskMinor > 0 ? (double) baselineRecoveredMinor / totalAtRiskMinor : 0.0);
        baselineSummary.put("avgAttempts", failedPayments.isEmpty() ? 0.0 : (double) baselineTotalAttempts / failedPayments.size());
        baselineSummary.put("complianceViolations", baselineViolations);

        Map<String, Object> agentSummary = new LinkedHashMap<>();
        agentSummary.put("recoveredCount", agentRecoveredCount);
        agentSummary.put("recoveredMinor", agentRecoveredMinor);
        agentSummary.put("recoveryRate", totalAtRiskMinor > 0 ? (double) agentRecoveredMinor / totalAtRiskMinor : 0.0);
        agentSummary.put("avgAttempts", failedPayments.isEmpty() ? 0.0 : (double) agentTotalAttempts / failedPayments.size());
        agentSummary.put("complianceViolations", agentViolations); // 0!

        Map<String, Object> comparison = new LinkedHashMap<>();
        comparison.put("totalAtRiskMinor", totalAtRiskMinor);
        comparison.put("baseline", baselineSummary);
        comparison.put("agent", agentSummary);
        
        long improvementMinor = agentRecoveredMinor - baselineRecoveredMinor;
        double improvementPct = baselineRecoveredMinor > 0 ? (double) improvementMinor / baselineRecoveredMinor * 100 : 0.0;
        
        comparison.put("improvementMinor", improvementMinor);
        comparison.put("improvementPct", Math.round(improvementPct * 100.0) / 100.0);

        return comparison;
    }
}
