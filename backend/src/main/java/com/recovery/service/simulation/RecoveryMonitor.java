package com.recovery.service.simulation;

import com.recovery.domain.Payment;
import com.recovery.domain.RecoveryCase;
import com.recovery.domain.PaymentAttempt;
import com.recovery.repository.PaymentRepository;
import com.recovery.repository.RecoveryCaseRepository;
import com.recovery.repository.PaymentAttemptRepository;
import com.recovery.service.actuator.RecoveryExecutorTools;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class RecoveryMonitor {
    private final RecoveryCaseRepository caseRepo;
    private final PaymentRepository paymentRepo;
    private final PaymentAttemptRepository attemptRepo;
    private final RecoveryExecutorTools tools;

    public RecoveryMonitor(RecoveryCaseRepository caseRepo, PaymentRepository paymentRepo,
                           PaymentAttemptRepository attemptRepo, RecoveryExecutorTools tools) {
        this.caseRepo = caseRepo;
        this.paymentRepo = paymentRepo;
        this.attemptRepo = attemptRepo;
        this.tools = tools;
    }

    public boolean verifyAndSyncStatus(RecoveryCase kase) {
        Payment payment = paymentRepo.findByPaymentId(kase.getPaymentId()).orElse(null);
        if (payment == null) return false;

        // Check if payment is SUCCESS
        if ("SUCCESS".equalsIgnoreCase(payment.getStatus())) {
            kase.setStatus("RECOVERED");
            kase.setDateUpdated(System.currentTimeMillis());
            caseRepo.save(kase);
            tools.recordAuditEvent(kase.getCaseId(), "VerificationAgent", "STATE_TRANSITION", 
                    "RECOVERED", "Payment successfully verified as recovered.", "APPROVED", "EXECUTED");
            return true;
        }

        // Check if any payment attempt was successful
        List<PaymentAttempt> attempts = attemptRepo.findByCaseIdOrderByTimestampAsc(kase.getCaseId());
        for (PaymentAttempt att : attempts) {
            if ("SUCCESS".equalsIgnoreCase(att.getStatus())) {
                payment.setStatus("SUCCESS");
                paymentRepo.save(payment);
                
                kase.setStatus("RECOVERED");
                kase.setDateUpdated(System.currentTimeMillis());
                caseRepo.save(kase);
                tools.recordAuditEvent(kase.getCaseId(), "VerificationAgent", "STATE_TRANSITION", 
                        "RECOVERED", "Payment successfully verified as recovered via attempt " + att.getGatewayAttemptId(), "APPROVED", "EXECUTED");
                return true;
            }
        }

        return false;
    }
}
