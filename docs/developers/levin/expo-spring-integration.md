# Wise Care Expo and Spring integration

Branch `codex/levin-expo-spring-integration` is based on `main` after the Spring backend merged in PR #6. The frontend was updated from `main` after PR #7 (`69d511c`). The goal is to verify the existing Maria and Nikita flow using the team's screens.

## Connected features

- The existing role picker opens a Spring session for the demo account. Zustand applies the snapshot returned by actions and calls `GET /state` every 1.5 seconds while the app is active.
- Maria sees her balance and history and can send money to a known recipient. Nikita sees the request in the family section, can approve or decline it, and can change the threshold and new-recipient check. Maria's status and balance update automatically.
- `GET /state` includes `accountBalance` for the signed-in account. Nikita still receives `null` in `balance`. Maria can see the protected balance.

## Work for the agreed MVP

| Scenario | Spring | Next step in Expo |
| --- | --- | --- |
| Sign-in | Demo accounts exist | Use the existing role picker for the prototype. |
| New recipient | Wise ID lookup is available | The field on the new screen looks up the recipient in Spring. Enter `@anna` for a new recipient in this version of the demo. |
| Approval reasons | The preview and the request include the reasons | Nikita sees the reasons on the existing screen. Maria sees the general pending status. |
| Maria's money request contact list | Spring provides the allowlist and lets Nikita change it | Nikita edits the list in Rules, and Maria sees the changes in her list. The existing screen keeps its demo link. |
| Maria's Help and rules | The threshold and new-recipient check are available, and only Nikita can change them | Show both rules read-only for Maria and keep the call action in Help. A rule stays active for 24 hours after deactivation is requested. |

## Sync with PR #7

- `request.tsx` keeps the new card and Share button. The list comes from `requestPeople`. The screen closes the amount form if the selected contact disappears. Sharing uses a demo link and creates no API request.
- `rules.tsx` keeps the new toggles and countdown. Spring supplies the scheduled deactivation and cancellation state. The helper manages the money request contact list alongside the rules.
- `send.tsx` uses Spring for Wise ID lookup and recipient history. The account snapshot provides the name and Wise ID used by the current role's avatars and cards.
- The new interface removes the `/send-maria` route. The API and a local Spring test support direct transfers.
- Checks in two Expo Web sessions on an isolated demo schema covered Wise ID lookup and a transfer to Anna, approval and decline, contact list synchronization, and cancellation of scheduled deactivation. Cards, ordinary payments, and other Full Wise actions outside the family scenario are demo-only.

## Outside the current prototype

- Invitations, multiple protected people per helper, and removal of protection. The old invitation screen is demo-only.
- Working payment links for money requests. The server stores the money request itself.
- IBAN, Scam Pause, manually managed transfer favorites, cards, and recurring payments.

## Deactivation delay and money request contact list

- Spring stores the deactivation deadlines for the threshold and new-recipient checks in `V2__wiseease_protection_delay.sql`. Rules stay active for 24 hours. Turning a rule on cancels a scheduled deactivation or re-enables the rule. Existing approval requests retain their status and reasons.
- The existing toggles in `frontend/app/rules.tsx` show the state from Spring. The money request contact list uses `requestPeople` independently of the transfer recipient list. Maria's list in `frontend/app/request.tsx` refreshes through `GET /state`.
- The Expo integration is in `frontend/lib/wise-store.ts` and `frontend/lib/wise-spring-api.ts`. See the [Spring API contract](../nikita/wise-lite-api.md) for the methods. Flyway upgraded the existing demo schema. API checks covered the delay, cancellation, expiration, and permissions. In two Expo Web sessions, a contact appeared and disappeared without a reload, and the toggle showed the warning and let the helper cancel deactivation.

## Earlier work on direct linking, helper transfers, and demo reset

- Linking: The signed-in owner enters the Wise ID of an existing helper. The relationship takes effect immediately, with one helper per owner. If either account is already linked, the server rejects the new link. Registration and invitations are outside this scope.
- Transfers: The helper can send money from their own balance to their protected account. The debit and credit are atomic. Retrying with the same key results in one debit.
- Reset: Available to Maria and Nikita in demo mode. It restores four demo balances, the initial history, and the rules. The server rejects the reset if any transfers link demo accounts to other accounts.
- Changes were limited to `backend/.../wiselite/`, its API contract, and calls for two existing actions in `frontend/lib/wise-store.ts`. The database schema, build configuration, and screens stayed as they were. A linking screen was unnecessary at this stage.
- Push notifications are outside the prototype scope. The open app updates approval requests and their statuses through the existing `GET /state` polling.
- Verification covered Spring compilation, TypeScript, and lint. HTTP checks for all three operations passed on a separate PostgreSQL schema, including transfer retries, permissions, and protecting outside accounts from a reset. The full test suite was deferred and commits required a separate request.

## Files and verification

- Existing screen integration: `frontend/lib/wise-store.ts`, `frontend/lib/wise-spring-api.ts`, and `frontend/.env.example`. Screen files, styles, and components stayed as they were.
- Server snapshot: `backend/src/main/java/com/team/hackathon/features/wiselite/application/Households.java`. See the [shared API contract](../nikita/wise-lite-api.md) and [setup guide](../../../backend/README.md).
- TypeScript and lint passed. In the end-to-end browser check on this version, Maria sent €600 to Olga, Nikita approved it, and Maria's balance updated automatically from €4,000 to €3,400. Native Expo Go and a repeat of the full suite were still pending.
- The reset button uses native `Alert`, which does not display in the browser. For browser testing, call `POST /demo/reset` directly. The screens stayed as they were.
