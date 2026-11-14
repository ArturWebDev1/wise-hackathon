# Balance on the Full Wise Home screen

## Agreed task

Replace the `Start using Wise now` card in `frontend/features/fullwise/home.tsx` with a block matching the reference: `Total balance`, the hidden amount `**** EUR`, a round visibility button, and a decorative chart icon. Kurban approved the plan and asked to preserve his file mode change to `backend/mvnw` when creating the branch.

## Ownership and API

- Kurban owns `frontend/features/fullwise/home.tsx` and this plan.
- Keep the developer's file mode change to `backend/mvnw`.
- After checking on a phone, the developer approved changes to the shared `frontend/app/full/_layout.tsx` and `frontend/features/fullwise/parts.tsx`. Move the top safe area into the Regular Wise layout and remove the duplicate inset in `FullPage`. This places `Back to Wise Lite` below the camera cutout.
- Use the existing `useWise.balance`. See `docs/developers/nikita/wise-lite-api.md` for the HTTP contract. No new requests or API changes are required.
- Keep the other sections of the screen.
- At the developer's request, move the approval alert from `Tasks` to a compact, prominent banner above the balance on Home. Show it only to the helper when outgoing `pending` transfers have yet to expire. Tapping it opens `/family-requests`. Use the existing store and polling.

## Implementation and checks

1. Replace the card. Hide the balance by default and toggle it using a button with an accessible label.
2. Check hiding, showing, and hiding again in a browser at mobile width.
3. Run `npm run check` and `git diff --check`.

## Result

The balance block replaced the card. The amount is hidden by default, and the button labeled `Show balance` or `Hide balance` toggles the value from the store. The chart is decorative.

`npm run check` passed lint, TypeScript, 8 tests, and web export. At 390 px in the browser, the display changed from `**** EUR` to `4 000,00 EUR` and back, matching the reference. `git diff --check` passed. The physical phone check was pending.

Branch: `codex/kurban-full-home-balance`. The developer's file mode change to `backend/mvnw` was preserved. At this stage, the work had not been committed or pushed.

The layout uses `SafeAreaView` to apply the device's top and side insets to the button and all tabs. `FullPage` uses a regular `View` to avoid adding a second top inset.

For the safe area change, `npm run check` passed lint, TypeScript, 8 tests, and web export, and `git diff --check` passed. Opening Regular Wise and returning to Lite worked in a browser. A phone with a camera cutout was unavailable. Reload Expo Go and check Maria's transition on a physical phone.

The compact yellow approval banner sits above the balance with a bell and a count. It appears only for the helper when there are outgoing, unexpired `pending` transfers. Existing polling updates it. It disappears when the count reaches zero and opens `/family-requests` when tapped. The old `Tasks` card was removed to avoid showing the same alert twice.

For the banner, `npm run check` and `git diff --check` passed. In the browser at 390 px, Maria saw no banner and Nikita saw two real pending requests. Tapping opened `Waiting for you (2)`. The check did not approve or decline either request. Screenshot: `/tmp/wiseease-pending-home.jpg`.
