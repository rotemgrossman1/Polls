# Feature: Create poll

**Status:** Approved
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
