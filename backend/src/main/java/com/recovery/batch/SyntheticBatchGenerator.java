package com.recovery.batch;

import com.recovery.domain.Payment;
import com.recovery.domain.Customer;
import org.springframework.stereotype.Component;

import java.util.*;

@Component
public class SyntheticBatchGenerator {
    private static final long SEED = 42L;
    private final Random rng = new Random(SEED);

    private static final String[] DECLINE_CODES = {
        "insufficient_funds", "card_expired", "do_not_honour", "stolen_card",
        "mandate_lapsed", "mandate_revoked", "invalid_card_number", "timeout", null
    };
    private static final String[] METHODS = {"card", "upi", "netbanking", "wallet"};

    public List<Customer> generateCustomers(int count) {
        List<Customer> customers = new ArrayList<>();
        String[] plans = {"basic", "pro", "enterprise"};
        String[] channels = {"email", "sms", "whatsapp"};
        String[] recoverability = {"high", "medium", "low"};
        for (int i = 0; i < count; i++) {
            customers.add(new Customer(
                "Customer_" + (i + 1),
                plans[rng.nextInt(plans.length)],
                50000 + rng.nextInt(500000),
                channels[rng.nextInt(channels.length)],
                rng.nextDouble() < 0.05,
                rng.nextDouble() < 0.02,
                recoverability[rng.nextInt(recoverability.length)]
            ));
        }
        return customers;
    }

    public List<Payment> generateBatch(int eventCount, List<Customer> customers) {
        List<Payment> events = new ArrayList<>();
        for (int i = 0; i < eventCount; i++) {
            Customer c = customers.get(rng.nextInt(customers.size()));
            Payment event = new Payment();
            event.setPaymentId("pay_" + UUID.randomUUID().toString().substring(0, 8));
            event.setCustomerId(c.getId());
            event.setCurrency("INR");
            String declineCode = DECLINE_CODES[rng.nextInt(DECLINE_CODES.length)];
            event.setFailureReason(declineCode);
            event.setMethod(METHODS[rng.nextInt(METHODS.length)]);
            event.setRetryCount(rng.nextInt(3));
            event.setAmountMinor(c.getAmountMinor());
            event.setStatus("FAILED");
            events.add(event);
        }
        return events;
    }
}
