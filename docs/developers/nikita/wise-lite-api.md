# Wise Care API

This is the Spring Boot contract for Expo integration. The local demo base URL is `http://localhost:8080`. Amounts are EUR and use JSON numbers with at most two decimal places. Timestamps are Unix milliseconds. Every request except sign-in uses `Authorization: Bearer <token>`.

| Method and path | Body or parameters | Success response |
| --- | --- | --- |
| `POST /auth/login` | `{ "email": "maria@example.com", "password": "…" }` | `200 { token, account }`. `account` includes `id`, `wiseId`, `name`, and `role`. Roles are `owner` and `helper`. |
| `POST /auth/logout` | No body | `204`. The token is invalidated. |
| `GET /state` | No body | `200` with a state snapshot. |
| `POST /household/connect` | `{ "helperWiseId": "trusted-person" }` | `200 { state }`. The signed-in owner immediately links an existing helper account. |
| `GET /recipients/lookup?wiseId=anna` | Exact Wise ID | `200 { id, wiseId, name }`. |
| `POST /transfers/preview` | `{ "recipientId": "anna", "amount": 600 }` | `200 { "reasons": ["ABOVE_THRESHOLD", "NEW_RECIPIENT"] }`. |
| `POST /transfers` | Same body plus `expectedReasons` from the preview. The `Idempotency-Key` header is required. | `200 { id, state }`. |
| `POST /transfers/to-protected-account` | `{ "amount": 50 }`. The `Idempotency-Key` header is required. | `200 { id, state }`. The helper sends their own money to the protected account. The server selects the recipient. |
| `POST /transfers/{id}/decision` | `{ "approve": true }` or `false` | `200 { state }`. Available to the assigned helper. |
| `PUT /settings/limit` | `{ "limit": 250 }` | `200 { state }`. Available to the helper. |
| `PUT /settings/rules/{rule}` | `{ "enabled": false }`, where `rule` is `limit` or `checkNew`. | `200 { state }`. The helper schedules deactivation after 24 hours. `true` enables the rule immediately and cancels scheduled deactivation. |
| `PUT /settings/request-people` | `{ "accountIds": ["nikita", "anna"] }` | `200 { state }`. The helper replaces the entire list. |
| `POST /money-requests` | `{ "recipientId": "nikita", "amount": 25 }` | `200 { id, state }`. The prototype saves the request and shows confirmation to Maria. |
| `POST /demo/reset` | No body | `200 { state }`. Available only to Maria and Nikita in demo mode. |

## State snapshot

`GET /state` returns `{ account, ownerId, balance, accountBalance, limit, checkNew, protectionOffAt, transfers, recipients, requestPeople }`. `accountBalance` is the signed-in account's own balance. `balance` is the protected account's balance and is `null` for the helper. The helper can see the household's history and settings. `recipients` and `requestPeople` are arrays of `{ id, wiseId, name }`. Successful transfers determine `recipients`. The helper sets `requestPeople`, and Maria's app reads it on state refresh. `limit` and `checkNew` show the active rules. `limit` is `null` when the threshold check is off. `protectionOffAt` contains only upcoming deactivations, for example `{ "checkNew": 1794704400000 }`.

A transfer includes `id`, `direction` (`incoming` or `outgoing`), `recipient`, `sender` (for incoming transfers), `amount`, `status`, `createdAt`, `expiresAt`, `expired`, `approvalReasons`, `aboveLimit`, `isNew`, and `limitAtCreation`. Incoming transfers include only completed credits. Outgoing transfers can be `sent`, `pending`, `approved`, or `declined`. `approved` means the debit and credit have already completed in the database. An expired transfer is returned as `declined` with `expired: true`.

To stay in sync, the client can apply `state` from responses and poll `GET /state` every 1.5 seconds while the app is active and whenever it returns to the foreground.

## Rules and errors

- Linking sets a €250 threshold, enables the new-recipient check, and adds the helper to the money request contact list. Linking the same pair again preserves settings. If either account is already linked to someone else, the server returns `409`. Linking an account to itself returns `400`. A missing helper account or one without sign-in access returns `404`.
- A direct transfer requires no approval and appears as an incoming transfer in the protected account's history. The helper's response includes their own balance and the household history. An unassigned helper receives `403`.
- Reset restores the original demo balances, rules, and history, clears Maria's money requests, and preserves sessions. It returns `409` if demo data is incomplete or transfers connect demo accounts to outside accounts.
- Approval is required when the amount is strictly above the threshold or when the new-recipient check is enabled and no successful transfer to the recipient exists. Both reasons can apply. Each deactivation affects new transfers after 24 hours. Repeating the deactivation request leaves the deadline in place. Existing approval requests continue to wait for a decision.
- `pending` lasts 12 hours from creation. Funds stay in the account until approval. Declines and expiration leave both balances unchanged. On approval, Spring checks the balance again and records the debit, credit, and decision in one transaction.
- Repeating a create request with the same account, key, recipient, and amount returns the existing ID. Changing the amount or recipient with the same key returns `409`. If the reasons change between preview and creation, the client receives `409` and shows the reasons again.
- Wise Care errors use `{ "error": "message" }`. `400` means invalid input, insufficient funds, or an unavailable money request recipient. `401` means a sign-in or session error. `403` means the role lacks permission. `404` means an unknown Wise ID or inaccessible transfer. `409` is also used for already-decided or expired approval requests.

See the [backend guide](../../../backend/README.md) for setup, demo accounts, and verification.
