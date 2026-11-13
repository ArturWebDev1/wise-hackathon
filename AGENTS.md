# Hackathon agent instructions

## Human-maintained file

Do not create, edit, rename, or delete `AGENTS.md` files. Developers maintain them manually after the explicitly authorized initial scaffold. Propose instruction changes to the developer in conversation instead.

## Read the smallest relevant context first

1. Identify the developer and read `docs/developers/<name>/README.md`. Names: `artur`, `nikita`, `gruba`, `levin`, `kurban`. Ask if identity is unknown before writing personal notes; do not assume everyone is Artur.
2. Follow their language preference: Artur — English; everyone else — Russian. Explicit user preferences take precedence. Use that language for plans, questions, conflict explanations, and team reminders.
3. Read `docs/architecture.md`, the relevant task plan, and `docs/brief.md` for product work. Read `docs/workflow.md` for Git operations. Russian-speaking developers must also read `docs/workflow.ru.md`, which translates the team rules.
4. Follow links only as needed. Do not read all personal notes or duplicate API contracts into this file. Human setup/check commands are in root `README.md`; demo steps are in `docs/demo.md`.

## Plan first; keep the prototype small

- We have roughly 12 hours. Prioritize a working demo and the agreed acceptance criteria.
- Discuss a small plan with the developer before implementation. Once agreed, save it in `docs/developers/<name>/<task>.md`, including owned paths, shared-file exceptions, API contract path/examples, implementation steps, and checks. Implement in small steps and update that plan as useful.
- Ask about material uncertainty; make routine implementation choices independently. Work only within assigned responsibility. Do not overwrite others' changes or edit other developers' notes without assignment.
- Java 21 + Spring Boot, Next.js + TypeScript, PostgreSQL through Docker, Maven wrapper, npm. Minimal interfaces/mappers/abstractions; only essential behavioral or integration tests. No unrelated refactors, broad formatting, or speculative infrastructure.
- Backend: `features/<feature>/{api,application,domain,infrastructure}`; add layers only when needed. Frontend: feature UI, endpoints, types, styles, and helpers belong under `src/features/<feature>/`; `components/ui/` and `lib/` are for truly shared code. Keep route composition thin. Small duplication is acceptable.
- Backend/frontend pairs use one agreed plan as the API source of truth. Agree changes with both sides; do not maintain competing contracts.

## Coordinate shared edits before making them

- Shared hotspots: existing shared UI/helpers, layouts/global styles, dependencies/lockfiles, root/config/CI files, `.env`, Compose, shared test setup/docs, and DB schema/migrations.
- Name exact files and intended changes. Ask the developer to verbally notify teammates and confirm nobody has overlapping work, or agree a single owner. Wait for confirmation before the shared edit. Already-confirmed ownership in the task counts; do not request it repeatedly.
- You cannot see teammates' unpushed changes. Continue independent feature-local work while coordination is pending. Afterward, list shared edits and remind the developer to notify the team and integrate promptly. Do not message teammates automatically.

## Branches, conflicts, and validation

- New task: clean working tree → `git fetch origin` → switch to `main` → `git pull --ff-only origin main` → create a new `codex/<developer>-<task>` branch. Never discard/stash work silently or force-push. Direct work on `main` was authorized only for the initial empty-repo scaffold.
- Before handoff, commit authorized task work, fetch again, and merge `origin/main` into the task branch. Do not merge the task into local `main`. If conflicts occur, show paths, both sides' intent, the cause, and a proposed resolution **before resolving**. Discuss uncertain choices; preserve both features. After agreement, resolve locally, show the resulting diff/explanation, and rerun relevant checks.
- Suggest committing and integrating when a coherent working slice is ready, especially if the branch has grown. Do not nag on a timer. Commit/push/PR/merge actions require the developer's request or standing authorization.
- Push the task branch and merge the PR into `main` through GitHub when authorized. Self-merging ordinary changes is acceptable. Ask for teammate input on uncertain shared changes. A conflict check is only a snapshot; sync/recheck if `main` advances. Delete merged task branches; start the next task from updated `main`.
- Frontend checks from `frontend/`: `npm run check` (lint, TypeScript, Vitest, build). Backend from `backend/`: `./mvnw verify`, or `.\mvnw.cmd verify` on Windows, with Postgres running. Start DB from root: `docker compose up -d --wait`.
- New frontend `src/**/*.{test,spec}.{ts,tsx}` and backend `src/test/java/**/*Test.java` / `*Tests.java` tests are discovered by CI automatically. Keep tests essential. Report actual results, shared edits, and unresolved limitations. Never silently bypass failing checks.

## Local settings

Tracked `.env` files contain deliberately committed disposable development settings. Keep production credentials/private overrides out of Git and secrets out of browser-exposed `NEXT_PUBLIC_*` values. Baseline browser requests use the Next.js same-origin API rewrite. Authentication and deployment are optional until required by the problem. Do not delete database data or deploy without an explicit task requiring it.
