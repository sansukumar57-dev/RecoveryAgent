package com.recovery.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "recovery_policies")
public class RecoveryPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String name = "Default Policy";
    private Integer maxRetries = 3;
    private Integer maxRecoveryAttemptsPerDay = 2;
    private Integer maxIncentivePercentage = 10;
    private Integer minEscalationAmount = 2500000; // in minor units (25000 INR)
    private Boolean stopAfterSuccess = true;
    private Boolean doNotContactAfterOptOut = true;
    private Boolean doNotRepeatAction = true;
    private Integer requireHumanApprovalAboveThreshold = 2500000; // in minor units (25000 INR)

    public RecoveryPolicy() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public Integer getMaxRetries() { return maxRetries; }
    public void setMaxRetries(Integer maxRetries) { this.maxRetries = maxRetries; }

    public Integer getMaxRecoveryAttemptsPerDay() { return maxRecoveryAttemptsPerDay; }
    public void setMaxRecoveryAttemptsPerDay(Integer maxRecoveryAttemptsPerDay) { this.maxRecoveryAttemptsPerDay = maxRecoveryAttemptsPerDay; }

    public Integer getMaxIncentivePercentage() { return maxIncentivePercentage; }
    public void setMaxIncentivePercentage(Integer maxIncentivePercentage) { this.maxIncentivePercentage = maxIncentivePercentage; }

    public Integer getMinEscalationAmount() { return minEscalationAmount; }
    public void setMinEscalationAmount(Integer minEscalationAmount) { this.minEscalationAmount = minEscalationAmount; }

    public Boolean getStopAfterSuccess() { return stopAfterSuccess; }
    public void setStopAfterSuccess(Boolean stopAfterSuccess) { this.stopAfterSuccess = stopAfterSuccess; }

    public Boolean getDoNotContactAfterOptOut() { return doNotContactAfterOptOut; }
    public void setDoNotContactAfterOptOut(Boolean doNotContactAfterOptOut) { this.doNotContactAfterOptOut = doNotContactAfterOptOut; }

    public Boolean getDoNotRepeatAction() { return doNotRepeatAction; }
    public void setDoNotRepeatAction(Boolean doNotRepeatAction) { this.doNotRepeatAction = doNotRepeatAction; }

    public Integer getRequireHumanApprovalAboveThreshold() { return requireHumanApprovalAboveThreshold; }
    public void setRequireHumanApprovalAboveThreshold(Integer requireHumanApprovalAboveThreshold) { this.requireHumanApprovalAboveThreshold = requireHumanApprovalAboveThreshold; }
}
