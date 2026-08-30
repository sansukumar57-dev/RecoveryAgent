package com.recovery.domain;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

/**
 * Guards the bug these enums were introduced to fix: status columns are Strings,
 * so {@code SOME_ENUM.equals(string)} is always false and silently breaks filters.
 */
class StatusEnumTest {

    @Test
    @DisplayName("enum.equals(String) is always false — proving why matches() is required")
    void enumEqualsStringIsAlwaysFalse() {
        assertFalse(CaseStatus.RECOVERED.equals("RECOVERED"),
                "enum.equals(String) must never be used for status comparison");
        assertTrue(CaseStatus.RECOVERED.matches("RECOVERED"));
    }

    @Test
    void caseStatusMatchesIsCaseInsensitiveAndTrims() {
        assertTrue(CaseStatus.ESCALATED.matches("escalated"));
        assertTrue(CaseStatus.ESCALATED.matches("  ESCALATED  "));
        assertFalse(CaseStatus.ESCALATED.matches("ESCALATE"));
        assertFalse(CaseStatus.ESCALATED.matches(null));
    }

    @Test
    void terminalAndActiveAreMutuallyExclusive() {
        for (CaseStatus status : CaseStatus.values()) {
            String raw = status.name();
            assertNotEquals(CaseStatus.isTerminal(raw), CaseStatus.isActive(raw),
                    status + " must be exactly one of terminal/active");
        }
    }

    @Test
    void terminalStatusesAreNotRunAgain() {
        assertTrue(CaseStatus.isTerminal("RECOVERED"));
        assertTrue(CaseStatus.isTerminal("ESCALATED"));
        assertTrue(CaseStatus.isTerminal("FAILED"));
        assertTrue(CaseStatus.isTerminal("STOPPED"));
        assertTrue(CaseStatus.isActive("DETECTED"));
        assertTrue(CaseStatus.isActive("RETRY_PENDING"));
    }

    @Test
    void unknownStatusIsNeitherActiveNorTerminal() {
        // Unrecognised values must not be auto-processed.
        assertFalse(CaseStatus.isActive("BANANA"));
        assertFalse(CaseStatus.isTerminal("BANANA"));
        assertNull(CaseStatus.from("BANANA"));
    }

    @Test
    void paymentStatusHelpers() {
        assertTrue(PaymentStatus.isFailed("FAILED"));
        assertTrue(PaymentStatus.isFailed("failed"));
        assertFalse(PaymentStatus.isFailed("SUCCESS"));
        assertTrue(PaymentStatus.isSuccess("success"));
        assertFalse(PaymentStatus.isSuccess(null));
        assertEquals(PaymentStatus.PENDING, PaymentStatus.from("pending"));
    }

    @Test
    void eventTypeAndActionTypeParse() {
        assertEquals(EventType.TOOL_EXECUTION, EventType.from("tool_execution"));
        assertNull(EventType.from("nope"));
        assertEquals(ActionType.RETRY_PAYMENT, ActionType.from("retry_payment"));
        assertTrue(ActionType.SEND_MESSAGE.isCustomerFacing());
        assertFalse(ActionType.RETRY_PAYMENT.isCustomerFacing());
    }

    @Test
    void guardrailStatusDeniedDetection() {
        assertFalse(GuardrailStatus.APPROVED.isDenied());
        assertTrue(GuardrailStatus.DENIED_STOP.isDenied());
        assertTrue(GuardrailStatus.DENIED_ESCALATE.isDenied());
        assertEquals(GuardrailStatus.DENIED, GuardrailStatus.from("denied"));
    }
}
