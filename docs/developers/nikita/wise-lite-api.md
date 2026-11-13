# Wise Lite API contract

Canonical contract between the Expo app (`frontend/`) and the backend. Today it is implemented by
`api-prototype/` (Node). The Spring Boot backend must implement the same contract so the app
works unchanged. Schema: `wise-lite-schema.sql` (tables use the `wl_` prefix).

Base URL: `http://localhost:3001` (override in the app with `EXPO_PUBLIC_API_URL`). JSON only.
CORS must allow any origin (the Expo web dev server runs on :8081). There is one demo household,
so there is no authentication and no user id.

## State object

Returned by `GET /state` and as `state` by every mutation.

```json
{
  "balance": 4000,
  "limit": 250,
  "checkNew": true,
  "scamPause": true,
  "favouriteIds": ["nikita", "anna", "olga"],
  "protectionOffAt": { "limit": 1794676164514 },
  "inviteSent": false,
  "consent": false,
  "transfers": [
    {
      "id": "transfer-1794589646381-m2tg4",
      "recipient": { "id": "olga", "name": "Olga", "initials": "OK", "relationship": "Your friend" },
      "sender": null,
      "direction": "outgoing",
      "amount": 600,
      "status": "pending",
      "createdAt": 1794589646381,
      "pressured": false,
      "isNew": false,
      "aboveLimit": true,
      "limitAtCreation": 250,
      "expired": false
    }
  ]
}
```

- `limit` is `null` when the limit check is off. Amounts are numbers with at most 2 decimals.
- `createdAt` and `protectionOffAt` values are epoch milliseconds. `transfers` are newest first.
- `status`: `sent | pending | approved | declined | blocked`. `direction`: `outgoing | incoming`.
- `sender` is only set for `incoming` transfers (Nikita sends money to Maria).

## Endpoints

Mutations return `{ "state": <State> }`; the ones that create a transfer also return `"id"`.

| Method | Path | Body | Notes |
|---|---|---|---|
| GET | `/health` | | `{ "ok": true }` |
| GET | `/state` | | Applies expiry first, then returns the state |
| POST | `/transfers` | `{ recipient, amount, pressured }` | Creates a transfer, returns `{ id, state }` |
| POST | `/transfers/send-to-maria` | `{ amount }` | Helper sends to Maria: `incoming`, `sent`, balance goes up |
| POST | `/transfers/{id}/decision` | `{ approve: boolean }` | Only for `pending` |
| PUT | `/settings/limit` | `{ limit: number }` | `0 < limit <= 1000000` |
| PUT | `/settings/rules/{key}` | `{ enabled: boolean }` | `key`: `limit`, `checkNew`, `scamPause` |
| POST | `/settings/favourites/{id}/toggle` | | `id` is a known recipient |
| POST | `/invite` | | `inviteSent = true` |
| POST | `/consent` | | `consent = true` |
| POST | `/reset` | | Restores the seed data |

`recipient` is either a known contact (`{ "id": "anna" }`, resolved server-side) or a new person:
`{ "id": "new-DE89...", "name": "Ola Nordmann", "initials": "ON", "iban": "DE89370400440532013000" }`.
Known contacts: `nikita` (Your son), `anna` (Your granddaughter), `olga` (Your friend).

## Rules

All rules live on the server.

- **Risky** = (`checkNew` and the recipient is not in `favouriteIds`) or (`limit` is not null and `amount > limit`).
- **Create transfer**: `pressured` → `blocked`; else risky → `pending`; else `sent`. Only `sent`
  reduces the balance. `isNew` and `aboveLimit` are stored at creation, with `limitAtCreation`.
- **Approve** subtracts the amount (fails if the balance is now too low). **Decline** changes
  nothing else. A `pending` transfer older than 12 hours becomes `declined` with `expired: true`.
- **Turning a rule off** does not take effect for 24 hours: `protectionOffAt[key] = now + 24h`
  and the rule stays on. After that deadline the rule switches off (`limit` → `null`,
  the others → `false`). Turning it on again removes the pending deadline; if `limit` was `null`
  it becomes 300.
- **New person** needs a non-empty name and a valid IBAN (mod-97, spaces stripped, upper-cased).
- Expiry runs on every request, so no scheduler is required.

## Errors

Every error is `{ "error": "<message the app shows to the user>" }`.

| Status | When |
|---|---|
| 400 | Invalid input: amount missing, not a number, `<= 0` or `> 1000000`; not enough balance; bad IBAN or name; unknown rule or contact; `approve` not a boolean; invalid JSON |
| 404 | Unknown route or transfer id |
| 409 | `decision` on a transfer that is no longer `pending` |
| 413 | Body larger than 10 KB |
| 503 | Database unavailable |
| 500 | Anything else |

Messages used by the app today: `Enter an amount greater than zero.`,
`There is not enough money for this transfer.`,
`Check the recipient’s name and IBAN and try again.`,
`Maria no longer has enough money for this transfer. Decline it instead.`,
`This request has already been answered.`.

## Seed data (`POST /reset`)

Balance 4000, limit 250, `checkNew` and `scamPause` on, all three contacts as favourites, no
pending protection changes, `inviteSent` and `consent` false, and three `sent` transfers:
Anna 35 € (1 h ago), Nikita 120 € (1 day ago), Olga 25 € (2 days ago).
