# Detailed team workflow

We have about 12 hours to deliver a working prototype and a clear demonstration. Keep abstractions and tests to the essentials and avoid unnecessary refactoring. The code is organized by feature. See `docs/architecture.md` for details and paths.

## Language and context

Start with your developer's `README.md` in `docs/developers/<name>/`. Artur prefers English. Nikita, Gruba, Levin, and Kurban prefer Russian. Use the developer's preferred language for plans, questions, conflict explanations, and reminders. Follow any explicit language request. Keep code names and commands in their conventional form.

Read the root `AGENTS.md`, your personal README, the current `docs/brief.md`, the relevant architecture guidance, and the agreed task plan. Read other drafts only as needed. After initial setup, developers maintain `AGENTS.md` themselves.

## Start a new task from updated main

Check `git status --short` before switching branches. Ask how to handle unrelated changes and preserve other people's work.

```sh
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c codex/nikita-task-name
```

If the branch histories diverge, explain the problem and avoid resetting or force-pushing. The initial scaffold was the only agreed exception for direct work on `main`.

## Agree on the plan first

Discuss the minimum implementation, acceptance criteria, scope of ownership, and API with the developer. After agreement, save the plan in `docs/developers/<name>/<task>.md`, then implement it in small steps. Clarify material uncertainties and make routine technical choices independently.

For frontend and backend work, use a single agreed document for methods, paths, requests, and example responses and errors. Both agents read it. Keep evolving contracts in that document rather than `AGENTS.md`.

## Code organization

- Backend: `features/<feature>/api` handles HTTP, `application` handles use cases and business logic, `domain` holds models and rules when needed, and `infrastructure` handles the database and external integrations. Add layers, interfaces, and mappers only when they serve a purpose.
- Frontend: Feature-specific components, APIs, types, hooks, CSS, and helpers belong in `src/features/<feature>/`.
- Put shared primitives in `src/components/ui/` and common transport and helpers in `src/lib/`. Pages under `src/app/` mainly compose features.
- A little duplication is acceptable when extracting shared code would slow the team down.

## Coordinate shared files before editing

Shared configuration, dependencies and lockfiles, `.env`, Compose, CI, global styles, layouts, existing shared components and helpers, the database schema, and shared documents affect the whole team.

Before editing, name the exact files and explain the reason and proposed change. Ask the developer to **tell the team verbally and confirm that nobody is editing those files in parallel, or agree on a single owner**. Wait for confirmation. Paths already agreed for the task require no further confirmation. Continue independent feature work in the meantime.

An agent cannot see teammates' unpushed changes. After editing, list the shared files and remind the developer to tell the team. The developer handles team communication.

## Synchronization and conflicts

Before handoff, commit the agreed changes, confirm the working tree is clean, and run the following from the task branch.

```sh
git fetch origin
git merge origin/main
```

This updates the task branch. If conflicts arise, show the developer the affected paths, what each side changed, why the changes overlap, and the proposed resolution before editing.

Discuss uncertain choices and preserve the behavior each side needs. Avoid choosing all of “ours” or “theirs” just to clear the conflict. After agreement, resolve it locally, show the diff and a short explanation for each file, commit the resolution, and run the combined checks. A clean merge still needs validation. If the merge must be abandoned, explain `git merge --abort` and preserve the original work.

## Checks, pull requests, and handoff

- Frontend: Run `npm run check` from `frontend/` for lint, TypeScript, tests, and the build.
- Backend: Run `./mvnw verify` from `backend/` or `.\mvnw.cmd verify` on Windows. Start PostgreSQL with `docker compose up -d --wait` from the root.
- CI automatically discovers frontend tests named `src/**/*.test.ts(x)` or `*.spec.ts(x)` and backend tests named `src/test/java/**/*Test.java` or `*Tests.java`. Focus on meaningful behavior and integration boundaries.
- CI runs on pull requests targeting `main`, updates to those PRs, and pushes to `main`. Find results under Checks or Actions and in the test artifacts.
- Push and open a PR when the developer authorizes it. You may push an unfinished branch for backup, with its merge status clearly marked.
- In the PR, summarize the result, checks, shared files, and limitations. You may merge an ordinary PR yourself when authorized. Discuss disputed shared changes with teammates.
- If `main` advances while the PR is waiting, sync again and rerun the relevant checks. Merge through GitHub, delete the merged branch, and start the next task from updated `main`.

At a coherent milestone, remind the developer to review, commit, and integrate the branch so it stays close to `main`. Keep reminders milestone-based. Commits, pushes, and merges require authorization.

## Settings and demo

The team keeps development settings and disposable local passwords in Git by agreement. Keep production secrets and personal overrides out of Git. Browsers can read `NEXT_PUBLIC_*` variables. The Next.js `/api/*` route handles the basic flow without CORS. Add authorization when the task calls for it. Run PostgreSQL in Docker. Hibernate may update the schema automatically for the prototype, with schema changes coordinated first.

See the root `README.md` for setup, `docs/brief.md` for the current MVP, and `docs/demo.md` for demo steps, data, reset, and fallback. Deployment is optional.
