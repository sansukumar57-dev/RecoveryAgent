package com.recovery.config;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
@ConfigurationProperties(prefix = "razorpay")
public class RazorpayProperties {
    private String keyId;
    private String keySecret;
    private String webhookSecret;
    private String baseUrl = "https://api.razorpay.com/v1";
    private String mode = "test";
    private Gateway gateway = new Gateway();
    private Webhook webhook = new Webhook();

    public static class Gateway {
        private boolean enabled = false;
        private boolean autoCapture = false;
        private boolean enable3ds = true;
        private boolean enableOffus = true;
        private String settlementCycle = "T+2";

        public boolean isEnabled() { return enabled; }
        public void setEnabled(boolean enabled) { this.enabled = enabled; }
        public boolean isAutoCapture() { return autoCapture; }
        public void setAutoCapture(boolean autoCapture) { this.autoCapture = autoCapture; }
        public boolean isEnable3ds() { return enable3ds; }
        public void setEnable3ds(boolean enable3ds) { this.enable3ds = enable3ds; }
        public boolean isEnableOffus() { return enableOffus; }
        public void setEnableOffus(boolean enableOffus) { this.enableOffus = enableOffus; }
        public String getSettlementCycle() { return settlementCycle; }
        public void setSettlementCycle(String settlementCycle) { this.settlementCycle = settlementCycle; }
    }

    public static class Webhook {
        private List<String> events = List.of();
        private String url;

        public List<String> getEvents() { return events; }
        public void setEvents(List<String> events) { this.events = events; }
        public String getUrl() { return url; }
        public void setUrl(String url) { this.url = url; }
    }

    public String getKeyId() { return keyId; }
    public void setKeyId(String keyId) { this.keyId = keyId; }
    public String getKeySecret() { return keySecret; }
    public void setKeySecret(String keySecret) { this.keySecret = keySecret; }
    public String getWebhookSecret() { return webhookSecret; }
    public void setWebhookSecret(String webhookSecret) { this.webhookSecret = webhookSecret; }
    public String getBaseUrl() { return baseUrl; }
    public void setBaseUrl(String baseUrl) { this.baseUrl = baseUrl; }
    public String getMode() { return mode; }
    public void setMode(String mode) { this.mode = mode; }
    public Gateway getGateway() { return gateway; }
    public void setGateway(Gateway gateway) { this.gateway = gateway; }
    public Webhook getWebhook() { return webhook; }
    public void setWebhook(Webhook webhook) { this.webhook = webhook; }

    public boolean isLiveMode() {
        return "live".equalsIgnoreCase(mode);
    }
}
