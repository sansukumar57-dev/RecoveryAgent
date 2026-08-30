package com.recovery.service.actuator;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recovery.config.RazorpayProperties;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
@ConditionalOnProperty(name = "razorpay.gateway.enabled", havingValue = "true", matchIfMissing = false)
public class RazorpayActuator {
    private static final Logger log = LoggerFactory.getLogger(RazorpayActuator.class);
    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(5, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .build();
    private final ObjectMapper mapper;
    private final RazorpayProperties properties;

    public RazorpayActuator(@Qualifier("configObjectMapper") ObjectMapper mapper, RazorpayProperties properties) {
        this.mapper = mapper;
        this.properties = properties;
    }

    @PostConstruct
    public void init() {
        log.info("Razorpay Actuator initialized in {} mode", properties.getMode());
        if (properties.isLiveMode()) {
            log.warn("Running in LIVE mode - real transactions will be processed!");
        }
    }

    private String authHeader() {
        return "Basic " + java.util.Base64.getEncoder()
                .encodeToString((properties.getKeyId() + ":" + properties.getKeySecret()).getBytes());
    }

    private String getApiUrl(String endpoint) {
        return properties.getBaseUrl() + endpoint;
    }

    public Map<String, Object> createPaymentLink(int amountMinor, String currency, String customerId, String description) {
        try {
            Map<String, Object> body = Map.of(
                "amount", amountMinor,
                "currency", currency,
                "description", description != null ? description : "Recovery payment",
                "customer_id", customerId,
                "notify", Map.of("email", true, "sms", true, "whatsapp", true),
                "reference_id", "recovery_" + System.currentTimeMillis()
            );
            String json = mapper.writeValueAsString(body);
            Request req = new Request.Builder()
                    .url(getApiUrl("/payment_links"))
                    .addHeader("Authorization", authHeader())
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(json, MediaType.parse("application/json")))
                    .build();
            try (Response resp = http.newCall(req).execute()) {
                String respBody = resp.body() != null ? resp.body().string() : "{}";
                Map<String, Object> result = mapper.readValue(respBody, Map.class);
                result.put("success", resp.isSuccessful());
                return result;
            }
        } catch (Exception e) {
            log.error("Failed to create payment link: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> createOrder(int amountMinor, String currency, String customerId) {
        try {
            Map<String, Object> body = Map.of(
                "amount", amountMinor,
                "currency", currency,
                "customer_id", customerId,
                "receipt", "recovery_" + System.currentTimeMillis()
            );
            String json = mapper.writeValueAsString(body);
            Request req = new Request.Builder()
                    .url(getApiUrl("/orders"))
                    .addHeader("Authorization", authHeader())
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(json, MediaType.parse("application/json")))
                    .build();
            try (Response resp = http.newCall(req).execute()) {
                String respBody = resp.body() != null ? resp.body().string() : "{}";
                Map<String, Object> result = mapper.readValue(respBody, Map.class);
                result.put("success", resp.isSuccessful());
                return result;
            }
        } catch (Exception e) {
            log.error("Failed to create order: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> fetchPayment(String paymentId) {
        try {
            Request req = new Request.Builder()
                    .url(getApiUrl("/payments/" + paymentId))
                    .addHeader("Authorization", authHeader())
                    .get()
                    .build();
            try (Response resp = http.newCall(req).execute()) {
                String respBody = resp.body() != null ? resp.body().string() : "{}";
                Map<String, Object> result = mapper.readValue(respBody, Map.class);
                result.put("success", resp.isSuccessful());
                return result;
            }
        } catch (Exception e) {
            log.error("Failed to fetch payment: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> capturePayment(String paymentId, int amountMinor) {
        try {
            Map<String, Object> body = Map.of("amount", amountMinor);
            String json = mapper.writeValueAsString(body);
            Request req = new Request.Builder()
                    .url(getApiUrl("/payments/" + paymentId + "/capture"))
                    .addHeader("Authorization", authHeader())
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(json, MediaType.parse("application/json")))
                    .build();
            try (Response resp = http.newCall(req).execute()) {
                String respBody = resp.body() != null ? resp.body().string() : "{}";
                Map<String, Object> result = mapper.readValue(respBody, Map.class);
                result.put("success", resp.isSuccessful());
                return result;
            }
        } catch (Exception e) {
            log.error("Failed to capture payment: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> createRefund(String paymentId, int amountMinor, String reason) {
        try {
            Map<String, Object> body = Map.of(
                "amount", amountMinor,
                "reason", reason != null ? reason : "customer_request"
            );
            String json = mapper.writeValueAsString(body);
            Request req = new Request.Builder()
                    .url(getApiUrl("/payments/" + paymentId + "/refund"))
                    .addHeader("Authorization", authHeader())
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(json, MediaType.parse("application/json")))
                    .build();
            try (Response resp = http.newCall(req).execute()) {
                String respBody = resp.body() != null ? resp.body().string() : "{}";
                Map<String, Object> result = mapper.readValue(respBody, Map.class);
                result.put("success", resp.isSuccessful());
                return result;
            }
        } catch (Exception e) {
            log.error("Failed to create refund: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> retrySubscription(String subscriptionId) {
        try {
            Request req = new Request.Builder()
                    .url(getApiUrl("/subscriptions/" + subscriptionId + "/retry"))
                    .addHeader("Authorization", authHeader())
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create("{}", MediaType.parse("application/json")))
                    .build();
            try (Response resp = http.newCall(req).execute()) {
                String respBody = resp.body() != null ? resp.body().string() : "{}";
                Map<String, Object> result = mapper.readValue(respBody, Map.class);
                result.put("success", resp.isSuccessful());
                return result;
            }
        } catch (Exception e) {
            log.error("Failed to retry subscription: {}", e.getMessage());
            return Map.of("success", false, "error", e.getMessage());
        }
    }

    public Map<String, Object> sendMessage(String to, String template, Map<String, String> vars) {
        log.info("Sending message to {}: {} with vars {}", to, template, vars);
        return Map.of("success", true, "channel", "email", "status", "queued");
    }

    public boolean isGatewayEnabled() {
        return properties.getGateway().isEnabled();
    }

    public boolean isLiveMode() {
        return properties.isLiveMode();
    }
}
