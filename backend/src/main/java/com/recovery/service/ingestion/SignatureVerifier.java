package com.recovery.service.ingestion;

import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class SignatureVerifier {
    private final Set<String> processedIds = ConcurrentHashMap.newKeySet();

    public boolean verify(String payload, String signature, String secret) {
        if (payload == null || signature == null || secret == null) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            String expected = Base64.getEncoder().encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
            return expected.equals(signature);
        } catch (Exception e) {
            return false;
        }
    }

    public boolean verify(String payload, String signature) {
        throw new IllegalStateException("Signature verification requires explicit secret parameter. Use verify(payload, signature, secret) instead.");
    }

    public boolean isDuplicate(String eventId) {
        return !processedIds.add(eventId);
    }
}