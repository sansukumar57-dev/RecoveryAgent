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

    public GatewayConfigController(GatewayConfigRepository gatewayConfigRepo) {
        this.gatewayConfigRepo = gatewayConfigRepo;
    }

    /** Returns the current gateway key id (masked) and whether a secret is stored. */
    @GetMapping("/gateway")
    public ResponseEntity<Map<String, Object>> getGateway() {
        String storedId = gatewayConfigRepo.findById("razorpay.key-id").map(GatewayConfig::getValue).orElse(null);
        boolean hasSecret = gatewayConfigRepo.findById("razorpay.key-secret").map(GatewayConfig::getValue).map(v -> !v.isBlank()).orElse(false);

        String maskedId = null;
        if (storedId != null && !storedId.isBlank() && !"rzp_test_demo".equals(storedId)) {
            maskedId = storedId.length() <= 6 ? "••••" : storedId.substring(0, 4) + "••••" + storedId.substring(storedId.length() - 4);
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
}
