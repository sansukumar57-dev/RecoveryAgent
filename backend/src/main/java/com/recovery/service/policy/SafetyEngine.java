package com.recovery.service.policy;

import com.recovery.domain.Customer;
import com.recovery.domain.Payment;
import com.recovery.domain.RecoveryCase;
import com.recovery.domain.RecoveryAction;
import com.recovery.repository.RecoveryActionRepository;
import com.recovery.repository.CustomerRepository;
import com.recovery.repository.PaymentRepository;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.List;

@Service
public class SafetyEngine {
    private final RecoveryActionRepository actionRepo;
    private final CustomerRepository customerRepo;
    private final PaymentRepository paymentRepo;
    private final com.recovery.repository.GatewayConfigRepository configRepo;

    // Configurable thresholds (minor units)
    private static final int MAX_RETRIES = 3;
    private static final int MAX_ATTEMPTS_PER_DAY = 2;
    private static final int MAX_INCENTIVE_PERCENTAGE = 10;
    private static final int HIGH_VALUE_THRESHOLD = 2500000; // ₹25,000
    private static final int DISCOUNT_MAX_AMOUNT = 200000; // ₹2,000

    public SafetyEngine(RecoveryActionRepository actionRepo, CustomerRepository customerRepo, PaymentRepository paymentRepo, com.recovery.repository.GatewayConfigRepository configRepo) {
        this.actionRepo = actionRepo;
        this.customerRepo = customerRepo;
        this.paymentRepo = paymentRepo;
        this.configRepo = configRepo;
    }

    public static record SafetyResult(boolean approved, String finalAction, String reason, String ruleId) {}

    public SafetyResult evaluate(RecoveryCase kase, String proposedAction, Integer incentivePercent) {
        Customer customer = customerRepo.findById(kase.getCustomerId()).orElse(null);
        Payment payment = paymentRepo.findByPaymentId(kase.getPaymentId()).orElse(null);

        if (customer == null || payment == null) {
            return new SafetyResult(false, "STOP", "Customer or Payment context not found", "ERROR_CONTEXT");
        }

        // 1. Consent Stop (R4) - Opt-Out or Dispute
        if (Boolean.TRUE.equals(customer.getOptOut())) {
            return new SafetyResult(false, "STOP", "Customer opted out of communication", "R4_OPT_OUT");
        }
        if (Boolean.TRUE.equals(customer.getDispute())) {
            return new SafetyResult(false, "ESCALATE", "Customer has active dispute", "R4_DISPUTE");
        }

        // 2. Fraud Route / Stolen Card (R7)
        if ("stolen_card".equalsIgnoreCase(payment.getFailureReason()) || "lost_card".equalsIgnoreCase(payment.getFailureReason())) {
            return new SafetyResult(false, "ESCALATE", "Potential fraud/stolen card detected", "R7_FRAUD");
        }

        // 3. High-Value Route / Human Approval (R6)
        int highValueThreshold = configRepo.findById("policy.high_value_threshold").map(c -> Integer.parseInt(c.getValue())).orElse(HIGH_VALUE_THRESHOLD);
        if (payment.getAmountMinor() > highValueThreshold) {
            return new SafetyResult(false, "ESCALATE", "Payment amount exceeds auto-execution limit of ₹" + (highValueThreshold / 100), "R6_HIGH_VALUE");
        }

        // 4. Max Retries Check (R3)
        int maxRetries = configRepo.findById("policy.max_retries").map(c -> Integer.parseInt(c.getValue())).orElse(MAX_RETRIES);
        if ("RETRY_PAYMENT".equals(proposedAction)) {
            if (payment.getRetryCount() >= maxRetries || kase.getAttemptsCount() >= maxRetries) {
                return new SafetyResult(false, "CREATE_PAYMENT_LINK", "Payment retry limit exceeded (" + maxRetries + ")", "R3_MAX_RETRIES");
            }
            if ("card_expired".equalsIgnoreCase(payment.getFailureReason())) {
                return new SafetyResult(false, "CREATE_PAYMENT_LINK", "Cannot auto-retry an expired card", "R3_EXPIRED_CARD");
            }
        }

        // 5. Max Daily Attempts (R2)
        long oneDayAgo = System.currentTimeMillis() - (24 * 60 * 60 * 1000);
        List<RecoveryAction> pastActions = actionRepo.findByCaseIdOrderByTimestampAsc(kase.getCaseId());
        long dailyAttempts = pastActions.stream()
                .filter(a -> a.getTimestamp() > oneDayAgo && !"STOP".equals(a.getType()) && !"ESCALATE".equals(a.getType()))
                .count();
        if (dailyAttempts >= MAX_ATTEMPTS_PER_DAY) {
            return new SafetyResult(false, "STOP", "Exceeded maximum daily recovery attempts (" + MAX_ATTEMPTS_PER_DAY + ")", "R2_DAILY_LIMIT");
        }

        // 6. Quiet Hours (R1)
        boolean quietHoursEnabled = configRepo.findById("policy.quiet_hours_enabled").map(c -> Boolean.parseBoolean(c.getValue())).orElse(true);
        if (quietHoursEnabled) {
            int qStart = configRepo.findById("policy.quiet_hours_start").map(c -> Integer.parseInt(c.getValue())).orElse(20);
            int qEnd = configRepo.findById("policy.quiet_hours_end").map(c -> Integer.parseInt(c.getValue())).orElse(8);
            ZonedDateTime nowKolkata = Instant.now().atZone(ZoneId.of("Asia/Kolkata"));
            int hour = nowKolkata.getHour();
            if ((qStart > qEnd && (hour >= qStart || hour < qEnd)) || (qStart < qEnd && (hour >= qStart && hour < qEnd))) {
                return new SafetyResult(false, "RETRY_LATER", "Action proposed during quiet hours (" + qStart + ":00 - " + qEnd + ":00). Deferring to 09:30", "R1_QUIET_HOURS");
            }
        }

        // 7. Discount / Incentive Cap (R5)
        int maxIncentive = configRepo.findById("policy.max_incentive_percent").map(c -> Integer.parseInt(c.getValue())).orElse(MAX_INCENTIVE_PERCENTAGE);
        if (incentivePercent != null && incentivePercent > 0) {
            if (incentivePercent > maxIncentive) {
                return new SafetyResult(false, proposedAction, "Requested incentive " + incentivePercent + "% exceeds cap of " + MAX_INCENTIVE_PERCENTAGE + "%", "R5_INCENTIVE_CAP");
            }
            int discountValue = (payment.getAmountMinor() * incentivePercent) / 100;
            if (discountValue > DISCOUNT_MAX_AMOUNT) {
                return new SafetyResult(false, proposedAction, "Incentive discount exceeds maximum allowed value of ₹2,000", "R5_INCENTIVE_VAL");
            }
        }

        // 8. Prevent Immediate Duplicate Actions
        if (!pastActions.isEmpty()) {
            RecoveryAction lastAction = pastActions.get(pastActions.size() - 1);
            if (lastAction.getType().equals(proposedAction) && "FAILED".equals(lastAction.getStatus())) {
                // If the last identical action failed within 1 hour, prevent immediate repeat
                long oneHourAgo = System.currentTimeMillis() - (60 * 60 * 1000);
                if (lastAction.getTimestamp() > oneHourAgo) {
                    if ("RETRY_PAYMENT".equals(proposedAction)) {
                        return new SafetyResult(false, "CREATE_PAYMENT_LINK", "Immediate retry failed. Switching to Payment Link.", "R2_PREVENT_DUP");
                    } else if ("CREATE_PAYMENT_LINK".equals(proposedAction)) {
                        return new SafetyResult(false, "SEND_MESSAGE", "Payment Link generated but unpaid. Sending reminder message.", "R2_PREVENT_DUP");
                    }
                }
            }
        }

        return new SafetyResult(true, proposedAction, "Approved by safety engine", "APPROVED");
    }
}
