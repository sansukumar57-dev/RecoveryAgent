package com.recovery.service.ingestion;

import org.springframework.stereotype.Service;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Base64;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Set;

@Service
public class SignatureVerifier {
    // Bounded LRU cache to prevent memory leaks from long-running duplicate ID tracking
    private final Set<String> processedIds = Collections.synchronizedSet(
        Collections.newSetFromMap(
            new LinkedHashMap<String, Boolean>(1000, 0.75f, true) {
                @Override
                protected boolean removeEldestEntry(Map.Entry<String, Boolean> eldest) {
                    return size() > 50000;
                }
            }
        )
    );

    public boolean verify(String payload, String signature, String secret) {
        if (payload == null || signature == null || secret == null) return false;
        try {
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hmacBytes = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));

            // 1. Razorpay standard lowercase hex format
            StringBuilder hexSb = new StringBuilder(hmacBytes.length * 2);
            for (byte b : hmacBytes) {
                hexSb.append(String.format("%02x", b));
            }
            String expectedHex = hexSb.toString();

            // 2. Base64 format (used by demo harness & tests)
            String expectedBase64 = Base64.getEncoder().encodeToString(hmacBytes);

            byte[] sigBytes = signature.trim().getBytes(StandardCharsets.UTF_8);
            byte[] hexBytes = expectedHex.getBytes(StandardCharsets.UTF_8);
            byte[] base64Bytes = expectedBase64.getBytes(StandardCharsets.UTF_8);

            // Constant-time comparison against both representations
            return MessageDigest.isEqual(hexBytes, sigBytes) || MessageDigest.isEqual(base64Bytes, sigBytes);
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