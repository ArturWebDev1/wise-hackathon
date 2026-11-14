package com.team.hackathon.features.wiselite.infrastructure.repository;

import com.team.hackathon.features.wiselite.infrastructure.entity.SessionEntity;
import java.time.Instant;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface SessionRepository extends JpaRepository<SessionEntity, String> {
    Optional<SessionEntity> findByTokenHashAndExpiresAtAfter(String tokenHash, Instant now);

    @Modifying
    @Query("DELETE FROM SessionEntity s WHERE s.expiresAt <= :now")
    void deleteExpired(Instant now);
}
