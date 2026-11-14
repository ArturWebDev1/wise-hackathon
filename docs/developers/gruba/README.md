# Gruba

- Preferred language for communication: **Russian**.
- Personal plans and notes: `docs/developers/gruba/`.
- Before implementation, read the root `AGENTS.md`, `docs/workflow.ru.md`, the relevant sections of the architecture guide, the brief, and the agreed task plan.
- Discuss the plan first and then save it here. List your files and link to the shared API contract when working with others.
- You can organize your own documents and `.gitignore`. Leave other developers' notes to their owners by default.

## MVP plan for the Wise Care frontend (Maria)

### Goal and scope

Complete the existing Expo flow for an older user: view the balance, send a transfer, wait for the helper's decision, and see the result without refreshing. Home and Help are the main sections. Sending, requesting, and viewing a result are additional steps. Reuse the existing screens and components. A full redesign or app migration is unnecessary.

### Required work

1. **Home:** Show the balance, Send money, Request money, and a short history with statuses. Use large, clear buttons, keep the number of actions small, and provide access to Help. Read amounts and statuses from the API.
2. **Send:** Choose a favorite or a new recipient. Collect the new recipient's name and IBAN, the amount, confirmation, and the existing Scam Pause pressure check. Show input, insufficient-funds, and network errors. Disable the submit button while sending.
3. **Result:** Show success for a regular transfer and a waiting state for a risky one. Show approved and declined outcomes, with distinct states for blocked and expired transfers. Pending transfers leave the balance available. Approved means the transfer has already settled in the same operation.
4. **Request money:** Select a contact and an amount, compose a message, and open the system share sheet. Label the demo link clearly as unable to accept payment. Implement real payment requests only after extending the shared contract.
5. **Help:** Provide a prominent call button, information about the trusted helper, and read-only access to the threshold and protections. Maria cannot change rules or favorites. Check calling on a phone and a clear fallback in the browser. Current numbers are for the demo. Agree before using a real contact.
6. **Consent:** If the existing invitation is shown, complete the user's confirmation step. Registration, KYC, and access revocation require an API agreement.

### File ownership and coordination

- Owned screens: `frontend/app/send.tsx`, `request.tsx`, and `switch-mode.tsx`.
- New components and hooks for the user flow: `frontend/features/lite/**`. Keep route files thin as they are touched and avoid a broad refactor.
- Personal notes: `docs/developers/gruba/**`.
- **Nikita is the proposed single owner for shared routes:** `frontend/app/(tabs)/index.tsx`, `frontend/app/(tabs)/help.tsx`, `frontend/app/onboarding.tsx`, `frontend/app/result.tsx`, and `frontend/app/rules.tsx`. Gruba prepares the Wise Care components, and Nikita integrates them for both roles.
- Nikita owns the store, API, polling, and shared navigation. Coordinate exact paths for changes to shared components, the theme, global CSS, dependencies, and layouts with Nikita and the team. Confirm there is no overlapping work before making shared edits.

### Shared API source

The [Wise Care contract](../nikita/wise-lite-api.md) is the single source for methods, JSON examples, errors, and business rules. `api-prototype/` is the working temporary implementation, and Spring Boot preserves the interface. Use `useWise` from `frontend/lib/wise-store.ts`, which already supports fetching state, creating a transfer, and recording consent. Reuse its HTTP client and polling.

The current scope has one household, a local role, and no server-side access checks. Consent alone does not grant authorization. Real sign-in, access revocation, and payment requests need an agreed update to the canonical contract. The threshold applies per transfer. The API always blocks a transfer when `pressured: true`. Agree separately on any change to its relationship with `scamPause`.

### Implementation and checks

1. Agree on the screens, copy, and boundaries for shared files with UI/UX and Nikita.
2. Finish Send and the result screens, followed by Home, Help, and the demo Request money flow.
3. Check two sessions with Nikita. A safe transfer goes through immediately. A transfer above the threshold or to a new recipient waits for a decision. Approval debits the balance once, decline leaves it untouched, and the result appears without a refresh.
4. Check blocked and expired transfers, invalid IBAN, insufficient funds, repeat taps, API downtime, and reconnection. Use prepared backend data to check expiration without waiting 12 hours or adding a production bypass endpoint.
5. Run `npm run check` from `frontend/` and report the results. Add only essential behavior tests for the changed flow.

The flow is ready when a user on the first phone can start a transfer independently, understand the wait and the result, and get help. Changes from the second phone should appear automatically. At this stage, the role-specific plan is agreed and code work is pending. Confirm UI details with the designer.
