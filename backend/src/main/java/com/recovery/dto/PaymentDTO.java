package com.recovery.dto;

import com.recovery.domain.Payment;

/** API view of a payment. Amount widened to long to avoid int overflow. */
public class PaymentDTO {
    private Long id;
    private String paymentId;
    private String orderId;
    private Long customerId;
    private Long amountMinor;
    private String currency;
    private String status;
    private String method;
    private String failureReason;
    private Integer retryCount;

    public static PaymentDTO from(Payment payment) {
        PaymentDTO dto = new PaymentDTO();
        dto.id = payment.getId();
        dto.paymentId = payment.getPaymentId();
        dto.orderId = payment.getOrderId();
        dto.customerId = payment.getCustomerId();
        dto.amountMinor = payment.getAmountMinor() != null ? payment.getAmountMinor().longValue() : null;
        dto.currency = payment.getCurrency();
        dto.status = payment.getStatus();
        dto.method = payment.getMethod();
        dto.failureReason = payment.getFailureReason();
        dto.retryCount = payment.getRetryCount();
        return dto;
    }

    public Long getId() { return id; }
    public String getPaymentId() { return paymentId; }
    public String getOrderId() { return orderId; }
    public Long getCustomerId() { return customerId; }
    public Long getAmountMinor() { return amountMinor; }
    public String getCurrency() { return currency; }
    public String getStatus() { return status; }
    public String getMethod() { return method; }
    public String getFailureReason() { return failureReason; }
    public Integer getRetryCount() { return retryCount; }
}
