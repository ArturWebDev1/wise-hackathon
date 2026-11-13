# Architecture and ownership

## Scope first

Time budget: roughly 12 hours. Prefer a working end-to-end demo over framework building. Create only the code and essential tests needed for the agreed task. Small duplication is acceptable when extracting shared abstractions would create coordination overhead. No speculative interfaces, mapping layers, generic repositories, microservices, or broad refactors.

## Backend

One Spring Boot application, one Maven module, Java 21. Base package: `com.team.hackathon`.

```text
features/<feature>/
  api/              # Controllers, request/response types, HTTP validation
  application/      # Use cases and business logic
  domain/           # Business models/rules when useful
  infrastructure/   # JPA entities/repositories and external-service adapters
```

Add inner packages only when needed. The status feature starts with `api/` and `application/`; it does not invent domain or repository layers for a single readiness query. Controllers delegate application behavior. Keep business rules independent of HTTP. Domain models should stay simple; avoid separate copies and mappers unless there is a concrete benefit. Prefer constructor injection. Repository interfaces required by Spring Data are fine; unnecessary service interfaces are not.

Put feature entities and Spring Data repositories in that feature's infrastructure package. Add a genuine domain layer only when the business behavior benefits. Keep common configuration outside features under `config/` only as needed. Use PostgreSQL; no new database framework without coordination.

## Frontend

```text
src/
  app/                      # Thin route composition, root layout, global styles
  features/<feature>/
    components/             # UI used by this feature
    api.ts                  # Feature endpoint calls
    types.ts                # Feature types, when a separate file is useful
    ...                     # Feature-local hooks, helpers, CSS, and tests
  components/ui/            # Generic Button/Input/Dialog used across features
  lib/                      # Shared HTTP transport and genuinely shared helpers
  test/setup.ts             # Shared test setup
```

**Default to feature-local code.** A results card belongs in its feature even if another feature might someday need it. A generic Button can be shared. A feature API call belongs in `features/<feature>/api.ts`; only the generic transport belongs in `lib/api.ts`. Use direct imports rather than a frequently edited central barrel/index file.

Do not move code to shared folders just because it is reusable in theory. Reuse existing primitives where suitable. Adding a separate shared file is usually low-conflict, but still state its intended ownership. Modifying an existing shared file requires the coordination below.

## Shared files: verbally coordinate before editing

Shared hotspots include root configuration and docs, `.github/`, `.env` files, `compose.yaml`, `pom.xml`, dependency/lockfiles, root layout and global CSS, existing `components/ui/` and `lib/` files, shared test setup, and database schema/migrations.

Before editing one, the agent must:

1. Name exact paths, explain why, and describe the intended change.
2. Ask the developer to tell the team verbally and confirm no teammate has in-progress changes to those paths, or agree who will own them.
3. Wait for the developer's confirmation before making the shared edit. A task assignment that explicitly includes already-coordinated shared paths counts as confirmation; do not ask repeatedly.
4. Afterward, list the shared changes and remind the developer to notify the team and integrate promptly.

Agents cannot inspect teammates' unpushed work. Do not assume a clean local checkout proves nobody else is editing a file. Keep unaffected feature-local work moving while coordination is pending. Do not send messages to teammates automatically.

Feature ownership and the shared-file owner are recorded in task plans; they are not permanently assigned to the five people before the problem is known. For cross-feature API work, record one contract owner and one canonical plan path.

## Plans and API contracts

Discuss and agree a plan before implementation. Save it in `docs/developers/<developer>/<task>.md`. Include:

- Goal and smallest acceptance criteria.
- Owned paths and coordinated shared-file exceptions.
- Canonical API contract path; HTTP method, path, request, success/error examples.
- Small implementation steps and relevant checks.
- Remaining questions and short progress/handoff notes.

For a frontend/backend pair, both plans point to one canonical contract. Do not duplicate API definitions into `AGENTS.md` or maintain conflicting copies. Agree contract changes with both sides before implementing.

## Essential tests and discovery

Test important behavior or integration boundaries. Avoid tests that only mirror getters, framework wiring, or trivial implementation details. No coverage target, snapshot churn, or exhaustive testing for a throwaway prototype.

- Frontend: Vitest + Testing Library. Tests under `frontend/src/` named `*.test.ts`, `*.test.tsx`, `*.spec.ts`, or `*.spec.tsx` run automatically with `npm test`. Keep them beside their feature. The existing test exercises a user click and resulting connection status with mocked HTTP.
- Backend: JUnit + Spring Boot. Tests under `backend/src/test/java/` named `*Test.java` or `*Tests.java` run automatically with `./mvnw verify`. Keep their packages aligned with the feature. The existing `StatusApiTest` uses the real app and Postgres. The CI service is isolated and disposable; tests that mutate data should isolate/clean their own fixtures.
- Different runners, end-to-end tools, or `*IT.java` naming need explicit configuration; they are not automatically covered by these conventions.

Run affected checks while developing and the full relevant project checks before handoff. Report actual results and limitations. New dependencies, schema changes, and unrelated formatting need coordination.
