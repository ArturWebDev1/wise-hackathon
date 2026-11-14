package com.team.hackathon.features.wiselite.infrastructure.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;

@Entity
@Table(name = "we_account")
public class AccountEntity {
    @Id
    private String id;
    private String email;
    @Column(name = "wise_id", nullable = false)
    private String wiseId;
    @Column(name = "display_name", nullable = false)
    private String displayName;
    @Column(name = "password_hash")
    private String passwordHash;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal balance;

    protected AccountEntity() {}

    public AccountEntity(String id, String email, String wiseId, String displayName,
            String passwordHash, BigDecimal balance) {
        this.id = id;
        this.email = email;
        this.wiseId = wiseId;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
        this.balance = balance;
    }

    public String id() { return id; }
    public String wiseId() { return wiseId; }
    public String displayName() { return displayName; }
    public String passwordHash() { return passwordHash; }
    public BigDecimal balance() { return balance; }

    public void debit(BigDecimal amount) {
        balance = balance.subtract(amount);
    }

    public void credit(BigDecimal amount) {
        balance = balance.add(amount);
    }
}
