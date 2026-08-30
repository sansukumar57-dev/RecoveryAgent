package com.recovery.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recovery.domain.Payment;
import com.recovery.domain.RecoveryCase;
import com.recovery.repository.PaymentRepository;
import com.recovery.repository.RecoveryCaseRepository;
import com.recovery.service.simulation.RecoveryMonitor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.GeneralSecurityException;
import java.util.Base64;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/api/demo")
public class DemoGatewayController {
    private static final Logger log = LoggerFactory.getLogger(DemoGatewayController.class);

    private final PaymentRepository paymentRepo;
    private final RecoveryCaseRepository caseRepo;
    private final RecoveryMonitor monitor;
    private final RestTemplate restTemplate = new RestTemplate();
    private final ObjectMapper mapper;

    @Value("${server.port:8001}") private int serverPort;

    /** Same secret the webhook endpoint verifies against, so the demo signs correctly. */
    @Value("${razorpay.webhook-secret:demo_webhook_secret}") private String webhookSecret;

    public DemoGatewayController(PaymentRepository paymentRepo, RecoveryCaseRepository caseRepo,
                                 RecoveryMonitor monitor,
                                 @Qualifier("configObjectMapper") ObjectMapper mapper) {
        this.paymentRepo = paymentRepo;
        this.caseRepo = caseRepo;
        this.monitor = monitor;
        this.mapper = mapper;
    }

    // 1. POST /api/demo/process-payment
    @PostMapping("/process-payment")
    @Transactional
    public ResponseEntity<Map<String, Object>> processPayment(@RequestBody Map<String, Object> req) {
        String paymentId = (String) req.get("paymentId");
        String status = (String) req.get("status"); // SUCCESS or FAILED
        String failureReason = (String) req.get("failureReason");

        Payment payment = paymentRepo.findByPaymentId(paymentId).orElse(null);
        if (payment == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Payment not found"));
        }

        payment.setStatus(status);
        if ("FAILED".equalsIgnoreCase(status)) {
            payment.setFailureReason(failureReason != null ? failureReason : "gateway_timeout");
        } else {
            payment.setFailureReason(null);
        }
        paymentRepo.save(payment);

        return ResponseEntity.ok(Map.of("status", "updated", "paymentId", paymentId, "newStatus", status));
    }

    // 2. POST /api/demo/pay-link
    @PostMapping("/pay-link")
    @Transactional
    public ResponseEntity<Map<String, Object>> payLink(@RequestBody Map<String, Object> req) {
        String caseId = (String) req.get("caseId");
        RecoveryCase kase = caseRepo.findByCaseId(caseId).orElse(null);
        if (kase == null) {
            return ResponseEntity.notFound().build();
        }

        Payment payment = paymentRepo.findByPaymentId(kase.getPaymentId()).orElse(null);
        if (payment == null) {
            return ResponseEntity.badRequest().body(Map.of("status", "error", "message", "Payment not found"));
        }

        // Simulate successful payment via payment link
        payment.setStatus("SUCCESS");
        payment.setFailureReason(null);
        paymentRepo.save(payment);

        // Run VerificationAgent to capture the change and transition state to RECOVERED
        monitor.verifyAndSyncStatus(kase);

        return ResponseEntity.ok(Map.of("status", "recovered", "caseId", caseId, "paymentStatus", payment.getStatus()));
    }

    // 3. POST /api/demo/trigger-webhook
    @PostMapping("/trigger-webhook")
    public ResponseEntity<Map<String, Object>> triggerWebhook(@RequestBody(required = false) Map<String, Object> req) {
        Map<String, Object> body = req != null ? req : Map.of();
        String type = body.get("type") instanceof String s ? s : "payment.failed";
        // Amount read as long — JSON may deserialize to Integer, Long or Double,
        // and an int would overflow past ~₹21L.
        long amount = asLong(body.get("amount"), 499900L);
        String reason = body.get("declineReason") instanceof String s ? s : "insufficient_funds";

        if (amount <= 0) {
            throw new IllegalArgumentException("amount must be a positive number of paise");
        }

        String mockPaymentId = "pay_" + UUID.randomUUID().toString().substring(0, 8);
        String mockEventId = "evt_" + UUID.randomUUID().toString().substring(0, 8);

        Map<String, Object> payloadMap = new LinkedHashMap<>();
        payloadMap.put("id", mockEventId);
        payloadMap.put("entity", "event");
        payloadMap.put("account_id", "acc_demo");
        payloadMap.put("event", type);

        Map<String, Object> paymentPayload = new LinkedHashMap<>();
        paymentPayload.put("id", mockPaymentId);
        paymentPayload.put("amount", amount);
        paymentPayload.put("currency", "INR");
        paymentPayload.put("method", "card");
        paymentPayload.put("error_code", reason);
        paymentPayload.put("customer_id", 1L);

        payloadMap.put("payload", Map.of("payment", Map.of("entity", paymentPayload)));

        try {
            String payloadJson = mapper.writeValueAsString(payloadMap);

            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.set("X-Razorpay-Event", type);
            // Sign the payload properly with the configured webhook secret. The
            // verifier has no mock-signature bypass, so the demo must sign for real.
            headers.set("X-Razorpay-Signature", sign(payloadJson, webhookSecret));

            HttpEntity<String> entity = new HttpEntity<>(payloadJson, headers);
            String url = "http://localhost:" + serverPort + "/webhooks/razorpay";

            String webhookResponse = restTemplate.postForObject(url, entity, String.class);

            return ResponseEntity.ok(Map.of("status", "triggered", "response", webhookResponse, "mockPaymentId", mockPaymentId));
        } catch (Exception e) {
            log.error("Failed to trigger mock webhook: {}", e.getMessage());
            return ResponseEntity.internalServerError().body(Map.of("status", "error", "message", "Could not trigger webhook"));
        }
    }

    /** Base64 HMAC-SHA256, matching SignatureVerifier.verify(). */
    private static String sign(String payload, String secret) {
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            return Base64.getEncoder().encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Unable to sign demo webhook", e);
        }
    }

    /** Safe numeric coercion — avoids ClassCastException on Long/Double JSON values. */
    private static long asLong(Object value, long fallback) {
        if (value instanceof Number n) return n.longValue();
        if (value instanceof String s) {
            try {
                return Long.parseLong(s.trim());
            } catch (NumberFormatException ignored) {
                return fallback;
            }
        }
        return fallback;
    }
}
