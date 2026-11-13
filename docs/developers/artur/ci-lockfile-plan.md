# Repair frontend CI installation

Owner: Artur. Language: English. User approved fixing the incomplete npm lockfile.

## Scope and acceptance

- Shared-file scope: `frontend/package-lock.json`; its repair is explicitly requested.
- Keep direct dependency versions, application behavior, and `npm ci` in CI unchanged.
- Repair missing transitive optional dependencies in an isolated Linux environment without existing `node_modules`.
- Verify a clean Linux `npm ci`, followed by lint, TypeScript, the existing test, and build.
- Preserve local developer dependencies and the running PostgreSQL container. No app servers, deployments, remote pushes, or commits.
- No API contract changes.

## Steps

1. Update main and create `codex/artur-fix-ci-lockfile`.
2. Copy package manifests into ignored scratch space and repair the lockfile using Node 24 on Linux.
3. Inspect the diff, retain a minimal repair, and verify clean installation and frontend checks on Linux.
4. Report changed shared files and verification results; recommend integrating the small fix promptly.

## Results

- Added only npm-generated entries for `@emnapi/core@2.0.0-beta.2` and `@emnapi/runtime@1.11.3` (23 lines). Existing resolved versions and direct dependencies are unchanged; unrelated npm peer metadata normalization was excluded.
- Clean Linux Node 24.22.3 / npm 11.19.1: `npm ci` passed, then lint, TypeScript, the existing frontend test (1 passed), and production build all passed.
- Separate clean Linux install with npm 12.2.2: `npm ci` passed.
- Validation used ignored scratch space and disposable container dependency/build volumes, preserving local `frontend/node_modules`. No application servers were started and PostgreSQL was left running.
- Refetched origin after validation: task branch and `origin/main` still share the same base; no main changes to integrate or conflicts to resolve.
- Shared change: `frontend/package-lock.json` only. Commit and push the repair branch when authorized, then open a PR to run GitHub CI. No commit, push, or PR was performed in this task.
