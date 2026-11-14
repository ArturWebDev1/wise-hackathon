package com.team.hackathon.features.wiselite.application;

import com.team.hackathon.features.wiselite.infrastructure.entity.TransferEntity;
import com.team.hackathon.features.wiselite.infrastructure.repository.AccountRepository;
import com.team.hackathon.features.wiselite.infrastructure.repository.MoneyRequestRepository;
import com.team.hackathon.features.wiselite.infrastructure.repository.ProtectionRepository;
import com.team.hackathon.features.wiselite.infrastructure.repository.TransferRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class DemoReset {
    // Keep these opening values aligned with R__wiseease_demo_seed.sql.
    private static final Map<String, BigDecimal> OPENING_BALANCES = Map.of(
            "maria", new BigDecimal("4000.00"), "nikita", new BigDecimal("5000.00"),
            "olga", new BigDecimal("25.00"), "anna", new BigDecimal("0.00"));
    private static final UUID OPENING_TRANSFER = UUID.fromString("00000000-0000-0000-0000-000000000001");

    private final boolean enabled;
    private final AccountRepository accounts;
    private final ProtectionRepository protections;
    private final TransferRepository transfers;
    private final MoneyRequestRepository requests;

    public DemoReset(@Value("${wiseease.demo.enabled:${WISEEASE_DEMO_ENABLED:false}}") boolean enabled,
            AccountRepository accounts, ProtectionRepository protections, TransferRepository transfers,
            MoneyRequestRepository requests) {
        this.enabled = enabled;
        this.accounts = accounts;
        this.protections = protections;
        this.transfers = transfers;
        this.requests = requests;
    }

    @Transactional
    public void reset(String actorId) {
        if (!enabled || !List.of("maria", "nikita").contains(actorId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Demo reset is unavailable for this account.");
        }

        var protection = protections.lockByOwnerId("maria")
                .filter(p -> p.helperId().equals("nikita"))
                .orElseThrow(DemoReset::unavailable);
        var demoIds = OPENING_BALANCES.keySet();
        var demoAccounts = accounts.lockAccounts(demoIds);
        if (demoAccounts.size() != demoIds.size() || transfers.existsBetweenDemoAndOtherAccounts(demoIds)) {
            throw unavailable();
        }

        transfers.deleteDemoTransfers(demoIds);
        requests.deleteForOwner("maria");
        demoAccounts.forEach(account -> account.restoreDemoBalance(OPENING_BALANCES.get(account.id())));
        protection.changeThreshold(Households.DEFAULT_THRESHOLD);
        Instant now = Instant.ofEpochMilli(transfers.currentEpochMillis());
        protection.changeThresholdRule(true, now);
        protection.changeCheckNew(true, now);
        protection.replaceRequestPeople(List.of("nikita"));
        var yesterday = now.minus(Duration.ofDays(1));
        transfers.save(new TransferEntity(OPENING_TRANSFER, "maria", "olga", new BigDecimal("25.00"),
                "sent", false, false, Households.DEFAULT_THRESHOLD, yesterday, null, null));
    }

    private static ResponseStatusException unavailable() {
        return new ResponseStatusException(HttpStatus.CONFLICT,
                "Use a fresh demo schema. The demo fixture is incomplete or has transfers with other accounts.");
    }
}
