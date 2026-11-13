# Demo runbook

Owner/presenter: assign when the problem is known. Coordinate shared edits.

## Baseline smoke check

1. Start Postgres: `docker compose up -d --wait`.
2. Start `api-prototype/` and the Expo app from `frontend/` (root README commands).
3. Open `http://localhost:8081` in two browser tabs. Choose **I'm Maria** in one and **I'm Nikita** in the other.
4. Expected: the Maria tab shows the home screen with a balance of 4 000 €.
5. Spring Boot status check: `http://localhost:8080/api/status`.

## Product demo — fill after agreeing the MVP

- User and problem in one sentence:
- Starting URL/screen:
- Required sample data and how to create it:
- Exact click sequence and expected result at each step:
- Who narrates / who operates the demo:
- How to restore the initial state before the next rehearsal:
- Fallback if an external service fails:
- Location of backup recording/screenshots:

Keep the final demo focused on one successful user journey. Rehearse on the actual demo machine. Database volume deletion is not a routine rehearsal step; document a safe product-specific reset when data exists.
