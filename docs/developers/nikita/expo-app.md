# Plan for moving Wise Lite (Expo) into the repository

Branch: `codex/nikita-wise-lite`. Working language: Russian.

## Goal

Move the existing Wise Lite app into `frontend/` in place of Next.js. Keep the temporary API working and prepare the contract for the team's Spring Boot rewrite.

## Completed work

- `frontend/` is the Expo app for React Native, web, and phones. The team agreed to remove Next.js.
- `api-prototype/` is the temporary Node API on `:3001`. It connects to PostgreSQL from `compose.yaml` and creates its own `wl_` tables. Remove it after the Spring Boot rewrite.
- The [API contract](wise-lite-api.md) and [database schema](wise-lite-schema.sql) are the shared source for the Spring version. They also describe the business rules.
- Risk and IBAN rules are in `frontend/lib/rules.ts` with 8 Vitest tests.

## Owned paths

`frontend/**`, `api-prototype/**`, and `docs/developers/nikita/**`.

## Shared files changed by verbal agreement

- All of `frontend/`, including `package-lock.json`, for the switch from Next.js to Expo.
- `.gitignore` for `dist/` and `.expo/`, plus setup commands in `README.md` and `docs/demo.md`.
- `.github/workflows/ci.yml` and `.nvmrc` stayed as they were. The new frontend's `lint`, `typecheck`, `test`, and `build` scripts match the CI commands.

## Checks

`npm run check` passed in `frontend/`, covering lint, type checking, 8 tests, and `expo export -p web`. The backend prototype was checked manually with `curl` against PostgreSQL from `compose.yaml`.

## Limitations

- The Spring Boot rewrite was pending at this stage. The prototype does not authenticate API callers.
- The frontend no longer has the old “Check connection” flow from Next.js through Spring to PostgreSQL.
- Tests cover the standalone rules. UI testing is pending.
- A local PostgreSQL instance may already use `5432`. In that case, run `POSTGRES_PORT=5433 docker compose up -d --wait`.
