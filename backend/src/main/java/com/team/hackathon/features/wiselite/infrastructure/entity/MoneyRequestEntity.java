package com.team.hackathon.features.wiselite.infrastructure.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "we_money_request")
public class MoneyRequestEntity {
    @Id
    private UUID id;
    @Column(name = "owner_id", nullable = false)
    private String ownerId;
    @Column(name = "recipient_id", nullable = false)
    private String recipientId;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal amount;
    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    protected MoneyRequestEntity() {}

    public MoneyRequestEntity(UUID id, String ownerId, String recipientId, BigDecimal amount, Instant createdAt) {
        this.id = id;
        this.ownerId = ownerId;
        this.recipientId = recipientId;
        this.amount = amount;
        this.createdAt = createdAt;
    }
}
