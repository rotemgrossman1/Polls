# Component Catalog

**Created:** 2026-09-14
**Last updated:** 2026-09-15

Direction: Option B — Playful (`specs/design/direction-brief.md`). Token names only — values live in `client/src/styles/tokens.css`.
Previews: `specs/design/previews/direction-playful.html`, `specs/design/previews/component-CreatePoll.html`, `specs/design/previews/component-ShareAndJoinPoll.html`.

**Scope:** components needed by Create poll and Share and join poll. Remaining starter components (`VoteOption`, `ResultChart`, `PollCard`, `Toast`) are added by the first feature that uses each one. How components combine on each screen is under **Screens**.

---

### Button

**Status:** Draft
**Purpose:** Pill button for actions.
**Used in:** All screens.

**Anatomy:** Container, optional leading icon, label, optional spinner.

**Variants:** primary, secondary, secondary-dashed (additive actions), ghost, danger. Sizes: default, sm. Modifier: block (full width).

**States:** default, hover, focus-visible, active (press), disabled, loading, success.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Container | all | `--radius-full`; height `--space-12` (default) / `--touch-target-min` (sm); padding x `--space-6` / `--space-4` |
| Label | all | `--font-sans`, `--weight-bold` |
| Primary | default / hover | bg `--color-action` / `--color-action-hover`, text `--color-action-text`, `--shadow-md` |
| Secondary | default / hover | bg `--color-surface` / `--color-bg`, 2px border + text `--color-text` |
| Secondary-dashed | default / hover | as secondary, border style dashed |
| Ghost | default / hover | text `--color-text`, bg transparent / `--color-action-subtle` |
| Danger | default / hover | bg `--color-danger`, text `--color-text-inverse`, `--shadow-md`; hover adds 2px `--color-text` border |
| Any | disabled | bg `--color-surface`, text `--color-text-muted`, border `--color-border-strong`, no shadow |
| Primary | loading | bg `--color-action-hover`, no shadow, spinner `currentColor` |
| Primary | success | bg `--color-success` (hover unchanged), text `--color-text-inverse`, `--shadow-md`, check icon |
| Any | focus-visible | 3px outline `--color-focus` |
| Any | active | translate down 2px, shadow removed, `--duration-fast` `--ease-emphasized` |

**Behavior:** Loading shows the spinner before the label and blocks further presses. The label is the spec's copy for that state (Create poll uses "Creating…"). One primary per screen. In the mobile bottom bar, buttons are block. Success shows a check icon and the spec's confirmation label for a short time (Share and join poll: "Copied" for 2 seconds); the button stays usable.

**Accessibility:** Native `<button>`. A success label change is announced through a separate polite live region with the spec's announcement copy, not by the label change alone. Loading uses `aria-disabled="true"` so focus is not lost; the spinner is `aria-hidden`. A disabled button with an explanation uses `aria-disabled="true"` plus `aria-describedby` pointing to the hint, so it stays focusable and the hint is announced.

**Do / Don't:**
- Do use danger only for confirming destructive actions.
- Don't put two primary buttons on one screen.
- Don't build icon-only actions with `Button`; use the icon button defined in `OptionEditorRow`.

---

### TextInput

**Status:** Draft
**Purpose:** Labeled text field with optional error message and character counter.
**Used in:** Create poll (question, details, options). Share and join poll (nickname, through `NicknameField`). Later: login.

**Anatomy:** Label, optional help text (between the label and the field), field, helper row (error left, counter right).

**Variants:** single-line; auto-grow (textarea that grows with content, no line breaks, soft wrap); multiline (textarea, minimum two rows' height, line breaks allowed); large (question).

**States:** default, focus-visible, error, read-only (locked while saving), at-limit (counter).

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Label | all | `--text-sm`, `--weight-bold`, `--color-text` |
| Field | default | bg `--color-surface`, 2px border `--color-border-strong`, `--radius-md`, min height `--space-12`, padding `--space-3` / `--space-4` |
| Field (large) | default | `--text-xl`, `--weight-medium`, `--leading-tight` |
| Placeholder | empty | `--color-text-muted` |
| Field | focus-visible | 3px outline `--color-focus` |
| Field | error | border `--color-danger`, bg `--color-danger-subtle` |
| Error message | error | `--text-sm`, `--weight-bold`, `--color-danger`, alert icon |
| Counter | default | `--text-sm`, `--color-text-muted`, tabular numerals |
| Counter | at limit | `--color-text`, `--weight-bold` |
| Gaps | all | `--space-2` |

**Behavior:** Auto-grow fields never hide text. The field stops accepting input at the limit; pasted text is cut at the limit. The error appears after a submit attempt and clears as soon as the field is valid.

**Accessibility:** Visible label always; a placeholder is never the label (option rows use the number badge as the visible label — see `OptionEditorRow`). Invalid: `aria-invalid="true"`. `aria-describedby` lists the error first, then the help text, then the counter. The counter is not a live region, so it is not announced on every keystroke.

**Do / Don't:**
- Do keep the counter visible at all times.
- Don't signal the limit with color alone; the counter number is the signal.

---

### PageLayout

**Status:** Draft
**Purpose:** Screen frame: `NavBar`, content column, optional bottom action bar.
**Used in:** All screens.

**Anatomy:** `NavBar`, main column, bottom bar.

**Variants:** with bottom bar, without bottom bar.

**States:** Not applicable.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Page | all | bg `--color-bg` |
| Main | all | max width `--container-max`, side padding `--space-5`, block gap `--space-5`, top padding `--space-4` (mobile) / `--space-8` (md) |
| Bottom bar | mobile | sticky, bg `--color-bg`, 2px top border `--color-border`, padding `--space-3` / `--space-5` / `--space-5`, gap `--space-2` |
| Bottom bar | md and up | static, no border, bottom padding `--space-10` |

**Behavior:** Mobile: the bottom bar sticks to the bottom; buttons are stacked with the secondary or ghost action on top and the primary at the bottom. From `md`: the bar is in normal flow; buttons sit in a right-aligned row with the primary on the right.

**Accessibility:** One `<main>` and one `h1` per screen. The bottom bar comes after the main content in the DOM, so tab order matches reading order.

**Do / Don't:**
- Do keep a single column at every width.
- Don't put more than two actions in the bottom bar.

---

### NavBar

**Status:** Draft
**Purpose:** Top bar with the logo (links to the landing page) and the current user.
**Used in:** default: screens for registered users. minimal: invite page, joined screen, link doesn't work page.

**Anatomy:** Logo mark, "Polls" wordmark, username and avatar initial (default only).

**Variants:** default (logo + current user), minimal (logo only).

**States:** default, focus-visible (logo link).

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Bar | all | padding `--space-3` / `--space-5`, gap `--space-3` |
| Logo mark | all | bg `--color-action`, icon `--color-action-text`, `--radius-md`, size `--space-9`, `--rotate-tilt-md` |
| Wordmark | all | `--text-xl`, `--weight-bold`, `--color-text` |
| Username | all | `--text-sm`, `--weight-medium` |
| Avatar | all | bg `--color-text`, text `--color-text-inverse`, `--radius-full`, size `--space-9`, `--weight-bold` |
| Logo link | focus-visible | 3px outline `--color-focus` |

**Behavior:** Until Register and log in ships, shows the fixed test user. Minimal is used on invite-link screens, so every visitor (guest, registered user, or the poll's creator) sees the same page. Under `prefers-reduced-motion` the tilt stays (it is static, not motion).

**Accessibility:** `<header>` containing `<nav>`. Logo is a link with accessible name "Polls". Avatar is `aria-hidden`.

**Do / Don't:**
- Do keep the logo link on every screen.
- Don't add feature links to the bar without a product spec.

---

### HeroCard

**Status:** Draft
**Purpose:** Welcome block at the top of the landing page.
**Used in:** Landing page. Later: login.

**Anatomy:** Tinted card, decorative tilted bars, heading, intro text.

**Variants:** Not applicable.

**States:** Not applicable.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Card | all | bg `--color-action-subtle`, 2px border `--color-text`, `--radius-lg`, `--shadow-md`, padding `--space-5`, gap `--space-4` |
| Bars | all | fills `--color-action`, `--color-text`, `--color-border-strong`; height `--space-4`, `--radius-full`, `--rotate-tilt-sm` |
| Heading | all | `--text-3xl`, `--weight-bold`, `--leading-tight` |
| Intro | all | `--text-base`, `--color-text` |

**Behavior:** The page's primary action sits below the card, not inside it, so there is one orange focal point.

**Accessibility:** Heading is the page `h1`. Bars are `aria-hidden`.

**Do / Don't:**
- Do follow the emphasis-card pattern (tint + ink outline).
- Don't place a primary button on the tinted card.

---

### AnswerTypeSelector

**Status:** Draft
**Purpose:** Lets the creator pick Single choice or Multiple choice.
**Used in:** Create poll form.

**Anatomy:** Fieldset legend, two choice cards (indicator circle + label).

**Variants:** Not applicable.

**States:** default, hover, focus-visible, selected, disabled (while saving).

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Card | default | bg `--color-surface`, 2px border `--color-text`, `--radius-md`, `--shadow-sm`, min height `--space-12`, padding `--space-3` / `--space-4`, `--weight-medium` |
| Card | hover | lift 1px, `--duration-fast` `--ease-emphasized` |
| Card | selected | bg `--color-action`, text `--color-action-text`, border `--color-action-hover`, no shadow |
| Indicator | default | size `--space-8`, 2px border `--color-text`, `--radius-full`, bg `--color-surface` |
| Indicator | selected | border `--color-surface`, check icon `--color-action` |
| Card | focus-visible | 3px outline `--color-focus` |
| Legend | all | `--text-sm`, `--weight-bold` |
| Cards | all | gap `--space-3` |

**Behavior:** Cards stack full width at every size. The label is the full spec copy and wraps. Single choice is selected when the form opens. No hover lift under `prefers-reduced-motion`.

**Accessibility:** `<fieldset>` + `<legend>`, native radio inputs (visually hidden) — arrow keys change the selection. Selected is shown by fill **and** the check icon, never color alone.

**Do / Don't:**
- Do follow the answer-tile pattern.
- Don't shorten or split the label copy.

---

### OptionListEditor

**Status:** Draft
**Purpose:** Edits the poll's 2–8 options: add, remove, reorder.
**Used in:** Create poll form.

**Anatomy:** Fieldset legend, help text, ordered list of `OptionEditorRow`, drop slot (while dragging), "Add option" button (secondary-dashed, block), limit hint, visually hidden live region.

**Variants:** Not applicable.

**States:** default, dragging, at limit (8 options), locked (saving).

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| List | all | gap `--space-3` |
| Help text | all | `--text-sm`, `--color-text-muted` |
| Drop slot | dragging | 2px dashed border `--color-border-strong`, bg `--color-bg`, `--radius-md`, height of the dragged row |
| Limit hint | 8 options | `--text-sm`, `--weight-medium`, `--color-text-muted`, info icon |

**Behavior:**
- Add appends an empty row and focuses its field. At 8 options, "Add option" is `aria-disabled` and the limit hint shows.
- Remove moves focus to the next row's field, or the previous row's if the last row was removed.
- Drag starts from the handle only. The drop slot follows the pointer; the list auto-scrolls near the viewport edges. Rows renumber on drop.
- Move up / Move down swap the row with its neighbor. Focus stays on the same button of the moved row; if that button becomes disabled, focus moves to the other move button. The live region announces the new position (copy pending `/product`).
- Locked: handles, move, and remove buttons are disabled; fields are read-only.

**Accessibility:** `<fieldset>` + `<legend>` + `<ol>`. Move buttons provide the single-pointer and keyboard alternative to dragging (WCAG 2.2 — 2.5.7 Dragging Movements, 2.1.1 Keyboard). Announcements use a polite live region.

**Do / Don't:**
- Do keep move buttons visible on every row — never hover-only.
- Don't start a drag from the text field.

---

### OptionEditorRow

**Status:** Draft
**Purpose:** One editable option inside `OptionListEditor`.
**Used in:** `OptionListEditor`.

**Anatomy:** Header: drag handle, number badge (visible label), spacer, Move up, Move down, Remove (icon buttons). Body: auto-grow `TextInput`, helper row (error, counter).

**Variants:** Not applicable.

**States:** default, focus-visible (on controls), error, dragging, first row (Move up disabled), last row (Move down disabled), minimum reached (Remove hidden at 2 options), locked.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Tile | default | bg `--color-surface`, 2px border `--color-text`, `--radius-md`, `--shadow-sm`, padding `--space-1` / `--space-3` / `--space-2`, gap `--space-2` |
| Tile | error | border `--color-danger` (plus `TextInput` error styles) |
| Tile | dragging | `--shadow-md`, `--rotate-tilt-sm`, `--z-dropdown`; pick-up `--duration-fast` `--ease-emphasized` |
| Number badge | all | size `--space-8`, 2px border `--color-text`, `--radius-full`, `--text-sm`, `--weight-bold` |
| Icon button | default | size `--touch-target-min`, `--radius-full`, icon `--color-text-muted` |
| Icon button | hover | bg `--color-bg`, icon `--color-text` |
| Icon button | disabled | icon `--color-border-strong` |
| Icon button | focus-visible | 3px outline `--color-focus` |
| Drag handle | default / dragging | icon `--color-text`; dragging bg `--color-action-subtle` |

**Behavior:** The header fits all five controls at 360px; the field spans the full width below. The number badge follows the row's position and matches the "Option {n}" placeholder. Numbers in the editor; letters stay reserved for voting tiles. Under `prefers-reduced-motion`: no tilt, no pick-up animation.

**Accessibility:** The number badge is a `<label>` for the field, read as "Option {n}". Every icon button has the spec's accessible label (Move labels pending `/product`). Disabled move buttons use native `disabled`. All targets at least `--touch-target-min`.

**Do / Don't:**
- Do keep the row a tile so the lift reads as a physical move.
- Don't show Remove when only 2 options remain.

---

### Alert

**Status:** Draft
**Purpose:** Inline message for a form-level or page-level failure.
**Used in:** Create poll (save failure, confirmation load error). Share and join poll (join failure, poll load error). Later: login failure.

**Anatomy:** Container, icon, and either text or title + body. Optional action placed after the alert.

**Variants:** danger.

**States:** Not applicable.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Container | danger | bg `--color-danger-subtle`, 2px border `--color-danger`, `--radius-md`, padding `--space-3` / `--space-4`, gap `--space-3` |
| Icon | danger | `--color-danger` |
| Text | danger | `--color-text`, `--weight-medium` |
| Title | danger | `--text-base`, `--weight-bold`, `--color-text` |
| Body | danger | `--text-base`, `--weight-regular`, `--color-text` |

**Behavior:** Save or join failure: directly above the bottom bar; removed on the next submit. Load error: top of the content area, followed by the spec's action. Title + body is used when the spec gives the error a heading and a body. When the alert is the only content on the screen, its title is the page `h1`.

**Accessibility:** `role="alert"`; icon `aria-hidden`. Focus is not moved; the alert is announced.

**Do / Don't:**
- Do use it once per form, for failures that aren't tied to one field.
- Don't use it for field errors; those stay inline in `TextInput`.

---

### StatusBadge

**Status:** Draft
**Purpose:** Shows a poll's status.
**Used in:** Confirmation screen, invite page, joined screen. Later: My polls, results.

**Anatomy:** Pill, leading marker (dot for Open, lock icon for Closed), label.

**Variants:** open, closed.

**States:** Not applicable.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Pill | all | `--radius-full`, 2px border `currentColor`, `--text-xs`, `--weight-bold`, uppercase, padding x `--space-3`, gap `--space-1` |
| Open | — | text + dot `--color-success`, bg `--color-success-subtle` |
| Closed | — | text `--color-text-muted`, bg `--color-surface`, lock icon |

**Behavior:** Static.

**Accessibility:** Plain text; screen readers read the spec copy ("Open"), not the uppercase styling. Marker is `aria-hidden`.

**Do / Don't:**
- Do pair color with the marker and the text.
- Don't make it interactive.

---

### PollSummary

**Status:** Draft
**Purpose:** Read-only view of a poll's content.
**Used in:** Confirmation screen (default). Invite page and joined screen (invite + bubble).

**Anatomy:** Card, meta row, question, optional details, numbered option list (default only), bubble tail (bubble only).

**Variants:** default (meta row: `StatusBadge` + answer-type tag with icon; numbered option list), invite (meta row: `StatusBadge` + "{n} options" with a list icon; no answer type, no option list). Modifier: bubble.

**States:** Not applicable (loading uses `Skeleton`; failure uses `Alert`).

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Card | all | bg `--color-surface`, 2px border `--color-text`, `--radius-lg`, `--shadow-md`, padding `--space-5`, gap `--space-2` |
| Meta row | all | `--text-sm`, `--weight-medium`, `--color-text-muted`, gap `--space-1` / `--space-3` |
| Question | all | `--text-2xl`, `--weight-bold`, `--leading-tight` |
| Details | all | `--text-base`, `--color-text`, `--leading-normal` |
| Option list | all | 2px dividers `--color-border` |
| Option row | all | padding y `--space-3`, `--weight-medium`, gap `--space-3` |
| Number badge | all | as `OptionEditorRow` |
| Card | bubble | top margin `--space-2` (room for the tail) |
| Tail | bubble | size `--space-5`, fill same as the card, 2px `--color-text` outline on its two outer edges, left offset `--space-8`, rises `--space-3` above the card |

**Behavior:** All text wraps in full, no truncation. Line breaks in details are kept. Options appear in saved order. Answer-type icon: dot-in-circle for single, stacked boxes for multiple. The invite variant never shows answer options, answer counts, results, nicknames, the creator, or the poll ID. Bubble: the tail points up at the screen heading directly above the card (`StickerHeading` or the joined heading). The tail is a shape (a square turned 45°), not a tilt, so `--rotate-tilt-*` does not apply.

**Accessibility:** `<article>` labelled by the question heading (`h2`). Options in an `<ol>`; number badges `aria-hidden`.

**Do / Don't:**
- Do keep it visually distinct from editable tiles.
- Don't give option rows tiles or shadows — read-only content must not look tappable.
- Don't use the bubble without a heading directly above the card.

---

### SuccessMark

**Status:** Draft
**Purpose:** Playful success moment above a success heading.
**Used in:** Confirmation screen, joined screen.

**Anatomy:** Circle, check icon.

**Variants:** Not applicable.

**States:** Not applicable.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Circle | all | bg `--color-success-subtle`, 2px border `--color-success`, `--radius-full`, size `--space-12` + `--space-6`, `--rotate-tilt-sm` |
| Icon | all | `--color-success`, size `--space-9` |

**Behavior:** Static.

**Accessibility:** `aria-hidden`; the heading carries the meaning.

**Do / Don't:**
- Do place it directly above the success heading.
- Don't use it without a text heading.

---

### Skeleton

**Status:** Draft
**Purpose:** Placeholder matching the final layout while data loads.
**Used in:** Confirmation screen on reload. Invite page and joined screen while the poll loads.

**Anatomy:** Line, title, row, and sticker shapes inside the real container.

**Variants:** line, title, row, sticker.

**States:** Not applicable.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Shape | all | bg `--chart-track`; `--radius-full` (line, title, sticker) / `--radius-md` (row); heights `--space-4` / `--space-7` / `--space-10` / `--space-10` |
| Sticker | all | `--rotate-tilt-sm` (matches `StickerHeading`) |
| Pulse | all | `--ease-standard` |

**Behavior:** Gentle opacity pulse. No animation under `prefers-reduced-motion`.

**Accessibility:** Container `aria-busy="true"`; shapes `aria-hidden`. The spec's loading copy ("Loading poll…") is visible with `role="status"`.

**Do / Don't:**
- Do match the shape of the content that will load.
- Don't show a skeleton without the spec's loading text.

---

### Sheet

**Status:** Draft
**Purpose:** Modal container: a bottom sheet on mobile, a centered dialog from `md`.
**Used in:** `ConfirmDialog`, `ShareInviteModal`.

**Anatomy:** Scrim, sheet, handle (mobile only), content.

**Variants:** Not applicable.

**States:** open, closed.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Scrim | open | `--color-scrim`, `--z-modal` |
| Sheet | mobile | bg `--color-surface`, top corners `--radius-lg`, `--shadow-lg`, padding `--space-3` / `--space-5` / `--space-6`, gap `--space-4` |
| Dialog | md and up | all corners `--radius-lg`, 2px border `--color-text`, top padding `--space-6`, centered, max width 28rem (layout value, set by dev in the Tailwind config) |
| Handle | mobile | `--color-border-strong`, `--space-10` × `--space-1`, `--radius-full` |
| Enter | open | `--duration-base` `--ease-standard`; none under `prefers-reduced-motion` |

**Behavior:** Opens over the current screen; the page behind does not scroll. Escape and a scrim tap close it the way the component using it defines (the safe action for `ConfirmDialog`, Done for `ShareInviteModal`). Content taller than the viewport scrolls inside the sheet.

**Accessibility:** `aria-modal="true"`; the role and label come from the component using it. Focus is trapped inside; on close, focus returns to the control that opened it. The handle is `aria-hidden` and is not a drag control.

**Do / Don't:**
- Do build every modal on `Sheet`.
- Don't open one sheet on top of another.

---

### ConfirmDialog

**Status:** Draft
**Purpose:** Confirms a destructive action.
**Used in:** Create poll discard [Could].

**Anatomy:** `Sheet`, title, body, danger action, safe action.

**Variants:** Not applicable.

**States:** open, closed.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Container | all | as `Sheet` |
| Title | all | `--text-xl`, `--weight-bold` |

**Behavior:** Mobile: actions stacked, danger on top, safe action at the bottom near the thumb. From `md`: actions in a row, safe action left, danger right. Escape and a scrim tap act as the safe action.

**Accessibility:** `role="alertdialog"`, labelled by the title, described by the body. Initial focus on the safe action. Focus trap and focus return as `Sheet`.

**Do / Don't:**
- Do build it on `Sheet`.
- Don't put initial focus on the destructive action.

---

### ShareInviteModal

**Status:** Draft
**Purpose:** Share sheet that shows a poll's invite link and lets the creator copy or send it.
**Used in:** Confirmation screen (Share and join poll). Later: My polls.

**Anatomy:** `Sheet`; header (title `h2`, Close icon button); body text; link box (link icon, link text); copy error (under the link box, when shown); actions (Copy, Share link, Done); visually hidden live region.

**Variants:** with Share link (device supports sharing), without Share link.

**States:** default, copied, copy blocked.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Title | all | `--text-xl`, `--weight-bold` |
| Body | all | `--text-base`, `--color-text-muted` |
| Close | all | icon button as `OptionEditorRow` |
| Link box | default | bg `--color-bg`, 2px dashed border `--color-border-strong`, `--radius-md`, padding `--space-3` / `--space-4`, gap `--space-3` |
| Link box | copy blocked | border `--color-danger`, bg `--color-danger-subtle` |
| Link icon | all | `--color-text-muted` |
| Link text | all | `--text-base`, `--weight-medium`, `--color-text` |
| Copy error | copy blocked | as `TextInput` error message |
| Actions | all | gap `--space-2` |
| Copy | default / copied | `Button` primary block with copy icon / `Button` success state |
| Share link | all | `Button` secondary block with share icon |
| Done | all | `Button` ghost block |

**Behavior:**
- Actions are stacked and full width at every size, in this order: Copy, Share link, Done (Done nearest the thumb on mobile).
- The link is shown in full and wraps; it is never cut off. Tapping the link text selects all of it.
- Copy copies the link and shows "Copied" for 2 seconds, then "Copy". Each tap copies again and restarts the 2 seconds.
- Copy blocked: the error appears under the link box and the link text is selected. Copy keeps its default label.
- Share link is shown only when the device supports sharing. Canceling the device share options shows no error; the sheet stays open.
- Done, Close, Escape and a scrim tap all close the sheet.

**Accessibility:** `role="dialog"`, labelled by the title, described by the body. Initial focus on Copy. The link box has the accessible name "Invite link". After copying, a polite live region announces "Link copied". The copy error uses `role="alert"`. Close is an icon button labelled "Close", at least `--touch-target-min`.

**Do / Don't:**
- Do keep Copy as the primary on every device; Share link is the extra.
- Don't confirm the copy with a `Toast`.
- Don't shorten the link with an ellipsis.

---

### StickerHeading

**Status:** Draft
**Purpose:** Tilted pill heading that marks a playful screen moment.
**Used in:** Invite page ("You're invited").

**Anatomy:** Pill, leading icon, text.

**Variants:** Not applicable.

**States:** Not applicable.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Pill | all | bg `--color-surface`, 2px border `--color-text`, `--radius-full`, `--shadow-sm`, padding `--space-2` / `--space-4`, gap `--space-2`, `--rotate-tilt-sm` |
| Text | all | `--text-lg`, `--weight-bold`, `--leading-tight`, `--color-text` |
| Icon | all | `--color-action` |

**Behavior:** Sizes to its text and sits at the start of the column. Text wraps if it does not fit. The tilt is static, so it stays under `prefers-reduced-motion`.

**Accessibility:** Rendered as the page `h1`. Icon `aria-hidden`.

**Do / Don't:**
- Do use it at most once per screen, at the top.
- Don't use it for status or tags; use `StatusBadge`.
- Don't make it interactive.

---

### NicknameField

**Status:** Draft
**Purpose:** Nickname entry for joining a poll.
**Used in:** Invite page.

**Anatomy:** Emphasis card containing a large single-line `TextInput`: label, help text, field, helper row (error, counter).

**Variants:** Not applicable.

**States:** empty, filled, at limit, error (empty), error (taken), locked (joining).

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Card | all | bg `--color-action-subtle`, 2px border `--color-text`, `--radius-lg`, `--shadow-md`, padding `--space-5`, gap `--space-2` |
| Label, help, field, error, counter | all | as `TextInput` (large) |
| Field | locked | as `TextInput` read-only |

**Behavior:**
- Limit 20: typing stops at the limit, pasted text is cut at 20, and the counter reads {count}/20.
- Line breaks, tabs, control and direction-override characters are removed as typed or pasted. Emoji and right-to-left text are allowed.
- Enter submits the invite page form, same as "Join poll".
- Errors appear after a join attempt, left of the counter. The empty error clears as soon as the field is valid; the taken error clears as soon as the nickname changes.
- Never prefilled.

**Accessibility:** `autocomplete="nickname"`, `dir="auto"`, `enterkeyhint="go"`. Invalid: `aria-invalid="true"`. `aria-describedby` lists the error, then the help text, then the counter. On an error, focus moves to the field.

**Do / Don't:**
- Do keep the help text visible at all times; it tells people the creator will see the name.
- Don't add an avatar or initial preview to the card.

---

### EmptyState

**Status:** Draft
**Purpose:** Whole-content message when there is nothing to show.
**Used in:** Link doesn't work page. Later: My polls (no polls), results (no answers).

**Anatomy:** Icon circle, heading, body, optional action.

**Variants:** without action, with action.

**States:** Not applicable.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Container | all | centered text, padding y `--space-10`, gap `--space-4` |
| Icon circle | all | size `--space-12` × 2, bg `--color-action-subtle`, 2px dashed border `--color-action`, `--radius-full`, `--rotate-tilt-md` |
| Icon | all | `--color-action`, size `--space-10` |
| Heading | all | `--text-2xl`, `--weight-bold`, `--leading-tight` |
| Body | all | `--text-base`, `--color-text-muted` |
| Action | with action | `Button` primary |

**Behavior:** Heading and body are the spec's copy and wrap. The icon matches the situation (broken link for the link doesn't work page). The tilt is static.

**Accessibility:** The heading is the page `h1` when the empty state fills the screen, otherwise an `h2`. Icon circle `aria-hidden`.

**Do / Don't:**
- Do follow the brief's empty-state pattern (large tilted icon in a dashed circle).
- Don't use it for failures that can be retried; use `Alert` with the spec's action.

---

## Screens

How components combine on each screen. Copy comes from the specs.

### Confirmation screen (Share and join poll changes)
- Success: `SuccessMark`, "Poll created" heading, intro, `PollSummary` (default), then "Back to home" as a ghost `Button` (sm, home icon) below the summary.
- Bottom bar: "Create another poll" (secondary) and "Share poll" (primary, share icon). Mobile: Share poll at the bottom. From `md`: Share poll on the right.
- "Share poll" opens `ShareInviteModal`; closing it returns focus to "Share poll".
- Loading and load error are unchanged from Create poll; "Share poll" is not shown.

### Invite page
- `NavBar` minimal.
- Loading: "Loading poll…" (`role="status"`) and a `Skeleton` shaped like the page: sticker, poll card (line, two titles), nickname card (line, row).
- Success: `StickerHeading` "You're invited" (`h1`), `PollSummary` invite + bubble, `NicknameField`.
- The whole page is one form. Bottom bar: "Join poll" (primary). Joining: `Button` loading with "Joining…" and the field locked.
- Join failed: `Alert` directly above the bottom bar.
- Link doesn't work and load failed: see below.

### Joined screen
- `NavBar` minimal. `SuccessMark`, then "You're in, {nickname}" (`h1`; the nickname is isolated with `<bdi>` and wraps in full), then `PollSummary` invite + bubble.
- No bottom bar and no action in this feature.
- Loading, link doesn't work and load failed: same as the invite page.

### Link doesn't work page
- `NavBar` minimal and `EmptyState` without action: broken-link icon, "This link doesn't work" (`h1`), body.
- Identical for every non-working link. No poll content, no form.

### Load failed (invite page and joined screen)
- `NavBar` minimal. `Alert` with title "We couldn't load this poll." (`h1`) and body, then "Try again" (`Button` primary, block on mobile).

---

## Changelog
- 2026-09-14 — Catalog created with the components Create poll needs: Button, TextInput, PageLayout, NavBar, HeroCard, AnswerTypeSelector, OptionListEditor, OptionEditorRow, Alert, StatusBadge, PollSummary, SuccessMark, Skeleton, ConfirmDialog. Character counter is part of `TextInput`. Move up / Move down on `OptionEditorRow` follow captain decision 2A (WCAG 2.5.7); their copy is pending a `/product` spec change. Uses new tokens `--rotate-tilt-sm` and `--rotate-tilt-md`.
- 2026-09-15 — Share and join poll. Added `Sheet` (pulled out of `ConfirmDialog`, which now builds on it), `ShareInviteModal`, `StickerHeading`, `NicknameField`, `EmptyState`, and a **Screens** section. Changed: `Button` (success state), `TextInput` (help text sits between label and field; described-by order), `NavBar` (minimal variant), `Alert` (title + body), `PollSummary` (invite variant, bubble modifier), `Skeleton` (sticker shape), plus Used in lines for `StatusBadge` and `SuccessMark`. Captain decisions: invite card keeps the speech bubble without a creator avatar; Copy is the share sheet's primary; on the confirmation screen, "Back to home" moves out of the bottom bar so it keeps two actions. No new tokens. Preview: `component-ShareAndJoinPoll.html`.
