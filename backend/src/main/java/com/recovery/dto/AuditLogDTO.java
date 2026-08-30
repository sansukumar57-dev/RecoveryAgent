package com.recovery.dto;

import com.recovery.domain.AgentAuditLog;

/**
 * API view of an audit entry. Renames internal columns to the names the
 * dashboard expects (agent -> agentName, policyResult -> guardrailStatus)
 * and collapses reason/result into a single human-readable detail string.
 */
public class AuditLogDTO {
    private Long id;
    private String caseId;
    private Long timestamp;
    private String agentName;
    private String eventType;
    private String guardrailStatus;
    private String ruleId;
    private String tool;
    private String decision;
    private String details;
    private String status;

    public static AuditLogDTO from(AgentAuditLog log) {
        AuditLogDTO dto = new AuditLogDTO();
        dto.id = log.getId();
        dto.caseId = log.getCaseId();
        dto.timestamp = log.getTimestamp();
        dto.agentName = log.getAgent();
        dto.eventType = log.getEventType();
        dto.guardrailStatus = log.getPolicyResult();
        dto.ruleId = log.getDecision();
        dto.tool = log.getTool();
        dto.decision = log.getDecision();
        dto.status = log.getStatus();

        String reason = log.getReason();
        String result = log.getResult();
        if (reason != null && result != null && !result.isBlank() && !result.equals(reason)) {
            dto.details = reason + " — " + result;
        } else if (reason != null) {
            dto.details = reason;
        } else {
            dto.details = result;
        }
        return dto;
    }

    public Long getId() { return id; }
    public String getCaseId() { return caseId; }
    public Long getTimestamp() { return timestamp; }
    public String getAgentName() { return agentName; }
    public String getEventType() { return eventType; }
    public String getGuardrailStatus() { return guardrailStatus; }
    public String getRuleId() { return ruleId; }
    public String getTool() { return tool; }
    public String getDecision() { return decision; }
    public String getDetails() { return details; }
    public String getStatus() { return status; }
}
