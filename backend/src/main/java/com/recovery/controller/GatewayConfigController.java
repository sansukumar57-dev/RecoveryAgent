package com.recovery.controller;

import com.recovery.domain.GatewayConfig;
import com.recovery.repository.GatewayConfigRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/config")
public class GatewayConfigController {

    private final GatewayConfigRepository gatewayConfigRepo;

    @org.springframework.beans.factory.annotation.Value("${razorpay.key-id:}")
    private String envKeyId;

    @org.springframework.beans.factory.annotation.Value("${razorpay.key-secret:}")
    private String envKeySecret;

    public GatewayConfigController(GatewayConfigRepository gatewayConfigRepo) {
        this.gatewayConfigRepo = gatewayConfigRepo;
    }

    /** Returns the current gateway key id (masked) and whether a secret is stored. */
    @GetMapping("/gateway")
    public ResponseEntity<Map<String, Object>> getGateway() {
        String storedId = gatewayConfigRepo.findById("razorpay.key-id").map(GatewayConfig::getValue).orElse(envKeyId);
        boolean hasSecret = gatewayConfigRepo.findById("razorpay.key-secret").map(GatewayConfig::getValue).map(v -> !v.isBlank())
                .orElse(envKeySecret != null && !envKeySecret.isBlank() && !"demo_secret".equals(envKeySecret));

        String maskedId = null;
        if (storedId != null && !storedId.isBlank() && !"rzp_test_demo".equals(storedId)) {
            maskedId = storedId.length() <= 8 ? "••••" : storedId.substring(0, 8) + "••••" + storedId.substring(storedId.length() - 4);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("configured", maskedId != null && hasSecret);
        result.put("keyIdMasked", maskedId != null ? maskedId : "rzp_test_demo (demo)");
        result.put("hasSecret", hasSecret);
        return ResponseEntity.ok(result);
    }

    /** Saves the Razorpay gateway key id + secret to the config store (and a .env file for reference). */
    @PostMapping("/gateway")
    public ResponseEntity<Map<String, Object>> saveGateway(@RequestBody Map<String, String> body) {
        String keyId = body.getOrDefault("keyId", "").trim();
        String keySecret = body.getOrDefault("keySecret", "").trim();

        if (keyId.isBlank() || keySecret.isBlank()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Both keyId and keySecret are required"));
        }

        gatewayConfigRepo.save(new GatewayConfig("razorpay.key-id", keyId));
        gatewayConfigRepo.save(new GatewayConfig("razorpay.key-secret", keySecret));

        writeEnvFile(keyId, keySecret);

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "saved");
        result.put("keyIdMasked", keyId.substring(0, Math.min(4, keyId.length())) + "••••");
        result.put("demoMode", false);
        return ResponseEntity.ok(result);
    }

    /**
     * Upserts RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET in the local .env file,
     * preserving every other line (comments, sections, unrelated keys).
     * Creates the file from scratch only when it does not exist yet.
     */
    private void writeEnvFile(String keyId, String keySecret) {
        Path envPath = Path.of(".env");
        Map<String, String> updates = new LinkedHashMap<>();
        updates.put("RAZORPAY_KEY_ID", keyId);
        updates.put("RAZORPAY_KEY_SECRET", keySecret);

        try {
            List<String> lines = Files.exists(envPath)
                    ? new ArrayList<>(Files.readAllLines(envPath))
                    : new ArrayList<>(List.of(
                            "# Razorpay gateway credentials (managed from the dashboard Settings page)"));

            Set<String> replaced = new HashSet<>();
            for (int i = 0; i < lines.size(); i++) {
                String line = lines.get(i);
                String trimmed = line.trim();
                if (trimmed.isEmpty() || trimmed.startsWith("#")) continue;

                int eq = trimmed.indexOf('=');
                if (eq <= 0) continue;

                String key = trimmed.substring(0, eq).trim();
                if (updates.containsKey(key)) {
                    lines.set(i, key + "=" + updates.get(key));
                    replaced.add(key);
                }
            }

            // Append any key that was not already present in the file.
            for (Map.Entry<String, String> e : updates.entrySet()) {
                if (!replaced.contains(e.getKey())) {
                    lines.add(e.getKey() + "=" + e.getValue());
                }
            }

            Files.write(envPath, lines);
        } catch (IOException e) {
            // .env is a convenience file; the DB config store is the source of truth at runtime
        }
    }

    /** Returns current runtime safety guardrail and AI settings. */
    @GetMapping("/policies")
    public ResponseEntity<Map<String, Object>> getPolicies() {
        Map<String, Object> p = new LinkedHashMap<>();
        p.put("maxRetries", Integer.parseInt(gatewayConfigRepo.findById("policy.max_retries").map(GatewayConfig::getValue).orElse("3")));
        p.put("autoExecutionLimit", Long.parseLong(gatewayConfigRepo.findById("policy.high_value_threshold").map(GatewayConfig::getValue).orElse("2500000")));
        p.put("quietHoursEnabled", Boolean.parseBoolean(gatewayConfigRepo.findById("policy.quiet_hours_enabled").map(GatewayConfig::getValue).orElse("true")));
        p.put("quietHoursStart", Integer.parseInt(gatewayConfigRepo.findById("policy.quiet_hours_start").map(GatewayConfig::getValue).orElse("20")));
        p.put("quietHoursEnd", Integer.parseInt(gatewayConfigRepo.findById("policy.quiet_hours_end").map(GatewayConfig::getValue).orElse("8")));
        p.put("maxIncentivePercent", Integer.parseInt(gatewayConfigRepo.findById("policy.max_incentive_percent").map(GatewayConfig::getValue).orElse("10")));
        p.put("llmModel", gatewayConfigRepo.findById("ai.llm_model").map(GatewayConfig::getValue).orElse("Llama-3.1-70B-Versatile (Groq)"));
        p.put("temperature", Double.parseDouble(gatewayConfigRepo.findById("ai.temperature").map(GatewayConfig::getValue).orElse("0.2")));
        p.put("voiceDialect", gatewayConfigRepo.findById("ai.voice_dialect").map(GatewayConfig::getValue).orElse("Hinglish (Hindi + English)"));
        p.put("autonomyLevel", gatewayConfigRepo.findById("ai.autonomy_level").map(GatewayConfig::getValue).orElse("AUTONOMOUS"));
        return ResponseEntity.ok(p);
    }

    /** Saves updated safety policies and AI parameters into SQLite. */
    @PostMapping("/policies")
    public ResponseEntity<Map<String, Object>> savePolicies(@RequestBody Map<String, Object> body) {
        if (body.containsKey("maxRetries")) {
            gatewayConfigRepo.save(new GatewayConfig("policy.max_retries", body.get("maxRetries").toString()));
        }
        if (body.containsKey("autoExecutionLimit")) {
            gatewayConfigRepo.save(new GatewayConfig("policy.high_value_threshold", body.get("autoExecutionLimit").toString()));
        }
        if (body.containsKey("quietHoursEnabled")) {
            gatewayConfigRepo.save(new GatewayConfig("policy.quiet_hours_enabled", body.get("quietHoursEnabled").toString()));
        }
        if (body.containsKey("quietHoursStart")) {
            gatewayConfigRepo.save(new GatewayConfig("policy.quiet_hours_start", body.get("quietHoursStart").toString()));
        }
        if (body.containsKey("quietHoursEnd")) {
            gatewayConfigRepo.save(new GatewayConfig("policy.quiet_hours_end", body.get("quietHoursEnd").toString()));
        }
        if (body.containsKey("maxIncentivePercent")) {
            gatewayConfigRepo.save(new GatewayConfig("policy.max_incentive_percent", body.get("maxIncentivePercent").toString()));
        }
        if (body.containsKey("llmModel")) {
            gatewayConfigRepo.save(new GatewayConfig("ai.llm_model", body.get("llmModel").toString()));
        }
        if (body.containsKey("temperature")) {
            gatewayConfigRepo.save(new GatewayConfig("ai.temperature", body.get("temperature").toString()));
        }
        if (body.containsKey("voiceDialect")) {
            gatewayConfigRepo.save(new GatewayConfig("ai.voice_dialect", body.get("voiceDialect").toString()));
        }
        if (body.containsKey("autonomyLevel")) {
            gatewayConfigRepo.save(new GatewayConfig("ai.autonomy_level", body.get("autonomyLevel").toString()));
        }
        return getPolicies();
    }
}
