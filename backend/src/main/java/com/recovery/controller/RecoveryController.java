package com.recovery.controller;

import com.recovery.domain.*;
import com.recovery.dto.*;
import com.recovery.repository.*;
import com.recovery.service.simulation.RecoveryOrchestrator;
import com.recovery.service.simulation.RevenueRiskAgent;
import com.recovery.service.simulation.RevenueRiskGraphTools;
import com.recovery.service.actuator.RecoveryExecutorTools;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class RecoveryController {

    private final RecoveryCaseRepository caseRepo;
    private final PaymentRepository paymentRepo;
    private final CustomerRepository customerRepo;
    private final OrderRepository orderRepo;
    private final AgentAuditLogRepository auditRepo;
    private final PaymentAttemptRepository attemptRepo;
    private final RecoveryOrchestrator orchestrator;
    private final RecoveryExecutorTools tools;
    private final RevenueRiskAgent riskAgent;
    private final RevenueRiskGraphTools riskGraph;

    public RecoveryController(RecoveryCaseRepository caseRepo, PaymentRepository paymentRepo,
                              CustomerRepository customerRepo, OrderRepository orderRepo,
                              AgentAuditLogRepository auditRepo, PaymentAttemptRepository attemptRepo,
                              RecoveryOrchestrator orchestrator, RecoveryExecutorTools tools,
                              RevenueRiskAgent riskAgent, RevenueRiskGraphTools riskGraph) {
        this.caseRepo = caseRepo;
        this.paymentRepo = paymentRepo;
        this.customerRepo = customerRepo;
        this.orderRepo = orderRepo;
        this.auditRepo = auditRepo;
        this.attemptRepo = attemptRepo;
        this.orchestrator = orchestrator;
        this.tools = tools;
        this.riskAgent = riskAgent;
        this.riskGraph = riskGraph;
    }

    // ── helpers ───────────────────────────────────────────────────────────

    private RecoveryCase requireCase(Long id) {
        return caseRepo.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Recovery case " + id + " not found"));
    }

    /** Batch-loads customers and payments so case listing does not N+1 query. */
    private List<RecoveryCaseDTO> toCaseDTOs(List<RecoveryCase> cases) {
        Map<Long, Customer> customers = customerRepo.findAll().stream()
                .collect(Collectors.toMap(Customer::getId, Function.identity(), (a, b) -> a));
        Map<String, Payment> payments = paymentRepo.findAll().stream()
                .filter(p -> p.getPaymentId() != null)
                .collect(Collectors.toMap(Payment::getPaymentId, Function.identity(), (a, b) -> a));

        return cases.stream()
                .map(k -> RecoveryCaseDTO.from(k, customers.get(k.getCustomerId()), payments.get(k.getPaymentId())))
                .collect(Collectors.toList());
    }

    // 1. POST /api/recovery/run
    @PostMapping("/recovery/run")
    public ResponseEntity<Map<String, Object>> runBatchRecovery() {
        // CaseStatus is an enum but status is persisted as a String — compare via
        // CaseStatus.isActive(), never enum.equals(String) (which is always false).
        List<RecoveryCase> activeCases = caseRepo.findAll().stream()
                .filter(c -> CaseStatus.isActive(c.getStatus()))
                .collect(Collectors.toList());

        int processedCount = 0;
        for (RecoveryCase kase : activeCases) {
            orchestrator.runCaseToTermination(kase.getCaseId());
            processedCount++;
        }

        return ResponseEntity.ok(Map.of("status", "success", "processed", processedCount));
    }

    // 2. GET /api/recovery/cases
    @GetMapping("/recovery/cases")
    public ResponseEntity<List<RecoveryCaseDTO>> getCases() {
        return ResponseEntity.ok(toCaseDTOs(caseRepo.findAll()));
    }

    // 3. GET /api/recovery/cases/{id}
    @GetMapping("/recovery/cases/{id}")
    public ResponseEntity<Map<String, Object>> getCaseDetails(@PathVariable Long id) {
        RecoveryCase kase = requireCase(id);

        Customer customer = customerRepo.findById(kase.getCustomerId()).orElse(null);
        Payment payment = paymentRepo.findByPaymentId(kase.getPaymentId()).orElse(null);
        List<AgentAuditLog> auditLogs = auditRepo.findByCaseIdOrderByTimestampAsc(kase.getCaseId());
        List<PaymentAttempt> attempts = attemptRepo.findByCaseIdOrderByTimestampAsc(kase.getCaseId());

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("case", RecoveryCaseDTO.from(kase, customer, payment));
        details.put("customer", customer != null ? CustomerDTO.from(customer) : null);
        details.put("payment", payment != null ? PaymentDTO.from(payment) : null);
        details.put("auditLogs", auditLogs.stream().map(AuditLogDTO::from).collect(Collectors.toList()));
        details.put("attempts", attempts);

        return ResponseEntity.ok(details);
    }

    // 4. POST /api/recovery/cases/{id}/execute
    @PostMapping("/recovery/cases/{id}/execute")
    @Transactional
    public ResponseEntity<RecoveryCaseDTO> executeCaseCycle(@PathVariable Long id) {
        RecoveryCase kase = requireCase(id);
        RecoveryCase updated = orchestrator.stepCase(kase.getCaseId());
        Customer customer = customerRepo.findById(updated.getCustomerId()).orElse(null);
        Payment payment = paymentRepo.findByPaymentId(updated.getPaymentId()).orElse(null);
        return ResponseEntity.ok(RecoveryCaseDTO.from(updated, customer, payment));
    }

    // 5. POST /api/recovery/cases/{id}/retry
    // Single transaction: the attempt, the payment and the case status commit or roll back together.
    @PostMapping("/recovery/cases/{id}/retry")
    @Transactional
    public ResponseEntity<PaymentAttempt> manualRetry(@PathVariable Long id) {
        RecoveryCase kase = requireCase(id);
        PaymentAttempt att = tools.retryPayment(kase.getCaseId(), kase.getPaymentId());

        kase.setStatus(("SUCCESS".equalsIgnoreCase(att.getStatus())
                ? CaseStatus.RECOVERED
                : CaseStatus.RETRY_PENDING).name());
        kase.setAttemptsCount(kase.getAttemptsCount() + 1);
        kase.setDateUpdated(System.currentTimeMillis());
        caseRepo.save(kase);

        return ResponseEntity.ok(att);
    }

    // 6. POST /api/recovery/cases/{id}/payment-link
    @PostMapping("/recovery/cases/{id}/payment-link")
    @Transactional
    public ResponseEntity<Map<String, Object>> manualPaymentLink(@PathVariable Long id) {
        RecoveryCase kase = requireCase(id);
        Payment payment = paymentRepo.findByPaymentId(kase.getPaymentId())
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "No payment found for case " + kase.getCaseId()));

        String orderId = payment.getOrderId();
        if (orderId == null) {
            orderId = "order_" + UUID.randomUUID().toString().substring(0, 8);
            payment.setOrderId(orderId);
            paymentRepo.save(payment);

            Order order = new Order();
            order.setOrderId(orderId);
            order.setCustomerId(kase.getCustomerId());
            order.setAmountMinor(payment.getAmountMinor());
            order.setStatus("created");
            orderRepo.save(order);
        }

        Map<String, Object> result = tools.createPaymentLink(kase.getCaseId(), orderId);
        kase.setAttemptsCount(kase.getAttemptsCount() + 1);
        kase.setStatus(CaseStatus.VERIFYING.name());
        kase.setDateUpdated(System.currentTimeMillis());
        caseRepo.save(kase);

        return ResponseEntity.ok(result);
    }

    // 7. POST /api/recovery/cases/{id}/escalate
    @PostMapping("/recovery/cases/{id}/escalate")
    @Transactional
    public ResponseEntity<RecoveryCaseDTO> manualEscalate(@PathVariable Long id) {
        RecoveryCase kase = requireCase(id);
        kase.setStatus(CaseStatus.ESCALATED.name());
        kase.setDateUpdated(System.currentTimeMillis());
        caseRepo.save(kase);
        tools.escalateToHuman(kase.getCaseId(), "Manually escalated via UI dashboard");

        Customer customer = customerRepo.findById(kase.getCustomerId()).orElse(null);
        Payment payment = paymentRepo.findByPaymentId(kase.getPaymentId()).orElse(null);
        return ResponseEntity.ok(RecoveryCaseDTO.from(kase, customer, payment));
    }

    // 7a. POST /api/recovery/cases/{id}/approve
    @PostMapping("/recovery/cases/{id}/approve")
    @Transactional
    public ResponseEntity<RecoveryCaseDTO> manualApprove(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        RecoveryCase kase = requireCase(id);
        String notes = body != null && body.containsKey("notes") ? body.get("notes") : "Approved by human operator via dashboard";

        tools.recordAuditEvent(kase.getCaseId(), "HumanReviewer", "HUMAN_APPROVAL", "APPROVE", notes, "APPROVED", "EXECUTED");

        kase.setStatus("DIAGNOSING");
        kase.setDateUpdated(System.currentTimeMillis());
        caseRepo.save(kase);

        RecoveryCase updated = orchestrator.stepCase(kase.getCaseId());
        if (updated == null) updated = kase;
        Customer customer = customerRepo.findById(updated.getCustomerId()).orElse(null);
        Payment payment = paymentRepo.findByPaymentId(updated.getPaymentId()).orElse(null);
        return ResponseEntity.ok(RecoveryCaseDTO.from(updated, customer, payment));
    }

    // 7b. POST /api/recovery/cases/{id}/reject
    @PostMapping("/recovery/cases/{id}/reject")
    @Transactional
    public ResponseEntity<RecoveryCaseDTO> manualReject(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body) {
        RecoveryCase kase = requireCase(id);
        String reason = body != null && body.containsKey("reason") ? body.get("reason") : "Rejected by human operator via dashboard";

        kase.setStatus(CaseStatus.STOPPED.name());
        kase.setDateUpdated(System.currentTimeMillis());
        caseRepo.save(kase);

        tools.recordAuditEvent(kase.getCaseId(), "HumanReviewer", "HUMAN_REJECTION", "REJECT", reason, "DENIED", "EXECUTED");

        Customer customer = customerRepo.findById(kase.getCustomerId()).orElse(null);
        Payment payment = paymentRepo.findByPaymentId(kase.getPaymentId()).orElse(null);
        return ResponseEntity.ok(RecoveryCaseDTO.from(kase, customer, payment));
    }

    // 7c. POST /api/recovery/cases/custom
    // Allows admin / operator to manually ingest custom failed payment cases
    @PostMapping("/recovery/cases/custom")
    @Transactional
    public ResponseEntity<RecoveryCaseDTO> createCustomCase(@RequestBody Map<String, Object> body) {
        String customerName = body.containsKey("customerName") ? body.get("customerName").toString() : "Custom Enterprise Client";
        String plan = body.containsKey("plan") ? body.get("plan").toString() : "Enterprise Annual";
        int amountMinor = body.containsKey("amountMinor") ? Integer.parseInt(body.get("amountMinor").toString()) : 2500000;
        String failureReason = body.containsKey("failureReason") ? body.get("failureReason").toString() : "gateway_timeout";
        String method = body.containsKey("method") ? body.get("method").toString() : "card";

        Customer customer = new Customer();
        customer.setName(customerName);
        customer.setPlan(plan);
        customer.setAmountMinor(amountMinor);
        customer.setChannelPref("whatsapp");
        customer = customerRepo.save(customer);

        Payment payment = new Payment();
        payment.setPaymentId("pay_" + UUID.randomUUID().toString().substring(0, 8));
        payment.setCustomerId(customer.getId());
        payment.setAmountMinor(amountMinor);
        payment.setCurrency("INR");
        payment.setMethod(method);
        payment.setOrderId("order_" + UUID.randomUUID().toString().substring(0, 8));
        payment.setStatus("FAILED");
        payment.setFailureReason(failureReason);
        payment.setRetryCount(0);
        payment = paymentRepo.save(payment);

        RecoveryCase kase = riskAgent.detectAndCreateCase(payment);
        return ResponseEntity.ok(RecoveryCaseDTO.from(kase, customer, payment));
    }

    // 8. GET /api/recovery/metrics and /api/dashboard
    @GetMapping({"/recovery/metrics", "/dashboard"})
    public ResponseEntity<MetricsDTO> getMetrics() {
        List<RecoveryCase> cases = caseRepo.findAll();
        List<Payment> payments = paymentRepo.findAll();

        // Amounts summed as long — an int would overflow past ~₹21L.
        long revenueAtRisk = payments.stream()
                .filter(p -> PaymentStatus.isFailed(p.getStatus()))
                .mapToLong(p -> p.getAmountMinor() != null ? p.getAmountMinor() : 0L).sum();
        long revenueRecovered = payments.stream()
                .filter(p -> PaymentStatus.isSuccess(p.getStatus()))
                .mapToLong(p -> p.getAmountMinor() != null ? p.getAmountMinor() : 0L).sum();

        long totalRevenue = revenueAtRisk + revenueRecovered;
        double recoveryRate = totalRevenue > 0 ? (double) revenueRecovered / totalRevenue : 0.0;

        long activeCases = cases.stream().filter(c -> CaseStatus.isActive(c.getStatus())).count();
        long escalatedCases = cases.stream().filter(c -> CaseStatus.ESCALATED.matches(c.getStatus())).count();
        long stoppedCases = cases.stream().filter(c -> CaseStatus.STOPPED.matches(c.getStatus())).count();
        long recoveredCases = cases.stream().filter(c -> CaseStatus.RECOVERED.matches(c.getStatus())).count();

        List<AgentAuditLog> logs = auditRepo.findAll();
        Map<String, Long> actionDistribution = logs.stream()
                .filter(l -> EventType.TOOL_EXECUTION.matches(l.getEventType()))
                .filter(l -> l.getTool() != null)
                .collect(Collectors.groupingBy(AgentAuditLog::getTool, LinkedHashMap::new, Collectors.counting()));

        long policyViolations = logs.stream()
                .filter(l -> {
                    GuardrailStatus g = GuardrailStatus.from(l.getPolicyResult());
                    return g != null && g.isDenied() && "EXECUTED".equalsIgnoreCase(l.getStatus());
                })
                .count();

        // Real numbers only — no fabricated demo values when the DB is empty.
        MetricsDTO dto = new MetricsDTO();
        dto.setHasData(!cases.isEmpty() || !payments.isEmpty());
        dto.setRevenueAtRiskMinor(revenueAtRisk);
        dto.setRevenueRecoveredMinor(revenueRecovered);
        dto.setRecoveryRate(Math.round(recoveryRate * 1000.0) / 10.0);
        dto.setActiveCases(activeCases);
        dto.setRecoveredCases(recoveredCases);
        dto.setEscalatedCases(escalatedCases);
        dto.setStoppedCases(stoppedCases);
        dto.setTotalCasesCount(cases.size());
        dto.setExpectedRecoveryMinor(Math.round(revenueAtRisk * 0.81));
        dto.setAvgCaseValueMinor(cases.isEmpty() ? 0 : revenueAtRisk / Math.max(1, activeCases));
        dto.setAvgRecoveryTime(averageRecoveryTime(cases));
        dto.setAgentStatus("ACTIVE");
        dto.setPolicyViolations(policyViolations);
        dto.setActionDistribution(actionDistribution);

        return ResponseEntity.ok(dto);
    }

    /** Mean created→updated duration of recovered cases, formatted as "8h 42m". */
    private String averageRecoveryTime(List<RecoveryCase> cases) {
        List<Long> durations = cases.stream()
                .filter(c -> CaseStatus.RECOVERED.matches(c.getStatus()))
                .filter(c -> c.getDateCreated() != null && c.getDateUpdated() != null)
                .map(c -> c.getDateUpdated() - c.getDateCreated())
                .filter(d -> d > 0)
                .collect(Collectors.toList());

        if (durations.isEmpty()) return "—";

        long avgMs = (long) durations.stream().mapToLong(Long::longValue).average().orElse(0);
        long hours = avgMs / 3_600_000L;
        long minutes = (avgMs % 3_600_000L) / 60_000L;
        return hours + "h " + minutes + "m";
    }

    // 9. GET /api/recovery/audit/{caseId}
    @GetMapping("/recovery/audit/{caseId}")
    public ResponseEntity<List<AuditLogDTO>> getAuditTrail(@PathVariable String caseId) {
        List<AgentAuditLog> logs = "all".equalsIgnoreCase(caseId)
                ? auditRepo.findAllByOrderByTimestampDesc()
                : auditRepo.findByCaseIdOrderByTimestampAsc(caseId);
        return ResponseEntity.ok(logs.stream().map(AuditLogDTO::from).collect(Collectors.toList()));
    }

    // 10. GET /api/payments
    @GetMapping("/payments")
    public ResponseEntity<List<PaymentDTO>> getPayments() {
        return ResponseEntity.ok(paymentRepo.findAll().stream().map(PaymentDTO::from).collect(Collectors.toList()));
    }

    // 11. GET /api/customers
    @GetMapping("/customers")
    public ResponseEntity<List<CustomerDTO>> getCustomers() {
        return ResponseEntity.ok(customerRepo.findAll().stream().map(CustomerDTO::from).collect(Collectors.toList()));
    }

    // 12. Revenue-risk graph tools
    @GetMapping("/risk/graph")
    public ResponseEntity<Map<String, Object>> riskGraphSummary() {
        return ResponseEntity.ok(riskGraph.graphSummary());
    }

    @GetMapping("/risk/graph/clusters")
    public ResponseEntity<List<Map<String, Object>>> riskGraphClusters() {
        return ResponseEntity.ok(riskGraph.riskClusters());
    }

    @GetMapping("/risk/graph/concentration")
    public ResponseEntity<Map<String, Object>> riskGraphConcentration() {
        return ResponseEntity.ok(riskGraph.riskConcentration());
    }

    @GetMapping("/risk/graph/distribution")
    public ResponseEntity<Map<String, Object>> riskGraphDistribution() {
        return ResponseEntity.ok(riskGraph.declineReasonDistribution());
    }

    @GetMapping("/risk/graph/trend")
    public ResponseEntity<List<Map<String, Object>>> riskGraphTrend(@RequestParam(defaultValue = "12") int buckets) {
        if (buckets < 1 || buckets > 200) {
            throw new IllegalArgumentException("buckets must be between 1 and 200");
        }
        return ResponseEntity.ok(riskGraph.riskTrend(buckets));
    }

    @GetMapping("/risk/graph/top")
    public ResponseEntity<List<Map<String, Object>>> riskGraphTop(@RequestParam(defaultValue = "10") int n) {
        if (n < 1 || n > 500) {
            throw new IllegalArgumentException("n must be between 1 and 500");
        }
        return ResponseEntity.ok(riskGraph.topRiskCustomers(n));
    }

    @GetMapping("/risk/graph/context")
    public ResponseEntity<Map<String, Object>> riskGraphContext(@RequestParam String paymentId) {
        return ResponseEntity.ok(riskAgent.graphRiskContext(paymentId));
    }
}
