package com.recovery.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "subscriptions")
public class Subscription {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String subscriptionId;
    private Long customerId;
    private String status; // authenticated, active, pending, halted, cancelled
    private String plan;
    private Integer amountMinor;

    public Subscription() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSubscriptionId() { return subscriptionId; }
    public void setSubscriptionId(String subscriptionId) { this.subscriptionId = subscriptionId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPlan() { return plan; }
    public void setPlan(String plan) { this.plan = plan; }

    public Integer getAmountMinor() { return amountMinor; }
    public void setAmountMinor(Integer amountMinor) { this.amountMinor = amountMinor; }
}
