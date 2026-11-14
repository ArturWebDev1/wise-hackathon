# Wise Care backend checks

Branch `codex/levin-backend-tests`, based on `main` at `2cf86da`.

## Changes

- Update `WiseEaseApiTest.java` in the `features/wiselite` test package for the current Flyway demo data. Maria has already sent money to Anna, Nikita, and Olga. Ola, Liisa, and Pavel are new recipients.
- Verify the demo scenario over HTTP. A €50 transfer to Anna goes through immediately. A €50 transfer to Ola waits for Nikita's decision. After approval, Maria sees the new status and a balance of €3,900 in the next state response.
- Run the existing scenarios for declines, approval requests expiring after 12 hours, protection deactivation after 24 hours, changes to the money request contact list, and transfer retries and concurrency.

The [Spring API contract](../nikita/wise-lite-api.md) describes state, transfers, and helper decisions. The changes are limited to the feature test and this plan.

## Running the tests

Use Java 21 and PostgreSQL. Run `docker compose up -d --wait postgres` from the repository root, then run `.\mvnw.cmd verify` on Windows or `./mvnw verify` on Linux or macOS from `backend/`. `WiseEaseApiTest` creates a separate PostgreSQL schema for every run and applies the Flyway migrations with demo data. For `StatusApiTest`, you can set `WISEEASE_DB_SCHEMA` to a separate schema to isolate the whole run from your local demo.

## Result

On November 14, 2026, `mvnw.cmd --batch-mode --no-transfer-progress verify` succeeded on Java 21 and PostgreSQL 17.12. All 25 Wise Care checks and the `/api/status` check passed. Maven built the executable JAR. The test covered Maria and Nikita's scenario over HTTP. Expo UI verification is a separate check.
