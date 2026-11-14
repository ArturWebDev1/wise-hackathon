# Team workflow

See also the [detailed team workflow](workflow.ru.md). Communicate in the developer's preferred language, including plans, questions, conflict explanations, and coordination reminders. Keep code identifiers and commands in their conventional form.

## Start from current main

Ensure `git status --short` is clean. Never silently discard, stash, or overwrite another change. Commit intentional work or ask how to handle unrelated changes before switching branches.

```sh
git fetch origin
git switch main
git pull --ff-only origin main
git switch -c codex/artur-task-name
```

Replace the developer/task portion. If fast-forward fails, explain the divergence; do not reset or force-push. The empty-repo scaffold is the sole agreed exception allowing work directly on `main`.

## Work in small slices

Discuss the plan, agree ownership, and save it in your personal folder before coding. Keep backend/frontend API examples in a single agreed plan. Tell the team the task and owned paths. Read only relevant context. Coordinate shared files using the architecture guide before editing.

Commit meaningful progress. When a coherent slice works, the agent should suggest checking, committing, pushing, and integrating soon rather than letting the branch grow all day. Suggestions are milestone-based, not repeated interruptions on a timer. Do not commit, push, create PRs, or merge automatically unless the developer asks or has granted standing authorization.

## Integrate main into the task branch

Before readiness/handoff, commit intentional task changes and ensure the checkout is clean. Stay on the task branch:

```sh
git fetch origin
git merge origin/main
```

This updates **the task branch**, not local or remote `main`, and needs no history rewriting. If there are no conflicts, run relevant checks on the combined code. A clean merge alone does not establish that the app works.

If a conflict occurs, pause resolution and show the developer:

- Exact conflicted paths and what changed on each side.
- Why those changes overlap and what behavior must be preserved.
- The proposed combined result and any uncertain choice.

Discuss the proposal before editing conflicted content. After agreement, resolve locally, show the resulting diff and a short per-file explanation, stage only resolved task paths, and commit the merge. Never choose all of "ours" or "theirs" to silence conflicts without understanding them. If backing out is needed, explain `git merge --abort`; preserve existing work.

Run checks again after resolution. Explain any failures, including failures unrelated to the task. If GitHub is used to resolve a simple conflict instead, fetch and sync that result locally before further work; code conflicts are preferably resolved locally so the combined behavior can be tested.

## Push, PR, and GitHub merge

Push the task branch after checks and open a PR targeting `main` when authorized. Pushing a branch with unresolved integration issues is allowed for backup or discussion; mark it clearly as not ready. Do not claim it is ready to merge.

PR description: what changed, how it was checked, shared files touched, and unresolved limitations. CI runs on PR opening and updates, and after pushes to `main`; see the Checks tab and test artifacts. Self-merging is acceptable for ordinary changes. Get a teammate's input for uncertain contracts, shared changes, or conflict resolutions.

Fetch current `main` again if another PR merges while yours is waiting; integrate and recheck when necessary. Conflict checks are snapshots, not a guarantee against later changes. Merge into `main` through GitHub. Delete the merged branch; integrated commits remain in history. Start the next task from freshly updated `main`.

No force-pushes, unrelated formatting, or broad refactors during the hackathon. Do not bypass failed checks silently.
