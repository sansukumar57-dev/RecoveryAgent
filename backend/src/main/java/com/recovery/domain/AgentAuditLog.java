package com.recovery.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "agent_audit_log")
public class AgentAuditLog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String caseId;
    private Long timestamp;
    private String agent; // RevenueRiskAgent, DiagnosisAgent, RecoveryDecisionAgent, PolicyEngine, ToolLayer, VerificationAgent
    private String eventType; // STATE_TRANSITION, DECISION, TOOL_EXECUTION, POLICY_CHECK
    
    @Column(columnDefinition = "TEXT")
    private String inputData;
    
    @Column(columnDefinition = "TEXT")
    private String decision;
    
    @Column(columnDefinition = "TEXT")
    private String reason;
    
    private String tool;
    
    @Column(columnDefinition = "TEXT")
    private String toolArguments;
    
    private String policyResult; // APPROVED, DENIED
    
    @Column(columnDefinition = "TEXT")
    private String result;
    private String status; // EXECUTED, SKIPPED, FAILED

    public AgentAuditLog() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public Long getTimestamp() { return timestamp; }
    public void setTimestamp(Long timestamp) { this.timestamp = timestamp; }

    public String getAgent() { return agent; }
    public void setAgent(String agent) { this.agent = agent; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getInputData() { return inputData; }
    public void setInputData(String inputData) { this.inputData = inputData; }

    public String getDecision() { return decision; }
    public void setDecision(String decision) { this.decision = decision; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getTool() { return tool; }
    public void setTool(String tool) { this.tool = tool; }

    public String getToolArguments() { return toolArguments; }
    public void setToolArguments(String toolArguments) { this.toolArguments = toolArguments; }

    public String getPolicyResult() { return policyResult; }
    public void setPolicyResult(String policyResult) { this.policyResult = policyResult; }

    public String getResult() { return result; }
    public void setResult(String result) { this.result = result; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
