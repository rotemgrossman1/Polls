# Feature: Share and join poll

**Status:** Approved
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
