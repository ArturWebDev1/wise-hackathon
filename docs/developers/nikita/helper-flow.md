# Trusted Helper flow in Full Wise (Nikita)

Branch: `codex/nikita-helper-flow`. Working language: Russian.
API source: [wise-lite-api.md](wise-lite-api.md). The plan uses the existing contract and endpoints.
Artur's overall plan: [README.md](README.md).

## Goal

Nikita opens “Family protection” from regular Wise and sees Maria's requests, protection rules, and history. Match the approval and result screens to the agreed designs.

## Scope

1. `app/approval.tsx`: Follow the design with a gray card showing Recipient, Amount, Requested (“5 min ago”), and IBAN when available. Show reason flags, a shield hint, a green Approve button, a red outlined Decline button, and a text “Call Mom” action. Omit the top bell card and “Waiting” label. After a decision, show a checkmark with “Approved.”, “Declined.”, or “Expired.”, the amount, and one line of text.
2. `app/full/payments.tsx`: Add a dashed “Family protection” card for the Nikita role.
3. `app/family-protection.tsx`: Show people Nikita protects, Maria's pending request count, added people, and a dashed “Add someone to protect” card.
   `app/family-person.tsx?id=`: For Maria, show Requests (N), Protection rules (`/rules`), and Maria’s history. For an added person, show “Invite sent”, the selected rules, and “Remove”.
   `app/family-add.tsx`: Add a person by entering their name and relationship, choosing a threshold and the new-recipient check, then sharing an invitation with a 24-hour link. Finish with “Invite sent.”
4. `app/family-requests.tsx`: Show all pending requests and a separate list of decided requests.
5. `app/family-history.tsx`: Show all Maria's transfers.
6. For Nikita, `(tabs)/index.tsx` redirects to `/full`. `full/_layout.tsx` hides the “Back to Wise Care” strip. `full/index.tsx` shows an approval banner or a “Family protection” card.

Screens in steps 3–5 live at the root of `app/` as regular Stack screens like `approval` and `rules`. As hidden tabs under `app/full/`, they were redirected back to `/full` by `(tabs)/index`.

## Full Wise screens from reference screenshots

Home, Cards, Recipients, and Payments were rebuilt from screenshots of Wise with hardcoded content.

- Home: “Start using Wise now”, “Welcome to Wise”, Send, Add money, Upload, three dashed cards, Tasks, Your returns, Explore, Transfer calculator, and “Your money, protected”.
- Cards: Travel hub and “Global spending made simple”.
- Recipients: Invite, Add, Upload, and a list.
- Payments: Send, Request, six dashed cards, and Payment tools (Wisetag, Send via link, Auto Conversions).

The feature appears in two places described by the product plan: **Payments → Payment tools → “Family protection”** and **Home → Tasks → “Mom needs your help”**, which appears when Maria has a request. Code is in `features/fullwise/*`, with thin routes in `app/full/*`. Flat shapes replace photos and illustrations. The prototype uses demo names and Wisetags and does not copy real logos or assets.

## Nikita's navigation in Full Wise

Working controls are Payments → Payment tools → “Family protection”, the “Mom needs your help” task on Home (opens Requests), the avatar (switches demo roles), Dismiss and close buttons, and the bottom tabs. Other Wise controls, including Send, Add money, Upload, Earn €150, and Scheduled transfers, are placeholders. A `Tap` without `onPress` ignores taps. Nikita sees “You protect Maria (Mom)” in place of Maria's balance.

## Owned paths

`app/approval.tsx`, `app/family-*.tsx`, `app/full/**`, `features/helper/**`, and `docs/developers/nikita/**`.

## Shared files

`lib/wise-store.ts`, `lib/wise-theme.ts`, `global.css`, `app/_layout.tsx`, `package.json`, and the lockfile were outside the scope of edits.

At the developer's direction, changes were made in `app/(tabs)/index.tsx` (Nikita's redirect and removal of `HelperHome`), `app/rules.tsx` (toggle in the heading row with no duplicate labels), and `components/wise.tsx` (optional `trailing` for `DashedCard`). Tell the team about these changes. `app/result.tsx` stayed as it was.

## Backend integration notes

- The account avatar and name (MA / NG) come from `accountFor(role)` in `lib/wise-store.ts`. Use `account` from the `POST /auth/login` response after connecting Spring.
- Wise Care looks up new recipients by Wise ID in `features/lite/demo-accounts.ts`. Replace this with `GET /recipients/lookup?wiseId=`.

## Limitations

- Sign-in and the money request contact list are outside this stage because the contract did not yet provide endpoints.
- Added people live in AsyncStorage on the device through `features/helper/people-store.ts`. The server knows one household, Maria's. Supporting multiple households requires a new contract and schema.
- The prototype uses 1.5-second polling. Push notifications are outside scope.
- The card and screens are visible only for `role === 'nikita'`.

## Checks

Run `npm run check` from `frontend/`, then use two browser tabs. Send €600 from Maria to Olga. As Nikita, open Payments → Family protection → Requests, approve or decline, and check Maria's result.
