# Wise Lite amount field and Close button plan

## Goal

Remove the nested border around the amount and the double styling of the Close button on iPhone in Send and Ask for money. Preserve manual entry, amount presets, navigation, and submission.

Match the Send amount screen to `IMG_6206.png`. Use a recipient row, a light gray card with a green outline, a large amount, two icon-supported notes, a highlighted preset, and an arrow after Continue. Use solid colors.

Match the Send confirmation screen to `DC6D0B22-3989-42E3-94EF-AE23DBB4A292.png`. Use a light gray card with a thin green outline, center the recipient and amount, show the transfer status below the amount, and place a large Send button at the bottom. Use solid colors.

Both Send cards use `wise.card`. The Request card keeps its white background.

## File ownership

- `frontend/app/send.tsx` and `frontend/app/request.tsx` are Gruba's screens.
- `frontend/features/lite/lite-amount-input.tsx`, `frontend/features/lite/lite-close-button.tsx`, and `frontend/features/lite/lite-confirm-card.tsx` are new components for those screens.
- `docs/developers/gruba/lite-amount-header.md` contains this plan.
- Other screens continue using the shared `Calculator` and `frontend/app/_layout.tsx`. Shared files are outside the edit scope.

## API and scope

See the [Wise Lite API](../nikita/wise-lite-api.md). The change uses the existing HTTP calls, store, and business rules and needs no new dependencies.

## Implementation

1. Add an amount component with one visual surface, the number and Euro on the same line, separate presets, a hint, and the existing error message. Use money request copy on Request.
2. Add a simple text Close button and override `headerRight` only for Send and Request.
3. Check both screens on iPhone if available. Run `npm run check` from `frontend/` and inspect the Git diff and status.
4. On Send, add a recipient row that goes back to recipient selection, move the amount to a white card, highlight the chosen preset, and add an arrow to the right of Continue. Keep Request's simple amount entry and avoid claims about fees or transfer speed there.
5. On the Send confirmation screen, replace the gray card with a white outlined card. Keep API data, the IBAN for a new recipient, the risk status, errors, and protection against duplicate submission.

## Acceptance criteria

- The number inside the Send and Request amount field has no nested border or shadow.
- Close returns to Home and has a single visual layer.
- Both manual entry and presets work. Errors and Continue behave as before.

## Verification and handoff

- `npm run check` in `frontend/` passed lint, TypeScript, 8 tests, and web export.
- `git diff --check` passed.
- Both checks passed again after matching Send to `IMG_6206.png`.
- Both checks passed again after matching confirmation to `DC6D0B22-3989-42E3-94EF-AE23DBB4A292.png`.
- The visual check on a physical iPhone after reloading was still pending. The code had not been committed or pushed.
