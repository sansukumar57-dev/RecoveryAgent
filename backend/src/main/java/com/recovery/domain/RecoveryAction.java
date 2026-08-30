package com.recovery.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "recovery_actions")
public class RecoveryAction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String caseId;
    private String type; // RETRY_PAYMENT, CREATE_PAYMENT_LINK, SEND_MESSAGE, ESCALATE, STOP
    private String status; // SUCCESS, FAILED, RUNNING
    private Long timestamp;
    
    @Column(columnDefinition = "TEXT")
    private String details;

    public RecoveryAction() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public String getType() { return type; }
    public void setType(String type) { this.type = type; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }
}
