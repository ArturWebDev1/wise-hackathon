package com.team.hackathon.features.wiselite.application;

import com.team.hackathon.features.wiselite.infrastructure.entity.AccountEntity;
import com.team.hackathon.features.wiselite.infrastructure.entity.MoneyRequestEntity;
import com.team.hackathon.features.wiselite.infrastructure.entity.ProtectionEntity;
import com.team.hackathon.features.wiselite.infrastructure.entity.TransferEntity;
import com.team.hackathon.features.wiselite.infrastructure.repository.AccountRepository;
import com.team.hackathon.features.wiselite.infrastructure.repository.MoneyRequestRepository;
import com.team.hackathon.features.wiselite.infrastructure.repository.ProtectionRepository;
import com.team.hackathon.features.wiselite.infrastructure.repository.TransferRepository;
import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class Households {
    static final BigDecimal DEFAULT_THRESHOLD = new BigDecimal("250.00");

    private final AccountRepository accounts;
    private final ProtectionRepository protections;
    private final TransferRepository transfers;
    private final MoneyRequestRepository moneyRequests;

    public Households(AccountRepository accounts, ProtectionRepository protections,
            TransferRepository transfers, MoneyRequestRepository moneyRequests) {
        this.accounts = accounts;
        this.protections = protections;
        this.transfers = transfers;
        this.moneyRequests = moneyRequests;
    }

    public Account account(String id) {
        return account(findAccount(id), protections.existsByHelperId(id));
    }

    public Person lookup(String actorId, String wiseId) {
        return findByWiseId(wiseId)
                .filter(account -> !account.id().equals(actorId) || protections.existsByHelperId(actorId))
                .map(Households::person)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "No account found for this Wise ID."));
    }

    @Transactional
    public void connect(String ownerId, String helperWiseId) {
        AccountEntity helper = findByWiseId(helperWiseId)
                .filter(account -> account.passwordHash() != null)
                .orElseThrow(() -> error(HttpStatus.NOT_FOUND, "No sign-in account found for this Wise ID."));
        String helperId = helper.id();
        if (ownerId.equals(helperId)) {
            throw error(HttpStatus.BAD_REQUEST, "Choose a helper other than yourself.");
        }

        // Serialize competing links for either account, including attempts with the roles reversed.
        accounts.lockAccounts(List.of(ownerId, helperId));
        var existing = protections.findById(ownerId);
        if (existing.isPresent() && existing.get().helperId().equals(helperId)) {
            return;
        }
        if (existing.isPresent() || protections.existsByHelperId(ownerId) || protections.existsById(helperId)
                || protections.existsByHelperId(helperId)) {
            throw error(HttpStatus.CONFLICT, "One of these accounts already belongs to a protected household.");
        }
        var protection = new ProtectionEntity(ownerId, helperId, DEFAULT_THRESHOLD, true);
        protection.replaceRequestPeople(List.of(helperId));
        protections.save(protection);
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public State state(String actorId) {
        AccountEntity signedIn = findAccount(actorId);
        var helperProtection = protections.findByHelperId(actorId);
        boolean helper = helperProtection.isPresent();
        ProtectionEntity protection = helperProtection.orElseGet(() -> protections.findById(actorId).orElseThrow(
                () -> error(HttpStatus.FORBIDDEN, "This account has no protected household.")));
        String ownerId = protection.ownerId();
        BigDecimal balance = helper ? null : signedIn.balance();
        var history = transfers.findHistory(ownerId);
        var transferPeople = new HashSet<String>();
        for (TransferEntity transfer : history) {
            transferPeople.add(transfer.senderId());
            transferPeople.add(transfer.recipientId());
        }
        var peopleById = new HashMap<String, Person>();
        accounts.findAllById(transferPeople).forEach(account -> peopleById.put(account.id(), person(account)));
        Instant now = Instant.ofEpochMilli(transfers.snapshotEpochMillis());
        var items = history.stream().map(item -> transfer(item, ownerId, peopleById, now)).toList();
        var recipients = accounts.findPastRecipients(ownerId).stream().map(Households::person).toList();
        var allowed = protection.requestPeople();
        var requestPeople = allowed.isEmpty() ? List.<Person>of()
                : accounts.findByIdInOrderByDisplayNameAscIdAsc(allowed).stream().map(Households::person).toList();
        Map<String, Long> protectionOffAt = new HashMap<>(2);
        if (protection.thresholdOffAt() != null && protection.thresholdOffAt().isAfter(now)) {
            protectionOffAt.put("limit", protection.thresholdOffAt().toEpochMilli());
        }
        if (protection.checkNewOffAt() != null && protection.checkNewOffAt().isAfter(now)) {
            protectionOffAt.put("checkNew", protection.checkNewOffAt().toEpochMilli());
        }
        BigDecimal activeLimit = protection.thresholdEnabledAt(now) ? protection.threshold() : null;
        return new State(account(signedIn, helper), ownerId, balance, signedIn.balance(), activeLimit,
                protection.checkNewAt(now), protectionOffAt, items, recipients, requestPeople);
    }

    @Transactional
    public void threshold(String helperId, BigDecimal threshold) {
        helperProtection(helperId).changeThreshold(Transfers.transferAmount(threshold));
    }

    @Transactional
    public void thresholdRule(String helperId, Boolean enabled) {
        if (enabled == null) {
            throw error(HttpStatus.BAD_REQUEST, "Choose whether to check transfers above the threshold.");
        }
        ProtectionEntity protection = helperProtection(helperId);
        protection.changeThresholdRule(enabled, Instant.ofEpochMilli(transfers.currentEpochMillis()));
    }

    @Transactional
    public void checkNew(String helperId, Boolean enabled) {
        if (enabled == null) {
            throw error(HttpStatus.BAD_REQUEST, "Choose whether to check new recipients.");
        }
        ProtectionEntity protection = helperProtection(helperId);
        protection.changeCheckNew(enabled, Instant.ofEpochMilli(transfers.currentEpochMillis()));
    }

    @Transactional
    public void requestPeople(String helperId, List<String> accountIds) {
        ProtectionEntity protection = helperProtection(helperId);
        if (accountIds == null || accountIds.size() > 25 || accountIds.stream().anyMatch(
                id -> id == null || id.isBlank() || id.length() > 64 || id.equals(protection.ownerId()))
                || new HashSet<>(accountIds).size() != accountIds.size()) {
            throw error(HttpStatus.BAD_REQUEST, "Choose up to 25 distinct people from Wise accounts.");
        }
        if (accounts.findAllById(accountIds).size() != accountIds.size()) {
            throw error(HttpStatus.BAD_REQUEST, "A selected account was not found.");
        }
        protection.replaceRequestPeople(accountIds);
    }

    @Transactional
    public UUID requestMoney(String ownerId, String recipientId, BigDecimal requestedAmount) {
        BigDecimal value = Transfers.transferAmount(requestedAmount);
        ProtectionEntity protection = protections.lockByOwnerId(ownerId).orElseThrow(
                () -> error(HttpStatus.FORBIDDEN, "Only the account owner can request money."));
        if (recipientId == null || !protection.requestPeople().contains(recipientId)) {
            throw error(HttpStatus.BAD_REQUEST, "Choose a person from your request list.");
        }
        UUID id = UUID.randomUUID();
        moneyRequests.save(new MoneyRequestEntity(id, ownerId, recipientId, value,
                Instant.ofEpochMilli(transfers.currentEpochMillis())));
        return id;
    }

    private ProtectionEntity helperProtection(String helperId) {
        return protections.lockByHelperId(helperId).orElseThrow(
                () -> error(HttpStatus.FORBIDDEN, "Only the assigned helper can change these settings."));
    }

    private Optional<AccountEntity> findByWiseId(String wiseId) {
        if (wiseId == null || !wiseId.strip().matches("[A-Za-z0-9_.-]{1,64}")) {
            throw error(HttpStatus.BAD_REQUEST, "Enter a valid Wise ID.");
        }
        return accounts.findByWiseId(wiseId.strip().toLowerCase(Locale.ROOT));
    }

    private AccountEntity findAccount(String id) {
        return accounts.findById(id).orElseThrow(() -> error(HttpStatus.UNAUTHORIZED, "Sign in to continue."));
    }

    private static Account account(AccountEntity account, boolean helper) {
        return new Account(account.id(), account.wiseId(), account.displayName(), helper ? "helper" : "owner");
    }

    private static Person person(AccountEntity account) {
        return new Person(account.id(), account.wiseId(), account.displayName());
    }

    private static Transfer transfer(TransferEntity item, String ownerId, Map<String, Person> people, Instant now) {
        boolean incoming = !ownerId.equals(item.senderId());
        Instant expiry = item.expiresAt();
        boolean expired = "pending".equals(item.status()) && expiry != null && !expiry.isAfter(now);
        var reasons = new ArrayList<String>(2);
        if (item.aboveLimit()) {
            reasons.add(Transfers.ABOVE_THRESHOLD);
        }
        if (item.newRecipient()) {
            reasons.add(Transfers.NEW_RECIPIENT);
        }
        return new Transfer(item.id(), people.get(item.recipientId()), incoming ? people.get(item.senderId()) : null,
                incoming ? "incoming" : "outgoing", item.amount(), expired ? "declined" : item.status(),
                item.createdAt().toEpochMilli(), expiry == null ? null : expiry.toEpochMilli(), expired, reasons,
                item.aboveLimit(), item.newRecipient(), item.thresholdAtCreation());
    }

    private static ResponseStatusException error(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    public record Account(String id, String wiseId, String name, String role) {}

    public record Person(String id, String wiseId, String name) {}

    public record Transfer(UUID id, Person recipient, Person sender, String direction, BigDecimal amount,
            String status, long createdAt, Long expiresAt, boolean expired, List<String> approvalReasons,
            boolean aboveLimit, boolean isNew, BigDecimal limitAtCreation) {}

    public record State(Account account, String ownerId, BigDecimal balance, BigDecimal accountBalance,
            BigDecimal limit, boolean checkNew, Map<String, Long> protectionOffAt,
            List<Transfer> transfers, List<Person> recipients, List<Person> requestPeople) {}
}
