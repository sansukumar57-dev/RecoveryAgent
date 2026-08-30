package com.recovery.domain;

import java.util.Set;

public enum CaseStatus {
    DETECTED,
    DIAGNOSING,
    PLANNING,
    POLICY_CHECK,
    EXECUTING,
    VERIFYING,
    RECOVERED,
    RETRY_PENDING,
    ESCALATED,
    FAILED,
    STOPPED;

    /** Statuses where no further automated work should happen. */
    public static final Set<CaseStatus> TERMINAL = Set.of(RECOVERED, ESCALATED, FAILED, STOPPED);

    /**
     * Status is persisted as a String, so never call {@code SOME_ENUM.equals(string)}
     * — that is always false. Use this instead.
     */
    public boolean matches(String raw) {
        return raw != null && name().equalsIgnoreCase(raw.trim());
    }

    public static CaseStatus from(String raw) {
        if (raw == null) return null;
        for (CaseStatus s : values()) {
            if (s.matches(raw)) return s;
        }
        return null;
    }

    /** True when the case is terminal (or unrecognised, which we do not auto-run). */
    public static boolean isTerminal(String raw) {
        CaseStatus status = from(raw);
        return status != null && TERMINAL.contains(status);
    }

    /** True when the orchestrator may still act on this case. */
    public static boolean isActive(String raw) {
        CaseStatus status = from(raw);
        return status != null && !TERMINAL.contains(status);
    }
}
