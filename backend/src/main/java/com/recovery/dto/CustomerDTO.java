package com.recovery.dto;

import com.recovery.domain.Customer;

/**
 * API view of a customer. Intentionally omits nothing sensitive today, but
 * keeps a boundary so internal columns can change without breaking clients.
 */
public class CustomerDTO {
    private Long id;
    private String name;
    private String plan;
    private Long amountMinor;
    private String channelPref;
    private Boolean optOut;
    private Boolean dispute;
    private String recoverability;

    public static CustomerDTO from(Customer customer) {
        CustomerDTO dto = new CustomerDTO();
        dto.id = customer.getId();
        dto.name = customer.getName();
        dto.plan = customer.getPlan();
        dto.amountMinor = customer.getAmountMinor() != null ? customer.getAmountMinor().longValue() : null;
        dto.channelPref = customer.getChannelPref();
        dto.optOut = customer.getOptOut();
        dto.dispute = customer.getDispute();
        dto.recoverability = customer.getRecoverability();
        return dto;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public String getPlan() { return plan; }
    public Long getAmountMinor() { return amountMinor; }
    public String getChannelPref() { return channelPref; }
    public Boolean getOptOut() { return optOut; }
    public Boolean getDispute() { return dispute; }
    public String getRecoverability() { return recoverability; }
}
