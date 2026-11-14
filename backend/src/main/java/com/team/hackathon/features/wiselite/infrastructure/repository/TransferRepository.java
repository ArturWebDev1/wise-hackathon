package com.team.hackathon.features.wiselite.infrastructure.repository;

import com.team.hackathon.features.wiselite.infrastructure.entity.TransferEntity;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface TransferRepository extends JpaRepository<TransferEntity, UUID> {
    Optional<TransferEntity> findBySenderIdAndIdempotencyKey(String senderId, String idempotencyKey);

    @Query("""
            SELECT t FROM TransferEntity t, ProtectionEntity p
            WHERE t.id = :id AND p.ownerId = t.senderId AND p.helperId = :helperId
            """)
    Optional<TransferEntity> findAccessibleToHelper(UUID id, String helperId);

    boolean existsBySenderIdAndRecipientIdAndStatusIn(String senderId, String recipientId, Collection<String> statuses);

    @Query("""
            SELECT t FROM TransferEntity t
            WHERE t.senderId = :ownerId OR (t.recipientId = :ownerId AND t.status IN ('sent', 'approved'))
            ORDER BY t.createdAt DESC, t.id DESC
            """)
    List<TransferEntity> findHistory(String ownerId);

    @Query(value = "SELECT CAST(FLOOR(EXTRACT(EPOCH FROM clock_timestamp()) * 1000) AS bigint)", nativeQuery = true)
    long currentEpochMillis();

    @Query(value = "SELECT CAST(FLOOR(EXTRACT(EPOCH FROM now()) * 1000) AS bigint)", nativeQuery = true)
    long snapshotEpochMillis();

    @Modifying
    @Query(value = """
            UPDATE we_transfer SET status = :status
            WHERE id = :id AND status = 'pending' AND expires_at > clock_timestamp()
            """, nativeQuery = true)
    int decidePending(UUID id, String status);
}
