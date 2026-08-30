package com.recovery.controller;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.recovery.domain.Payment;
import com.recovery.domain.RecoveryCase;
import com.recovery.repository.PaymentRepository;
import com.recovery.service.ingestion.Normalizer;
import com.recovery.service.ingestion.SignatureVerifier;
import com.recovery.service.simulation.RecoveryOrchestrator;
import com.recovery.service.simulation.RevenueRiskAgent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/webhooks")
public class WebhookController {
    private static final Logger log = LoggerFactory.getLogger(WebhookController.class);
    
    private final SignatureVerifier verifier;
    private final Normalizer normalizer;
    private final RevenueRiskAgent riskAgent;
    private final RecoveryOrchestrator orchestrator;
    private final PaymentRepository paymentRepo;
    private final ObjectMapper mapper;

    @Value("${razorpay.webhook-secret:demo_webhook_secret}") 
    private String webhookSecret;

    public WebhookController(SignatureVerifier verifier, Normalizer normalizer,
                             RevenueRiskAgent riskAgent, RecoveryOrchestrator orchestrator,
                             PaymentRepository paymentRepo,
                             @Qualifier("configObjectMapper") ObjectMapper mapper) {
        this.verifier = verifier;
        this.normalizer = normalizer;
        this.riskAgent = riskAgent;
        this.orchestrator = orchestrator;
        this.paymentRepo = paymentRepo;
        this.mapper = mapper;
    }

    @PostMapping("/razorpay")
    @Transactional
    public ResponseEntity<Map<String, String>> handleWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature,
            @RequestHeader(value = "X-Razorpay-Event", required = false) String eventType) {

        // 1. Signature check — HMAC-SHA256 over the raw body, no bypasses.
        if (!verifier.verify(payload, signature, webhookSecret)) {
            log.warn("Invalid webhook signature received");
            return ResponseEntity.status(401).body(Map.of("status", "invalid_signature"));
        }

        // 2. Parse before any writes so malformed JSON is a clean 400.
        Map<String, Object> body;
        try {
            body = mapper.readValue(payload, new TypeReference<Map<String, Object>>() {});
        } catch (JsonProcessingException e) {
            log.warn("Malformed webhook payload: {}", e.getOriginalMessage());
            return ResponseEntity.badRequest().body(Map.of("status", "malformed_json"));
        }

        String eventId = body.get("id") instanceof String s ? s : null;

        // 3. Idempotency check (duplicate prevention)
        if (eventId != null && verifier.isDuplicate(eventId)) {
            log.info("Duplicate webhook eventId={} ignored", eventId);
            return ResponseEntity.ok(Map.of("status", "duplicate"));
        }

        // 4. Normalize + persist + detect. Anything thrown from here rolls the
        //    whole transaction back and is rendered by GlobalExceptionHandler,
        //    so a half-saved payment can never be left behind.
        Payment payment = normalizer.normalize(eventType, payload);
        paymentRepo.save(payment);

        RecoveryCase kase = riskAgent.detectAndCreateCase(payment);

        log.info("Webhook processed: eventId={}, status={}, paymentId={}, caseId={}",
                eventId, eventType, payment.getPaymentId(), kase.getCaseId());

        Map<String, String> result = new LinkedHashMap<>();
        result.put("status", "processed");
        result.put("paymentId", payment.getPaymentId());
        result.put("caseId", kase.getCaseId());
        result.put("declineCode", payment.getFailureReason() != null ? payment.getFailureReason() : "");
        return ResponseEntity.ok(result);
    }
}
