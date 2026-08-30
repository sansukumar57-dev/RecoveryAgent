package com.recovery.service.simulation;

import com.recovery.domain.Customer;
import com.recovery.domain.Payment;
import com.recovery.domain.RecoveryCase;
import com.recovery.repository.CustomerRepository;
import com.recovery.repository.PaymentRepository;
import com.recovery.repository.RecoveryCaseRepository;
import com.recovery.service.actuator.RecoveryExecutorTools;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@Service
public class RevenueRiskAgent {
    private final RecoveryCaseRepository caseRepo;
    private final CustomerRepository customerRepo;
    private final PaymentRepository paymentRepo;
    private final RecoveryExecutorTools tools;
    private final RevenueRiskGraphTools graphTools;

    public RevenueRiskAgent(RecoveryCaseRepository caseRepo, CustomerRepository customerRepo,
                            PaymentRepository paymentRepo, RecoveryExecutorTools tools,
                            RevenueRiskGraphTools graphTools) {
        this.caseRepo = caseRepo;
        this.customerRepo = customerRepo;
        this.paymentRepo = paymentRepo;
        this.tools = tools;
        this.graphTools = graphTools;
    }

    @Transactional
    public RecoveryCase detectAndCreateCase(Payment payment) {
        // If a case already exists for this payment, return it
        if (caseRepo.findByPaymentId(payment.getPaymentId()).isPresent()) {
            return caseRepo.findByPaymentId(payment.getPaymentId()).get();
        }

        Customer customer = customerRepo.findById(payment.getCustomerId()).orElse(null);
        String customerRecoverability = (customer != null) ? customer.getRecoverability() : "medium";

        // Calculate risk score (0.0 to 1.0)
        double riskScore = 0.5; // default base
        if ("low".equalsIgnoreCase(customerRecoverability)) {
            riskScore = 0.8;
        } else if ("medium".equalsIgnoreCase(customerRecoverability)) {
            riskScore = 0.5;
        } else if ("high".equalsIgnoreCase(customerRecoverability)) {
            riskScore = 0.2;
        }

        // Adjust risk based on decline reason
        String code = payment.getFailureReason();
        if ("stolen_card".equalsIgnoreCase(code) || "lost_card".equalsIgnoreCase(code)) {
            riskScore = 0.95; // Extreme risk (fraud)
        } else if ("card_expired".equalsIgnoreCase(code)) {
            riskScore = 0.7; // High risk (requires user action)
        } else if ("insufficient_funds".equalsIgnoreCase(code)) {
            riskScore = 0.4; // Medium-low risk (could succeed on retry or later)
        }

        // Calculate initial recovery probability
        double recoveryProbability = 1.0 - riskScore;

        RecoveryCase kase = new RecoveryCase();
        kase.setPaymentId(payment.getPaymentId());
        kase.setCustomerId(payment.getCustomerId());
        kase.setStatus("DETECTED");
        kase.setRiskScore(riskScore);
        kase.setRecoveryProbability(recoveryProbability);
        kase.setDeclineReason(code);
        kase.setAttemptsCount(0);
        kase.setDateCreated(System.currentTimeMillis());
        kase.setDateUpdated(System.currentTimeMillis());

        RecoveryCase saved = caseRepo.save(kase);
        // Derive caseId from the DB-generated primary key — atomic, no duplicate IDs
        saved.setCaseId("RC-" + (1000 + saved.getId()));
        caseRepo.save(saved);

        tools.recordAuditEvent(saved.getCaseId(), "RevenueRiskAgent", "STATE_TRANSITION",
                "DETECTED", "Detected failed payment for ₹" + (payment.getAmountMinor() / 100.0) + " at risk.", "APPROVED", "EXECUTED");

        return saved;
    }

    /**
     * Graph tool: returns the correlated-failure cohort context for a payment's
     * customer — which risk cluster they belong to and that cluster's share of
     * total at-risk revenue. Used by the agent to prioritise correlated risk.
     */
    public Map<String, Object> graphRiskContext(String paymentId) {
        Payment payment = paymentRepo.findByPaymentId(paymentId).orElse(null);
        if (payment == null) {
            return Map.of("found", false);
        }
        Long customerId = payment.getCustomerId();
        String cohortKey = payment.getFailureReason() + " / " + payment.getMethod();

        Map<String, Object> match = graphTools.riskClusters().stream()
                .filter(c -> cohortKey.equals(c.get("cohort")))
                .findFirst()
                .map(c -> (Map<String, Object>) c)
                .orElse(Map.of("cohort", cohortKey, "customerCount", 0, "atRiskMinor", 0L, "shareOfTotalRisk", 0.0));

        Map<String, Object> context = new LinkedHashMap<>();
        context.put("found", true);
        context.put("customerId", customerId);
        context.put("cohort", cohortKey);
        context.put("cohortCustomerCount", match.get("customerCount"));
        context.put("cohortAtRiskMinor", match.get("atRiskMinor"));
        context.put("cohortShareOfTotalRiskPct", match.get("shareOfTotalRisk"));
        context.put("inCorrelatedCluster", (Integer) match.get("customerCount") > 1);
        return context;
    }
}
