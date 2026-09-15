# Feature: Create poll

**Status:** In Dev
**Created:** 2026-09-14
**Last updated:** 2026-09-14

## Problem Statement
A registered user needs a way to create a poll — a question, 2 to 8 answer options, and a choice between single and multiple answers. The poll is the core object of the app: sharing, answering, results, and My polls all depend on it, so it comes first.

## Users & Permissions
| Role  | What they can do in this feature |
|-------|----------------------------------|
| User  | Open the landing page, start a new poll, fill in the form, create the poll, and see the confirmation screen for their own new poll. |
| Guest | Nothing. Cannot open the landing page or the Create poll form, and cannot create a poll. Enforced once Register and log in ships (see Deferred Decisions). |

## User Stories
- [Must] As a User, I want a landing page with a "Create poll" action, so that I have a clear place to start.
- [Must] As a User, I want to write a poll question, so that participants know what I'm asking.
- [Must] As a User, I want to add between 2 and 8 answer options, so that participants have choices to pick from.
- [Must] As a User, I want to choose whether participants pick one answer or several, so that the poll fits my question.
- [Must] As a User, I want to drag options into the order I want, so that participants see them in that order.
- [Must] As a User, I want to see a confirmation of the poll I created, so that I know it was saved correctly.
- [Should] As a User, I want to add optional details under my question, so that I can give participants context.
- [Should] As a User, I want clear errors on the fields I need to fix, so that I can create the poll without guessing.
- [Could] As a User, I want a warning before I leave a half-filled form, so that I don't lose my work by accident.

## User Flows

The landing page is the app's start page. Until Register and log in ships, the app opens directly on it.

**Flow 1 — Create a poll (happy path)**
1. User opens the app. System shows the landing page.
2. User selects "Create poll".
3. System shows the Create poll form: empty Question field, "Add details" button, Answer type with Single choice selected, two empty option fields, "Add option" button, "Create poll" and "Cancel" buttons.
4. User types the question.
5. User fills in Option 1 and Option 2.
6. User selects "Create poll".
7. System checks the form. All valid: the button changes to "Creating…" and the form is locked.
8. System saves the poll with status Open and the logged-in user as creator.
9. System shows the confirmation screen with the question, details (if any), answer type, options in their saved order, and status Open.

**Alternate paths**
- **A. Add details:** User selects "Add details". System shows the Details field below the question and focuses it. "Remove details" hides the field and discards its text. Hidden details are not saved.
- **B. Multiple choice:** User selects Multiple choice. Options are unchanged. Switching back and forth changes nothing else.
- **C. Add option:** User selects "Add option". System adds an empty option at the bottom and focuses it. At 8 options, "Add option" is disabled and a hint shows.
- **D. Remove option:** With more than 2 options, each option has a remove button. System removes that option and renumbers the placeholders. With exactly 2 options, remove buttons are hidden.
- **E. Reorder:** User drags an option by its drag handle to a new position. System updates the order immediately. Works with any number of options from 2 to 8.
- **F. Validation fails:** User selects "Create poll" with invalid input. System saves nothing, shows an error under each invalid field, and focuses the first one. From then on, each error clears as soon as its field becomes valid.
- **G. Save fails (network or server):** System keeps all input, shows a form-level error above the "Create poll" button, and unlocks the form. User can try again.
- **H. Cancel:** User selects "Cancel". System returns to the landing page and discards input. [Could] If anything was entered, System first asks for confirmation.
- **I. Create another:** On the confirmation screen, user selects "Create another poll". System shows an empty Create poll form.
- **J. Back to home:** On the confirmation screen, user selects "Back to home". System shows the landing page.

## UI States

| Screen / Component | Empty | Loading | Error | Success |
|--------------------|-------|---------|-------|---------|
| Landing page | Not applicable — always shows heading, intro, and "Create poll". The ongoing-polls list is added by My polls. | Not applicable — no data loaded. | Not applicable | Heading, intro text, and "Create poll" button. |
| Create poll form | Question empty, details hidden, Single choice selected, two empty options, remove buttons hidden, "Create poll" enabled. | While saving: button reads "Creating…", button and all fields locked. | Inline error under each invalid field, focus on the first. Save failure: form-level error above the button, input kept, form unlocked. | Navigates to the confirmation screen. |
| Option list | Two empty options (minimum). | Not applicable | Inline error under an empty or duplicate option. | Each option shows its placeholder, drag handle, character counter, and remove button (only when more than 2 options). |
| Confirmation screen | Not applicable | On reload: "Loading poll…" until the poll loads. | Poll can't be loaded (doesn't exist, or belongs to someone else): load error with "Back to home". | "Poll created" heading, question, details (if any), answer type, options in order, status Open, "Back to home" and "Create another poll". |
| Discard dialog [Could] | Not applicable | Not applicable | Not applicable | Title, body, "Discard" and "Keep editing". |

## UI Copy

| Location | State | Text |
|----------|-------|------|
| Landing page heading | Default | Welcome |
| Landing page intro | Default | Create a poll and share it with others. |
| Landing page button | Default | Create poll |
| Form heading | Default | Create a poll |
| Question label | Default | Question |
| Question placeholder | Empty | What do you want to ask? |
| Question counter | Default | {count}/200 |
| Details button | Details hidden | Add details |
| Details label | Details shown | Details (optional) |
| Details placeholder | Empty | Add context for the people answering. |
| Details counter | Default | {count}/1000 |
| Remove details button | Details shown | Remove details |
| Answer type label | Default | Answer type |
| Single choice option | Default | Single choice — people pick one answer |
| Multiple choice option | Default | Multiple choice — people can pick more than one answer |
| Options label | Default | Options |
| Options helper | Default | Add 2 to 8 options. Drag to reorder. |
| Option placeholder | Empty | Option {n} |
| Option counter | Default | {count}/100 |
| Drag handle (accessible label) | Default | Drag to reorder option {n} |
| Remove option (accessible label) | More than 2 options | Remove option {n} |
| Add option button | Default | Add option |
| Add option hint | 8 options | You can add up to 8 options. |
| Create button | Default | Create poll |
| Create button | Saving | Creating… |
| Cancel button | Default | Cancel |
| Question error | Empty or only spaces | Enter a question. |
| Option error | Empty or only spaces | Fill in this option or remove it. |
| Option error | Duplicate | This option is already in the list. |
| Form error | Save failed | Couldn't create your poll. Check your connection and try again. |
| Discard dialog title [Could] | Default | Discard this poll? |
| Discard dialog body [Could] | Default | What you've entered will be lost. |
| Discard dialog buttons [Could] | Default | Discard / Keep editing |
| Confirmation heading | Success | Poll created |
| Confirmation intro | Success | Your poll is open and ready for answers. |
| Confirmation answer type | Success | Single choice / Multiple choice |
| Confirmation status | Success | Open |
| Confirmation buttons | Success | Back to home / Create another poll |
| Confirmation loading | Loading | Loading poll… |
| Confirmation load error | Error | We couldn't load this poll. |

## Security & Privacy
- **Who can see this data?** Only the creator, on the confirmation screen of their new poll. Participants reach the poll later through Share invite link.
- **What does the creator see about participants?** Not applicable — no one has answered yet.
- **Can anyone see results before answering?** Not applicable — no answers or results exist in this feature.
- **What does an invite link expose?** Not applicable — links belong to Share invite link.
- **Unauthorized access (final behavior):** A guest opening the landing page or Create poll form is sent to the login page. A create attempt without a logged-in user is rejected and nothing is saved. Another user opening someone else's confirmation screen sees "We couldn't load this poll." — the poll's existence is not revealed.
- **Until Register and log in ships:** The app acts as one fixed test user. Guest blocking is not enforced (see Deferred Decisions).
- **User-entered text** (question, details, options) is always shown as plain text; it never runs as code or markup.

## Edge Cases
- User double-clicks or taps "Create poll" repeatedly: exactly one poll is created.
- Network or server failure while saving: input is kept, user can retry. If the first save succeeded but the response was lost, a retry may create a duplicate — accepted for MVP (see Deferred Decisions).
- Question or option contains only spaces: treated as empty. Leading and trailing spaces are trimmed on save.
- Duplicate options differing only in case or surrounding spaces ("Yes" and " yes"): blocked with the duplicate error.
- User pastes text longer than the limit: text is cut at the limit and the counter shows the maximum.
- 8 options at 100 characters, a 200-character question, and 1000 characters of details: all text wraps and shows in full on the form and confirmation screen, with no truncation, including at phone width.
- Text in any language, including right-to-left text and emoji, is saved and shown as entered.
- User fills in details then selects "Remove details": text is discarded and not saved.
- User removes an option that has an error: the error disappears with it.
- User switches answer type: options and their order stay the same.
- User refreshes the form: input is lost (no draft saving).
- User refreshes the confirmation screen: the same poll loads again.
- Guest tries to create a poll, or session expires mid-action: handled by Register and log in (deferred).
- Keyboard-only and screen-reader users cannot reorder options, because reordering is drag only (captain decision, see Deferred Decisions).

## Acceptance Criteria
- [ ] The app opens on the landing page.
- [ ] The landing page shows "Welcome", the intro text, and a "Create poll" button that opens the Create poll form.
- [ ] The form opens with an empty question, hidden details, Single choice selected, and exactly 2 empty options.
- [ ] The Question field accepts at most 200 characters and shows a {count}/200 counter.
- [ ] "Add details" shows a Details field that accepts at most 1000 characters and shows a {count}/1000 counter.
- [ ] "Remove details" hides the Details field, and its text is not saved.
- [ ] Each option accepts at most 100 characters and shows a {count}/100 counter.
- [ ] "Add option" adds an empty option at the bottom and focuses it.
- [ ] At 8 options, "Add option" is disabled and "You can add up to 8 options." is shown.
- [ ] Remove buttons appear only when there are more than 2 options; removing an option deletes it from the list.
- [ ] Dragging an option by its handle moves it, and the new order is the order saved.
- [ ] Submitting with an empty or spaces-only question shows "Enter a question." and saves nothing.
- [ ] Submitting with an empty or spaces-only option shows "Fill in this option or remove it." under that option and saves nothing.
- [ ] Submitting with options that match after trimming and ignoring case shows "This option is already in the list." and saves nothing.
- [ ] After a failed submit, focus moves to the first invalid field, and each error clears as soon as its field becomes valid.
- [ ] While saving, the button reads "Creating…" and the form cannot be edited or submitted again.
- [ ] Repeated clicks on "Create poll" create exactly one poll.
- [ ] If saving fails, "Couldn't create your poll. Check your connection and try again." is shown, all input is kept, and the form is editable again.
- [ ] A saved poll stores the trimmed question, trimmed details (or none), the answer type, the trimmed options in displayed order, the creator, and status Open.
- [ ] After saving, the confirmation screen shows "Poll created", the question, details (if any), "Single choice" or "Multiple choice", the options in order, and "Open".
- [ ] "Back to home" opens the landing page; "Create another poll" opens an empty form.
- [ ] Reloading the confirmation screen shows the same poll.
- [ ] Opening a confirmation screen for a poll that doesn't exist, or that belongs to another user, shows "We couldn't load this poll." with "Back to home".
- [ ] "Cancel" returns to the landing page without saving.
- [ ] User-entered text containing markup or script is displayed as plain text.

## Out of Scope
- Invite link and sharing (Share invite link)
- Ongoing-polls list on the landing page (My polls)
- Registration, login, logout, guest blocking, session expiry (Register and log in)
- Editing or deleting a poll after creation
- Closing a poll, answering a poll, viewing results
- Creator-set minimum or maximum number of picks for multiple choice
- Move up/down buttons or keyboard reordering
- Drafts and autosave
- Images, expiry dates, anonymity settings, templates

## Deferred Decisions
- **Guest blocking and session expiry** — no auth yet; captain decides in the Register and log in spec.
- **Duplicate poll on retry after a lost response** — rare, accepted for MVP; dev may propose a fix in the dev plan, captain decides.
- **Keyboard and screen-reader reordering** — captain chose drag only; revisit after MVP.
- **Min/max picks for multiple choice** — not needed for MVP; captain decides after Answer poll ships.

## Changelog
- 2026-09-14 — Spec created.

---

## Technical Plan

**Plan status:** Approved
**Author:** /dev
**Last updated:** 2026-09-14

### Summary
Set up the server and client, then build Create poll end to end. Server: `users`, `polls`, `poll_options` tables. A router-level `requireUser` stand-in loads the seeded test user. Two endpoints: `POST /api/polls` (transactional, idempotent through `clientRequestId`) and `GET /api/polls/:pollId` (scoped to the creator; 404 otherwise). Client: three routes (landing, create form, confirmation), built only from catalog components styled through token-mapped Tailwind classes. Form state and validation live in a hook plus pure utils. Drag reordering is a hand-written Pointer Events hook, so it works with mouse and touch without a dependency. The [Could] discard dialog is included and triggered by Cancel only.

### Story Coverage
| Story | Priority | Covered by (tasks) |
|-------|----------|--------------------|
| Landing page with "Create poll" | Must | 7, 9, 10 |
| Write a poll question | Must | 3, 4, 5, 6, 11, 13 |
| 2–8 answer options | Must | 3, 4, 5, 6, 11, 12, 13 |
| Single or multiple answers | Must | 3, 4, 12, 13 |
| Drag options into order | Must | 5, 11, 12 |
| Confirmation of created poll | Must | 6, 8, 14 |
| Optional details | Should | 3, 4, 11, 13 |
| Clear field errors | Should | 11, 13 |
| Warning before leaving a half-filled form | Could | 15 |

### Data Model
All tables use `underscored` columns, `created_at` / `updated_at`, and UUID primary keys defaulting to `gen_random_uuid()`. Every migration has a `down` that drops what `up` created.
- **`users`**: `id` UUID PK; `username` VARCHAR(50) NOT NULL UNIQUE. (Register adds `password_hash` later.)
- **`polls`**: `id` UUID PK; `creator_id` UUID NOT NULL FK → `users.id` ON DELETE CASCADE; `question` VARCHAR(200) NOT NULL; `details` VARCHAR(1000) NULL; `answer_type` VARCHAR(10) NOT NULL CHECK IN ('single','multiple'); `status` VARCHAR(10) NOT NULL DEFAULT 'open' CHECK IN ('open','closed'); `client_request_id` UUID NOT NULL. UNIQUE (`creator_id`, `client_request_id`).
- **`poll_options`**: `id` UUID PK; `poll_id` UUID NOT NULL FK → `polls.id` ON DELETE CASCADE; `text` VARCHAR(100) NOT NULL; `position` SMALLINT NOT NULL CHECK 0–7. UNIQUE (`poll_id`, `position`).
- **Models:** `User` hasMany `Poll` (as `polls`, fk `creator_id`); `Poll` belongsTo `User` (as `creator`); `Poll` hasMany `PollOption` (as `options`); `PollOption` belongsTo `Poll`.
- **Seeder:** creates the test user whose username comes from `TEST_USER_USERNAME`. Its `down` deletes that user.

### API
Envelope: `{ data, error }`. JSON field names are camelCase.

Poll object: `{ id, question, details: string|null, answerType: 'single'|'multiple', status: 'open', createdAt, options: [{ id, text, position }] }`, with options sorted by position. `creatorId` and `clientRequestId` are never returned.

| Method | Route | Auth | Validation | Success | Errors |
|--------|-------|------|------------|---------|--------|
| POST | /api/polls | `requireUser` (router) | body (strict): `question` trim 1–200, no line breaks; `details` optional string or null, trim, max 1000, empty → null; `answerType` enum; `options` 2–8 strings, each trim 1–100, no line breaks, unique by trim + lowercase; `clientRequestId` UUID | 201 `{ data: poll }` new. 200 `{ data: poll }` when this creator already used `clientRequestId` (replay returns the existing poll) | 400 "Invalid request", 401 "Authentication required", 413 "Request too large", 500 "Something went wrong" |
| GET | /api/polls/:pollId | `requireUser` (router) | params: `pollId` UUID; a malformed ID returns **404**, not 400 | 200 `{ data: poll }` | 404 "Poll not found" (doesn't exist, belongs to another user, or malformed ID), 401, 500 |

Also: unknown `/api/*` routes → 404 envelope; malformed JSON → 400.

### Backend
Files at the server root: `server/app.js` (exports the app for Supertest) and `server/server.js` (listen), plus `.sequelizerc` pointing at `utils/dbConfig.js`, `migrations/`, `models/`, `seeders/`.
- **utils:** `logger.js` (pino; silent under test; redacts authorization/cookie), `asyncHandler.js`, `httpErrors.js` (`AppError`, `NotFoundError`, `UnauthorizedError` carrying status and a public message), `dbConfig.js` (dev/test/prod from `DATABASE_URL` / `DATABASE_URL_TEST`; throws if the two are equal under test).
- **middleware:** `requireUser.js` looks up the user whose username is in `TEST_USER_USERNAME` (reading only `id, username`) and sets `req.user`; missing user → 401 and an error log. Register later replaces only this file's body with JWT verification. `validate.js` takes `({ body, params, query }, { status })` Zod schemas, replaces `req.body` / `req.params` with the parsed values, and fails with 400 by default (404 for the poll-id params). `errorHandler.js` maps `AppError` → its status and message; body-parser errors → 400 / 413; everything else → 500 with a generic message. It logs method, route and user id, and never the body or stack traces to the client. `notFound.js`.
- **app.js:** helmet → cors (`origin: CLIENT_URL`) → `express.json({ limit: '20kb' })` → pino-http → `/api` routes → notFound → errorHandler.
- **Schemas:** `server/utils/pollSchemas.js`, with Zod schemas for create-poll body and poll-id params.
- **services/pollService.js:**
  - `createPoll({ creatorId, question, details, answerType, options, clientRequestId })` → `{ poll, created }`. It first looks up an existing `(creator_id, client_request_id)` and returns it with `created: false`. Otherwise one `sequelize.transaction` inserts the poll with `status 'open'` and then `bulkCreate`s the options with `position` = array index. If a concurrent insert hits the unique constraint (`UniqueConstraintError`), it reloads and returns the existing poll with `created: false`.
  - `getPollForCreator({ pollId, creatorId })` runs `WHERE id AND creator_id` with explicit attributes and ordered options. Nothing found → `NotFoundError`.
- **controllers/pollController.js** (thin): `create` → 201/200 depending on `created`. `getById` → 200.
- **routes:** `routes/index.js` mounts `/polls`. `routes/polls.js` has `router.use(requireUser)`, `POST /` with validate, `GET /:pollId` with validate(params, 404).

### Frontend
- **Setup:** Vite React (JS). Tailwind 3.4 `tailwind.config.js` **replaces** the default theme sections: colors (semantic tokens only, plus `transparent` / `current`), spacing (`space-1…12` → `1…12`, plus `0`), fontSize (`xs…3xl`), fontWeight (`regular/medium/bold`), lineHeight (`tight/normal`), borderRadius (`sm/md/lg/full`), boxShadow (`sm/md/lg/none`), transition duration and easing, rotate (`tilt-sm/md`), zIndex, `maxWidth.container`, `maxWidth.dialog` (28rem, per catalog), `minHeight` / `minWidth` touch. `src/index.css` imports `styles/tokens.css` and sets `body` to `font-sans bg-bg text-text`. Reduced motion uses `motion-safe:` / `motion-reduce:` variants.
- **Routes (`App.jsx`):** `/` → `LandingPage`; `/polls/new` → `CreatePollPage`; `/polls/:pollId/created` → `PollCreatedPage`; `*` → redirect to `/`.
- **Pages:** `LandingPage.jsx`, `CreatePollPage.jsx` (form markup; logic lives in the hook), `PollCreatedPage.jsx`.
- **Components (all from the catalog):** `Button`, `TextInput`, `PageLayout`, `NavBar` (logo only), `HeroCard`, `AnswerTypeSelector`, `OptionListEditor`, `OptionEditorRow` (handle, number badge, remove; **no move buttons**), `Alert`, `StatusBadge`, `PollSummary`, `SuccessMark`, `Skeleton`, `ConfirmDialog`. Icons are small inline SVGs (`currentColor`, `aria-hidden`) inside the component that uses them.
- **Hooks:**
  - `useCreatePollForm` holds question, detailsShown/details, answerType, options `[{ key, text }]`, submitAttempted, errors, saving, formError, and a `clientRequestId` (`crypto.randomUUID()`, created once per form mount). Its actions: add/remove/update/reorder option, show/remove details, submit.
  - `useDragReorder`: Pointer Events on the handle, `setPointerCapture`, `touch-action: none`, a drop slot following the pointer, auto-scroll near viewport edges, Escape cancels. Midpoint math lives in a pure `getTargetIndex`.
  - `usePoll(pollId, initialPoll)` returns `{ data, loading, error }`. It uses router state after create and fetches on reload.
- **Services:** `services/apiConfig.js` (reads `import.meta.env.VITE_API_URL`; mapped to a stub in Jest), `services/api.js` (one axios instance; unwraps the envelope; throws `{ status }`; a JWT hook point is added by Register), `services/pollService.js` (`createPoll`, `getPoll`).
- **Utils:** `uiCopy.js` (every spec string, word for word), `pollValidation.js` (`validatePollForm` → `{ question?, options: { [key]: 'empty'|'duplicate' } }`; normalizes with trim + lowercase; the error goes on later duplicates; empty beats duplicate), `reorder.js`, `singleLine.js` (typed or pasted line breaks → spaces for question and options).
- **UI states:**
  - Landing: static.
  - Form default: empty question, details hidden, Single choice, 2 empty options, remove buttons hidden.
  - Saving: Button in loading state with "Creating…" (`aria-disabled`); fields read-only; radios, handles, remove, Add option and Cancel disabled; a ref guard blocks re-entry.
  - Field errors: shown under each field; focus goes to the first invalid field (question, then options top to bottom); after that errors are only **cleared** live and new ones appear on the next submit.
  - Save failure: `Alert` above the bottom bar with the form-error copy; input kept; form unlocked; retry reuses the same `clientRequestId`.
  - Success: `navigate('/polls/:id/created', { state: { poll } })`.
  - Confirmation loading: `Skeleton` with "Loading poll…" (`role="status"`).
  - Confirmation error (404 or any failure): `Alert` "We couldn't load this poll." plus "Back to home".
  - Confirmation success: `SuccessMark`, "Poll created", intro, `PollSummary`, "Back to home" and "Create another poll".
  - Discard dialog: shown on Cancel when anything was entered (any text in question, visible details or options, answer type changed, or option count ≠ 2). "Keep editing" is the initial focus; Escape or a scrim tap acts as keep editing.

### Security
- **Guest blocking:** deferred to Register. `requireUser` is applied at router level on `/api/polls`, so the swap later happens in one place.
- **Create without a user:** `requireUser` returns 401 before the controller runs; nothing is saved.
- **Someone else's poll:** the query is scoped by `creator_id`. Missing, foreign and malformed IDs all return the same 404, so existence is not revealed.
- **Plain text:** React escaping only. No `dangerouslySetInnerHTML` anywhere; test strings include `<script>` and `<b>`.
- **Server hardening:** helmet; CORS limited to `CLIENT_URL`; a 20kb body limit; strict Zod (unknown keys rejected); no stack traces or internals in responses; logs never include bodies or tokens.

### Edge Cases
- **Repeated clicks:** a synchronous ref guard plus the locked button on the client, and the idempotency key plus unique constraint on the server.
- **Lost response, then retry:** the same `clientRequestId` returns the existing poll with 200, so no duplicate is created.
- **Spaces-only or leading/trailing spaces:** trimmed in client validation and in Zod before saving.
- **Case or space duplicates:** trim + lowercase comparison on both client and server.
- **Pasting past the limit:** native `maxLength` cuts pasted text (UTF-16 counting, matched by Zod); the counter shows the maximum and the at-limit style.
- **Max-length content at 360px:** `break-words` / `overflow-wrap:anywhere`, auto-grow textareas, no truncation, `whitespace-pre-wrap` for details.
- **RTL and emoji:** `dir="auto"` on inputs and displayed user text; UTF-8 end to end.
- **Remove details:** clears the text and hides the field; the payload sends `details: null`.
- **Removing an option with an error:** errors are keyed by the option's stable `key`, so the error goes with it.
- **Switching answer type:** only `answerType` changes.
- **Refreshing the form:** no persistence.
- **Refreshing the confirmation:** `usePoll` fetches by id.
- **Keyboard reordering:** none, as the spec states; the handle has its label but no keyboard action.

### Tests
- **Unit (Jest, server):**
  - `pollSchemas`: trim, limits, 1 and 9 options, spaces-only, case duplicates, line breaks, unknown keys, bad UUID.
  - `errorHandler`: statuses; no stack in body.
  - `requireUser`: found / missing user.
  - `pollService`: stores trimmed values, order, `open` status, creator; replay returns existing; concurrent same key gives one poll; a failing option insert rolls back the poll; get works for own, 404s for foreign and missing.
- **API integration (Supertest):**
  - POST: 201 success; 400 for each validation rule; 401 (no test user); 200 on replay; 5 parallel identical requests give 1 poll; markup stored verbatim; 413 oversize; 400 malformed JSON.
  - GET: 200 own; 404 foreign, missing and malformed; 401.
  - Unknown `/api` route → 404 envelope.
  - 403 doesn't apply (no roles in this feature); the foreign-poll 404 covers "unauthorized".
- **Unit (Jest + RTL, client):**
  - Utils: `pollValidation`, `reorder`, `singleLine`, `getTargetIndex`.
  - Hooks: `useCreatePollForm` (add, remove, limit, clear-only errors, double-submit guard, failure keeps input); `usePoll`.
  - Components: `Button` loading; `TextInput` counter / aria / error; `OptionListEditor` (remove hidden at 2, add disabled + hint at 8, focus after add/remove, simulated pointer drag reorders); `AnswerTypeSelector`; `ConfirmDialog` (focus, Escape); `PollSummary` plain text.
  - Pages: Landing copy and navigation; CreatePollPage (validation messages and focus, "Creating…", failure alert, payload order and trim, remove details not sent, Cancel with and without the dialog); PollCreatedPage (loading, error, success, fetch on reload).
- **E2E (Playwright):** owned by /qa.

### Tasks
Backend
1. `chore:` server setup: package.json and scripts, app/server, logger, asyncHandler, httpErrors, errorHandler, notFound, dbConfig, `.sequelizerc`, Jest config and test-DB helpers (migrate in globalSetup, truncate per test, factories), `server/.env.example`, root `.gitignore`. Tests: errorHandler, notFound.
2. `feat:` users migration, User model, test-user seeder, `requireUser`, and their tests.
3. `feat:` polls + poll_options migrations, models, associations; model / constraint tests.
4. `feat:` `validate` middleware + poll Zod schemas, and their tests.
5. `feat:` `pollService` (transactional create, idempotency, creator-scoped get), and its tests.
6. `feat:` poll controller + routes (POST, GET) and Supertest tests. → **Checkpoint 1** (also run migrations up/down/up).

Frontend
7. `chore:` client setup: Vite, React Router routes skeleton, Tailwind token mapping, `index.css`, Jest + Babel + RTL config, `client/.env.example`; smoke test.
8. `feat:` axios instance, `apiConfig`, `pollService`, and their tests.
9. `feat:` `Button`, `TextInput`, `Alert`, `PageLayout`, `NavBar`, and their tests.
10. `feat:` `HeroCard` + `LandingPage`, and their tests.
11. `feat:` `uiCopy`, `pollValidation`, `reorder`, `singleLine`, `useCreatePollForm`, and their tests.
12. `feat:` `AnswerTypeSelector`, `OptionEditorRow`, `OptionListEditor`, `useDragReorder`, and their tests.
13. `feat:` `CreatePollPage` (assemble, submit, saving, errors, failure), and its tests.
14. `feat:` `StatusBadge`, `PollSummary`, `SuccessMark`, `Skeleton`, `usePoll`, `PollCreatedPage`, and their tests.
15. `feat:` `ConfirmDialog` + discard on Cancel [Could], and their tests. → **Checkpoint 2** → captain's `/design` UI review → fixes → verify all acceptance criteria → handoff.

### Decisions
All made by the captain on 2026-09-14 unless marked as a dev proposal in this plan.
- **Reorder:** drag only, per spec. The catalog's Move up/down buttons are not built.
- **Design files:** committed to `main` by the captain before branching.
- **Test user:** minimal `users` table + seeder; `requireUser` loads the user named in `TEST_USER_USERNAME` (new env var).
- **Duplicate on retry:** idempotency key (`client_request_id`, unique per creator; a replay returns the existing poll with 200).
- **Packages:** helmet approved. @dnd-kit, lucide-react and @fontsource/nunito declined, so drag is custom, icons are inline SVG, and Nunito falls back to system fonts. Also added: dotenv, cors, pino-http, React Testing Library + jest-dom + user-event, jest-environment-jsdom, babel-jest + presets, identity-obj-proxy, postcss, autoprefixer. No nodemon (`node --watch` instead).
- **Poll IDs:** UUID.
- **Discard dialog [Could]:** built now, triggered by Cancel only.
- **Validation display:** the duplicate error goes on later duplicates; after a failed submit errors only clear live.
- **Drag:** a custom Pointer Events hook.
- **NavBar:** logo only until Register ships.
- **Character counting:** native UTF-16 (`maxLength` / `.length`), matched by Zod.
- **Tailwind:** v3.4 with default palette, spacing and radii replaced by token mappings.
- **Dev proposals, approved with this plan:**
  - VARCHAR + CHECK instead of Postgres ENUM, so later values are easy to add.
  - Malformed poll ID → 404.
  - Line breaks rejected in question and options (the client converts them to spaces).
  - Replay returns the existing poll even if the payload differs.
  - Unknown client routes redirect to `/`.
  - Confirmation route is `/polls/:pollId/created`, leaving `/polls/:pollId` free for later features.
  - Client tests use Jest, per `CLAUDE.md`, rather than Vitest.
  - UI strings are kept in `utils/uiCopy.js`.
  - 20kb body limit.
- **Package pin (dev, 2026-09-15):** `@vitejs/plugin-react` pinned to 5.2 (v6 has a Babel peer conflict with Jest's Babel 7 presets).
- **/design UI review (captain, 2026-09-15):**
  - Fixed: V1 (logo link touch target), V2 (h1 on loading and load-error screens), V3 (drag handle grip drawn as filled dots).
  - V2 reuses existing spec copy as the heading: "Loading poll…" and "We couldn't load this poll." No new copy.
  - Deferred for later: V4–V9 and design-system issues D1–D6.
  - /qa deferred until V4–V9 are fixed, so the spec stays In Dev.

### Risks & Open Questions
- **For `/design` (dev does not edit the catalog):** remove Move up/down from `OptionEditorRow` / `OptionListEditor` and the live-region announcement; NavBar shows no user yet; the Nunito and icon deferred decisions are resolved as "no package"; the brief and catalog are still `Draft`.
- **Accessibility:** drag-only reordering fails WCAG 2.5.7 / 2.1.1 for reordering. The spec accepts this; it is recorded for the post-MVP revisit.
- **Custom drag:** needs manual testing on a real touch device (iOS Safari scroll vs. drag). Jest covers the logic, not real touch.
- **`crypto.randomUUID()`:** needs a secure context. It works on localhost and on Render over HTTPS.
- **Local setup:** the captain provides DB credentials in `server/.env` and creates the dev and test databases (or approves me running `createdb`).

### Handoff Notes
Filled in at hand off, for `/qa`.
- Branch:
- How to run (setup, seed data, env vars):
- What to test first:
- Known limitations:
