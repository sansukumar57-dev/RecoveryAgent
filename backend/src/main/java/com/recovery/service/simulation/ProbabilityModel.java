package com.recovery.service.simulation;

import org.springframework.stereotype.Component;
import java.util.Random;

@Component
public class ProbabilityModel {
    private final Random rng = new Random(42L);

    public double baseProbability(String diagnosis, String strategy) {
        return switch (diagnosis) {
            case "insufficient_funds" -> switch (strategy) {
                case "RETRY_PAYMENT" -> 0.60;
                case "CREATE_PAYMENT_LINK" -> 0.55;
                default -> 0.40;
            };
            case "expired_card" -> switch (strategy) {
                case "CREATE_PAYMENT_LINK" -> 0.65; // User updates card
                default -> 0.05;
            };
            case "temporary_gateway_issue" -> switch (strategy) {
                case "RETRY_PAYMENT" -> 0.75;
                case "CREATE_PAYMENT_LINK" -> 0.50;
                default -> 0.30;
            };
            case "authentication_failure" -> switch (strategy) {
                case "CREATE_PAYMENT_LINK" -> 0.60;
                default -> 0.20;
            };
            case "customer_abandonment" -> switch (strategy) {
                case "SEND_MESSAGE" -> 0.45;
                default -> 0.15;
            };
            default -> 0.35;
        };
    }

    public boolean simulate(double probability) {
        return rng.nextDouble() < probability;
    }

    public double withAdjustments(double base, int attempt, boolean personalized) {
        double adj = base;
        adj *= Math.pow(0.85, attempt - 1); // diminishing returns
        if (personalized) adj *= 1.20; // boost for personalization
        return Math.min(0.95, Math.max(0.01, adj));
    }
}
