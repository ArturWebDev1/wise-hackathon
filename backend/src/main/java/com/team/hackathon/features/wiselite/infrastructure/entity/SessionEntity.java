package com.team.hackathon.features.wiselite.infrastructure.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;

@Entity
@Table(name = "we_session")
public class SessionEntity {
    @Id
    @Column(name = "token_hash")
    private String tokenHash;
    @Column(name = "account_id", nullable = false)
    private String accountId;
    @Column(name = "expires_at", nullable = false)
    private Instant expiresAt;

    protected SessionEntity() {}

    public SessionEntity(String tokenHash, String accountId, Instant expiresAt) {
        this.tokenHash = tokenHash;
        this.accountId = accountId;
        this.expiresAt = expiresAt;
    }

    public String accountId() { return accountId; }
}
