package com.recovery.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "customers")
public class Customer {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private String plan;
    private Integer amountMinor;
    private String channelPref;
    private Boolean optOut = false;
    private Boolean dispute = false;
    private String recoverability = "high";

    public Customer() {}
    public Customer(String name, String plan, Integer amountMinor, String channelPref, Boolean optOut, Boolean dispute, String recoverability) {
        this.name = name; this.plan = plan; this.amountMinor = amountMinor;
        this.channelPref = channelPref; this.optOut = optOut; this.dispute = dispute;
        this.recoverability = recoverability;
    }
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getName() { return name; }
    public void setName(String v) { this.name = v; }
    public String getPlan() { return plan; }
    public void setPlan(String v) { this.plan = v; }
    public Integer getAmountMinor() { return amountMinor; }
    public void setAmountMinor(Integer v) { this.amountMinor = v; }
    public String getChannelPref() { return channelPref; }
    public void setChannelPref(String v) { this.channelPref = v; }
    public Boolean getOptOut() { return optOut; }
    public void setOptOut(Boolean v) { this.optOut = v; }
    public Boolean getDispute() { return dispute; }
    public void setDispute(Boolean v) { this.dispute = v; }
    public String getRecoverability() { return recoverability; }
    public void setRecoverability(String v) { this.recoverability = v; }
}
