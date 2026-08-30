package com.recovery.service.policy;

import com.recovery.domain.Customer;
import com.recovery.domain.Payment;
import com.recovery.domain.RecoveryCase;
import com.recovery.repository.CustomerRepository;
import com.recovery.repository.PaymentRepository;
import com.recovery.repository.RecoveryActionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Collections;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SafetyEngineTest {

    @Mock
    private RecoveryActionRepository actionRepo;
    @Mock
    private CustomerRepository customerRepo;
    @Mock
    private PaymentRepository paymentRepo;

    private SafetyEngine safetyEngine;

    @BeforeEach
    void setUp() {
        safetyEngine = new SafetyEngine(actionRepo, customerRepo, paymentRepo);
    }

    @Test
    void testOptOutCustomerRejection() {
        Customer c = new Customer("Test User", "Premium", 499900, "email", true, false, "high"); // OptOut = true
        c.setId(1L);
        Payment p = new Payment();
        p.setPaymentId("pay_123");
        p.setCustomerId(1L);
        p.setAmountMinor(499900);
        p.setRetryCount(0);

        RecoveryCase kase = new RecoveryCase();
        kase.setCaseId("CASE-1");
        kase.setCustomerId(1L);
        kase.setPaymentId("pay_123");
        kase.setAttemptsCount(0);

        when(customerRepo.findById(1L)).thenReturn(Optional.of(c));
        when(paymentRepo.findByPaymentId("pay_123")).thenReturn(Optional.of(p));

        SafetyEngine.SafetyResult result = safetyEngine.evaluate(kase, "RETRY_PAYMENT", 0);

        assertFalse(result.approved());
        assertEquals("STOP", result.finalAction());
        assertEquals("R4_OPT_OUT", result.ruleId());
    }

    @Test
    void testHighValueEscalation() {
        Customer c = new Customer("High Value User", "Enterprise", 3000000, "email", false, false, "high"); // ₹30,000
        c.setId(2L);
        Payment p = new Payment();
        p.setPaymentId("pay_high");
        p.setCustomerId(2L);
        p.setAmountMinor(3000000); // ₹30,000 > ₹25,000 limit
        p.setRetryCount(0);

        RecoveryCase kase = new RecoveryCase();
        kase.setCaseId("CASE-2");
        kase.setCustomerId(2L);
        kase.setPaymentId("pay_high");

        when(customerRepo.findById(2L)).thenReturn(Optional.of(c));
        when(paymentRepo.findByPaymentId("pay_high")).thenReturn(Optional.of(p));

        SafetyEngine.SafetyResult result = safetyEngine.evaluate(kase, "RETRY_PAYMENT", 0);

        assertFalse(result.approved());
        assertEquals("ESCALATE", result.finalAction());
        assertEquals("R6_HIGH_VALUE", result.ruleId());
    }

    @Test
    void testMaxRetriesRerouteToPaymentLink() {
        Customer c = new Customer("Retry User", "Standard", 249900, "email", false, false, "medium");
        c.setId(3L);
        Payment p = new Payment();
        p.setPaymentId("pay_retry");
        p.setCustomerId(3L);
        p.setAmountMinor(249900);
        p.setRetryCount(3); // Already 3 retries

        RecoveryCase kase = new RecoveryCase();
        kase.setCaseId("CASE-3");
        kase.setCustomerId(3L);
        kase.setPaymentId("pay_retry");
        kase.setAttemptsCount(3);

        when(customerRepo.findById(3L)).thenReturn(Optional.of(c));
        when(paymentRepo.findByPaymentId("pay_retry")).thenReturn(Optional.of(p));

        SafetyEngine.SafetyResult result = safetyEngine.evaluate(kase, "RETRY_PAYMENT", 0);

        assertFalse(result.approved());
        assertEquals("CREATE_PAYMENT_LINK", result.finalAction());
        assertEquals("R3_MAX_RETRIES", result.ruleId());
    }
}
