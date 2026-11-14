package com.team.hackathon.features.wiselite.application;

import com.team.hackathon.features.wiselite.infrastructure.entity.AccountEntity;
import com.team.hackathon.features.wiselite.infrastructure.entity.ProtectionEntity;
import com.team.hackathon.features.wiselite.infrastructure.entity.TransferEntity;
import com.team.hackathon.features.wiselite.infrastructure.repository.AccountRepository;
import com.team.hackathon.features.wiselite.infrastructure.repository.ProtectionRepository;
import com.team.hackathon.features.wiselite.infrastructure.repository.TransferRepository;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Isolation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class Transfers {
    static final String ABOVE_THRESHOLD = "ABOVE_THRESHOLD";
    static final String NEW_RECIPIENT = "NEW_RECIPIENT";
    private static final Set<String> REASONS = Set.of(ABOVE_THRESHOLD, NEW_RECIPIENT);
    private static final List<String> SUCCEEDED = List.of("sent", "approved");
    private static final BigDecimal MAX_AMOUNT = new BigDecimal("1000000");
    private static final Duration APPROVAL_WINDOW = Duration.ofHours(12);

    private final AccountRepository accounts;
    private final ProtectionRepository protections;
    private final TransferRepository transfers;

    public Transfers(AccountRepository accounts, ProtectionRepository protections, TransferRepository transfers) {
        this.accounts = accounts;
        this.protections = protections;
        this.transfers = transfers;
    }

    @Transactional(readOnly = true, isolation = Isolation.REPEATABLE_READ)
    public List<String> preview(String ownerId, String recipientId, BigDecimal amount) {
        BigDecimal value = transferAmount(amount);
        validateRecipient(ownerId, recipientId);
        ProtectionEntity protection = protections.findById(ownerId).orElseThrow(Transfers::unavailable);
        if (!accounts.existsById(recipientId)) {
            throw error(HttpStatus.NOT_FOUND, "Recipient not found.");
        }
        return approvalReasons(ownerId, recipientId, value, protection);
    }

    @Transactional
    public UUID create(String ownerId, String recipientId, BigDecimal amount, String idempotencyKey,
            List<String> expectedReasons) {
        BigDecimal value = transferAmount(amount);
        validateRecipient(ownerId, recipientId);
        if (idempotencyKey == null || idempotencyKey.isBlank() || idempotencyKey.length() > 128) {
            throw error(HttpStatus.BAD_REQUEST, "An Idempotency-Key of at most 128 characters is required.");
        }
        if (expectedReasons == null || expectedReasons.stream().anyMatch(
                reason -> reason == null || !REASONS.contains(reason))) {
            throw error(HttpStatus.BAD_REQUEST, "Expected approval reasons are required.");
        }
        Set<String> expected = new HashSet<>(expectedReasons);
        if (expected.size() != expectedReasons.size()) {
            throw error(HttpStatus.BAD_REQUEST, "Approval reasons must be unique.");
        }

        ProtectionEntity protection = protections.lockByOwnerId(ownerId).orElseThrow(Transfers::unavailable);
        var match = transfers.findBySenderIdAndIdempotencyKey(ownerId, idempotencyKey);
        if (match.isPresent()) {
            TransferEntity previous = match.get();
            if (previous.recipientId().equals(recipientId) && previous.amount().compareTo(value) == 0) {
                return previous.id();
            }
            throw error(HttpStatus.CONFLICT, "This idempotency key was used for a different transfer.");
        }

        var locked = lockAccounts(ownerId, recipientId);
        List<String> reasons = approvalReasons(ownerId, recipientId, value, protection);
        if (!expected.equals(Set.copyOf(reasons))) {
            throw error(HttpStatus.CONFLICT, "Approval reasons changed. Review the transfer again.");
        }
        if (locked.sender().balance().compareTo(value) < 0) {
            throw error(HttpStatus.BAD_REQUEST, "There is not enough money for this transfer.");
        }

        UUID id = UUID.randomUUID();
        boolean pending = !reasons.isEmpty();
        Instant now = Instant.ofEpochMilli(transfers.currentEpochMillis());
        transfers.save(new TransferEntity(id, ownerId, recipientId, value, pending ? "pending" : "sent",
                reasons.contains(ABOVE_THRESHOLD), reasons.contains(NEW_RECIPIENT), protection.threshold(), now,
                pending ? now.plus(APPROVAL_WINDOW) : null, idempotencyKey));
        if (!pending) {
            locked.sender().debit(value);
            locked.recipient().credit(value);
        }
        return id;
    }

    @Transactional
    public String decide(String helperId, UUID id, Boolean approve) {
        if (approve == null) {
            throw error(HttpStatus.BAD_REQUEST, "Choose approve or decline.");
        }
        TransferEntity transfer = transfers.findAccessibleToHelper(id, helperId)
                .orElseThrow(Transfers::missingTransfer);
        String ownerId = transfer.senderId();
        ProtectionEntity protection = protections.lockByOwnerId(ownerId).orElseThrow(Transfers::missingTransfer);
        if (!helperId.equals(protection.helperId())) {
            throw missingTransfer();
        }
        if (!"pending".equals(transfer.status())) {
            throw closedTransfer();
        }
        LockedAccounts locked = approve ? lockAccounts(ownerId, transfer.recipientId()) : null;
        // The guarded update checks the database clock after the account locks were acquired.
        if (transfers.decidePending(id, approve ? "approved" : "declined") != 1) {
            throw closedTransfer();
        }
        if (locked != null) {
            BigDecimal amount = transfer.amount();
            if (locked.sender().balance().compareTo(amount) < 0) {
                throw error(HttpStatus.BAD_REQUEST, "There is no longer enough money for this transfer. Decline it instead.");
            }
            locked.sender().debit(amount);
            locked.recipient().credit(amount);
        }
        return ownerId;
    }

    private List<String> approvalReasons(String ownerId, String recipientId, BigDecimal amount,
            ProtectionEntity protection) {
        var reasons = new ArrayList<String>(2);
        if (amount.compareTo(protection.threshold()) > 0) {
            reasons.add(ABOVE_THRESHOLD);
        }
        if (protection.checkNew() && !transfers.existsBySenderIdAndRecipientIdAndStatusIn(
                ownerId, recipientId, SUCCEEDED)) {
            reasons.add(NEW_RECIPIENT);
        }
        return reasons;
    }

    private LockedAccounts lockAccounts(String senderId, String recipientId) {
        var locked = accounts.lockAccounts(List.of(senderId, recipientId));
        if (locked.size() != 2) {
            throw error(HttpStatus.NOT_FOUND, "Recipient not found.");
        }
        AccountEntity first = locked.getFirst();
        AccountEntity last = locked.getLast();
        return first.id().equals(senderId) ? new LockedAccounts(first, last) : new LockedAccounts(last, first);
    }

    static BigDecimal transferAmount(BigDecimal amount) {
        if (amount == null || amount.signum() <= 0 || amount.compareTo(MAX_AMOUNT) > 0
                || amount.stripTrailingZeros().scale() > 2) {
            throw error(HttpStatus.BAD_REQUEST, "Enter an amount from 0.01 to 1,000,000 with up to two decimals.");
        }
        return amount.setScale(2);
    }

    private static void validateRecipient(String ownerId, String recipientId) {
        if (recipientId == null || recipientId.isBlank() || recipientId.equals(ownerId)) {
            throw error(HttpStatus.BAD_REQUEST, "Choose a recipient other than yourself.");
        }
    }

    private static ResponseStatusException unavailable() {
        return error(HttpStatus.FORBIDDEN, "Transfers are unavailable for this account.");
    }

    private static ResponseStatusException missingTransfer() {
        return error(HttpStatus.NOT_FOUND, "This request isn't available.");
    }

    private static ResponseStatusException closedTransfer() {
        return error(HttpStatus.CONFLICT, "This request has expired or already been answered.");
    }

    private static ResponseStatusException error(HttpStatus status, String message) {
        return new ResponseStatusException(status, message);
    }

    private record LockedAccounts(AccountEntity sender, AccountEntity recipient) {}
}
