package com.recovery.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "recovery_cases")
public class RecoveryCase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String caseId; // e.g., RC-1001
    private String paymentId;
    private Long customerId;
    private String status; // DETECTED, DIAGNOSING, PLANNING, POLICY_CHECK, EXECUTING, VERIFYING, RECOVERED, RETRY_PENDING, ESCALATED, FAILED, STOPPED
    private Double riskScore;
    private Double recoveryProbability;
    private String declineReason;
    private String currentIntervention;
    private Integer attemptsCount = 0;
    private Long dateCreated;
    private Long dateUpdated;

    public RecoveryCase() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getPaymentId() { return paymentId; }
    public void setPaymentId(String paymentId) { this.paymentId = paymentId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Double getRiskScore() { return riskScore; }
    public void setRiskScore(Double riskScore) { this.riskScore = riskScore; }

    public Double getRecoveryProbability() { return recoveryProbability; }
    public void setRecoveryProbability(Double recoveryProbability) { this.recoveryProbability = recoveryProbability; }

    public String getDeclineReason() { return declineReason; }
    public void setDeclineReason(String declineReason) { this.declineReason = declineReason; }

    public String getCurrentIntervention() { return currentIntervention; }
    public void setCurrentIntervention(String currentIntervention) { this.currentIntervention = currentIntervention; }

    public Integer getAttemptsCount() { return attemptsCount; }
    public void setAttemptsCount(Integer attemptsCount) { this.attemptsCount = attemptsCount; }

    public Long getDateCreated() { return dateCreated; }
    public void setDateCreated(Long dateCreated) { this.dateCreated = dateCreated; }

    public Long getDateUpdated() { return dateUpdated; }
    public void setDateUpdated(Long dateUpdated) { this.dateUpdated = dateUpdated; }
}
