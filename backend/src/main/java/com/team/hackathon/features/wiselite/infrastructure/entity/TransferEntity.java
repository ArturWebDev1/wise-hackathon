package com.team.hackathon.features.wiselite.infrastructure.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "we_transfer")
public class TransferEntity {
    @Id
    private UUID id;
    @Column(name = "sender_id", nullable = false)
    private String senderId;
    @Column(name = "recipient_id", nullable = false)
    private String recipientId;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(nullable = false)
    private String status;
    @Column(name = "above_limit", nullable = false)
    private boolean aboveLimit;
    @Column(name = "new_recipient", nullable = false)
    private boolean newRecipient;
    @Column(name = "threshold_at_creation", nullable = false, precision = 12, scale = 2)
    private BigDecimal thresholdAtCreation;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
    @Column(name = "expires_at")
    private Instant expiresAt;
    @Column(name = "idempotency_key")
    private String idempotencyKey;

    protected TransferEntity() {}

    public TransferEntity(UUID id, String senderId, String recipientId, BigDecimal amount, String status,
            boolean aboveLimit, boolean newRecipient, BigDecimal thresholdAtCreation, Instant createdAt,
            Instant expiresAt, String idempotencyKey) {
        this.id = id;
        this.senderId = senderId;
        this.recipientId = recipientId;
        this.amount = amount;
        this.status = status;
        this.aboveLimit = aboveLimit;
        this.newRecipient = newRecipient;
        this.thresholdAtCreation = thresholdAtCreation;
        this.createdAt = createdAt;
        this.expiresAt = expiresAt;
        this.idempotencyKey = idempotencyKey;
    }

    public UUID id() { return id; }
    public String senderId() { return senderId; }
    public String recipientId() { return recipientId; }
    public BigDecimal amount() { return amount; }
    public String status() { return status; }
    public boolean aboveLimit() { return aboveLimit; }
    public boolean newRecipient() { return newRecipient; }
    public BigDecimal thresholdAtCreation() { return thresholdAtCreation; }
    public Instant createdAt() { return createdAt; }
    public Instant expiresAt() { return expiresAt; }
}
