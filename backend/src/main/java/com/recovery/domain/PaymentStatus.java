package com.recovery.domain;

/**
 * Lifecycle status of a payment as stored on {@link Payment#getStatus()}.
 * Values are persisted as strings, so use {@link #matches(String)} /
 * {@link #from(String)} instead of comparing an enum to a String directly.
 */
public enum PaymentStatus {
    CREATED,
    PENDING,
    SUCCESS,
    FAILED;

    public boolean matches(String raw) {
        return raw != null && name().equalsIgnoreCase(raw.trim());
    }

    public static PaymentStatus from(String raw) {
        if (raw == null) return null;
        for (PaymentStatus s : values()) {
            if (s.matches(raw)) return s;
        }
        return null;
    }

    public static boolean isFailed(String raw) {
        return FAILED.matches(raw);
    }

    public static boolean isSuccess(String raw) {
        return SUCCESS.matches(raw);
    }
}
