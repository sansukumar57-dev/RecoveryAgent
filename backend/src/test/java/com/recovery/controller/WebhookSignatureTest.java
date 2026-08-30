package com.recovery.controller;

import com.recovery.domain.Payment;
import com.recovery.domain.RecoveryCase;
import com.recovery.repository.PaymentRepository;
import com.recovery.service.ingestion.Normalizer;
import com.recovery.service.ingestion.SignatureVerifier;
import com.recovery.service.simulation.RecoveryOrchestrator;
import com.recovery.service.simulation.RevenueRiskAgent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

public class WebhookSignatureTest {

    private WebhookController controller;
    private final Normalizer normalizer = mock(Normalizer.class);
    private final RevenueRiskAgent riskAgent = mock(RevenueRiskAgent.class);
    private final RecoveryOrchestrator orchestrator = mock(RecoveryOrchestrator.class);
    private final PaymentRepository paymentRepo = mock(PaymentRepository.class);
    private final SignatureVerifier verifier = new SignatureVerifier();

    @BeforeEach
    void setUp() {
        controller = new WebhookController(verifier, normalizer, riskAgent, orchestrator, paymentRepo,
                new com.fasterxml.jackson.databind.ObjectMapper());
        ReflectionTestUtils.setField(controller, "webhookSecret", "demo_webhook_secret");
    }

    private String sign(String payload) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec("demo_webhook_secret".getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getEncoder().encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void invalidSignatureReturnsUnauthorized() throws Exception {
        String payload = "{\"event\":\"payment.failed\"}";
        ResponseEntity<Map<String, String>> res = controller.handleWebhook(payload, "forged", "payment.failed");
        assertEquals(401, res.getStatusCode().value());
        assertEquals("invalid_signature", res.getBody().get("status"));
    }

    @Test
    void validSignatureIsProcessed() throws Exception {
        String payload = "{\"event\":\"payment.failed\",\"id\":\"ev_1\"}";

        Payment payment = new Payment();
        payment.setPaymentId("pay_1");
        payment.setFailureReason("insufficient_funds");
        payment.setCustomerId(1L);
        payment.setAmountMinor(100);
        payment.setStatus("FAILED");
        payment.setMethod("card");
        when(normalizer.normalize(anyString(), anyString())).thenReturn(payment);

        RecoveryCase rc = new RecoveryCase();
        rc.setId(1L);
        rc.setCaseId("RC-1001");
        when(riskAgent.detectAndCreateCase(any())).thenReturn(rc);

        ResponseEntity<Map<String, String>> res = controller.handleWebhook(payload, sign(payload), "payment.failed");
        assertEquals(200, res.getStatusCode().value());
        assertEquals("processed", res.getBody().get("status"));
    }

    @Test
    void forgedSignatureWithOldBypassIsRejected() {
        // Even the legacy demo secret must no longer auto-pass without a valid HMAC.
        String payload = "{\"event\":\"payment.failed\"}";
        ResponseEntity<Map<String, String>> res = controller.handleWebhook(payload, "mock_signature", "payment.failed");
        assertEquals(401, res.getStatusCode().value());
    }
}
