# Feature: Share and join poll

**Status:** In QA
**Created:** 2026-09-15
**Last updated:** 2026-09-15

## Problem Statement
A creator can make a poll, but nobody else can reach it. Participants have no account, so the invite link is the only way into a poll, and a nickname is the only way to tell participants apart. The creator needs a short link that is easy to copy or send from a phone. Anyone who opens that link needs to land on the right poll, pick a nickname, and join it. This merges roadmap items Share invite link and Join poll with nickname (captain, 2026-09-15), because Answer poll, View results and View participant nicknames all start from a joined participant.

## Users & Permissions
| Role  | What they can do in this feature |
|-------|----------------------------------|
| User  | Open the share sheet for their own poll from the confirmation screen, copy the invite link, and send it with the device's share options. Open any invite link and join with a nickname, the same way a guest does. |
| Guest | Open an invite link, see the poll's question, details, status and number of options, enter a nickname, and join the poll. Cannot see the share sheet, answer options, results, other participants' nicknames, or anything about the creator. |

## User Stories
- [Must] As a User, I want every poll I create to have its own invite link, so that I can bring people to it.
- [Must] As a User, I want to open a share sheet from my poll's confirmation screen, so that the link is easy to find right after creating the poll.
- [Must] As a User, I want to copy the invite link in one tap, so that I can paste it into any chat or email.
- [Must] As a Guest, I want the invite link to open the poll it belongs to, so that I know what I was invited to.
- [Must] As a Guest, I want a clear message when a link doesn't work, so that I know to ask for a new one.
- [Must] As a Guest, I want to enter a nickname and join the poll, so that I can take part without an account.
- [Must] As a Guest, I want to be told when my nickname is already taken in this poll, so that I can pick another one.
- [Must] As a Guest, I want the poll to remember that I joined on this device, so that I don't have to enter my nickname again.
- [Should] As a User, I want to send the link with my phone's share options, so that I can send it to a chat app without copying and pasting.
- [Should] As a Guest, I want to see the question, details, and how many options there are before I join, so that I can decide whether to take part.

## User Flows

**Flow 1 — Share a poll (happy path)**
1. User creates a poll. System shows the confirmation screen, now with a "Share poll" button as the main action.
2. User selects "Share poll".
3. System opens the share sheet (a bottom sheet on phones, a centered dialog on larger screens). It shows the title, the body text, the full invite link, a "Copy" button, a "Share link" button (only on devices that support sharing), and "Done".
4. User selects "Copy".
5. System copies the link. The button changes to "Copied" for 2 seconds, then back to "Copy". A screen reader announces "Link copied".
6. User selects "Done". System closes the sheet and returns focus to "Share poll".

**Alternate paths**
- **A. Device share:** User selects "Share link". System opens the device's own share options with the text "Answer my poll here:" followed by the invite link. If the user cancels, nothing happens and the sheet stays open.
- **B. Copy fails:** The browser blocks copying. System shows "Couldn't copy the link. Select it and copy it yourself." under the link and selects the link text. The button stays "Copy".
- **C. Close the sheet:** The close button, Escape, or tapping outside the sheet closes it, same as "Done".
- **D. Reload:** User reloads the confirmation screen. The poll loads again and "Share poll" works as before.
- **E. Share again:** User opens the share sheet again. It shows the same link.

**Flow 2 — Open an invite link and join (happy path)**
1. Guest opens the invite link (for example, from a chat app).
2. System shows "Loading poll…".
3. System shows the invite page: "You're invited", the status (Open), the number of options, the question, details (if any), the "Your nickname" field with its helper text and counter, and a "Join poll" button.
4. Guest types a nickname and selects "Join poll" (or presses Enter).
5. System checks the nickname. Valid: the button changes to "Joining…" and the field is locked.
6. System saves the nickname as a participant of this poll and remembers on this device that the guest joined.
7. System shows the joined screen: "You're in, {nickname}", the status, the number of options, the question, and details (if any).

**Alternate paths**
- **F. Link doesn't work:** The link is mistyped, cut off, or points to no poll. System shows "This link doesn't work" with the body text. Nothing about any poll is shown.
- **G. Load fails (network or server):** System shows "We couldn't load this poll." with "Check your connection and try again." and a "Try again" button. "Try again" returns to step 2.
- **H. Empty nickname:** Guest selects "Join poll" with an empty or spaces-only nickname. System saves nothing, shows "Enter a nickname." under the field, and focuses it. The error clears as soon as the field is valid.
- **I. Nickname taken:** Someone already joined this poll with the same nickname, ignoring case and surrounding spaces. System saves nothing, unlocks the field, keeps the typed nickname, shows "This nickname is taken in this poll. Try another one." under the field, and focuses it. The error clears as soon as the guest changes the nickname.
- **J. Join fails (network or server):** System keeps the nickname, shows "Couldn't join the poll. Check your connection and try again." above the button, and unlocks the field. Guest can try again.
- **K. Come back on the same device:** Guest who already joined opens the link again (reload, new tab, another day). After loading, System goes straight to the joined screen with their nickname. The nickname cannot be changed.
- **L. Registered user or the creator opens the link:** They see the same invite page and join the same way as a guest. Nothing is prefilled.

## UI States

| Screen / Component | Empty | Loading | Error | Success |
|--------------------|-------|---------|-------|---------|
| Confirmation screen (changes only) | Not applicable | Unchanged from Create poll. "Share poll" is not shown until the poll loads. | Unchanged from Create poll. "Share poll" is not shown. | Adds "Share poll" as the main action. "Back to home" and "Create another poll" stay, as secondary actions. |
| Share sheet | Not applicable — every poll has a link. | Not applicable — the link is known once the poll has loaded. | Copy blocked: inline message under the link, link text selected. | Title, body, full link, "Copy" ("Copied" for 2 seconds after copying), "Share link" (only if the device supports sharing), "Done", close button. |
| Invite page (not joined on this device) | Nickname field empty, counter 0/20, "Join poll" enabled. | Page: "Loading poll…" until the poll loads. Joining: button reads "Joining…", field and button locked. | Link doesn't work: heading and body, no poll content, no form. Load failed: heading, body and "Try again". Nickname empty or taken: error under the field, focus on the field. Join failed: form-level error above the button, nickname kept, form unlocked. | "You're invited", status Open, number of options, question, details (if any), nickname field with helper and counter, "Join poll". |
| Joined screen | Not applicable | "Loading poll…" when opened from the link on a device that already joined. | Same link-doesn't-work and load-failed states as the invite page. | "You're in, {nickname}", status Open, number of options, question, details (if any). No action button in this feature (Answer poll adds the answer options). |

## UI Copy

| Location | State | Text |
|----------|-------|------|
| Confirmation share button | Success | Share poll |
| Share sheet title | Default | Invite people |
| Share sheet body | Default | Anyone with this link can join and answer your poll. |
| Invite link (accessible label) | Default | Invite link |
| Copy button | Default | Copy |
| Copy button | Copied | Copied |
| Copy announcement (screen reader) | Copied | Link copied |
| Copy error | Copy blocked | Couldn't copy the link. Select it and copy it yourself. |
| Share button | Device supports sharing | Share link |
| Device share text | Default | Answer my poll here: {link} |
| Done button | Default | Done |
| Close button (accessible label) | Default | Close |
| Invite page eyebrow | Success | You're invited |
| Poll status | Success | Open |
| Poll option count | Success | {n} options |
| Poll loading | Loading | Loading poll… |
| Nickname label | Default | Your nickname |
| Nickname placeholder | Empty | e.g. Noa |
| Nickname helper | Default | The poll's creator will see this name. |
| Nickname counter | Default | {count}/20 |
| Join button | Default | Join poll |
| Join button | Joining | Joining… |
| Nickname error | Empty or only spaces | Enter a nickname. |
| Nickname error | Taken | This nickname is taken in this poll. Try another one. |
| Join error | Join failed | Couldn't join the poll. Check your connection and try again. |
| Joined heading | Success | You're in, {nickname} |
| Invalid link heading | Error | This link doesn't work |
| Invalid link body | Error | It may be mistyped or incomplete. Ask the person who shared it for a new link. |
| Load error heading | Error | We couldn't load this poll. |
| Load error body | Error | Check your connection and try again. |
| Load error button | Error | Try again |

## Security & Privacy
- **Who can see this data?** Anyone with the invite link sees the question, details, status and number of options. Only the creator sees the share sheet, from their own poll's confirmation screen. A participant sees only their own nickname.
- **What does the creator see about participants?** Nothing in this feature. The creator will see nicknames of people who answered in View participant nicknames. The nickname helper text tells participants this up front.
- **Can anyone see results before answering?** No. The invite page and joined screen show no answer options, answer counts, results, or other nicknames.
- **What does the invite link expose, and to whom?** The link works like a key: whoever has it, including people it was forwarded to, can see the invite page and join. It never reveals the poll's internal ID, the creator's username, other polls, or participants. The link code is random and short, cannot be worked out from the poll ID or the order polls were created, and guessing a working link is impractical.
- **Nickname taken message:** it confirms that someone in this poll already uses that nickname. Accepted: it reveals no other information, and only people with the link can see it.
- **Remembering a join:** the device remembers only which polls it joined and with which nickname. Anyone using the same browser on that device is treated as the same participant.
- **Unauthorized access:** A link that is mistyped, made up, or points to no poll shows the same "This link doesn't work" page in every case, so nobody can tell whether a poll exists. The confirmation screen (and its share sheet) still loads only for the poll's creator; anyone else sees "We couldn't load this poll." Joining without a valid link is not possible.
- **Search engines:** invite pages are marked so search engines do not list them.
- **User-entered text** (question, details, nickname) is shown as plain text on every screen; it never runs as code or markup.
- **Until Register and log in ships:** the app acts as one fixed test user, so "only the creator" means that test user.

## Edge Cases
- Invite link is mistyped, cut off, or made up: "This link doesn't work". Same page for any wrong link.
- Letters in the link code change case (for example, typed by hand): treated as a different link, so "This link doesn't work".
- A chat app adds extra parameters to the link (such as tracking codes) or a trailing slash: the invite page still opens the right poll.
- Registered user opens another user's link: joins as a guest with a nickname.
- Creator opens their own link: sees the same invite page and can join. Whether the creator may answer their own poll is decided in Answer poll.
- Same person, same device, joins again (reload, second tab, new visit): goes straight to the joined screen with the original nickname; no second participant is saved.
- Two tabs on one device both show the nickname form, and the guest joins in each: only the first join is saved; the second tab shows the joined screen with the first nickname.
- Same person on a different browser or device, or after clearing browser data: treated as a new participant and must choose a nickname. If they pick their earlier nickname, it is taken. Accepted for MVP.
- Two people submit the same nickname at the same moment: exactly one joins; the other sees the taken error.
- Nicknames that differ only by case, surrounding spaces, or invisible characters ("Noa", " noa", "NOA"): the same nickname, so taken.
- Nickname made only of spaces or invisible characters: "Enter a nickname."
- Leading and trailing spaces and invisible characters are trimmed on save. The nickname is shown as saved.
- Nickname with line breaks, tabs, control characters or direction-override characters: the field removes them as typed or pasted, like the question field in Create poll. Emoji and right-to-left text are allowed.
- Guest pastes a nickname longer than 20 characters: text is cut at 20 and the counter shows 20/20.
- Guest double-clicks "Join poll" or presses Enter repeatedly: exactly one participant is saved.
- Someone joins and never answers: their nickname stays reserved in this poll. Accepted for MVP.
- Someone tries to see results, answer options or other nicknames: nothing is shown; those screens don't exist yet.
- Someone opens another user's confirmation screen to get the share sheet: "We couldn't load this poll." (unchanged from Create poll).
- Polls created before this feature shipped: have an invite link too.
- Poll has a 200-character question and 1000 characters of details: all text wraps and shows in full on the invite page and joined screen at phone width.
- A 20-character nickname with emoji or right-to-left text: shown in full in "You're in, {nickname}" at phone width.
- Long link on a narrow screen: the full link is visible (wraps), never cut off.
- User taps "Copy" many times: the link is copied each time; "Copied" shows for 2 seconds after the last tap.
- Device doesn't support sharing: "Share link" is hidden; "Copy" is still there.
- User cancels the device share options: no error; the sheet stays open.
- Network or server failure while loading or joining: the matching error; nickname kept; guest can retry.
- Join succeeded but the response was lost, then the guest retries: no second participant, and the guest is not told their own nickname is taken; they see the joined screen.
- Closed polls: cannot happen yet. What the invite page and joined screen show for a closed poll is decided in Close poll.

## Acceptance Criteria

**Share**
- [ ] Every poll has exactly one invite link, and it never changes.
- [ ] The invite link is the app's own address followed by a short random code, and it does not contain the poll ID.
- [ ] The confirmation screen shows "Share poll" as the main action once the poll has loaded, with "Back to home" and "Create another poll" as secondary actions.
- [ ] "Share poll" is not shown while the confirmation screen is loading or showing its load error.
- [ ] "Share poll" opens the share sheet with "Invite people", "Anyone with this link can join and answer your poll.", the full invite link, "Copy", and "Done".
- [ ] "Copy" puts the invite link on the clipboard, changes to "Copied" for 2 seconds, and a screen reader announces "Link copied".
- [ ] If copying is blocked, "Couldn't copy the link. Select it and copy it yourself." is shown and the link text is selected.
- [ ] "Share link" is shown only on devices that support sharing, and it opens the device share options with "Answer my poll here:" followed by the invite link.
- [ ] Canceling the device share options shows no error and keeps the sheet open.
- [ ] "Done", the close button, Escape, and tapping outside close the sheet, and focus returns to "Share poll".
- [ ] Opening the share sheet again, or after reloading, shows the same link.
- [ ] Opening another user's confirmation screen still shows "We couldn't load this poll." and no share sheet.
- [ ] Polls created before this feature shipped have a working invite link.

**Open the link**
- [ ] Opening a valid invite link on a device that hasn't joined shows "Loading poll…", then "You're invited", "Open", "{n} options", the question, details if any, the nickname field, and "Join poll".
- [ ] The invite page and joined screen show no answer options, results, other nicknames, creator username, or poll ID.
- [ ] An invite link with a wrong, made-up, cut-off, or differently-cased code shows "This link doesn't work" and its body, with no poll content and no nickname form.
- [ ] Every non-working link shows an identical page, so a poll's existence is not revealed.
- [ ] An invite link with extra parameters or a trailing slash opens the right poll.
- [ ] If the poll fails to load, "We couldn't load this poll.", "Check your connection and try again." and "Try again" are shown; "Try again" loads the poll again.
- [ ] Invite pages are marked so search engines do not list them.

**Join**
- [ ] The nickname field shows "Your nickname", the placeholder "e.g. Noa", "The poll's creator will see this name.", and a {count}/20 counter.
- [ ] The nickname field accepts at most 20 characters; pasted text is cut at 20.
- [ ] Joining with an empty, spaces-only or invisible-only nickname shows "Enter a nickname.", focuses the field, and saves nothing.
- [ ] Joining with a nickname already used in this poll, ignoring case, surrounding spaces and invisible characters, shows "This nickname is taken in this poll. Try another one.", keeps the typed text, focuses the field, and saves nothing.
- [ ] Each nickname error clears as soon as the field changes to a value that could be valid.
- [ ] The same nickname can be used in two different polls.
- [ ] While joining, the button reads "Joining…" and the field and button cannot be used.
- [ ] Repeated clicks on "Join poll" or repeated Enter presses save exactly one participant.
- [ ] If joining fails, "Couldn't join the poll. Check your connection and try again." is shown above the button, the nickname is kept, and the form is usable again.
- [ ] A saved participant stores the trimmed nickname and the poll it joined.
- [ ] After joining, the joined screen shows "You're in, {nickname}", "Open", "{n} options", the question, and details if any.
- [ ] Reloading, or opening the link in a new tab on the same device after joining, shows the joined screen with the same nickname and saves no new participant.
- [ ] Joining in a second tab on the same device after joining in the first saves no new participant and shows the first nickname.
- [ ] When two people submit the same nickname at the same time, exactly one is saved.
- [ ] A registered user and the poll's creator can join through the invite link, with nothing prefilled.
- [ ] Markup or script in the question, details or nickname is shown as plain text.

## Out of Scope
- Answering, results, participant nickname list (Answer poll, View results, View participant nicknames)
- Invite page and joined screen for closed polls (Close poll)
- Share sheet from My polls (My polls)
- Changing a nickname after joining, or leaving a poll
- Recognizing the same person across browsers or devices
- Releasing a nickname reserved by someone who never answered
- Prefilling the nickname for logged-in users (Register and log in)
- Regenerating, revoking, or expiring a link
- Creator's name or avatar on the invite page
- Link preview cards in chat apps (title and image shown when a link is pasted)
- QR codes, sending links by email or SMS from the app
- Guest blocking of the landing page and create form (Register and log in)

## Deferred Decisions
- **Can the creator answer their own poll?** — belongs to Answer poll; captain decides in that spec. The creator can join in this feature.
- **Can a guest change their answer?** — belongs to Answer poll; captain decides in that spec.
- **Invite page and joined screen for a closed poll** — polls can't close yet; captain decides in Close poll.
- **Prefilled nickname for logged-in users** — no auth yet; captain decides in Register and log in.
- **Link preview cards in chat apps** — useful but would show the question to anyone who sees the chat; captain decides after MVP.
- **Regenerate or revoke a link** — not needed for MVP; captain decides after MVP.

## Changelog
- 2026-09-15 — Spec created. Merges roadmap items Share invite link and Join poll with nickname (captain decision). Link codes are case-sensitive; device share text is "Answer my poll here:" plus the link (captain).
- 2026-09-15 — Captain set status to Approved.

---

## Technical Plan

**Plan status:** Approved
**Author:** /dev
**Last updated:** 2026-09-15

### Summary
Server:
- Postgres function `generate_invite_code()` makes a random 10-character base62 code. It is the default of a new `polls.invite_code` column (unique, case-sensitive). The migration backfills existing polls.
- New `participants` table. Nickname uniqueness is enforced by UNIQUE (`poll_id`, `nickname_key`), where `nickname_key` is the nickname with invisible characters removed, lowercased and NFC-normalized (same rule as option duplicates).
- Joins are idempotent: each device sends a random per-poll `joinKey`, and UNIQUE (`poll_id`, `join_key`) means a replay returns the original participant.
- Public router `/api/invites/:inviteCode`: GET invite and POST join. Every non-working code gets the same 404. The poll ID and creator are never exposed.
- The creator's poll DTO gains `inviteCode`.

Client:
- `ShareInviteModal` on the confirmation screen, built on a new `Sheet` pulled out of `ConfirmDialog`.
- Route `/i/:inviteCode` → `InvitePage`, covering loading, invite form, joined, link doesn't work, and load failed.
- localStorage remembers `{ joinKey, nickname }` per invite code.
- All components come from the catalog.

### Story Coverage
| Story | Priority | Covered by (tasks) |
|-------|----------|--------------------|
| Every poll has its own invite link | Must | 2, 5, 6 |
| Share sheet from confirmation screen | Must | 7, 8, 9 |
| Copy link in one tap | Must | 9 |
| Invite link opens its poll | Must | 4, 5, 6, 11, 12 |
| Clear message when link doesn't work | Must | 4, 5, 10, 12 |
| Enter nickname and join | Must | 1, 3, 4, 5, 10, 11, 12 |
| Told when nickname is taken | Must | 3, 4, 5, 11, 12 |
| Poll remembers join on this device | Must | 4, 6, 11, 12 |
| Send link with phone's share options | Should | 9 |
| See question, details, option count before joining | Should | 4, 8, 12 |

### Data Model
**Migration `20260915000001-add-invite-code-to-polls`**, run in one transaction.

Up:
1. `CREATE FUNCTION generate_invite_code() RETURNS varchar(10)`, plpgsql, VOLATILE.
   - Takes bytes from `uuid_send(gen_random_uuid())` (`pg_strong_random`), skipping the version and variant bytes (6 and 8).
   - Rejects bytes ≥ 248 (62×4), so every character is equally likely.
   - Maps each kept byte to `0-9A-Za-z` until 10 characters.
2. Add `invite_code VARCHAR(10)` nullable.
3. Backfill: `UPDATE polls SET invite_code = generate_invite_code()`.
4. Set NOT NULL and DEFAULT `generate_invite_code()`.
5. Add UNIQUE `polls_invite_code_key` and CHECK `polls_invite_code_check` (`invite_code ~ '^[0-9A-Za-z]{10}$'`).

Down: drop the constraints and the column, then drop the function.

Default column collation is byte-wise for this comparison, so codes are case-sensitive. Raw SQL inserts (e.g. QA's `e2e/helpers/db.js`) still get a code.

**Migration `20260915000002-create-participants`:**
- Columns:
  - `id` UUID PK, default `gen_random_uuid()`
  - `poll_id` UUID NOT NULL, FK → `polls.id`, ON DELETE CASCADE
  - `nickname` VARCHAR(20) NOT NULL: trimmed, stored as saved
  - `nickname_key` VARCHAR(80) NOT NULL, CHECK `<> ''`. Lowercasing can lengthen text, hence 80.
  - `join_key` UUID NOT NULL
  - `created_at`, `updated_at`
- Constraints:
  - UNIQUE `participants_poll_id_nickname_key_key` (`poll_id`, `nickname_key`)
  - UNIQUE `participants_poll_id_join_key_key` (`poll_id`, `join_key`)
- Down: drop table.

**Models:**
- `Poll.inviteCode`: STRING(10). No JS default, the DB fills it; Sequelize's Postgres RETURNING reads it back.
- New `Participant` (`participants`, underscored).
- `Poll` hasMany `Participant` as `participants` (CASCADE); `Participant` belongsTo `Poll`.
- Test factory `createPoll` works unchanged; `createParticipant` is added.

### API
Envelope `{ data, error }`.

Poll DTO for the creator (POST /api/polls, GET /api/polls/:pollId) gains `inviteCode`.

Invite DTO: `{ question, details, status, optionCount }`. No id, creator, options, answer type or participants.

| Method | Route | Auth | Validation | Success | Errors |
|--------|-------|------|------------|---------|--------|
| GET | /api/invites/:inviteCode | Public (no `requireUser` on this router) | params `inviteCode` `^[0-9A-Za-z]{10}$`; anything else → **404** | 200 `{ data: invite }` | 404 "Poll not found" (malformed, wrong case, cut off, missing: identical body and headers), 500 |
| POST | /api/invites/:inviteCode/participants | Public | params as above (404). Body (strict): `nickname` = `singleLineText(20)` (same rules as the question: trims spaces and invisible characters at the edges, not blank, no line breaks, control or direction-override characters, UTF-16 length ≤ 20); `joinKey` UUID → 400 | 201 `{ data: { nickname } }` new participant. 200 `{ data: { nickname } }` when this `joinKey` already joined this poll; returns the **original** nickname even if the body's differs | 400 "Invalid request", 404, 409 "Nickname taken", 413, 500 |

Every `/api/invites` response sends `X-Robots-Tag: noindex`.

Params are validated before the body, so a malformed code always gets the 404. For a well-formed code, body validation (400) runs before the existence check, so a 400 reveals nothing about whether the poll exists.

### Backend
- **Refactor:** `server/utils/pollSchemas.js`'s text helpers (`trimText`, `singleLineText`, blank/control/direction rules, normalize for comparison) move to `server/utils/textRules.js`, with `normalizeText` = remove invisible characters, lowercase, NFC. `pollSchemas.js` imports them; its behavior is unchanged.
- **Rules:** `server/utils/participantRules.js` holds `NICKNAME_MAX_LENGTH = 20`, and `INVITE_CODE_PATTERN` goes in `pollRules.js`.
- **Schemas:** `server/utils/inviteSchemas.js` has `inviteCodeParams` and `joinBody`.
- **Errors:** `httpErrors.js` adds `ConflictError` (409) and `NicknameTakenError`. Missing invites reuse `PollNotFoundError`.
- **`services/pollService.js`:** `toPollDto` adds `inviteCode`. If `createPoll` hits `polls_invite_code_key` (practically never), it retries the transaction, up to 3 attempts.
- **`services/inviteService.js`:**
  - `getInvite({ inviteCode })`: finds the poll by `invite_code` with explicit attributes and `count` of options. Returns the invite DTO, or throws `PollNotFoundError`.
  - `joinPoll({ inviteCode, nickname, joinKey })`:
    1. Look up the poll id by code, or 404.
    2. If a participant exists for (poll, joinKey), return `{ nickname: original, created: false }`.
    3. Insert with `nicknameKey = normalizeText(nickname)`. This is a single insert, so no transaction.
    4. On `UniqueConstraintError`, look up by (poll, joinKey) **again first**. If found, return it (`created: false`): a concurrent replay, so a retry is never told "taken". Otherwise, if the constraint is the nickname one, throw `NicknameTakenError`; anything else is rethrown.
- **`controllers/inviteController.js`** (thin): `show` → 200; `join` → 201 or 200.
- **Routes:** `routes/invites.js` has router-level `X-Robots-Tag` middleware, `GET /:inviteCode` and `POST /:inviteCode/participants`, each with validate(params, 404) then validate(body). `routes/index.js` mounts `/invites`.
- Closed polls are **not** blocked from joining (the spec defers this to Close poll).

### Frontend
**Routes (`App.jsx`, `utils/routes.js`):**
- `/i/:inviteCode` → `InvitePage`. React Router already matches a trailing slash and ignores query strings.
- `/i` and `/i/*` → `InviteLinkBrokenPage`.
- `invitePath(code)` uses `encodeURIComponent`.

**Utils:**
- `uiCopy.js` gains `share`, `invite`, `join`, `joined`, `inviteLink` sections, word for word from the spec. `{n} options` and `You're in, {nickname}` are template functions or parts.
- `iconPaths.js` adds `link`, `copy`, `share`, `home`, `brokenLink`, `list`: Lucide-style geometry on a 24px grid, hand-authored, not copied from the preview.
- `inviteLink.js`: `buildInviteLink(code)` = `window.location.origin` + `invitePath(code)`. No new env var.
- `joinedPolls.js`: localStorage key `polls.joins` → `{ [inviteCode]: { joinKey, nickname? } }`. Provides `getJoin`, `getOrCreateJoinKey`, `saveJoin`. Every access is wrapped in try/catch; if storage is blocked it falls back to in-memory for the page's lifetime.
- `nicknameRules.js`: `isBlankNickname` reuses the `BLANK` rule from `pollValidation`, moved into `textRules.js`.

**Services:** `inviteService.js` provides `getInvite(code)` and `joinPoll(code, { nickname, joinKey })`.

**Hooks:**
- `useInvite(code)` → `{ data, loading, error, reload }`. `reload` powers "Try again", and late responses are ignored.
- `useJoinPoll(code)`:
  - State: `nickname`, `error` (`'empty'` | `'taken'` | null), `joining`, `joinFailed`, and `joinedNickname` (initially read from storage).
  - Submit:
    1. A ref guard blocks re-entry.
    2. Blank → `'empty'`.
    3. **Reads storage fresh.** If this device has already joined (another tab), switch to joined with the stored nickname and send no request.
    4. Otherwise get or create `joinKey`, POST, then `saveJoin` and show joined.
    5. A 409 sets `'taken'`; any other failure sets `joinFailed`.
  - The empty error clears once the field is non-blank; the taken error clears on any change.

**Components (catalog):**
- **New:**
  - `Sheet`: scrim, mobile handle, focus trap over all focusable elements, Escape and scrim tap call `onClose`, focus returns to the opener, body scroll lock, content scrolls inside, role and labels from props.
  - `ShareInviteModal`
  - `StickerHeading`
  - `NicknameField`: large `TextInput`, `maxLength` 20, help text, `autocomplete="nickname"`, `enterkeyhint="go"`, Enter → `form.requestSubmit()`.
  - `EmptyState`
- **Changed:**
  - `ConfirmDialog` now builds on `Sheet`; existing tests unchanged.
  - `Button`: `success` prop.
  - `TextInput`: `helpText` between the label and the field; `aria-describedby` order is error, help, counter; pass-through `autoComplete`, `enterKeyHint`, `onEnter`.
  - `Alert`: `title` + `body`.
  - `NavBar`: `variant="minimal"`, the same as today until Register ships. `PageLayout` gets a `navVariant` prop.
  - `PollSummary`: `variant="invite"` (StatusBadge + list icon + "{n} options"), `bubble` tail, `useId` for the heading id because the invite DTO has no id.
  - `Skeleton`: `sticker` shape.

**`ShareInviteModal` behavior:**
- `role="dialog"`, labelled by the title and described by the body. Initial focus on Copy.
- Link box: `role="group"`, `aria-label="Invite link"`, text wraps, `select-all`.
- Copy:
  1. `navigator.clipboard.writeText`
  2. If that fails, `execCommand('copy')` on a selection of the link text
  3. If that fails, the error (`role="alert"`) plus the link text selected, and the button stays "Copy"
- On success: "Copied" in the Button success state for 2s; each tap restarts the timer. A polite live region announces "Link copied".
- "Share link" is rendered only when `typeof navigator.share === 'function'`. It calls `share({ text: 'Answer my poll here: ' + link })`. AbortError and any other rejection are ignored and the sheet stays open.
- Done, Close, Escape and scrim all close the sheet.

**Pages:**
- `PollCreatedPage`:
  - Success: `PollSummary` default, then "Back to home" as a ghost sm button with the home icon.
  - Bottom bar: "Create another poll" (secondary), "Share poll" (primary, share icon) → `ShareInviteModal`.
  - Loading and error are unchanged, with no Share poll button.
- `InvitePage`: renders React 19 `<meta name="robots" content="noindex" />`, which React hoists into `<head>`, in every state. Then:
  - Loading → the loading screen.
  - 404 → `InviteLinkBrokenPage` content.
  - Other error → load failed.
  - Joined → the joined screen.
  - Otherwise → the invite form.
- `InviteLinkBrokenPage`: `NavBar` minimal + `EmptyState` (broken link icon, h1, body) + noindex meta. Used by both routes and `InvitePage`, so the page is identical for every non-working link.

**UI states → components:**
| State | Built from |
|-------|-----------|
| Loading | `role="status"` h1 "Loading poll…" + `aria-busy` `Skeleton` (sticker; poll card: line + two titles; nickname card: line + row) |
| Invite | `StickerHeading` h1, `PollSummary` invite+bubble, `NicknameField`, bottom bar "Join poll" |
| Joining | `Button loading` "Joining…", field read-only |
| Field errors | `TextInput` error; focus moves to the field |
| Join failed | `Alert` at the end of `<main>`, above the bottom bar |
| Joined | `SuccessMark`, h1 "You're in, <bdi>{nickname}</bdi>", `PollSummary` invite+bubble, no bottom bar |
| Link doesn't work | `EmptyState` |
| Load failed | `Alert` title (h1) + body, then "Try again" primary (block on mobile) |

### Security
- **Link as key:** 10 base62 characters from the DB's strong RNG, unbiased, about 59.5 bits. Codes don't come from the poll ID or creation order. The invite DTO omits the id, creator and options.
- **Existence not revealed:** malformed, wrong-case, cut-off and missing codes all get the same 404 body and headers (tested for equality). On the client, `/i`, `/i/*` and any 404 render the same `InviteLinkBrokenPage`.
- **Share sheet creator-only:** `inviteCode` is only in the creator-scoped DTO (`requireUser` + `creator_id` filter), and another user's confirmation screen still gets 404, so there's no sheet.
- **Nickname taken** reveals only that the name is in use in that poll (accepted in the spec).
- **Device memory:** stores only the invite code, nickname and a random `joinKey` (no personal data), under the captain's 2026-09-15 decision.
- **Search engines:** noindex meta on invite pages, and `X-Robots-Tag: noindex` on invite API responses.
- **Plain text:** React escaping only. No `dangerouslySetInnerHTML`. The nickname is wrapped in `<bdi>` with `dir="auto"`, and tests use `<script>` / `<b>` strings.
- **Input hardening:** strict Zod rejects unknown keys, the 20kb body limit and helmet are unchanged, and nicknames are rejected if they contain direction overrides or control characters.

### Edge Cases
| Edge case | How it's handled |
|-----------|------------------|
| Wrong case, made-up, mistyped or cut-off code | 404 → same page. `/i` with no code → same page. |
| Tracking params or trailing slash | Router match ignores the query and a trailing slash. Tested. |
| Registered user or creator opens the link | Public route, nothing prefilled. |
| Same device returns (reload, new tab, another day) | Stored nickname → joined screen after the invite loads; no POST. |
| Two tabs | Submit reads storage fresh; the server `joinKey` replay returns the first nickname. |
| Double click / repeated Enter | Ref guard + locked button; server unique `join_key`. |
| Lost response, then retry | Same `joinKey` → 200 with the original nickname, never 409. |
| Same nickname at the same moment | UNIQUE (`poll_id`, `nickname_key`) → exactly one insert; the other gets 409. Tested with parallel requests. |
| "Noa" / " noa" / "NOA" / invisible variants | Zod trim + `normalizeText` key. |
| Blank or invisible-only nickname | Client `isBlank` → "Enter a nickname."; Zod rejects it too. |
| Line breaks, tabs, control or direction characters | `TextInput` cleaning (`cleanText` + `toSingleLine`) removes them as typed or pasted. |
| Paste over 20 characters | Native `maxLength` cuts it; counter shows 20/20. |
| Long question/details, long nickname, long link at 360px | `break-words` / `whitespace-pre-wrap`; `<bdi>`; the link wraps with `break-all`. |
| Copy tapped repeatedly | Copies each time; the 2s timer restarts. |
| No Web Share support | "Share link" not rendered. |
| Share cancelled | Rejection ignored. |
| Network or server failure | Load failed with "Try again", or join failed with the nickname kept. |
| Storage blocked | In-memory fallback: the join works but isn't remembered after reload. |
| Existing polls | Migration backfill. Tested: a row inserted without a code gets one. |

### Tests
- **Unit (Jest, server):**
  - `textRules`: moved `pollSchemas` cases still pass, plus `normalizeText`.
  - `inviteSchemas`: code pattern (length, characters, case kept); nickname trim, 20 UTF-16 limit, blank or invisible-only, line breaks, tab, control, direction override, emoji + RTL accepted, unknown keys, bad UUID.
  - Model tests:
    - Polls: `generate_invite_code()` returns 10 base62 characters, distinct across 1,000 calls. The DB rejects a malformed or duplicate code, and codes that differ only in case are both allowed. A raw insert gets a code.
    - Participants: nickname key unique per poll, same key allowed in another poll, join key unique per poll, cascade on poll delete.
  - `inviteService`:
    - Invite DTO has exactly its fields; missing code → 404.
    - Join creates a participant with the trimmed nickname and key.
    - Replay returns the original nickname.
    - Case, space and invisible variants → taken.
    - Same nickname in two polls → OK.
    - 5 concurrent joins, same nickname, different keys → exactly 1 created, 4 taken.
    - 5 concurrent joins, same key → exactly 1 participant, none taken.
  - `pollService`: DTO includes `inviteCode`; it's the same on GET after reload; invite-code collision retries.
- **API integration (Supertest):**
  - GET invite:
    - 200 shape, with no `id` / `creatorId` / `options` / `inviteCode` / `answerType`.
    - 404 for missing, wrong-case, cut-off and malformed codes, each with a deep-equal body and the same relevant headers.
    - Works when there's no test user (public).
    - `X-Robots-Tag` header present.
  - POST participants:
    - 201 new; 200 replay with the original nickname.
    - 409 taken, including a variant.
    - 400 for each validation rule; 404 bad code; 413 oversize.
    - Parallel same nickname → one saved.
    - Public (no test user).
  - Polls: `inviteCode` in POST and GET responses. Existing 401/404 tests unchanged.
  - 403 doesn't apply: no roles, and invite routes are public by spec.
- **Unit (Jest + RTL, client):**
  - Utils: `joinedPolls` (storage blocked, get-or-create stable key), `inviteLink`, routes.
  - Services: `inviteService` (encodes the code).
  - Hooks:
    - `useInvite`: reload, late response ignored.
    - `useJoinPoll`: double submit → 1 request; taken; failure keeps the nickname; stored join → no request; saves on success; error clearing rules.
  - Components:
    - `Sheet`: focus trap, Escape, scrim, focus return, scroll lock.
    - `ConfirmDialog`: existing tests.
    - `ShareInviteModal`, with fake timers and mocked clipboard/share:
      - "Copied" for 2s, and the timer restarts on each tap.
      - Live region announces "Link copied".
      - `execCommand` fallback; if blocked, error + selection.
      - Share hidden/shown; share text exact; AbortError → no error.
      - Done/Close/Escape/scrim close it.
    - `NicknameField`: aria order, attributes, Enter submits, cut at 20.
    - `Button` success; `TextInput` help text; `Alert` title/body; `PollSummary` invite (no options or answer type, plain text); `StickerHeading`; `EmptyState`; `Skeleton` sticker.
  - Pages:
    - `PollCreatedPage`: Share poll only in success; opens the sheet with the link; ghost Back to home.
    - `InvitePage`: every UI state and copy; focus on errors; Try again refetches; remembered join; markup as plain text; robots meta.
    - `App`: `/i/CODE/`, `/i/CODE?utm_source=x`, `/i`, `/i/a/b`.
- **E2E (Playwright):** owned by /qa.
- **Verification at each checkpoint:**
  - `npm test` in `server/` and `client/`.
  - `npm run db:migrate:undo` ×2, then `db:migrate`: up/down/up on the dev DB, checking backfill on existing polls.
  - At Checkpoint 2, a manual walkthrough with the preview tools at 360px and desktop: create → share sheet (copy, Done focus return) → open link in a new tab → join → reload → joined; bad link; API stopped → load failed and join failed.

### Tasks
Branch: fast-forward the existing local `feature/2026-09-15-share-and-join-poll` (already merged, 0 commits ahead) to `main`, then commit there. Never pushed.

Backend
1. `refactor:` move shared text rules from `pollSchemas.js` to `textRules.js` (`normalizeText`, `BLANK`), with tests.
2. `feat:` invite code migration (function, backfill, constraints), `Poll.inviteCode`, poll DTO `inviteCode`, collision retry, with model/service/API tests.
3. `feat:` participants migration, `Participant` model and associations, factory, constraint tests.
4. `feat:` invite schemas, `ConflictError` / `NicknameTakenError`, `inviteService` (`getInvite`, `joinPoll`), with tests.
5. `feat:` invite controller + routes + `X-Robots-Tag`, Supertest tests. → **Checkpoint 1** (full server suite + migrations up/down/up).

Frontend
6. `feat:` uiCopy, routes, iconPaths, `inviteService`, `joinedPolls`, `inviteLink`, with tests.
7. `refactor:` `Sheet` pulled out of `ConfirmDialog`, with tests.
8. `feat:` `Button` success, `TextInput` help text, `Alert` title/body, `NavBar` minimal + `PageLayout` prop, `PollSummary` invite + bubble, `Skeleton` sticker, with tests.
9. `feat:` `ShareInviteModal` + `PollCreatedPage` share changes, with tests.
10. `feat:` `StickerHeading`, `NicknameField`, `EmptyState`, with tests.
11. `feat:` `useInvite`, `useJoinPoll`, with tests.
12. `feat:` `InvitePage`, `InviteLinkBrokenPage`, App routes, noindex, with tests. → **Checkpoint 2** → captain's `/design` UI review → fixes → acceptance criteria self-check → handoff.

### Decisions
Captain, 2026-09-15:
- **Link code:** DB default `generate_invite_code()`, 10 base62 characters, unbiased, from `gen_random_uuid()`. Link format `/i/{code}`, matching the preview.
- **Remember join / idempotency:** localStorage `{ joinKey, nickname }` per invite code. The server's unique (poll, join_key) replay returns the original participant.
- **Nickname uniqueness:** `nickname_key` column (invisible characters removed, lowercase, NFC) + UNIQUE (poll_id, nickname_key); a violation → 409.
- **Web Share / copy:** `share({ text })` only; hidden when unsupported; rejections ignored. Copy uses the Clipboard API, then `execCommand`, then error + select.

Dev proposals, approved with this plan:
- Invite API under public `/api/invites/:inviteCode`; taken → 409.
- The client builds the link from `window.location.origin`, so no new env var.
- Missing invites reuse the "Poll not found" 404.
- Noindex via React 19 `<meta>` + `X-Robots-Tag`.
- Joined screen trusts device memory without a server check.
- Closed polls are not blocked from joining (deferred to Close poll).
- No new npm packages.

During Checkpoint 1 (2026-09-15):
- **QA test conflict (captain):** `server/tests/qa/createPoll.test.js` ("success responses expose only the poll fields") locks the creator's poll to 7 keys, so adding `inviteCode` fails it. The plan stays as it is, and `/qa` adds `inviteCode` to that key list. Until then, this is the only failing server test.
- **Dev, no flag needed:**
  - Any other path under `/api/invites` (no code, extra path segments) also returns the "Poll not found" 404, so API responses stay identical for every non-working link.
  - `X-Robots-Tag` is set by `server/middleware/noIndex.js` at router level, so error responses carry it too.
  - Unicode escapes: source files write invisible, separator, control and combining characters as `\u` escapes, never raw (fix commit `b1622ee`).
  - A right-to-left mark at the edge of a nickname is trimmed like any invisible character, the same as in Create poll. Inside the text it is kept.

During Checkpoint 2 (2026-09-15):
- **Focus after joining (captain):** after a join from the form, focus moves to the "You're in, {nickname}" heading, because the form is removed. Not moved when the joined screen is shown on load.
- **"Try again" width (captain):** block on mobile; from `md`, auto width and left-aligned under the alert.
- **Dev, no flag needed:**
  - `Sheet`: a press that starts inside the sheet and ends on the scrim (e.g. selecting the link text) does not close it.
  - `joinedPolls`: stored entries without a valid UUID `joinKey` are ignored; invite codes are plain keys (no prototype lookups); if a storage write fails, the entry is kept in memory for the page.
  - `TextInput`: Enter that confirms an input method composition does not call `onEnter`.
  - Copy fallback chain lives in `client/src/utils/clipboard.js`; nickname error codes are `NICKNAME_ERROR` in `nicknameRules.js`.
  - Tailwind additions (catalog geometry, no new tokens): `rotate-45` for the bubble tail, `empty-state-icon` size (`--space-12` × 2).
  - Test hooks: `data-icon` on `Button` icons, `data-shape` on `Skeleton`, `data-variant` on `NavBar`.
  - Walkthrough (360px and desktop) passed every step: create, share sheet, copy, Done/Escape focus return, join, reload, bad links, tracking parameters, taken nickname, API stopped (join failed, load failed, Try again), two tabs.

### Risks & Open Questions
- **No rate limiting** on the public invite endpoints (code guessing, nickname spam). 59.5 bits makes guessing impractical; a limiter would be a new dependency (e.g. `express-rate-limit`) and is proposed for later.
- **Stale device memory:** if the participant row is gone (DB reset, poll deleted), the joined screen still shows while the poll loads. A deleted poll shows "This link doesn't work".
- **Tabs submitting within the same millisecond** could each create a `joinKey` before either writes storage, making two participants. This isn't realistic for a person; accepted.
- **Deploy (Render):** the static site needs an SPA rewrite so `/i/*` serves `index.html`.
- **`joinKey` as a future credential:** it will likely become the participant credential for Answer poll. It lives in localStorage, readable by same-origin JS (React escaping mitigates XSS).
- **Invite code change without a page load:** `useJoinPoll` reads device memory once per mount, so its state would not reset if `/i/A` changed to `/i/B` inside the app. Nothing in the app navigates between invite links, so this cannot happen today.
- **A tab opened before a join in another tab** keeps showing the form until its next submit, which then shows the stored nickname without a request.
- **For `/design`** (dev does not edit the catalog): none so far.

### Handoff Notes
- **Branch:** `feature/2026-09-15-share-and-join-poll` (local, not pushed). Captain's `/design` UI review on 2026-09-15 reported no violations.
- **How to run:**
  - `server/.env` exists. `client/.env` does not: copy `client/.env.example` to `client/.env` (`VITE_API_URL=http://localhost:3000/api`).
  - No new env vars in this feature.
  - `server/`: `npm install`, `npm run db:migrate` (adds `polls.invite_code` with backfill and the `participants` table), `npm run db:migrate:test`, `npm run db:seed` (fixed test user), `npm run dev` (port 3000).
  - `client/`: `npm install`, `npm run dev` (port 5173).
  - Tests: `npm test` in `server/` and `client/`.
- **Test results at hand off:**
  - Client: 331 of 331 pass (35 suites).
  - Server: 330 of 331 pass. The only failure is `server/tests/qa/createPoll.test.js` › "success responses expose only the poll fields, never creator or request ids". The poll DTO now includes `inviteCode`, and `/qa` adds it to that key list (Checkpoint 1 decision).
  - The production Vite build passes.
- **What to test first:**
  - Create a poll, then "Share poll": Copy ("Copied" for 2 seconds), Done/Escape/scrim with focus return, and the same link after a reload.
  - Open the link in a new tab, join, reload, then join again in a second tab that still shows the form.
  - Bad links: wrong case, cut off, made up, `/i`, `/i/a/b`. All must look identical in the UI and in the API (`GET /api/invites/:inviteCode` 404 body and headers).
  - Nickname uniqueness through the API: case, surrounding spaces, invisible characters, and parallel joins with the same nickname or the same `joinKey`.
  - Stop the API during load and during join to see the load-failed and join-failed states.
- **Endpoints:** `GET /api/invites/:inviteCode` and `POST /api/invites/:inviteCode/participants` with body `{ nickname, joinKey }`. Both are public (no test user needed) and send `X-Robots-Tag: noindex`. POST returns 201 on a new join, 200 on a `joinKey` replay (original nickname), 409 for a taken nickname, 400 for validation, 404 for a code that opens no poll, and 413 for an oversized body.
- **Known limitations** (see Risks & Open Questions):
  - No rate limiting on the public invite endpoints.
  - Stale device memory: the joined screen trusts localStorage without a server check.
  - An invite code change inside the app without a page load would not reset `useJoinPoll` (nothing navigates between invite links today).
  - A tab opened before a join in another tab shows the form until its next submit.
  - Deploy: Render's static site needs an SPA rewrite so `/i/*` serves `index.html`.
  - The QA key-list test above fails until `/qa` adds `inviteCode`.
  - Closed polls are not blocked from joining (deferred to Close poll).

---

## QA Report

**QA status:** Passed
**Author:** /qa
**Round:** 1
**Last updated:** 2026-09-15

### Test Strategy
**Risk areas (highest first):**
1. **Nickname uniqueness bypass:** two participants in one poll whose nicknames look the same (Unicode normalization, invisible characters inside the text, other space characters, letters that change length when lowercased), or a nickname that looks blank but is saved.
2. **Duplicate or lost participants under concurrency:** mixed parallel joins (case and invisible variants of one nickname, one join key sent with different nicknames, many distinct nicknames at once), double submit, a retry after a lost response, and two tabs.
3. **Existence leaks through links:** any response difference (status, body, headers) between non-working links, on both invite routes and in the UI. Also a malformed, huge, or injected code causing a 500.
4. **Data leaks:** the invite and join responses, and the creator's poll, must never expose participants, poll ID, creator, options, join keys, or internals.
5. **Every acceptance criterion in a real browser**, at desktop and 360px: share sheet, copy, device share, invite page, join, and joined screen.
6. **UI states under failure:** a slow load, a 500, an aborted request, and a lost response, for loading the invite and for joining.
7. **Device memory:** reload, new tab, two tabs, a new browser profile, blocked storage, and a poll deleted after joining.
8. **Stored XSS** in the question, details and nickname.
9. **Accessibility and responsiveness:**
   - Keyboard-only share and join, with the sheet's focus trap and focus return.
   - Touch targets, 360px layout with the longest content, 200% text size, and reduced motion.
   - Automated WCAG 2.2 AA scans.

| Area / Case | Layer | Why this layer |
|-------------|-------|----------------|
| Nickname look-alikes: NFC forms, soft hyphen and word joiner inside the text, NBSP and ideographic spaces, lowercase-expanding letters | Supertest (`server/tests/qa/shareAndJoinPoll.test.js`) | Uniqueness is decided by the API and the database; assertions query the DB. |
| Blank-looking nicknames: Hangul filler, NBSP-only, ideographic-space-only, soft hyphen only | Supertest | Same. |
| UTF-16 limit with emoji, a surrogate pair cut at 21; letters that expand when lowercased or normalized (20 × İ, 20 × U+FB2C, 10 × U+1D160) return 201 or 400, never 500 | Supertest | Boundary of the 20-unit column and the 80-unit key column. |
| Types and mass assignment: nickname null, number, array or object; extra `id`, `nicknameKey`, `pollId`, `createdAt`, `__proto__`; text/plain, form-encoded or malformed JSON bodies; null byte, control characters and lone surrogates sent as JSON escapes | Supertest | Fully visible at the API; DB unchanged after each request. |
| Code handling: a 5,000-character code, `%00`, full-width look-alike, `%20`, SQL-like text, percent-encoded path. Both routes must return identical status, body and relevant headers, and never a 500 | Supertest | Byte-level response comparison. |
| Concurrency: variants of one nickname in parallel (one saved); one join key with different nicknames in parallel (one participant, every response has the same nickname); 10 distinct nicknames in parallel (10 saved); the same nickname in two polls in parallel | Supertest | `Promise.all` against the real DB. |
| Leaks: POST returns only `nickname`; a 409 reveals nothing; GET invite never includes participants; the creator's `GET /api/polls/:id` has no participants; no internals in errors; `X-Robots-Tag` on 400, 404, 409 and 413 | Supertest | Response bodies and headers. |
| Lifecycle: a raw-inserted poll (pre-feature shape) can be opened and joined; the invite code is stable across the creator's GETs; a deleted poll returns 404 on both routes and its participants are gone | Supertest | DB state. |
| Share: Share poll only after the poll loads (not on a slow load or load error); exact sheet copy; link is origin + `/i/` + 10 base62 characters with no poll ID; Copy writes the clipboard, shows "Copied" for about 2 seconds and fills the live region; blocked copy shows the error and selects the link; Share link hidden or shown by support, with exact share text; AbortError shows no error; Done, Close, Escape and scrim close the sheet and return focus; same link after reopening and reloading; another user's poll has no Share poll; a long link wraps at 360px | Playwright (`e2e/shareAndJoinPoll.spec.js`), projects `chromium-desktop` and `mobile-360` | Needs a real browser; clipboard and Web Share are stubbed where the browser can't grant them. |
| Open link: loading state (delayed route); exact invite content; no option text, poll ID or creator username in the DOM; every broken link (wrong case, cut off, made up, `/i`, `/i/`, `/i/a/b`, code plus segment) shows identical visible text and no form; tracking parameters, trailing slash and fragment open the poll; load failure (500 and abort) and Try again recovers; robots meta in every state; poll deleted after joining shows the broken-link page | Playwright, both projects | Same. |
| Join: exact field copy, placeholder, help text and counter; typed and pasted text cut at 20 (with emoji); empty, spaces-only and invisible-only errors with focus and no request; taken error (including variants, seeded through the API) keeps the text, moves focus and clears on change; "Joining…" with the form locked; double click and repeated Enter save one participant (DB); join failure (500 and abort) shows the alert above the button, keeps the nickname and a retry saves one participant; a lost response and retry shows the joined screen with no taken error and one participant; joined screen content and focus on its heading; reload and new tab show the joined screen with no request; two tabs both on the form save one participant and show the first nickname; a new browser profile is a new participant and the earlier nickname is taken; the same nickname in two polls; the creator joins their own poll with an empty field; blocked storage still allows joining on the page; markup and script in question, details and nickname render as text | Playwright, both projects | Same; DB checks through `e2e/helpers/db.js`. |
| Keyboard-only share and join; axe scans (share sheet, invite form, field errors, join error, joined screen, broken link, load error); 44px touch targets on new controls; no horizontal scroll at 360px with a 200-character question, 1,000 characters of details and a 20-character emoji and RTL nickname; 200% text size on the invite page; reduced motion on the sheet | Playwright, both projects | Same. |

**Not tested (and why):**
- **Token and JWT attacks:** there is no authentication yet, and invite routes are public by spec. Guest access to creator routes is already covered by the Create poll QA tests.
- **Rate limiting, code brute force, timing side channels:** no limiter exists (known risk in the plan). Code randomness and alphabet are covered by dev's model tests.
- **Real device share sheet and real phone clipboard:** Web Share is stubbed. The clipboard is read back in Chromium only; the captain checks on a phone by hand.
- **Firefox and WebKit:** the required projects are Chromium only.
- **Migration backfill on existing rows:** dev ran up, down, up at Checkpoint 1. Running down migrations inside the suite would wipe the test database. QA instead proves that a raw-inserted poll works through the API.
- **Forced 500 on the invite API:** it can't be forced without mocking the database. The client's 500 handling is covered with `page.route`.
- **Render SPA rewrite for `/i/*`:** deploy configuration. Locally, `vite preview` serves the route.
- **Compatibility forms and full case folding** (full-width letters, ß and SS): out of scope, same as the captain's Create poll answer.
- **Closed polls, answering, results, participant list:** out of scope.
- **Browser Back after joining:** the spec doesn't define it, so it is observed and reported only.
- **Invite code change without a page load, tabs submitting in the same millisecond:** accepted risks in the plan. The tab opened before a join in another tab is tested.

**Questions for the captain:**
- **A nickname of only Braille blank characters (U+2800)?** Accepted for MVP, consistent with Create poll (2026-09-15).
- **Test strategy:** approved (2026-09-15).

### Dev Test Audit
| Test file / area | Finding | Action (sent to dev / none) |
|------------------|---------|-----------------------------|
| `PollCreatedPage`, `ShareInviteModal`, `Sheet`, `StickerHeading`, `EmptyState`, `Button`, `PollSummary`, `InvitePage` tests | Assert CSS class names (`bg-action`, `bg-success`, `break-all`, `rotate-tilt-sm`, `mt-2`…) and test hooks (`data-shape`, `data-icon`, `data-variant`). These are implementation details: a real visual regression would still pass. Same pattern as Create poll round 1. | Sent to dev (minor): replace with behavior assertions. QA proves the visible result in E2E ("Copied" state, wrapping, layout). |
| `server/tests/api/invites.test.js`, "the same nickname can join another poll" | Status-only assertion; it doesn't check the body or that both participants exist. | Sent to dev (minor). |
| `server/tests/api/invites.test.js`, POST 404 and error responses | POST 404 variants compare bodies but not headers, and `X-Robots-Tag` isn't checked on POST errors. | None: adversarial coverage, added by QA. |
| `server/tests/api/invites.test.js`, routes overall | Real database, body and DB assertions, parallel joins, identical GET 404s including headers; public access tested without a user. 401 and 403 don't apply (public by spec). The env restore now deletes an unset variable (Create poll round 1 finding fixed). | None. |
| `inviteService`, `poll` and `participant` model tests | Concurrency is asserted by DB counts; code format, uniqueness, case sensitivity and full alphabet use are covered; DB constraints are tested directly. | None. |
| `joinedPolls`, `useInvite`, `useJoinPoll`, `clipboard` tests | Cover blocked and damaged storage, prototype-named keys, late responses, the retry key, and the full copy fallback chain. They fail when the guarded code breaks. | None. |
| Client page tests | Mock the service layer, which is acceptable for unit tests; E2E covers the real API. | None. |

### Tests Added
- **Existing QA test updated:** `server/tests/qa/createPoll.test.js`, the response key list now includes `inviteCode` (captain decision at Checkpoint 1).
- **Integration (Supertest):** `server/tests/qa/shareAndJoinPoll.test.js`, 96 cases.
  - Nickname look-alikes: NFC, soft hyphen, word joiner, BOM, Hangul filler, no-break and ideographic spaces, RTL mark at the edge, dotted capital I, Hebrew presentation form.
  - Blank-looking and invalid nicknames: Braille blank accepted per the captain; UTF-16 limit with emoji; letters that grow when lowercased or normalized.
  - Types, extra fields, `__proto__`, and body formats.
  - Links that open no poll, on both routes, with identical status, body and headers.
  - Concurrency, response leaks, `X-Robots-Tag`, and invite code lifecycle (raw-inserted poll, stable code, deleted poll).
  - 2 regression cases for BUG-01, marked `test.failing`.
- **E2E (Playwright):** `e2e/shareAndJoinPoll.spec.js`, run in `chromium-desktop` and `mobile-360`.
  - Share sheet: copy, blocked copy, device share, closing, same link.
  - Opening links: loading, content, no leaks, identical broken-link page, tracking parameters, load failures, noindex, deleted poll.
  - Joining: field, empty and taken errors, lock, failures, lost response, joined screen, reload, new tab, two tabs, another browser, two polls, creator, blocked storage, XSS.
  - Keyboard, 44px targets, axe WCAG 2.2 AA, longest content, 200% text, reduced motion.
  - New helper: `e2e/helpers/participants.js`.
- **Test infrastructure fix:** `e2e/playwright.config.js` builds the client with `NODE_ENV=production`.
  - `helpers/env.js` loads `server/.env` (`NODE_ENV=development`) into the Playwright process, so the E2E client had been a development React build that runs every effect twice.
  - Every page load sent two identical API requests, which broke tests that fail or delay "the first" request.
  - The config's stated intent is "same bundle users get". No app code changed.
- **Notes:**
  - Body-parser rejections (malformed JSON, 413) carry no `X-Robots-Tag`. They answer POST requests, which aren't crawled, and the spec only asks that invite pages not be listed, so this is not a bug.
  - A broken percent-encoded invite path in the browser is answered by the static server before the app loads (`vite preview` returns its own 404). The page there depends on the host (Render rewrite), so it isn't in E2E; the API behavior is BUG-01.

### Bugs
| ID | Severity | Title | Steps to reproduce | Expected (spec) | Actual | Regression test | Status (Open / Fixed / Verified) |
|----|----------|-------|--------------------|-----------------|--------|-----------------|----------------------------------|
| BUG-01 | Minor | Broken percent-encoding in an invite code returns 500 instead of the "Poll not found" 404 | `GET /api/invites/q7Kx2Wm%E0%A4%A`, or `POST` to `/api/invites/q7Kx2Wm%E0%A4%A/participants` with a valid body. | The same 404 "Poll not found" as any code that opens no poll (approved plan: "404 for missing, wrong-case, cut-off and malformed codes"; CLAUDE.md: semantically correct status codes). | 500 "Something went wrong", logged as an unhandled error. Express's router throws a `URIError` carrying status 400 while decoding the parameter, and `errorHandler` turns any non-`AppError` into a 500. The same happens on `/api/polls/:pollId` (pre-existing). No poll data or existence is revealed, and the app never sends such a request (codes are encoded before calling the API). | `server/tests/qa/shareAndJoinPoll.test.js` BUG-01 (2 cases, `test.failing`) | Open |

Severity note: rated Minor because it can't be reached from the app, reveals nothing, and the body is generic. The severity table's Major examples include "wrong status code", so the captain may raise it to Major, which would send the feature back to dev. The captain did not raise it, so it stays Minor (2026-09-15).

### Acceptance Criteria
"API" tests are in `server/tests/qa/shareAndJoinPoll.test.js`. "E2E" tests are in `e2e/shareAndJoinPoll.spec.js` and pass in `chromium-desktop` and `mobile-360`.

| # | Criterion | Result | Proven by (test) |
|---|-----------|--------|------------------|
| 1 | Every poll has exactly one invite link, and it never changes. | Pass | API: the creator's invite code is the same when creating, on every later load, and it opens that poll. E2E: opening the share sheet again, and after a reload, shows the same link. Dev: invite codes are unique. |
| 2 | The link is the app's address plus a short random code, without the poll ID. | Pass | E2E: the share sheet shows … the full invite link without the poll id. API: the same stable-code test (10 base62 characters, no poll ID). |
| 3 | "Share poll" is the main action once loaded, with "Back to home" and "Create another poll" as secondary actions. | Pass | E2E: Share poll is the main action once the poll loads … |
| 4 | "Share poll" is not shown while loading or on the load error. | Pass | E2E: same test (delayed load, missing poll) |
| 5 | "Share poll" opens the sheet with its title, body, full link, "Copy" and "Done". | Pass | E2E: the share sheet shows the title, body, the full invite link … |
| 6 | "Copy" copies the link, shows "Copied" for 2 seconds, and announces "Link copied". | Pass | E2E: Copy puts the invite link on the clipboard …; Copied shows for 2 seconds after the last tap (fake clock) |
| 7 | If copying is blocked, the copy error is shown and the link text is selected. | Pass | E2E: when copying is blocked, the copy error is shown under the link and the link text is selected |
| 8 | "Share link" is shown only when sharing is supported, with "Answer my poll here:" plus the link. | Pass | E2E: Share link opens the device share options with the spec text …; the share sheet shows … (hidden when unsupported) |
| 9 | Canceling the device share options shows no error and keeps the sheet open. | Pass | E2E: same Share link test (AbortError) |
| 10 | "Done", Close, Escape and a tap outside close the sheet, and focus returns to "Share poll". | Pass | E2E: Done, the close button, Escape and a tap outside close the sheet … |
| 11 | Opening the sheet again, or after a reload, shows the same link. | Pass | E2E: opening the share sheet again, and after a reload, shows the same link |
| 12 | Another user's confirmation screen shows the load error and no share sheet. | Pass | E2E: Share poll is the main action … or for another user's poll |
| 13 | Polls created before this feature have a working invite link. | Pass | API: a poll inserted without an invite code, as polls were before this feature, gets a working link. Dev checked the migration backfill at Checkpoint 1. |
| 14 | A valid link on a device that hasn't joined shows loading, then the invite with the nickname field and "Join poll". | Pass | E2E: a device that has not joined sees Loading poll…, then You're invited … |
| 15 | The invite and joined screens show no options, results, other nicknames, creator username or poll ID. | Pass | E2E: the invite page and the joined screen never show answer options …. API: the invite never includes participants; responses never leak. |
| 16 | A wrong, made-up, cut-off or differently-cased code shows "This link doesn't work" with no content or form. | Pass | E2E: every link that doesn't work shows the identical page …. API: links that open no poll (GET and POST). |
| 17 | Every non-working link shows an identical page. | Pass | E2E: same test (identical page text, title, noindex). API: identical status, body and headers. The API returns 500 for broken percent-encoding (BUG-01, Minor); it reveals nothing and the app can't send it. |
| 18 | A link with extra parameters or a trailing slash opens the right poll. | Pass | E2E: a link with tracking parameters, a trailing slash, or a fragment opens the right poll |
| 19 | If the poll fails to load, the load error and "Try again" are shown, and "Try again" loads the poll. | Pass | E2E: after a server error / a network failure while loading … |
| 20 | Invite pages are marked so search engines don't list them. | Pass | E2E: invite pages are marked noindex while loading, on the form, … and on a broken link. API: search engines are told not to list invite responses. |
| 21 | The nickname field shows its label, placeholder, help text and {count}/20 counter. | Pass | E2E: the nickname field shows its label, placeholder, help text and counter … |
| 22 | The field accepts at most 20 characters, and pasted text is cut at 20. | Pass | E2E: same test (typed, pasted, emoji not split). API: the limit is 20 UTF-16 units. |
| 23 | An empty, spaces-only or invisible-only nickname shows "Enter a nickname.", focuses the field and saves nothing. | Pass | E2E: an empty / spaces-only / invisible-only nickname … (3 tests). API: blank-looking nicknames are rejected. |
| 24 | A nickname already used in this poll (ignoring case, spaces and invisible characters) shows the taken error, keeps the text, focuses the field and saves nothing. | Pass | E2E: a nickname already used in this poll … shows the taken error …. API: nicknames that look the same are the same nickname (10 cases). |
| 25 | Each nickname error clears as soon as the field could be valid. | Pass | E2E: the empty tests (the error stays for a space and clears for a letter) and the taken test (clears on change) |
| 26 | The same nickname can be used in two polls. | Pass | E2E: the same nickname can join two different polls. API: the same nickname joining two polls in parallel. |
| 27 | While joining, the button reads "Joining…" and the field and button are locked. | Pass | E2E: while joining, the button reads Joining… and the form is locked … |
| 28 | Repeated clicks or Enter presses save exactly one participant. | Pass | E2E: same test (request count and database) |
| 29 | If joining fails, the join error shows above the button, the nickname is kept, and the form is usable again. | Pass | E2E: after a server error / a network failure while joining …; if the join is saved but the response is lost … |
| 30 | A saved participant stores the trimmed nickname and the poll it joined. | Pass | E2E: after joining, the joined screen shows the trimmed nickname … (database). API: look-alike tests check stored nicknames per poll; spaces around a 20-character nickname are trimmed. |
| 31 | The joined screen shows "You're in, {nickname}", status, option count, question and details. | Pass | E2E: after joining, the joined screen shows … with focus on its heading |
| 32 | Reloading or a new tab after joining shows the joined screen and saves no new participant. | Pass | E2E: reloading, or opening the link in a new tab, after joining … |
| 33 | Joining in a second tab after the first saves nothing new and shows the first nickname. | Pass | E2E: with two tabs on the nickname form, joining in both saves only the first nickname … |
| 34 | Two people submitting the same nickname at once: exactly one is saved. | Pass | API: 10 parallel joins with case, space and invisible variants of one nickname save exactly one participant. Dev: parallel joins. |
| 35 | A registered user and the poll's creator can join through the link with nothing prefilled. | Pass | E2E: the poll's creator can open their own share link and join, with nothing prefilled; a different browser … (empty field). Until Register and log in ships, the creator is the only registered user. |
| 36 | Markup or script in the question, details or nickname is shown as plain text. | Pass | E2E: markup and script in the question, details and nickname are shown as plain text and never run |

### Test Runs
| Round | Date | Unit | Integration | E2E | Notes |
|-------|------|------|-------------|-----|-------|
| 1 | 2026-09-15 | Client 331 passed | Server 427 passed: dev tests 250; QA Create poll 81; QA Share and join poll 96, including 2 expected-to-fail BUG-01 tests | 164 passed across both projects (Create poll 84, Share and join poll 80) | See notes below. |

Notes for round 1:
- **Handoff state:** the only failing test at handoff, the QA key list, now passes after adding `inviteCode`.
- **Test-infrastructure failures, fixed in QA code:**
  - The first E2E run had 10 failures. Traces showed every page load sending two identical API requests, because the E2E client was a development React build (see Tests Added). A delayed or failed "first" request then hit the ignored duplicate. The config now builds with `NODE_ENV=production`.
  - Some "Loading poll…" timeouts and 2 API test flakes happened only while jest and Playwright ran at the same time. Both suites pass when run one after the other.
- **QA test mistakes fixed before committing:**
  - A valid-format unknown code with an invalid body returns 400, the same as the real code, so it reveals nothing. The test now compares against the real code.
  - `X-Robots-Tag` isn't expected on body-parser rejections (see Tests Added).
- **Exploration** (Back and Forward, which the spec doesn't define; observed only):
  - Joining adds no history entry. Back after joining returns to the page before the invite link, and Forward shows the joined screen again from device memory, with no second join request.
  - The creator opening their own link in a browser that already joined sees the joined screen, and Back returns to the confirmation screen.
  - No issues found.

### Verdict
**Passed.** All 36 acceptance criteria pass, and the full suite passes (unit, integration, E2E in both projects). There are no open Blocker or Major bugs.

**Next step:** the captain decides on the open Minor bug BUG-01 (fix now or later) and sets the spec to `Done`.

Minor items for dev from the Dev Test Audit (not blocking): replace class-name assertions with behavior assertions, and add body and DB checks to the status-only API test.
