package com.recovery.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "payment_attempts")
public class PaymentAttempt {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String paymentId;
    private String caseId;
    private String gatewayAttemptId;
    private Integer amountMinor;
    private String status; // SUCCESS, FAILED
    private Long timestamp;
    private String failureReason;

    public PaymentAttempt() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getGatewayAttemptId() { return gatewayAttemptId; }
    public void setGatewayAttemptId(String gatewayAttemptId) { this.gatewayAttemptId = gatewayAttemptId; }

    public Integer getAmountMinor() { return amountMinor; }
    public void setAmountMinor(Integer amountMinor) { this.amountMinor = amountMinor; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }
}
