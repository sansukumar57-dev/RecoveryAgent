package com.recovery.dto;

import com.recovery.domain.AgentAuditLog;
import com.recovery.domain.Customer;
import com.recovery.domain.Payment;
import com.recovery.domain.RecoveryCase;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class DtoMappingTest {

    private RecoveryCase kase() {
        RecoveryCase k = new RecoveryCase();
        k.setId(40L);
        k.setCaseId("RC-1040");
        k.setPaymentId("pay_abc123");
        k.setCustomerId(3L);
        k.setStatus("ESCALATED");
        k.setAttemptsCount(2);
        k.setRiskScore(0.7);
        k.setRecoveryProbability(0.3);
        k.setDeclineReason("card_expired");
        k.setDateCreated(1000L);
        k.setDateUpdated(2000L);
        return k;
    }

    @Test
    void caseDtoEnrichesWithCustomerAndPayment() {
        Customer c = new Customer("Acme Technologies", "Enterprise", 500000, "email", false, false, "high");
        c.setId(3L);

        Payment p = new Payment();
        p.setPaymentId("pay_abc123");
        p.setAmountMinor(4800000);
        p.setCurrency("INR");
        p.setMethod("card");
        p.setFailureReason("card_expired");

        RecoveryCaseDTO dto = RecoveryCaseDTO.from(kase(), c, p);

        assertEquals("RC-1040", dto.getCaseId());
        assertEquals("Acme Technologies", dto.getCustomerName());
        assertEquals("Enterprise", dto.getPlan());
        assertEquals(4800000L, dto.getAmountMinor());
        assertEquals("card", dto.getMethod());
        assertEquals("card_expired", dto.getFailureReason());
        assertEquals(1000L, dto.getCreatedAt());
    }

    @Test
    void caseDtoFallsBackWhenJoinsMissing() {
        RecoveryCaseDTO dto = RecoveryCaseDTO.from(kase(), null, null);

        assertEquals("Customer #3", dto.getCustomerName());
        assertNull(dto.getAmountMinor());
        // decline reason still surfaces as the failure reason
        assertEquals("card_expired", dto.getFailureReason());
    }

    @Test
    void paymentDtoWidensAmountToLongWithoutOverflow() {
        Payment p = new Payment();
        p.setPaymentId("pay_big");
        p.setAmountMinor(Integer.MAX_VALUE); // ~₹2.1 crore in paise
        p.setStatus("FAILED");

        PaymentDTO dto = PaymentDTO.from(p);

        assertEquals(2147483647L, dto.getAmountMinor());
        assertTrue(dto.getAmountMinor() > 0, "amount must not overflow negative");
    }

    @Test
    void auditDtoRenamesColumnsForTheDashboard() {
        AgentAuditLog log = new AgentAuditLog();
        log.setId(7L);
        log.setCaseId("RC-1040");
        log.setAgent("SafetyEngine");
        log.setEventType("POLICY_CHECK");
        log.setPolicyResult("DENIED_ESCALATE");
        log.setDecision("MAX_AUTO_AMOUNT_LIMIT");
        log.setReason("Amount exceeds automated threshold");
        log.setResult("Escalated to human");
        log.setTimestamp(123L);

        AuditLogDTO dto = AuditLogDTO.from(log);

        assertEquals("SafetyEngine", dto.getAgentName());
        assertEquals("DENIED_ESCALATE", dto.getGuardrailStatus());
        assertEquals("MAX_AUTO_AMOUNT_LIMIT", dto.getRuleId());
        assertEquals("Amount exceeds automated threshold — Escalated to human", dto.getDetails());
    }

    @Test
    void auditDtoDoesNotDuplicateIdenticalReasonAndResult() {
        AgentAuditLog log = new AgentAuditLog();
        log.setReason("same text");
        log.setResult("same text");

        assertEquals("same text", AuditLogDTO.from(log).getDetails());
    }

    @Test
    void customerDtoMapsAllFields() {
        Customer c = new Customer("Nova Retail", "Standard", 125000, "sms", true, false, "medium");
        c.setId(9L);

        CustomerDTO dto = CustomerDTO.from(c);

        assertEquals(9L, dto.getId());
        assertEquals("Nova Retail", dto.getName());
        assertEquals(125000L, dto.getAmountMinor());
        assertTrue(dto.getOptOut());
        assertEquals("medium", dto.getRecoverability());
    }
}
