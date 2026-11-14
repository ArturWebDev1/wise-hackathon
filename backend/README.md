# Spring Boot backend

The backend uses Java 21 and PostgreSQL. Wise Care code lives in `src/main/java/com/team/hackathon/features/wiselite/`. See the [roadmap](../docs/developers/levin/spring-boot-backend.md) and [decision notes](../docs/developers/levin/spring-boot-decisions.md) for implementation details.

## Run on Windows

Start PostgreSQL from the repository root.

```powershell
docker compose up -d --wait
```

Start the backend in another terminal. The root `.env` enables demo mode. Spring reads it when launched from the project root or from `backend/`.

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

On macOS and Linux, run `./mvnw spring-boot:run` from `backend/`. The API listens at `http://localhost:8080`. `/api/status` checks database connectivity. Sign in to the demo as `maria@example.com` or `nikita@example.com` with the password `WiseEaseDemo!`. Maria's known recipients are `anna`, `nikita`, and `olga`. The new recipients for the demo are `ola`, `liisa`, and `pavel`. Transfers to these new recipients require Nikita's approval.

The existing Maria and Nikita buttons open Spring demo sessions in this branch. From `frontend/`, run `npm ci`, then `npm run start -- --go --lan` for Expo Go or `npm run start -- --web` for the browser. By default, the client uses port `8080` on the Expo host. Set `EXPO_PUBLIC_API_URL` to override the address. On a phone, use the LAN IP of the computer running Spring. To allow a web origin on a different Expo port, configure `WISEEASE_CORS_ORIGIN_PATTERN` on the server.

## PostgreSQL schema and demo data

Flyway applies `src/main/resources/db/migration/V1__wiseease_schema.sql` before JPA starts. Hibernate validates the entities against the schema. The tables use the separate `wiseease` schema. The older `public.wl_*` and `public.we_*` tables remain available to legacy code.

The repeatable migration `R__wiseease_demo_seed.sql` loads demo data. With `WISEEASE_DEMO_ENABLED=true`, it creates the demo household with a fixed demo password in a clean schema. Turning demo mode back on preserves existing accounts, balances, and history, including data created by the previous Java seeder. With demo mode off, the migration skips new demo data. For a fresh demo, set `WISEEASE_DB_SCHEMA` to a new name such as `wiseease_demo2`.

## Quick API check

```powershell
$api = 'http://localhost:8080'
$login = Invoke-RestMethod -Method Post -Uri "$api/auth/login" -ContentType 'application/json' `
    -Body (@{ email = 'maria@example.com'; password = 'WiseEaseDemo!' } | ConvertTo-Json)
$headers = @{ Authorization = "Bearer $($login.token)" }
Invoke-RestMethod -Uri "$api/state" -Headers $headers
Invoke-RestMethod -Method Post -Uri "$api/transfers/preview" -Headers $headers -ContentType 'application/json' `
    -Body (@{ recipientId = 'anna'; amount = 600 } | ConvertTo-Json)
```

With fresh demo data, the state shows a €4,000 balance and three transfers in the history (Anna €35, Nikita €120, and Olga €25). A preview for €600 to `anna` returns `ABOVE_THRESHOLD`. A preview for €50 to `ola` returns `NEW_RECIPIENT`. See the [API contract](../docs/developers/nikita/wise-lite-api.md) for the other methods.

## Code and checks

- `api/WiseEaseController.java` handles HTTP entry points, sessions, and Wise Care routes.
- `application/Transfers.java` handles approval reasons, transactions, expiration, and decisions.
- `application/Households.java` provides the account snapshot, history, settings, and money requests.
- `application/Sessions.java` handles sign-in and session token validation.
- `infrastructure/entity/` contains JPA entities. `infrastructure/repository/` contains Spring Data JPA repositories. `src/main/resources/db/migration/` contains the schema and demo data.

Run `./mvnw verify` from `backend/` or `.\mvnw.cmd verify` on Windows. The tests use PostgreSQL.

From `frontend/`, `npm run check` runs lint, TypeScript, Vitest, and the web build.
