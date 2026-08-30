package com.recovery.domain;

/**
 * Bounded recovery actions the agent may execute. Mirrors the tool names used
 * by RecoveryExecutorTools and the strategies returned by the diagnosis agent.
 */
public enum ActionType {
    RETRY_PAYMENT,
    RETRY_LATER,
    CREATE_PAYMENT_LINK,
    SEND_MESSAGE,
    OFFER_INCENTIVE,
    ESCALATE,
    STOP;

    public boolean matches(String raw) {
        return raw != null && name().equalsIgnoreCase(raw.trim());
    }

    public static ActionType from(String raw) {
        if (raw == null) return null;
        for (ActionType a : values()) {
            if (a.matches(raw)) return a;
        }
        return null;
    }

    /** True when the action moves money or contacts the customer. */
    public boolean isCustomerFacing() {
        return this == CREATE_PAYMENT_LINK || this == SEND_MESSAGE || this == OFFER_INCENTIVE;
    }
}
