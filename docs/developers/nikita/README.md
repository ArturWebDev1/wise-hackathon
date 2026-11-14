# Nikita

- Preferred language for communication: **Russian**.
- Personal plans and notes: `docs/developers/nikita/`.
- Before implementation, read the root `AGENTS.md`, `docs/workflow.ru.md`, the relevant sections of the architecture guide, the brief, and the agreed task plan.
- Discuss the plan first and then save it here. List your files and link to the shared API contract when working with others.
- You can organize your own documents and `.gitignore`. Leave other developers' notes to their owners by default.

## MVP plan for regular Wise, Trusted Helper, and frontend integration

### Goal and scope

Show a regular Wise account with a section for helping Maria. A request appears on the second device, the helper reviews the reason and approves or declines, and both devices show the result. Use the existing Full, Home, and Helper screens. Building the full banking feature set is outside the scope. Regular Wise and Wise Care are interface modes. Maria and Nikita are account identities. Switching modes must preserve the signed-in identity and permissions.

### Required work

1. **Entry point:** Provide a clear way to open Trusted Helper from the regular account. Show whom Nikita helps and make clear whose balance the API provides. At this stage it returns only Maria's state and has no separate balance for Nikita.
2. **Requests:** Show all pending requests, their count or an empty state, and details for each request. Show the recipient, amount, and approval reasons: a new recipient or an amount above the threshold saved at creation.
3. **Decisions:** Show loading and errors for approval and decline. Disable repeat actions after a decision. Handle stale requests (`409`), missing requests (`404`), insufficient funds (`400`), and declined, expired, or blocked transfers. Blocked transfers cannot be approved.
4. **Results:** Show approved and declined transfers separately from pending ones. Approved means funds have already been debited. Keep the existing statuses and avoid adding `completed` or `rejected`, or a separate resubmission.
5. **Settings:** Keep the per-transfer threshold, `checkNew`, `scamPause`, and favorite recipients. Maria can view the settings. Deactivation takes effect after 24 hours. Indicate that protection remains active and provide a way to cancel deactivation. Use existing known contacts for favorites. Managing a contact directory is outside this task.
6. **Integration:** Keep one store, API transport, and polling loop (currently every 1.5 seconds). Handle offline recovery, initial loading, and mutation errors. A slow polling response must not overwrite a newer mutation response. WebSockets are unnecessary. For the second phone, use `EXPO_PUBLIC_API_URL` with an address both phones can reach. Switch from Node to Spring through configuration.
7. **Supporting steps:** Keep the existing invitation and consent flow, transfers to Maria, and rehearsal reset if they are part of the agreed demo. Registration and real payments are outside scope. Keep reset separate from regular user actions.

### File ownership and coordination

- Owned screens: `frontend/app/full/**`, `frontend/app/approval.tsx`, `frontend/app/send-maria.tsx`, and `frontend/app/roles.tsx`.
- New helper components: `frontend/features/helper/**`.
- Personal notes: `docs/developers/nikita/**`.
- **Nikita is the proposed single owner for integration in shared files:** `frontend/lib/wise-store.ts`, `frontend/app/_layout.tsx`, `frontend/app/(tabs)/_layout.tsx`, `frontend/app/(tabs)/index.tsx`, `frontend/app/(tabs)/help.tsx`, `frontend/app/onboarding.tsx`, `frontend/app/result.tsx`, and `frontend/app/rules.tsx`. Gruba prepares the Wise Care components, and Nikita integrates them for both roles.
- If shared UI or theme changes are needed, name the exact changes in `frontend/components/wise.tsx`, `frontend/lib/wise-theme.ts`, and `frontend/global.css`. Before editing, agree verbally on the owner and confirm there is no overlapping work. The same applies to dependencies, the lockfile, and `.env`, which are outside the scope of this plan.
- The backend, database schema, and `api-prototype/` are outside this frontend task. The historical frontend ownership in `expo-app.md` predates the split. Gruba's plan covers the user screens.

### Existing API and decisions to agree on

The [canonical contract](wise-lite-api.md) and [schema](wise-lite-schema.sql) already exist. Use them for methods, JSON examples, and errors. Read pending requests, history, and settings through `/state`. A separate approval list endpoint is unnecessary for one demo household. The contract already covers decisions, rules, favorites, and invitation and consent. Spring Boot should preserve the paths, responses, and statuses.

Confirm with the backend owner before extending the scope:

- **Authorization:** The current Node API does not check roles, household links, or consent. The protected MVP needs server-side identification of the two seeded users and permission checks for every operation. Agree with the backend owner on sessions and sign-in, `401` and `403` responses, and state changes in the same contract. Enforce protection on the server.
- **Two accounts:** The current balance belongs to Maria. Nikita's own funds and history would need a separate account API and are outside the helper demo.
- **Request money:** The current flow shares a demo link. Saving requests and accepting payment through the link require a new resource or API and are outside this frontend task.
- **Protection rules:** The threshold applies per transfer. `pressured: true` always blocks a transfer regardless of `scamPause`. Agree with the backend owner on the toggle before changing behavior. Avoid promising a working fraud detector.
- Consent revocation, contact editing, and multiple households are outside the current implementation. Add them only after a separate agreement.

### Implementation and checks

1. Confirm the shared file boundaries and Trusted Helper entry point with Gruba and UI/UX.
2. Complete the list, decisions, and settings on the Node API while the Spring migration is in progress.
3. Integrate Gruba's Wise Care components and check two independent sessions or devices.
4. Switch to Spring and repeat the checks. Safe transfers become `sent` and risky ones become `pending`. Approval debits once. Decline and expiration leave the balance unchanged. Blocked transfers cannot be approved. Check changes to the threshold and favorites, delayed deactivation, `409`, and offline recovery.
5. Run `npm run check` from `frontend/`. When server-side authorization is available, work with the backend owner to check unauthorized and cross-household actions and `401` and `403` responses.

The flow is ready when the helper sees every request, understands the reasons, decides, and changes protection rules, and Maria sees the result without refreshing. Report the actual checks and remaining limitations. At this stage, only the plans have changed and implementation is pending.
