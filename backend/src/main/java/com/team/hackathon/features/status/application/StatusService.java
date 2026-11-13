package com.team.hackathon.features.status.application;

import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

@Service
public class StatusService {
    private final JdbcTemplate jdbc;

    public StatusService(JdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    public SystemStatus check() {
        Integer result = jdbc.queryForObject("SELECT 1", Integer.class);
        if (!Integer.valueOf(1).equals(result)) {
            throw new IllegalStateException("Database readiness check failed");
        }
        return new SystemStatus("ok", "connected");
    }

    public record SystemStatus(String status, String database) {}
}
