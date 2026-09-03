package com.recovery.service.ingestion;

import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.*;

public class SignatureVerifierTest {

    private final SignatureVerifier verifier = new SignatureVerifier();
    private final String secret = "demo_webhook_secret";

    private String sign(String payload, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        return Base64.getEncoder().encodeToString(mac.doFinal(payload.getBytes(StandardCharsets.UTF_8)));
    }

    private String signHex(String payload, String key) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(key.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        byte[] hmac = mac.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        StringBuilder sb = new StringBuilder();
        for (byte b : hmac) sb.append(String.format("%02x", b));
        return sb.toString();
    }

    @Test
    void validBase64SignatureIsAccepted() throws Exception {
        String payload = "{\"event\":\"payment.failed\"}";
        assertTrue(verifier.verify(payload, sign(payload, secret), secret));
    }

    @Test
    void validHexSignatureIsAccepted() throws Exception {
        String payload = "{\"event\":\"payment.failed\"}";
        assertTrue(verifier.verify(payload, signHex(payload, secret), secret));
    }

    @Test
    void wrongSecretIsRejected() throws Exception {
        String payload = "{\"event\":\"payment.failed\"}";
        assertFalse(verifier.verify(payload, sign(payload, secret), secret + "tampered"));
    }

    @Test
    void tamperedPayloadIsRejected() throws Exception {
        String payload = "{\"event\":\"payment.failed\"}";
        assertFalse(verifier.verify(payload + "x", sign(payload, secret), secret));
    }

    @Test
    void legacyBypassShortcutsAreRejected() {
        // The old mock_signature / demo_webhook_secret auto-accept must no longer work.
        assertFalse(verifier.verify("{}", "mock_signature", secret));
        assertFalse(verifier.verify("{}", "anything", "demo_webhook_secret"));
    }

    @Test
    void nullInputsAreRejected() {
        assertFalse(verifier.verify(null, "sig", secret));
        assertFalse(verifier.verify("body", null, secret));
        assertFalse(verifier.verify("body", "sig", null));
    }
}
