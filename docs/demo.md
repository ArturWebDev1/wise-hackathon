# Demo runbook

Owner/presenter: assign when the problem is known. Coordinate shared edits.

## Baseline smoke check

1. Start Postgres, Spring Boot and Expo Web (root README; Spring needs `WISEEASE_DEMO_ENABLED=true`, already set in the root `.env`).
2. Open `http://localhost:8081` in two browser windows. Choose **I'm Maria** in one and **I'm Nikita** in the other.
3. Expected: Maria sees 4 000 € and three recent transfers (Anna, Nikita, Olga); Nikita lands in full Wise.
4. Spring Boot status check: `http://localhost:8080/api/status`.

## Demo data (seeded by Spring)

| Who | Role in the demo |
|---|---|
| Maria (`maria@example.com`) | Lite user, 4 000 €, limit 250 €, new people need approval |
| Nikita (`nikita@example.com`) | Trusted helper, full Wise |
| Anna, Nikita, Olga | People Maria already sent money to: transfers up to 250 € go straight through |
| Ola, Liisa, Pavel (`@ola`, `@liisa`, `@pavel`) | "New people": a transfer to them always waits for Nikita |

Password for both logins: `WiseEaseDemo!`.

## Click sequence (about 90 seconds)

1. Maria: Send money, Anna, 50 €: **Sent** at once, Nikita sees nothing.
2. Maria: Send money, Someone new, `@ola`, 50 €: **Waiting for approval**.
3. Nikita: Home, task "Mom needs your help", Review, Approve.
4. Maria's screen updates by itself: **Approved**, balance 3 950 €.
5. Also works: Olga 600 € waits because it is above the 250 € limit; Nikita changes the limit in Family protection, Protection rules.

## Restore the initial state

Maria's Help screen: long-press the grey footer text. Or `POST /demo/reset` with Maria's or Nikita's token (demo mode only). It restores balances, the three history entries and the rules; use a fresh `WISEEASE_DB_SCHEMA` if it answers 409.

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
