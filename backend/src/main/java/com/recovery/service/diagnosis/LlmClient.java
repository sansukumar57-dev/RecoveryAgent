package com.recovery.service.diagnosis;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import okhttp3.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class LlmClient {
    private static final Logger log = LoggerFactory.getLogger(LlmClient.class);
    private final OkHttpClient http = new OkHttpClient.Builder()
            .connectTimeout(8, TimeUnit.SECONDS)
            .readTimeout(10, TimeUnit.SECONDS)
            .build();
    private final ObjectMapper mapper = new ObjectMapper();

    @Value("${llm.openrouter.base-url}") private String openRouterUrl;
    @Value("${llm.openrouter.model}") private String openRouterModel;
    @Value("${llm.groq.base-url}") private String groqUrl;
    @Value("${llm.groq.model}") private String groqModel;
    @Value("${llm.nvidia.base-url}") private String nvidiaUrl;
    @Value("${llm.nvidia.model}") private String nvidiaModel;

    public Map<String, Object> diagnose(String eventJson, String apiKey, String provider) {
        String url, model;
        if ("groq".equals(provider)) { url = groqUrl; model = groqModel; }
        else if ("nvidia".equals(provider)) { url = nvidiaUrl; model = nvidiaModel; }
        else { url = openRouterUrl; model = openRouterModel; }
        if (apiKey == null || apiKey.isBlank()) return null;
        if (url == null || url.isBlank()) return null;
        // ensure endpoint
        String endpoint = url.endsWith("/chat/completions") ? url : url.replaceAll("/$", "") + "/chat/completions";
        try {
            String prompt = buildPrompt(eventJson);
            String body = mapper.writeValueAsString(Map.of(
                "model", model,
                "messages", new Object[]{Map.of("role", "user", "content", prompt)},
                "temperature", 0,
                "response_format", Map.of("type", "json_object")
            ));
            Request req = new Request.Builder()
                    .url(endpoint)
                    .addHeader("Authorization", "Bearer " + apiKey)
                    .addHeader("Content-Type", "application/json")
                    .post(RequestBody.create(body, MediaType.parse("application/json")))
                    .build();
            try (Response resp = http.newCall(req).execute()) {
                if (!resp.isSuccessful() || resp.body() == null) {
                    String errBody = resp.body() != null ? resp.body().string() : "no body";
                    log.warn("LLM {} failed {} {} ", provider, resp.code(), errBody.substring(0, Math.min(400, errBody.length())));
                    return null;
                }
                JsonNode respJson = mapper.readTree(resp.body().string());
                String content = respJson.at("/choices/0/message/content").asText();
                if (content == null || content.isBlank()) {
                    log.warn("LLM {} empty content: {}", provider, respJson.toString().substring(0, Math.min(400, respJson.toString().length())));
                    return null;
                }
                return mapper.readValue(content, Map.class);
            }
        } catch (Exception e) {
            log.warn("LLM call failed ({}): {}", provider, e.getMessage());
            return null;
        }
    }

    private String buildPrompt(String eventJson) {
        return "You are a payment failure diagnosis engine. Given this Razorpay transaction context:\n" +
               eventJson + "\n\n" +
               "Return a JSON object with exactly these fields:\n" +
               "\"diagnosis\": one of [insufficient_funds, bank_decline, expired_card, authentication_failure, temporary_gateway_issue, customer_abandonment, repeated_failure, unknown_failure]\n" +
               "\"confidence\": float 0.0-1.0\n" +
               "\"recommendedStrategy\": one of [RETRY_PAYMENT, CREATE_PAYMENT_LINK, SEND_MESSAGE, OFFER_INCENTIVE, RETRY_LATER, ESCALATE, STOP]\n" +
               "\"reasoning\": string explanation";
    }
}
