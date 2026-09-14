# Component Catalog

**Created:** 2026-09-14
**Last updated:** 2026-09-14

Direction: Option B — Playful (`specs/design/direction-brief.md`). Token names only — values live in `client/src/styles/tokens.css`.
Previews: `specs/design/previews/direction-playful.html`, `specs/design/previews/component-CreatePoll.html`.

**Scope:** components needed by Create poll. Remaining starter components (`VoteOption`, `ResultChart`, `PollCard`, `ShareInviteModal`, `EmptyState`, `Toast`) are added by the first feature that uses each one.

---

### Button

**Status:** Draft
**Purpose:** Pill button for actions.
**Used in:** All screens.

**Anatomy:** Container, optional leading icon, label, optional spinner.

**Variants:** primary, secondary, secondary-dashed (additive actions), ghost, danger. Sizes: default, sm. Modifier: block (full width).

**States:** default, hover, focus-visible, active (press), disabled, loading.

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
| Any | focus-visible | 3px outline `--color-focus` |
| Any | active | translate down 2px, shadow removed, `--duration-fast` `--ease-emphasized` |

**Behavior:** Loading shows the spinner before the label and blocks further presses. The label is the spec's copy for that state (Create poll uses "Creating…"). One primary per screen. In the mobile bottom bar, buttons are block.

**Accessibility:** Native `<button>`. Loading uses `aria-disabled="true"` so focus is not lost; the spinner is `aria-hidden`. A disabled button with an explanation uses `aria-disabled="true"` plus `aria-describedby` pointing to the hint, so it stays focusable and the hint is announced.

**Do / Don't:**
- Do use danger only for confirming destructive actions.
- Don't put two primary buttons on one screen.
- Don't build icon-only actions with `Button`; use the icon button defined in `OptionEditorRow`.

---

### TextInput

**Status:** Draft
**Purpose:** Labeled text field with optional error message and character counter.
**Used in:** Create poll (question, details, options). Later: nickname, login.

**Anatomy:** Label, field, helper row (error left, counter right), optional help text.

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

**Accessibility:** Visible label always; a placeholder is never the label (option rows use the number badge as the visible label — see `OptionEditorRow`). Invalid: `aria-invalid="true"`. `aria-describedby` lists the error first, then the counter. The counter is not a live region, so it is not announced on every keystroke.

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
**Used in:** All screens for registered users.

**Anatomy:** Logo mark, "Polls" wordmark, username, avatar initial.

**Variants:** Not applicable.

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

**Behavior:** Until Register and log in ships, shows the fixed test user. Under `prefers-reduced-motion` the tilt stays (it is static, not motion).

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
**Used in:** Create poll (save failure, confirmation load error). Later: login failure.

**Anatomy:** Container, icon, text. Optional action placed after the alert.

**Variants:** danger.

**States:** Not applicable.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Container | danger | bg `--color-danger-subtle`, 2px border `--color-danger`, `--radius-md`, padding `--space-3` / `--space-4`, gap `--space-3` |
| Icon | danger | `--color-danger` |
| Text | danger | `--color-text`, `--weight-medium` |

**Behavior:** Save failure: directly above the bottom bar; removed on the next submit. Load error: top of the content area, followed by the spec's action.

**Accessibility:** `role="alert"`; icon `aria-hidden`. Focus is not moved; the alert is announced.

**Do / Don't:**
- Do use it once per form, for failures that aren't tied to one field.
- Don't use it for field errors; those stay inline in `TextInput`.

---

### StatusBadge

**Status:** Draft
**Purpose:** Shows a poll's status.
**Used in:** Confirmation screen. Later: My polls, results.

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
**Used in:** Confirmation screen. Later: Share invite link.

**Anatomy:** Card, meta row (`StatusBadge` + answer-type tag with icon), question, optional details, numbered option list.

**Variants:** Not applicable.

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

**Behavior:** All text wraps in full, no truncation. Line breaks in details are kept. Options appear in saved order. Answer-type icon: dot-in-circle for single, stacked boxes for multiple.

**Accessibility:** `<article>` labelled by the question heading (`h2`). Options in an `<ol>`; number badges `aria-hidden`.

**Do / Don't:**
- Do keep it visually distinct from editable tiles.
- Don't give option rows tiles or shadows — read-only content must not look tappable.

---

### SuccessMark

**Status:** Draft
**Purpose:** Playful success moment above a success heading.
**Used in:** Confirmation screen.

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
**Used in:** Confirmation screen on reload.

**Anatomy:** Line, title, and row shapes inside the real container.

**Variants:** line, title, row.

**States:** Not applicable.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Shape | all | bg `--chart-track`; `--radius-full` (line, title) / `--radius-md` (row); heights `--space-4` / `--space-7` / `--space-10` |
| Pulse | all | `--ease-standard` |

**Behavior:** Gentle opacity pulse. No animation under `prefers-reduced-motion`.

**Accessibility:** Container `aria-busy="true"`; shapes `aria-hidden`. The spec's loading copy ("Loading poll…") is visible with `role="status"`.

**Do / Don't:**
- Do match the shape of the content that will load.
- Don't show a skeleton without the spec's loading text.

---

### ConfirmDialog

**Status:** Draft
**Purpose:** Confirms a destructive action.
**Used in:** Create poll discard [Could].

**Anatomy:** Scrim, sheet (handle on mobile), title, body, danger action, safe action.

**Variants:** Not applicable.

**States:** open, closed.

**Tokens:**
| Part | State | Token |
|------|-------|-------|
| Scrim | open | `--color-scrim`, `--z-modal` |
| Sheet | mobile | bg `--color-surface`, top corners `--radius-lg`, `--shadow-lg`, padding `--space-3` / `--space-5` / `--space-6`, gap `--space-4` |
| Dialog | md and up | all corners `--radius-lg`, 2px border `--color-text`, centered, max width 28rem (layout value, set by dev in the Tailwind config) |
| Handle | mobile | `--color-border-strong`, `--space-10` × `--space-1`, `--radius-full` |
| Title | all | `--text-xl`, `--weight-bold` |
| Enter | open | `--duration-base` `--ease-standard`; none under `prefers-reduced-motion` |

**Behavior:** Mobile: actions stacked, danger on top, safe action at the bottom near the thumb. From `md`: actions in a row, safe action left, danger right. Escape and a scrim tap act as the safe action.

**Accessibility:** `role="alertdialog"`, `aria-modal="true"`, labelled by the title, described by the body. Initial focus on the safe action; focus trapped inside; on close, focus returns to the control that opened it.

**Do / Don't:**
- Do reuse the bottom-sheet / dialog pattern.
- Don't put initial focus on the destructive action.

---

## Changelog
- 2026-09-14 — Catalog created with the components Create poll needs: Button, TextInput, PageLayout, NavBar, HeroCard, AnswerTypeSelector, OptionListEditor, OptionEditorRow, Alert, StatusBadge, PollSummary, SuccessMark, Skeleton, ConfirmDialog. Character counter is part of `TextInput`. Move up / Move down on `OptionEditorRow` follow captain decision 2A (WCAG 2.5.7); their copy is pending a `/product` spec change. Uses new tokens `--rotate-tilt-sm` and `--rotate-tilt-md`.
