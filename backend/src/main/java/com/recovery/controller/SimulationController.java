package com.recovery.controller;

import com.recovery.domain.*;
import com.recovery.repository.*;
import com.recovery.service.simulation.RevenueRiskAgent;
import com.recovery.service.simulation.RecoveryOrchestrator;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/simulation")
public class SimulationController {

    private final CustomerRepository customerRepo;
    private final PaymentRepository paymentRepo;
    private final OrderRepository orderRepo;
    private final SubscriptionRepository subscriptionRepo;
    private final RecoveryCaseRepository caseRepo;
    private final AgentAuditLogRepository auditRepo;
    private final PaymentAttemptRepository attemptRepo;
    private final NotificationRepository notificationRepo;
    
    private final RevenueRiskAgent riskAgent;
    private final RecoveryOrchestrator orchestrator;

    private final Random rng = new Random(42L); // Fixed seed for reproducible demo

    private static final String[] PLAN_NAMES = {"Premium Plan", "Standard Plan", "Enterprise Plan", "Basic Plan"};
    private static final int[] PLAN_AMOUNTS = {499900, 249900, 1299900, 99900}; // in minor units
    private static final String[] DECLINE_CODES = {
        "insufficient_funds", "card_expired", "gateway_timeout", "do_not_honour", "stolen_card", "mandate_lapsed", "user_abandoned"
    };
    private static final String[] METHODS = {"card", "upi", "netbanking", "wallet"};

    public SimulationController(CustomerRepository customerRepo, PaymentRepository paymentRepo,
                                OrderRepository orderRepo, SubscriptionRepository subscriptionRepo,
                                RecoveryCaseRepository caseRepo, AgentAuditLogRepository auditRepo,
                                PaymentAttemptRepository attemptRepo, NotificationRepository notificationRepo,
                                RevenueRiskAgent riskAgent, RecoveryOrchestrator orchestrator) {
        this.customerRepo = customerRepo;
        this.paymentRepo = paymentRepo;
        this.orderRepo = orderRepo;
        this.subscriptionRepo = subscriptionRepo;
        this.caseRepo = caseRepo;
        this.auditRepo = auditRepo;
        this.attemptRepo = attemptRepo;
        this.notificationRepo = notificationRepo;
        this.riskAgent = riskAgent;
        this.orchestrator = orchestrator;
    }

    // POST /api/simulation/generate
    @PostMapping("/generate")
    public ResponseEntity<Map<String, Object>> generateData(@RequestParam(defaultValue = "100") int count) {
        // Clear old database records to start fresh
        caseRepo.deleteAll();
        paymentRepo.deleteAll();
        orderRepo.deleteAll();
        subscriptionRepo.deleteAll();
        customerRepo.deleteAll();
        auditRepo.deleteAll();
        attemptRepo.deleteAll();
        notificationRepo.deleteAll();

        // 1. Generate 30 Customers
        List<Customer> customers = new ArrayList<>();
        String[] recoverability = {"high", "medium", "low"};
        String[] channels = {"email", "sms", "whatsapp"};
        
        for (int i = 1; i <= 30; i++) {
            Customer c = new Customer();
            c.setName(getRandomName());
            c.setPlan(PLAN_NAMES[rng.nextInt(PLAN_NAMES.length)]);
            c.setAmountMinor(PLAN_AMOUNTS[rng.nextInt(PLAN_AMOUNTS.length)]);
            c.setChannelPref(channels[rng.nextInt(channels.length)]);
            
            // Certain customers are opted out or have active disputes
            c.setOptOut(i == 7 || i == 19); // 2 customers opted out
            c.setDispute(i == 13); // 1 customer with dispute
            c.setRecoverability(recoverability[rng.nextInt(recoverability.length)]);
            customers.add(customerRepo.save(c));
        }

        // 2. Generate 100 Payments (60 FAILED, 40 SUCCESS to simulate baseline)
        int failedCount = 0;
        int successCount = 0;
        
        for (int i = 1; i <= count; i++) {
            Customer c = customers.get(rng.nextInt(customers.size()));
            Payment p = new Payment();
            p.setPaymentId("pay_" + UUID.randomUUID().toString().substring(0, 8));
            p.setCustomerId(c.getId());
            p.setAmountMinor(c.getAmountMinor());
            p.setCurrency("INR");
            p.setMethod(METHODS[rng.nextInt(METHODS.length)]);
            p.setOrderId("order_" + UUID.randomUUID().toString().substring(0, 8));
            p.setRetryCount(0);

            // High-value check
            if (i == 10 || i == 50) {
                p.setAmountMinor(2550000); // ₹25,500 for testing High-Value route
            }

            boolean isFailed = (i <= 60); // First 60 payments are failures, remaining are successful history
            if (isFailed) {
                p.setStatus("FAILED");
                p.setFailureReason(DECLINE_CODES[rng.nextInt(DECLINE_CODES.length)]);
                paymentRepo.save(p);
                
                // Initialize the AI Revenue Risk Detection Agent (Step 1 of Orchestration)
                riskAgent.detectAndCreateCase(p);
                failedCount++;
            } else {
                p.setStatus("SUCCESS");
                paymentRepo.save(p);
                successCount++;
            }

            // Create Order record for each payment
            Order o = new Order();
            o.setOrderId(p.getOrderId());
            o.setCustomerId(c.getId());
            o.setAmountMinor(p.getAmountMinor());
            o.setStatus("SUCCESS".equals(p.getStatus()) ? "paid" : "attempted");
            orderRepo.save(o);

            // Create Subscriptions for subscription plans
            if (rng.nextDouble() < 0.3) {
                Subscription sub = new Subscription();
                sub.setSubscriptionId("sub_" + UUID.randomUUID().toString().substring(0, 8));
                sub.setCustomerId(c.getId());
                sub.setPlan(c.getPlan());
                sub.setAmountMinor(c.getAmountMinor());
                sub.setStatus("SUCCESS".equals(p.getStatus()) ? "active" : "halted");
                subscriptionRepo.save(sub);
            }
        }

        Map<String, Object> response = new LinkedHashMap<>();
        response.put("status", "success");
        response.put("customers", customers.size());
        response.put("failedPayments", failedCount);
        response.put("successPayments", successCount);
        response.put("totalPayments", failedCount + successCount);
        response.put("activeCasesCreated", caseRepo.count());

        return ResponseEntity.ok(response);
    }

    // POST /api/demo/simulate or /api/simulation/run
    @PostMapping({"/run", "/demo/simulate"})
    public ResponseEntity<Map<String, Object>> runBatchSimulation() {
        List<RecoveryCase> activeCases = caseRepo.findAll().stream()
                .filter(c -> !"RECOVERED".equals(c.getStatus()) && !"ESCALATED".equals(c.getStatus()) && !"STOPPED".equals(c.getStatus()) && !"FAILED".equals(c.getStatus()))
                .collect(Collectors.toList());

        int processed = 0;
        for (RecoveryCase kase : activeCases) {
            orchestrator.runCaseToTermination(kase.getCaseId());
            processed++;
        }

        List<Payment> payments = paymentRepo.findAll();
        long revenueAtRisk = payments.stream().filter(p -> "FAILED".equalsIgnoreCase(p.getStatus())).mapToLong(Payment::getAmountMinor).sum();
        long revenueRecovered = payments.stream().filter(p -> "SUCCESS".equalsIgnoreCase(p.getStatus())).mapToLong(Payment::getAmountMinor).sum();

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("status", "success");
        result.put("casesProcessed", processed);
        result.put("revenueAtRisk", revenueAtRisk);
        result.put("revenueRecovered", revenueRecovered);
        result.put("remainingActiveCases", caseRepo.findAll().stream()
                .filter(c -> !"RECOVERED".equals(c.getStatus()) && !"ESCALATED".equals(c.getStatus()) && !"STOPPED".equals(c.getStatus()) && !"FAILED".equals(c.getStatus()))
                .count());

        return ResponseEntity.ok(result);
    }

    // POST /api/demo/reset
    @PostMapping("/demo/reset")
    public ResponseEntity<Map<String, Object>> resetDemoData() {
        return generateData(100);
    }

    private String getRandomName() {
        String[] firstNames = {"Arun", "Siddharth", "Neha", "Priya", "Rahul", "Anjali", "Vikram", "Karan", "Aditi", "Amit", "Rohan", "Meera", "Varun", "Simran", "Kabir"};
        String[] lastNames = {"Sharma", "Verma", "Kumar", "Iyer", "Mehta", "Patel", "Gupta", "Singh", "Joshi", "Sen", "Nair", "Reddy", "Rao", "Chawla", "Das"};
        return firstNames[rng.nextInt(firstNames.length)] + " " + lastNames[rng.nextInt(lastNames.length)];
    }
}
