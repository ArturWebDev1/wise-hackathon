# Hackathon workspace

Spring Boot + Expo (React Native, runs on web and phones) + PostgreSQL. One day, five developers, small independently owned features.

## First run

Install Docker with Compose and start Docker Desktop on Windows/macOS. From the repository root, build and start PostgreSQL, Spring Boot, and Expo Web:

```sh
docker compose up -d --build --wait
```

Open [the app](http://localhost:8081) or check [Spring and PostgreSQL readiness](http://localhost:8081/api/status). The web container serves the Expo PWA and forwards requests under `/api/` to Spring over the Compose network. Docker Compose reads the tracked development defaults from the root `.env`. Java, Maven, and Node run inside the build containers.

If a host port is occupied, override `FRONTEND_PORT` (8081), `SERVER_PORT` (8080), or `POSTGRES_PORT` (5432) in your shell before running Compose.

## Run Java and Expo locally

For hot reload or Expo Go, install **Java 21** and **Node 24** (see `.nvmrc`). Start just PostgreSQL from the repository root:

```sh
docker compose up -d --wait postgres
```

In a second terminal, start Spring Boot with the Maven Wrapper:

```sh
cd backend
./mvnw spring-boot:run
```

On Windows PowerShell use `.\mvnw.cmd spring-boot:run` instead.

In a third terminal, the Expo app (Wise Lite):

```sh
cd frontend
npm ci
npm start        # press w for web, or scan the QR code with Expo Go
```

On PowerShell, use `npm.cmd` if the execution policy blocks `npm.ps1`.

Spring reads the root `.env` and serves [its status endpoint](http://localhost:8080/api/status). For a different Spring host or port, see `frontend/.env.example` for the Expo API URL.

## Start a task

1. Tell Codex your name: Artur, Nikita, Gruba, Levin, or Kurban. It reads your `docs/developers/<name>/README.md` for language and note location.
2. Ensure the checkout is clean. Fetch and update `main`, then create a **new branch per task** from it. Do not put unrelated work on the same branch.
3. Discuss the smallest useful plan with Codex. Agree scope, owned paths, acceptance criteria, and API examples. Save the plan in your developer folder before implementation.
4. Implement small steps. Keep feature-specific UI, types, helpers, and endpoints inside the feature. Coordinate existing shared-file changes verbally before Codex edits them.
5. Sync against current `main`, resolve any conflicts with an explained proposal, run relevant checks, push, and open a PR. Merge through GitHub; self-merging is fine for ordinary changes. Ask a teammate to check shared or uncertain changes.
6. Delete the merged task branch and start the next task from freshly updated `main`.

For exact Git commands and conflict handling, read [team workflow](docs/workflow.md). See also the [detailed team workflow](docs/workflow.ru.md).

## Read only the context you need

- `AGENTS.md`: short mandatory instructions for Codex; **human-maintained after scaffolding**.
- Your `docs/developers/<name>/README.md`: preferred language and personal notes.
- [Architecture](docs/architecture.md): where code belongs, shared-file ownership, and test conventions.
- [Brief](docs/brief.md): current problem, target user, MVP, and exclusions.
- Your agreed task plan: implementation scope and API source of truth. If backend and frontend share a contract, both agents read the **same plan**, not separate copies.
- [Demo](docs/demo.md): click sequence, sample data, reset steps, and fallback.

No need to read everyone else's scratch notes or every document for each task. If a plan is needed by a teammate, commit it early and share its path.

## Checks and CI

Frontend, from `frontend/`:

```sh
npm run check
```

This runs ESLint, TypeScript, Vitest, and a production build. For fast iteration use `npm test` or `npm run test:watch`.

Backend, with Postgres running, from `backend/`:

```sh
./mvnw verify
```

On Windows use `.\mvnw.cmd verify`. The backend test makes a real HTTP request and checks a real PostgreSQL connection. No H2 replacement or external services are required beyond Postgres.

[GitHub Actions CI](.github/workflows/ci.yml) runs on PRs targeting `main`, pushes to `main`, and manual dispatch. It has separate frontend and backend jobs, supplies a fresh Postgres service, and uploads test-result artifacts. Future tests following the naming conventions in the architecture guide are discovered automatically.

To see CI on GitHub, push this baseline, then create and push a task branch with a small change and open a PR targeting `main`. Results appear in the PR's **Checks** tab and repository **Actions** tab. The workflow file alone does not enable branch protection: optionally require **Frontend checks** and **Backend checks** in GitHub repository settings. Mandatory human approval is unnecessary for this hackathon.

## Local development decisions

- Maven, npm, Java 21, Node 24; commit `frontend/package-lock.json` and use `npm ci` after cloning.
- Feature-based backend with layers added only when useful. Minimal interfaces/mappers; essential behavioral tests.
- Feature-local frontend components and helpers; small shared UI foundation. No global store or extra libraries until a feature needs them.
- Expo Web in Compose uses same-origin `/api/*` requests. During local development Expo can call Spring directly.
- Flyway manages the PostgreSQL schema and Hibernate validates it. Coordinate database schema changes and agree before adding migrations.
- Commit disposable development settings. Keep production credentials and private overrides out of Git. Expo bundles `EXPO_PUBLIC_*` variables into the client.
- `.editorconfig` and `.gitattributes` define shared formatting/line endings. Keep local `.idea/` and `.vscode/` state ignored. Enable EditorConfig support in your editor; avoid repository-wide formatting.

## Stop and reset

```sh
docker compose down
```

This keeps database data. `docker compose down -v` **deletes this project's local database volume**; use only when you intend to reset data, then run `docker compose up -d --wait`.

Deployment is optional. `deploy/` records the decision; there is no automatic deployment. `scripts/` holds documented local helper scripts.
