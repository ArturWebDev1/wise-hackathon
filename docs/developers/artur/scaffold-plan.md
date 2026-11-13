# Initial scaffold — agreed plan

Owner: Artur. Language: English. Exception: implement directly on empty `main`, as explicitly requested. All scaffold paths are in the agreed initial scope, including shared files and initial creation of the human-maintained `AGENTS.md`.

## Acceptance criteria

- Runnable Next.js frontend and Spring Boot backend with feature-based organization.
- PostgreSQL container, tracked disposable development settings, Maven wrapper, and npm lockfile.
- Minimal shared UI/HTTP utilities; no speculative abstraction or product/domain features.
- One meaningful frontend test and one backend integration test, automatically run by GitHub CI.
- Five developer folders with language preferences, human/agent guides, architecture, brief, and demo templates.
- No deployment, remote push, PR creation, or branch-protection changes in this task.

## Canonical baseline API contract

This section is the shared source of truth for the initial status feature. Frontend and backend use this same contract.

- **Method/path:** `GET /api/status`.
- **Request:** no body and no authentication.
- **Success:** HTTP 200, JSON `{ "status": "ok", "database": "connected" }`, after PostgreSQL successfully answers `SELECT 1`.
- **Failure:** database/query failures return a non-2xx response (normally HTTP 500); an unavailable backend may produce a proxy error. Error body is unspecified. Frontend displays a helpful generic error for any failed request or unexpected status values.
- **Transport:** browser calls same-origin Next.js `/api/status`; Next.js rewrites to the backend. Direct backend access is available on port 8080.

## Steps

1. Generate backend with official Maven wrapper and install pinned frontend dependencies.
2. Implement connection-check slice and PostgreSQL configuration.
3. Add tests and CI discovery/reporting.
4. Document architecture, collaboration, branch/conflict workflow, languages, and setup.
5. Validate both apps and the database path; report verification limitations honestly.

## Validation / handoff

Record final checks in the task handoff. After this setup, future tasks use fresh task branches and the plan-first workflow.
