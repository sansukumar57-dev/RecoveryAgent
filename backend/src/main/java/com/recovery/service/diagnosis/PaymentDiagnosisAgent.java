package com.recovery.service.diagnosis;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.recovery.domain.Customer;
import com.recovery.domain.Payment;
import com.recovery.repository.CustomerRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class PaymentDiagnosisAgent {
    private static final Logger log = LoggerFactory.getLogger(PaymentDiagnosisAgent.class);
    private final LlmClient llmClient;
    private final CustomerRepository customerRepo;
    private final ObjectMapper mapper = new ObjectMapper();

    public static record DiagnosisResult(String diagnosis, double confidence, String recommendedStrategy, String reasoning) {}

    public PaymentDiagnosisAgent(LlmClient llmClient, CustomerRepository customerRepo) {
        this.llmClient = llmClient;
        this.customerRepo = customerRepo;
    }

    public DiagnosisResult diagnose(Payment payment) {
        Customer customer = customerRepo.findById(payment.getCustomerId()).orElse(null);
        String customerHistoryInfo = "";
        if (customer != null) {
            customerHistoryInfo = String.format("Customer Plan: %s, Customer Recoverability: %s, OptOut: %s",
                    customer.getPlan(), customer.getRecoverability(), customer.getOptOut());
        }

        String eventContextJson = String.format(
            "{\"paymentId\": \"%s\", \"amountMinor\": %d, \"method\": \"%s\", \"failureReason\": \"%s\", \"retryCount\": %d, \"customerHistory\": \"%s\"}",
            payment.getPaymentId(), payment.getAmountMinor(), payment.getMethod(), payment.getFailureReason(), payment.getRetryCount(), customerHistoryInfo
        );

        // Try LLM calls (via LlmClient, which has fallback chain inside)
        Map<String, Object> llmResponse = null;
        try {
            // LlmClient diagnose takes (eventJson, apiKey, provider)
            // If we pass empty API keys or it fails, it returns null
            // We can invoke it through openrouter/groq/nvidia
            llmResponse = llmClient.diagnose(eventContextJson, "", "openrouter");
        } catch (Exception e) {
            log.warn("LLM Diagnosis failed: {}", e.getMessage());
        }

        if (llmResponse != null) {
            try {
                String diagnosis = (String) llmResponse.getOrDefault("diagnosis", "unknown_failure");
                double confidence = llmResponse.get("confidence") instanceof Number n ? n.doubleValue() : 0.7;
                String strategy = (String) llmResponse.getOrDefault("recommendedStrategy", "RETRY_PAYMENT");
                String reasoning = (String) llmResponse.getOrDefault("reasoning", "Decided by LLM agent reasoning.");
                return new DiagnosisResult(diagnosis, confidence, strategy, reasoning);
            } catch (Exception e) {
                log.warn("Error parsing LLM response, falling back: {}", e.getMessage());
            }
        }

        // Rule-Based Fallback (Section 15: AI Model Failure Handling)
        return getFallbackDiagnosis(payment);
    }

    private DiagnosisResult getFallbackDiagnosis(Payment payment) {
        String code = payment.getFailureReason();
        String method = payment.getMethod();
        int retries = payment.getRetryCount();

        String diagnosis = "unknown_failure";
        String strategy = "RETRY_PAYMENT";
        double confidence = 0.85;
        String reasoning = "Fallback rule engine: ";

        if ("insufficient_funds".equalsIgnoreCase(code)) {
            diagnosis = "insufficient_funds";
            strategy = retries < 2 ? "RETRY_PAYMENT" : "CREATE_PAYMENT_LINK";
            reasoning += "Insufficient funds error. Retry if retry count is low, otherwise send payment link.";
        } else if ("card_expired".equalsIgnoreCase(code) || "expired_card".equalsIgnoreCase(code)) {
            diagnosis = "expired_card";
            strategy = "CREATE_PAYMENT_LINK";
            reasoning += "Expired card. Cannot retry. Recommend creating a new payment link for card update.";
        } else if ("stolen_card".equalsIgnoreCase(code) || "lost_card".equalsIgnoreCase(code)) {
            diagnosis = "bank_decline";
            strategy = "ESCALATE";
            reasoning += "Stolen/lost card. Denied for security. Human escalation required.";
        } else if ("mandate_lapsed".equalsIgnoreCase(code) || "mandate_revoked".equalsIgnoreCase(code)) {
            diagnosis = "authentication_failure";
            strategy = "CREATE_PAYMENT_LINK";
            reasoning += "Mandate failure. Need new customer authentication. Generate payment link.";
        } else if ("timeout".equalsIgnoreCase(code) || "gateway_timeout".equalsIgnoreCase(code) || "do_not_honour".equalsIgnoreCase(code)) {
            diagnosis = "temporary_gateway_issue";
            strategy = retries < 3 ? "RETRY_PAYMENT" : "CREATE_PAYMENT_LINK";
            reasoning += "Temporary bank gateway or network issue. Retry should resolve it.";
        } else if (code == null || code.isBlank() || "abandoned".equalsIgnoreCase(code)) {
            diagnosis = "customer_abandonment";
            strategy = "SEND_MESSAGE";
            reasoning += "Customer checkout drop-off or abandonment. Send outreach reminder.";
        } else {
            diagnosis = "unknown_failure";
            strategy = retries < 2 ? "RETRY_PAYMENT" : "CREATE_PAYMENT_LINK";
            reasoning += "Unclassified error code: " + code + ". Attempting retry, then link.";
        }

        return new DiagnosisResult(diagnosis, confidence, strategy, reasoning);
    }
}
