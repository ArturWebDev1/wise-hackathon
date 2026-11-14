package com.team.hackathon.features.wiselite.infrastructure.repository;

import com.team.hackathon.features.wiselite.infrastructure.entity.MoneyRequestEntity;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface MoneyRequestRepository extends JpaRepository<MoneyRequestEntity, UUID> {
    @Modifying
    @Query("DELETE FROM MoneyRequestEntity r WHERE r.ownerId = :ownerId")
    int deleteForOwner(String ownerId);
}
