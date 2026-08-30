package com.recovery.service.evaluation;

import com.recovery.domain.Payment;
import com.recovery.service.diagnosis.PaymentDiagnosisAgent.DiagnosisResult;
import com.recovery.service.simulation.SimulationEngine;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Service
public class AbRunner {
    private static final Logger log = LoggerFactory.getLogger(AbRunner.class);
    private final SimulationEngine simEngine;
    private final ObjectMapper mapper = new ObjectMapper();

    private volatile Map<String, Object> lastReport;
    private final AtomicLong runCounter = new AtomicLong(0);

    public AbRunner(SimulationEngine simEngine) {
        this.simEngine = simEngine;
    }

    public Map<String, Object> runEvaluation(List<Payment> events, Map<String, String> rootCauses) {
        Map<String, Object> report = simEngine.runAxB(events, rootCauses);
        long runId = runCounter.incrementAndGet();
        report.put("run_id", runId);
        report.put("timestamp", System.currentTimeMillis());

        Map<String, Object> baseline = (Map<String, Object>) report.get("baseline");
        Map<String, Object> agent = (Map<String, Object>) report.get("agent");

        int baselineRecovered = (int) baseline.getOrDefault("recovered_minor", 0);
        int agentRecovered = (int) agent.getOrDefault("recovered_minor", 0);
        int improvement = agentRecovered - baselineRecovered;
        double improvementPct = baselineRecovered > 0 ? (double) improvement / baselineRecovered * 100 : 0;

        report.put("improvement_minor", improvement);
        report.put("improvement_pct", Math.round(improvementPct * 100.0) / 100.0);

        lastReport = report;
        log.info("A/B evaluation complete: baseline={}, agent={}, improvement={} ({}%)",
                baselineRecovered, agentRecovered, improvement, improvementPct);
        return report;
    }

    public Map<String, Object> getLastReport() {
        return lastReport;
    }
}
