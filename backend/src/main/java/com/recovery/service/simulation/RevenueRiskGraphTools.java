package com.recovery.service.simulation;

import com.recovery.domain.Customer;
import com.recovery.domain.Payment;
import com.recovery.domain.RecoveryCase;
import com.recovery.repository.CustomerRepository;
import com.recovery.repository.PaymentRepository;
import com.recovery.repository.RecoveryCaseRepository;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

/**
 * Graph tools for the revenue-risk domain.
 *
 * Models failed payments as a risk graph where nodes are customers and edges
 * connect customers that fail for the same reason using the same method
 * (a correlated-failure cohort). The tools expose graph analytics the agent
 * and dashboard can use: connected risk clusters, risk concentration (Gini),
 * decline-reason distribution, a time-bucketed risk trend, and top-risk nodes.
 */
@Service
public class RevenueRiskGraphTools {

    public static class RiskNode {
        public Long customerId;
        public String name;
        public long atRiskMinor;
        public double riskScore;
        public String declineReason;
        public String method;
        public int degree;
        public double centrality; // weighted by at-risk amount
    }

    public static class RiskEdge {
        public Long source;
        public Long target;
        public String reason;
        public String method;
    }

    public static class RiskGraph {
        public List<RiskNode> nodes = new ArrayList<>();
        public List<RiskEdge> edges = new ArrayList<>();
        public int clusterCount = 0;
        public long totalAtRiskMinor = 0;
    }

    private final RecoveryCaseRepository caseRepo;
    private final CustomerRepository customerRepo;
    private final PaymentRepository paymentRepo;

    public RevenueRiskGraphTools(RecoveryCaseRepository caseRepo, CustomerRepository customerRepo, PaymentRepository paymentRepo) {
        this.caseRepo = caseRepo;
        this.customerRepo = customerRepo;
        this.paymentRepo = paymentRepo;
    }

    // ---- graph construction ----
    public RiskGraph buildGraph() {
        RiskGraph graph = new RiskGraph();

        List<RecoveryCase> cases = caseRepo.findAll();
        List<Payment> failedPayments = paymentRepo.findAll().stream()
                .filter(p -> "FAILED".equalsIgnoreCase(p.getStatus()))
                .collect(Collectors.toList());

        // per-customer aggregation
        Map<Long, Long> atRiskByCustomer = new HashMap<>();
        Map<Long, String> reasonByCustomer = new HashMap<>();
        Map<Long, String> methodByCustomer = new HashMap<>();
        Map<Long, List<Double>> riskByCustomer = new HashMap<>();
        Map<Long, String> nameByCustomer = new HashMap<>();

        for (Customer c : customerRepo.findAll()) {
            nameByCustomer.put(c.getId(), c.getName());
        }
        for (Payment p : failedPayments) {
            atRiskByCustomer.merge(p.getCustomerId(), (long) p.getAmountMinor(), Long::sum);
            reasonByCustomer.put(p.getCustomerId(), p.getFailureReason());
            methodByCustomer.put(p.getCustomerId(), p.getMethod());
            graph.totalAtRiskMinor += p.getAmountMinor();
        }
        for (RecoveryCase k : cases) {
            riskByCustomer.computeIfAbsent(k.getCustomerId(), k2 -> new ArrayList<>()).add(k.getRiskScore());
        }

        // build nodes
        Map<Long, RiskNode> nodeMap = new HashMap<>();
        for (Map.Entry<Long, Long> e : atRiskByCustomer.entrySet()) {
            Long cid = e.getKey();
            RiskNode node = new RiskNode();
            node.customerId = cid;
            node.name = nameByCustomer.getOrDefault(cid, "cust-" + cid);
            node.atRiskMinor = e.getValue();
            node.declineReason = reasonByCustomer.getOrDefault(cid, "unknown");
            node.method = methodByCustomer.getOrDefault(cid, "unknown");
            List<Double> risks = riskByCustomer.getOrDefault(cid, Collections.singletonList(0.5));
            node.riskScore = risks.stream().mapToDouble(Double::doubleValue).average().orElse(0.5);
            nodeMap.put(cid, node);
            graph.nodes.add(node);
        }

        // edges: connect customers sharing the same reason + method (cohort)
        List<Long> ids = new ArrayList<>(nodeMap.keySet());
        Map<String, List<Long>> cohortMembers = new HashMap<>();
        for (Long cid : ids) {
            RiskNode n = nodeMap.get(cid);
            String key = n.declineReason + "::" + n.method;
            cohortMembers.computeIfAbsent(key, k -> new ArrayList<>()).add(cid);
        }
        for (Map.Entry<String, List<Long>> cohort : cohortMembers.entrySet()) {
            List<Long> members = cohort.getValue();
            if (members.size() < 2) continue;
            String[] parts = cohort.getKey().split("::", -1);
            for (int i = 0; i < members.size(); i++) {
                for (int j = i + 1; j < members.size(); j++) {
                    RiskEdge edge = new RiskEdge();
                    edge.source = members.get(i);
                    edge.target = members.get(j);
                    edge.reason = parts[0];
                    edge.method = parts[1];
                    graph.edges.add(edge);
                    nodeMap.get(members.get(i)).degree++;
                    nodeMap.get(members.get(j)).degree++;
                }
            }
        }

        // centrality = degree weighted by at-risk share
        long maxAtRisk = graph.nodes.stream().mapToLong(n -> n.atRiskMinor).max().orElse(1L);
        for (RiskNode n : graph.nodes) {
            n.centrality = (n.atRiskMinor / (double) Math.max(maxAtRisk, 1)) * (1 + n.degree);
        }

        graph.clusterCount = cohortMembers.size();
        return graph;
    }

    // ---- tools ----

    /** Connected risk clusters (correlated-failure cohorts) with aggregate stats. */
    public List<Map<String, Object>> riskClusters() {
        RiskGraph g = buildGraph();
        Map<String, List<RiskNode>> byCohort = new LinkedHashMap<>();
        for (RiskNode n : g.nodes) {
            String key = n.declineReason + " / " + n.method;
            byCohort.computeIfAbsent(key, k -> new ArrayList<>()).add(n);
        }
        List<Map<String, Object>> clusters = new ArrayList<>();
        for (Map.Entry<String, List<RiskNode>> e : byCohort.entrySet()) {
            long atRisk = e.getValue().stream().mapToLong(n -> n.atRiskMinor).sum();
            double avgRisk = e.getValue().stream().mapToDouble(n -> n.riskScore).average().orElse(0);
            Map<String, Object> c = new LinkedHashMap<>();
            c.put("cohort", e.getKey());
            c.put("customerCount", e.getValue().size());
            c.put("atRiskMinor", atRisk);
            c.put("avgRiskScore", Math.round(avgRisk * 1000.0) / 1000.0);
            c.put("shareOfTotalRisk", g.totalAtRiskMinor > 0
                    ? Math.round((atRisk * 1000.0) / g.totalAtRiskMinor) / 10.0 : 0.0);
            c.put("customerIds", e.getValue().stream().map(n -> n.customerId).collect(Collectors.toList()));
            clusters.add(c);
        }
        clusters.sort((a, b) -> Long.compare((Long) b.get("atRiskMinor"), (Long) a.get("atRiskMinor")));
        return clusters;
    }

    /** Risk concentration: Gini coefficient + top-N share of at-risk revenue. */
    public Map<String, Object> riskConcentration() {
        RiskGraph g = buildGraph();
        List<Long> amounts = g.nodes.stream().map(n -> n.atRiskMinor).sorted().collect(Collectors.toList());
        double gini = gini(amounts);
        long total = g.totalAtRiskMinor;
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("gini", Math.round(gini * 1000.0) / 1000.0);
        result.put("totalAtRiskMinor", total);
        result.put("customerCount", g.nodes.size());
        for (int n : new int[]{5, 10}) {
            long topSum = amounts.stream().skip(Math.max(0, amounts.size() - n)).mapToLong(Long::longValue).sum();
            result.put("top" + n + "SharePct", total > 0 ? Math.round((topSum * 1000.0) / total) / 10.0 : 0.0);
        }
        return result;
    }

    /** Distribution of at-risk revenue across decline reasons. */
    public Map<String, Object> declineReasonDistribution() {
        RiskGraph g = buildGraph();
        Map<String, Long> byReason = new LinkedHashMap<>();
        for (RiskNode n : g.nodes) {
            byReason.merge(n.declineReason, n.atRiskMinor, Long::sum);
        }
        List<Map<String, Object>> rows = byReason.entrySet().stream()
                .map(e -> {
                    Map<String, Object> r = new LinkedHashMap<>();
                    r.put("reason", e.getKey());
                    r.put("atRiskMinor", e.getValue());
                    r.put("sharePct", g.totalAtRiskMinor > 0
                            ? Math.round((e.getValue() * 1000.0) / g.totalAtRiskMinor) / 10.0 : 0.0);
                    return r;
                })
                .sorted((a, b) -> Long.compare((Long) b.get("atRiskMinor"), (Long) a.get("atRiskMinor")))
                .collect(Collectors.toList());
        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalAtRiskMinor", g.totalAtRiskMinor);
        result.put("distribution", rows);
        return result;
    }

    /** Time-bucketed trend of at-risk revenue from case creation timestamps. */
    public List<Map<String, Object>> riskTrend(int buckets) {
        if (buckets <= 0) buckets = 12;
        List<RecoveryCase> cases = caseRepo.findAll();
        List<Payment> failed = paymentRepo.findAll().stream()
                .filter(p -> "FAILED".equalsIgnoreCase(p.getStatus()))
                .collect(Collectors.toList());
        Map<String, Long> atRiskByPayment = failed.stream()
                .collect(Collectors.toMap(Payment::getPaymentId, p -> (long) p.getAmountMinor(), Long::sum));

        List<Long> times = cases.stream().map(RecoveryCase::getDateCreated)
                .filter(Objects::nonNull).sorted().collect(Collectors.toList());
        if (times.isEmpty()) return Collections.emptyList();

        long min = times.get(0);
        long max = times.get(times.size() - 1);
        long span = Math.max(1, max - min);
        long step = span / buckets;

        List<Map<String, Object>> out = new ArrayList<>();
        for (int i = 0; i < buckets; i++) {
            long start = min + i * step;
            long end = (i == buckets - 1) ? max + 1 : start + step;
            long sum = 0;
            long count = 0;
            for (RecoveryCase k : cases) {
                Long t = k.getDateCreated();
                if (t != null && t >= start && t < end) {
                    sum += atRiskByPayment.getOrDefault(k.getPaymentId(), 0L);
                    count++;
                }
            }
            Map<String, Object> bucket = new LinkedHashMap<>();
            bucket.put("bucketStart", start);
            bucket.put("atRiskMinor", sum);
            bucket.put("caseCount", count);
            out.add(bucket);
        }
        return out;
    }

    /** Highest at-risk customers with their risk score and dominant failure reason. */
    public List<Map<String, Object>> topRiskCustomers(int n) {
        if (n <= 0) n = 10;
        return buildGraph().nodes.stream()
                .sorted((a, b) -> Long.compare(b.atRiskMinor, a.atRiskMinor))
                .limit(n)
                .map(node -> {
                    Map<String, Object> m = new LinkedHashMap<>();
                    m.put("customerId", node.customerId);
                    m.put("name", node.name);
                    m.put("atRiskMinor", node.atRiskMinor);
                    m.put("riskScore", Math.round(node.riskScore * 1000.0) / 1000.0);
                    m.put("declineReason", node.declineReason);
                    m.put("method", node.method);
                    m.put("centrality", Math.round(node.centrality * 1000.0) / 1000.0);
                    return m;
                })
                .collect(Collectors.toList());
    }

    /** One-call summary combining all graph tools for the dashboard. */
    public Map<String, Object> graphSummary() {
        RiskGraph g = buildGraph();
        Map<String, Object> summary = new LinkedHashMap<>();
        summary.put("nodeCount", g.nodes.size());
        summary.put("edgeCount", g.edges.size());
        summary.put("clusterCount", g.clusterCount);
        summary.put("totalAtRiskMinor", g.totalAtRiskMinor);
        summary.put("concentration", riskConcentration());
        summary.put("declineReasonDistribution", declineReasonDistribution().get("distribution"));
        summary.put("clusters", riskClusters());
        summary.put("topRiskCustomers", topRiskCustomers(10));
        summary.put("riskTrend", riskTrend(12));
        return summary;
    }

    // ---- helpers ----
    private static double gini(List<Long> sortedAsc) {
        int n = sortedAsc.size();
        if (n == 0) return 0.0;
        long sum = sortedAsc.stream().mapToLong(Long::longValue).sum();
        if (sum == 0) return 0.0;
        double cum = 0;
        for (int i = 0; i < n; i++) {
            cum += (2.0 * (i + 1) - n - 1) * sortedAsc.get(i);
        }
        return cum / (n * (double) sum);
    }
}
