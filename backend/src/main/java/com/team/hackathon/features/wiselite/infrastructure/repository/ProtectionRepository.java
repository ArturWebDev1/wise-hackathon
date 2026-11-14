package com.team.hackathon.features.wiselite.infrastructure.repository;

import com.team.hackathon.features.wiselite.infrastructure.entity.ProtectionEntity;
import jakarta.persistence.LockModeType;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface ProtectionRepository extends JpaRepository<ProtectionEntity, String> {
    Optional<ProtectionEntity> findByHelperId(String helperId);

    boolean existsByHelperId(String helperId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ProtectionEntity p WHERE p.ownerId = :ownerId")
    Optional<ProtectionEntity> lockByOwnerId(String ownerId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT p FROM ProtectionEntity p WHERE p.helperId = :helperId")
    Optional<ProtectionEntity> lockByHelperId(String helperId);
}
