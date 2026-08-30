package com.recovery.domain;

import jakarta.persistence.*;

@Entity
@Table(name = "notifications")
public class Notification {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    private String caseId;
    private Long customerId;
    
    @Column(columnDefinition = "TEXT")
    private String messageText;
    private String language; // English, Hinglish
    private String channel; // email, sms, whatsapp
    private Long sentAt;

    public Notification() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getCaseId() { return caseId; }
    public void setCaseId(String caseId) { this.caseId = caseId; }

    public Long getCustomerId() { return customerId; }
    public void setCustomerId(Long customerId) { this.customerId = customerId; }

    public String getMessageText() { return messageText; }
    public void setMessageText(String messageText) { this.messageText = messageText; }

    public String getLanguage() { return language; }
    public void setLanguage(String language) { this.language = language; }

    public String getChannel() { return channel; }
    public void setChannel(String channel) { this.channel = channel; }

    public Long getSentAt() { return sentAt; }
    public void setSentAt(Long sentAt) { this.sentAt = sentAt; }
}
