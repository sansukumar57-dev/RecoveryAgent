package com.recovery.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "orders")
public class Order {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(unique = true)
    private String orderId;
    private Long customerId;
    private Integer amountMinor;
    private String status; // paid, attempted, created

    public Order() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getOrderId() { return orderId; }
    public void setOrderId(String orderId) { this.orderId = orderId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public Integer getAmountMinor() { return amountMinor; }
    public void setAmountMinor(Integer amountMinor) { this.amountMinor = amountMinor; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
