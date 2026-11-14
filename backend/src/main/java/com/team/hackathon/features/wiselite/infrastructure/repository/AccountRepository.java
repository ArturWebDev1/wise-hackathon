package com.team.hackathon.features.wiselite.infrastructure.repository;

import com.team.hackathon.features.wiselite.infrastructure.entity.AccountEntity;
import jakarta.persistence.LockModeType;
import java.util.Collection;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface AccountRepository extends JpaRepository<AccountEntity, String> {
    Optional<AccountEntity> findByEmailAndPasswordHashIsNotNull(String email);

    Optional<AccountEntity> findByWiseId(String wiseId);

    List<AccountEntity> findByIdInOrderByDisplayNameAscIdAsc(Collection<String> ids);

    @Query("""
            SELECT a FROM AccountEntity a
            WHERE EXISTS (
                SELECT 1 FROM TransferEntity t WHERE t.senderId = :ownerId
                AND t.recipientId = a.id AND t.status IN ('sent', 'approved')
            )
            ORDER BY a.displayName, a.id
            """)
    List<AccountEntity> findPastRecipients(String ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT a FROM AccountEntity a WHERE a.id IN :ids ORDER BY a.id")
    List<AccountEntity> lockAccounts(Collection<String> ids);
}
