# Wise Care migration to Spring Boot

Branch `codex/levin-spring-backend-only`. Base commit `a49b24f`. The goal is an end-to-end demo for Maria and Nikita using Java 21, Spring Boot, PostgreSQL, and Expo.

## Agreed scope

- Sign in with email and password for pre-created accounts. Maria manages her transfers. Nikita reviews her approval requests and manages protection rules and the money request contact list.
- Transfer by Wise ID. Successful outgoing transfers determine the list of known recipients. Before submission, the server reports which rules require approval and stores those reasons with the request.
- Approval requests stay open for 12 hours. If a request is declined or expires, the funds stay in the account. Disabling the threshold or new-recipient check affects new transfers after 24 hours. Turning the rule back on cancels a scheduled deactivation.
- While the app is active, it synchronizes history and balance through `GET /state` every 1.5 seconds. Mutations return an updated snapshot. The app also fetches a fresh snapshot when it returns to the foreground.
- Maria creates a money request for someone on Nikita's list and sees confirmation. This completes the demo flow.
- Expo Help lets Maria call Nikita and view protection rules. Sign-in, Wise ID lookup, money requests, and rules replace the matching demo placeholders. Registration, Scam Pause, and saved payments are outside the task scope.

## Implementation and acceptance

1. Prepare the schema and demo data. Check sign-in for two independent sessions, access to household data, and helper permissions.
2. Implement the transfer, decision, and history flow. Test both approval reasons, direct transfers, declines, expiration, insufficient funds, and retries. Update the amount and status atomically.
3. Add rule changes and the money request contact list. Check immediate deactivation of the rule and reject requests to people outside the list.
4. Agree on the contract and connect Expo. Check that the request and decision appear on two clients without a manual refresh. Prepare the setup and data for rehearsal.

## File ownership

Levin owns `backend/src/main/java/com/team/hackathon/features/wiselite/`, the matching test package, the [decision notes](spring-boot-decisions.md), and the [setup guide](../../../backend/README.md). This branch implements the backend. The [Spring API contract](../nikita/wise-lite-api.md) is the basis for the frontend integration task. The Wise Care schema is separate from the legacy Express tables.

## Status

- The branch was created from `main` at `a49b24f` with the backend, its configuration, and an API address template for Expo.
- Spring implements sign-in, permissions, demo data, transfers, helper decisions, history, rules, and money request creation.
- Flyway manages migrations and Spring Data JPA reads and writes data. Repositories retain PostgreSQL locks and conditions for critical updates.
- `R__wiseease_demo_seed.sql` replaced the Java seeder. With demo mode enabled, SQL creates the demo household. Existing data survives a restart.
- `mvnw.cmd clean verify` passed on PostgreSQL 17.9. The 20 checks included restart, household isolation, concurrent operations, both balances after rollback, deadlines, idempotency, settings, and the money request contact list.
- Expo integration has its own branch. See the [integration plan](expo-spring-integration.md) for what works and which screens need changes.
- Current setup instructions are in `backend/README.md`. The root README and older scenario in `docs/demo.md` still contain Express instructions.
- The AI disclosure records that Codex was used for planning, the Spring API, migrations and JPA, Expo integration, and automated checks.
