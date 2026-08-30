package com.recovery.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "gateway_config")
public class GatewayConfig {
    @Id
    private String key;
    @Column(length = 1024)
    private String value;

    public GatewayConfig() {}

    public GatewayConfig(String key, String value) {
        this.key = key;
        this.value = value;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }
}
