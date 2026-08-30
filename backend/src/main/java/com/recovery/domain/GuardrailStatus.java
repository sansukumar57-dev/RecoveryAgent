package com.recovery.domain;

/**
 * Outcome of a SafetyEngine policy evaluation, stored on
 * {@link AgentAuditLog#getPolicyResult()}.
 */
public enum GuardrailStatus {
    APPROVED,
    DENIED,
    DENIED_STOP,
    DENIED_ESCALATE,
    DENIED_DEFER;

    public boolean matches(String raw) {
        return raw != null && name().equalsIgnoreCase(raw.trim());
    }

    public static GuardrailStatus from(String raw) {
        if (raw == null) return null;
        for (GuardrailStatus g : values()) {
            if (g.matches(raw)) return g;
        }
        return null;
    }

    public boolean isDenied() {
        return this != APPROVED;
    }
}
