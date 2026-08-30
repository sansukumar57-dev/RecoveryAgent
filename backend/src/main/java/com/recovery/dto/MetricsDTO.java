package com.recovery.dto;

import java.util.Map;

/**
 * Dashboard metrics. Reports real numbers only — when the database is empty
 * every figure is zero and {@code hasData} is false, so the UI can show an
 * honest empty state instead of fabricated revenue.
 */
public class MetricsDTO {
    private boolean hasData;
    private long revenueAtRiskMinor;
    private long revenueRecoveredMinor;
    private double recoveryRate;
    private long activeCases;
    private long recoveredCases;
    private long escalatedCases;
    private long stoppedCases;
    private long totalCasesCount;
    private long expectedRecoveryMinor;
    private long avgCaseValueMinor;
    private String avgRecoveryTime;
    private String agentStatus;
    private long policyViolations;
    private Map<String, Long> actionDistribution;

    public boolean isHasData() { return hasData; }
    public void setHasData(boolean hasData) { this.hasData = hasData; }

    public long getRevenueAtRiskMinor() { return revenueAtRiskMinor; }
    public void setRevenueAtRiskMinor(long v) { this.revenueAtRiskMinor = v; }

    public long getRevenueRecoveredMinor() { return revenueRecoveredMinor; }
    public void setRevenueRecoveredMinor(long v) { this.revenueRecoveredMinor = v; }

    public double getRecoveryRate() { return recoveryRate; }
    public void setRecoveryRate(double v) { this.recoveryRate = v; }

    public long getActiveCases() { return activeCases; }
    public void setActiveCases(long v) { this.activeCases = v; }

    public long getRecoveredCases() { return recoveredCases; }
    public void setRecoveredCases(long v) { this.recoveredCases = v; }

    public long getEscalatedCases() { return escalatedCases; }
    public void setEscalatedCases(long v) { this.escalatedCases = v; }

    public long getStoppedCases() { return stoppedCases; }
    public void setStoppedCases(long v) { this.stoppedCases = v; }

    public long getTotalCasesCount() { return totalCasesCount; }
    public void setTotalCasesCount(long v) { this.totalCasesCount = v; }

    public long getExpectedRecoveryMinor() { return expectedRecoveryMinor; }
    public void setExpectedRecoveryMinor(long v) { this.expectedRecoveryMinor = v; }

    public long getAvgCaseValueMinor() { return avgCaseValueMinor; }
    public void setAvgCaseValueMinor(long v) { this.avgCaseValueMinor = v; }

    public String getAvgRecoveryTime() { return avgRecoveryTime; }
    public void setAvgRecoveryTime(String v) { this.avgRecoveryTime = v; }

    public String getAgentStatus() { return agentStatus; }
    public void setAgentStatus(String v) { this.agentStatus = v; }

    public long getPolicyViolations() { return policyViolations; }
    public void setPolicyViolations(long v) { this.policyViolations = v; }

    public Map<String, Long> getActionDistribution() { return actionDistribution; }
    public void setActionDistribution(Map<String, Long> v) { this.actionDistribution = v; }
}
