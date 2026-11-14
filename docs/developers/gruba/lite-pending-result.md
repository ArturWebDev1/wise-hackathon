# Pending transfer screen plan

## Goal

Show Maria a pending transfer screen based on `final.png`. Use solid colors, a large waiting icon, the amount and recipient, and text explaining that the money is safe and the request lasts 12 hours. Put `Call Nikita` above `Back home`, reversing the order in the reference.

## Ownership and shared files

- Component: `frontend/features/lite/lite-pending-result.tsx`.
- Plan: `docs/developers/gruba/lite-pending-result.md`.
- Integration uses the shared `frontend/app/result.tsx`. Gruba's plan proposes Nikita as its owner. Show the new component for Maria when `transfer.status === 'pending'`, keeping the existing handling for other statuses. Before editing, Gruba confirms with Nikita that there is no overlapping work or agrees on ownership.

## API and implementation

Use the `Transfer` already returned by `useWise` under the [Wise Lite API contract](../nikita/wise-lite-api.md). The change needs no new requests, dependencies, or statuses.

1. Add the component under `features/lite/`. Read the amount and recipient name from `Transfer`. Use the existing `callPerson()` for `Call Nikita` and `router.dismissTo('/')` for `Back home`.
2. After coordination, connect the component in `frontend/app/result.tsx` for Maria's pending transfers only.
3. Run `npm run check`. On a phone, check the transition from sending to waiting and the result update after Nikita's decision.

## Scope

Nikita's current number is for the demo. A real contact and changes to calling are outside this visual update.

## Status

- The component is ready with `Call Nikita` followed by `Back home`.
- `npm run check` passed lint, TypeScript, 8 tests, and web export.
- Gruba confirmed coordination with Nikita on `frontend/app/result.tsx`. The screen is connected for `pending` transfers in Maria's role.
- `npm run check` passed again after integration. The developer still needs to check on a physical phone.
