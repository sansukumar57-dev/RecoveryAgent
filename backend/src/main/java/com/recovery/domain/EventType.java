package com.recovery.domain;

/**
 * Audit event categories written to {@link AgentAuditLog#getEventType()}.
 */
public enum EventType {
    STATE_TRANSITION,
    DECISION,
    TOOL_EXECUTION,
    POLICY_CHECK,
    VERIFICATION;

    public boolean matches(String raw) {
        return raw != null && name().equalsIgnoreCase(raw.trim());
    }

    public static EventType from(String raw) {
        if (raw == null) return null;
        for (EventType e : values()) {
            if (e.matches(raw)) return e;
        }
        return null;
    }
}
