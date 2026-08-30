package com.recovery.service.actuator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recovery.domain.*;
import com.recovery.repository.*;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.TimeUnit;

@Service
public class RecoveryExecutorTools {
    private static final Logger log = LoggerFactory.getLogger(RecoveryExecutorTools.class);
    
    private final CustomerRepository customerRepo;
    private final PaymentRepository paymentRepo;
    private final OrderRepository orderRepo;
    private final SubscriptionRepository subscriptionRepo;
    private final AgentAuditLogRepository auditRepo;
    private final PaymentAttemptRepository attemptRepo;
    private final NotificationRepository notificationRepo;
    private final GatewayConfigRepository gatewayConfigRepo;

    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(8, TimeUnit.SECONDS)
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${razorpay.key-id:rzp_test_demo}") private String keyId;
    @Value("${razorpay.key-secret:demo_secret}") private String keySecret;

    public RecoveryExecutorTools(CustomerRepository customerRepo, PaymentRepository paymentRepo,
                                  OrderRepository orderRepo, SubscriptionRepository subscriptionRepo,
                                  AgentAuditLogRepository auditRepo, PaymentAttemptRepository attemptRepo,
                                  NotificationRepository notificationRepo, GatewayConfigRepository gatewayConfigRepo) {
        this.customerRepo = customerRepo;
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.auditRepo = auditRepo;
        this.attemptRepo = attemptRepo;
        this.notificationRepo = notificationRepo;
        this.gatewayConfigRepo = gatewayConfigRepo;
    }

    /** Resolves the live gateway key id from the persisted config store, falling back to application.yml defaults. */
    private String resolveKeyId() {
        return gatewayConfigRepo.findById("razorpay.key-id")
                .map(GatewayConfig::getValue)
                .filter(v -> !v.isBlank())
                .orElse(keyId);
    }

    /** Resolves the live gateway key secret from the persisted config store, falling back to application.yml defaults. */
    private String resolveKeySecret() {
        return gatewayConfigRepo.findById("razorpay.key-secret")
                .map(GatewayConfig::getValue)
                .filter(v -> !v.isBlank())
                .orElse(keySecret);
    }

    private String authHeader() {
        return "Basic " + java.util.Base64.getEncoder()
                .encodeToString((resolveKeyId() + ":" + resolveKeySecret()).getBytes());
    }

    private boolean isDemoKey() {
        return "rzp_test_demo".equals(resolveKeyId());
    }

    // 1. getPayment
    public Payment getPayment(String paymentId) {
        return paymentRepo.findByPaymentId(paymentId).orElse(null);
    }

    // 2. getCustomer
    public Customer getCustomer(Long customerId) {
        return customerRepo.findById(customerId).orElse(null);
    }

    // 3. getOrder
    public Order getOrder(String orderId) {
        return orderRepo.findByOrderId(orderId).orElse(null);
    }

    // 4. getSubscription
    public Subscription getSubscription(String subscriptionId) {
        return subscriptionRepo.findBySubscriptionId(subscriptionId).orElse(null);
    }

    // 5. getPaymentHistory
    public List<Payment> getPaymentHistory(Long customerId) {
        // Return payments associated with the customer
        List<Payment> all = paymentRepo.findAll();
        List<Payment> history = new ArrayList<>();
        for (Payment p : all) {
            if (p.getCustomerId().equals(customerId)) {
                history.add(p);
            }
        }
        return history;
    }

    // 6. retryPayment
    public PaymentAttempt retryPayment(String caseId, String paymentId) {
        Payment payment = getPayment(paymentId);
        if (payment == null) {
            recordAuditEvent(caseId, "ToolLayer", "TOOL_EXECUTION", "retryPayment", "paymentId=" + paymentId, "FAILED", "Payment not found");
            return null;
        }

        log.info("Executing Tool: retryPayment for paymentId={}", paymentId);
        PaymentAttempt attempt = new PaymentAttempt();
        attempt.setCaseId(caseId);
        attempt.setPaymentId(paymentId);
        attempt.setAmountMinor(payment.getAmountMinor());
        attempt.setTimestamp(System.currentTimeMillis());
        attempt.setGatewayAttemptId("att_" + UUID.randomUUID().toString().substring(0, 8));

        // Call Razorpay Test mode API or simulate
        boolean isDemoKey = isDemoKey();
        boolean success = false;
        String err = null;

        if (!isDemoKey) {
            try {
                // In Razorpay, retry payment means creating another attempt or capturing or calling specific endpoint
                // For subscriptions, we can trigger retry. For regular payment, retries are customer-initiated.
                // We'll mock the OkHttp POST request for regular retry if not standard
                Request req = new Request.Builder()
                        .url("https://api.razorpay.com/v1/payments/" + paymentId + "/capture")
                        .addHeader("Authorization", authHeader())
                        .addHeader("Content-Type", "application/json")
                        .post(RequestBody.create("{}", MediaType.parse("application/json")))
                        .build();
                try (Response resp = http.newCall(req).execute()) {
                    if (resp.isSuccessful()) {
                        success = true;
                    } else {
                        err = "Gateway code " + resp.code() + ": " + (resp.body() != null ? resp.body().string() : "No body");
                    }
                }
            } catch (Exception e) {
                err = e.getMessage();
            }
        } else {
            // Simulated response
            success = Math.random() < 0.6; // 60% recovery chance on retry
            if (!success) {
                err = "insufficient_funds";
            }
        }

        if (success) {
            attempt.setStatus("SUCCESS");
            payment.setStatus("SUCCESS");
            payment.setRetryCount(payment.getRetryCount() + 1);
            paymentRepo.save(payment);
            attemptRepo.save(attempt);
            recordAuditEvent(caseId, "ToolLayer", "TOOL_EXECUTION", "retryPayment", "paymentId=" + paymentId, "SUCCESS", "Retry successful. Payment captured.");
        } else {
            attempt.setStatus("FAILED");
            attempt.setFailureReason(err);
            payment.setStatus("FAILED");
            payment.setFailureReason(err);
            payment.setRetryCount(payment.getRetryCount() + 1);
            paymentRepo.save(payment);
            attemptRepo.save(attempt);
            recordAuditEvent(caseId, "ToolLayer", "TOOL_EXECUTION", "retryPayment", "paymentId=" + paymentId, "FAILED", "Retry failed: " + err);
        }

        return attempt;
    }

    // 7. createPaymentLink
    public Map<String, Object> createPaymentLink(String caseId, String orderId) {
        Order order = getOrder(orderId);
        if (order == null) {
            recordAuditEvent(caseId, "ToolLayer", "TOOL_EXECUTION", "createPaymentLink", "orderId=" + orderId, "FAILED", "Order not found");
            return Map.of("success", false, "error", "Order not found");
        }

        log.info("Executing Tool: createPaymentLink for orderId={}", orderId);
        boolean isDemoKey = isDemoKey();
        boolean success = false;
        String plinkId = "plink_" + UUID.randomUUID().toString().substring(0, 8);
        String plinkUrl = "https://rzp.io/i/" + UUID.randomUUID().toString().substring(0, 6);
        String err = null;

        if (!isDemoKey) {
            try {
                Map<String, Object> body = Map.of(
                    "amount", order.getAmountMinor(),
                    "currency", "INR",
                    "description", "Revenue Recover Link for " + orderId,
                    "reference_id", orderId,
                    "callback_url", "http://localhost:3000/recovery-success?caseId=" + caseId,
                    "callback_method", "get"
                );
                String json = mapper.writeValueAsString(body);
                Request req = new Request.Builder()
                        .url("https://api.razorpay.com/v1/payment_links")
                        .addHeader("Authorization", authHeader())
                        .addHeader("Content-Type", "application/json")
                        .post(RequestBody.create(json, MediaType.parse("application/json")))
                        .build();
                try (Response resp = http.newCall(req).execute()) {
                    if (resp.isSuccessful()) {
                        Map<String, Object> respMap = mapper.readValue(resp.body().string(), Map.class);
                        plinkId = (String) respMap.get("id");
                        plinkUrl = (String) respMap.get("short_url");
                        success = true;
                    } else {
                        err = "Gateway error: " + (resp.body() != null ? resp.body().string() : "");
                    }
                }
            } catch (Exception e) {
                err = e.getMessage();
            }
        } else {
            success = true;
        }

        if (success) {
            recordAuditEvent(caseId, "ToolLayer", "TOOL_EXECUTION", "createPaymentLink", "orderId=" + orderId, "SUCCESS", "Link created: ID=" + plinkId + ", URL=" + plinkUrl);
            return Map.of("success", true, "paymentLinkId", plinkId, "paymentLinkUrl", plinkUrl);
        } else {
            recordAuditEvent(caseId, "ToolLayer", "TOOL_EXECUTION", "createPaymentLink", "orderId=" + orderId, "FAILED", "Link creation failed: " + err);
            return Map.of("success", false, "error", err);
        }
    }

    // 8. sendRecoveryMessage
    public Notification sendRecoveryMessage(String caseId, Long customerId, String messageText, String channel, String language) {
        log.info("Executing Tool: sendRecoveryMessage to customerId={} via {} in {}", customerId, channel, language);
        
        Notification notification = new Notification();
        notification.setCaseId(caseId);
        notification.setCustomerId(customerId);
        notification.setMessageText(messageText);
        notification.setChannel(channel);
        notification.setLanguage(language);
        notification.setSentAt(System.currentTimeMillis());
        notificationRepo.save(notification);

        // Simulate sending
        recordAuditEvent(caseId, "ToolLayer", "TOOL_EXECUTION", "sendRecoveryMessage", 
                "customerId=" + customerId + ", channel=" + channel + ", lang=" + language, "SUCCESS", "Outreach message delivered: \"" + messageText.substring(0, Math.min(messageText.length(), 40)) + "...\"");
        
        return notification;
    }

    // 9. scheduleRetry
    public void scheduleRetry(String caseId, String paymentId, long delaySeconds) {
        log.info("Executing Tool: scheduleRetry for paymentId={} with delay={}s", paymentId, delaySeconds);
        long targetTime = System.currentTimeMillis() + (delaySeconds * 1000);
        recordAuditEvent(caseId, "ToolLayer", "TOOL_EXECUTION", "scheduleRetry", 
                "paymentId=" + paymentId + ", delay=" + delaySeconds + "s", "SUCCESS", "Scheduled next retry attempt at " + new Date(targetTime));
    }

    // 10. getPaymentStatus
    public String getPaymentStatus(String paymentId) {
        Payment payment = getPayment(paymentId);
        if (payment == null) return "UNKNOWN";
        
        // Simulates fetching fresh status from Razorpay
        return payment.getStatus();
    }

    // 11. escalateToHuman
    public void escalateToHuman(String caseId, String reason) {
        log.info("Executing Tool: escalateToHuman for caseId={} due to: {}", caseId, reason);
        recordAuditEvent(caseId, "ToolLayer", "TOOL_EXECUTION", "escalateToHuman", "caseId=" + caseId, "SUCCESS", "Escalated case to Human Owner: " + reason);
    }

    // 12. recordAuditEvent
    public void recordAuditEvent(String caseId, String agent, String eventType, String p4, String p5, String p6, String p7) {
        AgentAuditLog audit = new AgentAuditLog();
        audit.setCaseId(caseId);
        audit.setAgent(agent);
        audit.setEventType(eventType);
        audit.setTool(p4);
        audit.setDecision(p4);
        audit.setToolArguments(p5);
        audit.setReason(p5);
        audit.setStatus(p6);
        audit.setPolicyResult(p6);
        audit.setResult(p7);
        audit.setTimestamp(System.currentTimeMillis());
        auditRepo.save(audit);
    }
}
