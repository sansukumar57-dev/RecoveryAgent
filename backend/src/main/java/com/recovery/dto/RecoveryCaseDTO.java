package com.recovery.dto;

import com.recovery.domain.Customer;
import com.recovery.domain.Payment;
import com.recovery.domain.RecoveryCase;

/**
 * API view of a recovery case. Enriched with the customer name and payment
 * amount so the dashboard does not have to guess or fall back to placeholders,
 * and deliberately excludes internal DB columns.
 */
public class RecoveryCaseDTO {
    private Long id;
    private String caseId;
    private String paymentId;
    private Long customerId;
    private String status;
    private Integer attemptsCount;
    private Long createdAt;
    private Long updatedAt;

    private Double riskScore;
    private Double recoveryProbability;
    private String declineReason;
    private String currentIntervention;

    // enriched (joined) fields
    private String customerName;
    private String plan;
    private Long amountMinor;
    private String currency;
    private String failureReason;
    private String method;

    public static RecoveryCaseDTO from(RecoveryCase kase, Customer customer, Payment payment) {
        RecoveryCaseDTO dto = new RecoveryCaseDTO();
        dto.id = kase.getId();
        dto.caseId = kase.getCaseId();
        dto.paymentId = kase.getPaymentId();
        dto.customerId = kase.getCustomerId();
        dto.status = kase.getStatus();
        dto.attemptsCount = kase.getAttemptsCount() != null ? kase.getAttemptsCount() : 0;
        dto.createdAt = kase.getDateCreated();
        dto.updatedAt = kase.getDateUpdated();
        dto.riskScore = kase.getRiskScore();
        dto.recoveryProbability = kase.getRecoveryProbability();
        dto.declineReason = kase.getDeclineReason();
        dto.currentIntervention = kase.getCurrentIntervention();

        dto.customerName = customer != null && customer.getName() != null
                ? customer.getName()
                : "Customer #" + kase.getCustomerId();
        dto.plan = customer != null ? customer.getPlan() : null;

        if (payment != null) {
            dto.amountMinor = payment.getAmountMinor() != null ? payment.getAmountMinor().longValue() : null;
            dto.currency = payment.getCurrency();
            dto.failureReason = payment.getFailureReason() != null ? payment.getFailureReason() : kase.getDeclineReason();
            dto.method = payment.getMethod();
        } else {
            dto.failureReason = kase.getDeclineReason();
        }
        return dto;
    }

    public Long getId() { return id; }
    public String getCaseId() { return caseId; }
    public String getPaymentId() { return paymentId; }
    public Long getCustomerId() { return customerId; }
    public String getStatus() { return status; }
    public Integer getAttemptsCount() { return attemptsCount; }
    public Long getCreatedAt() { return createdAt; }
    public Long getUpdatedAt() { return updatedAt; }
    public Double getRiskScore() { return riskScore; }
    public Double getRecoveryProbability() { return recoveryProbability; }
    public String getDeclineReason() { return declineReason; }
    public String getCurrentIntervention() { return currentIntervention; }
    public String getCustomerName() { return customerName; }
    public String getPlan() { return plan; }
    public Long getAmountMinor() { return amountMinor; }
    public String getCurrency() { return currency; }
    public String getFailureReason() { return failureReason; }
    public String getMethod() { return method; }
}
