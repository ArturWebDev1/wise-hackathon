package com.team.hackathon.features.wiselite.infrastructure.entity;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.Collection;
import java.util.HashSet;
import java.util.Set;

@Entity
@Table(name = "we_protection")
public class ProtectionEntity {
    @Id
    @Column(name = "owner_id")
    private String ownerId;
    @Column(name = "helper_id", nullable = false)
    private String helperId;
    @Column(nullable = false, precision = 12, scale = 2)
    private BigDecimal threshold;
    @Column(name = "check_new", nullable = false)
    private boolean checkNew;

    @ElementCollection
    @CollectionTable(name = "we_request_person", joinColumns = @JoinColumn(name = "owner_id"))
    @Column(name = "account_id", nullable = false)
    private Set<String> requestPeople = new HashSet<>();

    protected ProtectionEntity() {}

    public ProtectionEntity(String ownerId, String helperId, BigDecimal threshold, boolean checkNew) {
        this.ownerId = ownerId;
        this.helperId = helperId;
        this.threshold = threshold;
        this.checkNew = checkNew;
    }

    public String ownerId() { return ownerId; }
    public String helperId() { return helperId; }
    public BigDecimal threshold() { return threshold; }
    public boolean checkNew() { return checkNew; }
    public Set<String> requestPeople() { return Set.copyOf(requestPeople); }

    public void changeThreshold(BigDecimal threshold) {
        this.threshold = threshold;
    }

    public void changeCheckNew(boolean checkNew) {
        this.checkNew = checkNew;
    }

    public void replaceRequestPeople(Collection<String> ids) {
        requestPeople.retainAll(ids);
        requestPeople.addAll(ids);
    }
}
