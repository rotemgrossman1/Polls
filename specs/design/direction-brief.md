# Design Direction Brief

**Status:** Draft
**Created:** 2026-09-14
**Last updated:** 2026-09-14

**Direction:** Option B — Playful
**Preview:** `specs/design/previews/direction-playful.html`
**Token values:** `client/src/styles/tokens.css` (this brief records the decisions; code reads tokens only)

Every feature's UI uses this direction. No feature introduces a different palette, font, shape language, or visual style.

## Product Feel
Warm, friendly, playful, confident, quick.

Must not feel like: a corporate form, a survey tool, a dashboard, or a children's app. Playful in shape and color, never at the cost of clarity.

## Audience & Context
- **Guests** open an invite link on a phone, often from a chat app, answer in under a minute, and see results. One-handed use is the main case.
- **Users** create and share polls on phone or desktop, and come back to My polls to see results, see nicknames, and close polls.
- Mobile first. Desktop is the same layouts with more room.

## References
- **Kahoot:** big lettered answer tiles and bold color for the answer moment.
- **Duolingo:** rounded heavy type, thick outlines, "sticker" shadows, friendly empty states.
- **Messaging apps:** speech-bubble invite card, bottom sheets for share actions.

## Color
Light theme only (MVP). All pairs below are checked against WCAG 2.2 AA (text 4.5:1, UI parts and chart bars 3:1).

| Role (semantic token) | Primitive | Value | Contrast notes |
|---|---|---|---|
| `--color-bg` | `--sand-50` | `#FFF7EE` | Text 15.3:1, muted 6.5:1 |
| `--color-surface` / `--color-surface-raised` | `--sand-0` | `#FFFFFF` | Text 16.2:1, muted 6.9:1 |
| `--color-border` | `--sand-300` | `#EBD3BE` | Decorative only (dividers). Never the only boundary of a control. |
| `--color-border-strong` | `--sand-500` | `#9C8676` | Input borders: 3.45:1 on surface, 3.25:1 on bg |
| `--color-text` | `--sand-900` | `#2A1E17` | Also used for 2px outlines on cards, tiles, secondary buttons |
| `--color-text-muted` | `--sand-700` | `#6B5647` | 6.2:1 on action-subtle |
| `--color-text-inverse` | `--sand-0` | `#FFFFFF` | 7.3:1 on chart-highlight |
| `--color-action` | `--orange-700` | `#C2410C` | White text on it 5.2:1; as text on bg 4.9:1 |
| `--color-action-hover` | `--orange-800` | `#9A3412` | White text 7.3:1 |
| `--color-action-text` | `--sand-0` | `#FFFFFF` | |
| `--color-action-subtle` | `--orange-50` | `#FFF1E6` | Tinted emphasis cards. Action text on it 4.7:1 |
| `--color-focus` | `--teal-700` | `#0F766E` | 5.2:1 on bg. Teal so the focus ring is never confused with the orange action color. |
| `--color-scrim` | `--sand-900-a45` | `rgba(42,30,23,.45)` | Modal / bottom-sheet backdrop |
| `--color-success` / `-subtle` | `--green-700` / `--green-50` | `#067647` / `#ECFDF3` | 5.4:1 |
| `--color-warning` / `-subtle` | `--amber-700` / `--amber-50` | `#B54708` / `#FFFAEB` | 5.2:1 |
| `--color-danger` / `-subtle` | `--red-700` / `--red-50` | `#B42318` / `#FEF3F2` | 6.1:1 |

**Additions to the starter token set:** `--color-action-subtle` (tinted emphasis surfaces) and `--color-scrim` (modal backdrop). Both are general roles, not one-offs.

## Typography
- **Family:** `--font-sans` = Nunito, then rounded system fonts (`ui-rounded`, "SF Pro Rounded"), then `Segoe UI`, `system-ui`, `Roboto`, `Arial`, `sans-serif`.
- **Scale (rem, survives 200% zoom):** xs 0.75 · sm 0.875 · base 1 · lg 1.125 · xl 1.375 · 2xl 1.625 · 3xl 2.25.
- **Weights:** regular 400 · medium 600 · bold 800. Headings, buttons, and labels are bold; body text is regular.
- **Line height:** tight 1.2 (headings), normal 1.5 (body).
- Poll questions use `--text-2xl` bold. Option text uses `--text-base` medium.

## Shape & Depth
- **Radius:** sm 8px (small elements) · md 14px (inputs, tiles) · lg 22px (cards, sheets, frames) · full (buttons, badges, tags, avatars, bars).
- **Outlines:** interactive cards, answer tiles, and secondary buttons use a 2px `--color-text` outline. Inputs use a 2px `--color-border-strong` outline.
- **Shadows:** "sticker" offset shadows with no blur: `--shadow-sm` for tiles, `--shadow-md` for cards and primary buttons. `--shadow-lg` is a soft blur, only for overlays (bottom sheets, dialogs).
- Primary buttons press down on click (move 2px, shadow removed).
- **Tilt:** playful static tilts use `--rotate-tilt-sm` (-2deg: dragged option row, hero bars, success mark) and `--rotate-tilt-md` (-6deg: logo mark). No other tilt angles. Addition to the starter token set: a Transform category, a general role, not a one-off.

## Spacing & Density
- Base unit 4px (`--space-1` … `--space-12`).
- Spacious. Screen side padding `--space-5`, vertical rhythm between blocks `--space-5`.
- Touch targets at least `--touch-target-min` (44px). Buttons and answer tiles are 48px or taller.
- Content width capped at `--container-max` (36rem). Single column on every screen.
- **Breakpoints:** Tailwind defaults (`sm` 640px, `md` 768px, `lg` 1024px). Layout changes at `md`: bottom sheets become centered dialogs; result labels sit beside bars instead of above.

## Motion
- `--duration-fast` (140ms) for hover, press, and selection. `--duration-base` (320ms) for sheets opening and bars growing.
- `--ease-standard` for anything that shows data or moves layout (bars, sheets). `--ease-emphasized` (slight overshoot) only for playful feedback: button press, answer tile selection.
- Result bars never overshoot their value.
- Under `prefers-reduced-motion`: no bar animation, no press movement, no transitions; spinners slow down.

## Iconography
- Outline icons on a 24px grid, 2–2.2px stroke, round caps and joins (Lucide style).
- Icons always have a text label next to them or an `aria-label`; decorative icons are `aria-hidden`.
- Key icons: check (selected, your vote, copied), trophy (leading), lock (closed), link (invite), share, copy, alert (errors).

## Pattern Principles
New components must follow these, so every feature looks like this direction:
- **Buttons** are pills. One primary (filled orange) per screen; secondary is white with a 2px ink outline; ghost is text only.
- **Answer options** are letter tiles (A, B, C…). Selected = filled `--color-action` with the letter replaced by a check icon.
- **Emphasis cards** (question input, nickname, leading result) use `--color-action-subtle` with a 2px ink outline.
- **Poll question** on invite screens sits in a speech-bubble card under the creator's avatar.
- **Modals** are bottom sheets on mobile and centered dialogs from `md` up.
- **Confirmations** for quick actions (copy link) happen inline on the control; `Toast` is kept for background failures.
- **Badges and tags** are uppercase pills with a 2px border in their own color.
- **Empty states** use a large tilted icon in a dashed circle.
- **Errors:** field errors inline (icon + bold text + danger border and tint); login failure is one form-level `Alert` that does not reveal which field was wrong.

## Chart Style
Follows the Results Chart Rules in `design.md`, styled as:
- Thick rounded bars (`--space-5` tall) in `--chart-1` on `--chart-track`, in the poll's original option order.
- A **leading summary card** above the chart shows the leading option, its percentage (`--text-3xl` bold), and its vote count. On a tie it lists every tied option.
- The leading row's bar uses `--chart-highlight` plus a "Leading" tag with a trophy icon. Tied leaders are highlighted equally.
- The viewer's own answer gets an outlined tag with a check icon.
- Row: label and tags, then percentage (bold) and count (muted), then bar. Label above the bar on mobile; beside it from `md`.
- **Zero answers:** the summary card becomes a dashed empty card with the spec's message; tracks stay visible and empty.
- `--chart-1` on `--chart-track` is 3.10:1, just above the 3:1 minimum. Do not lighten either value.

## Constraints
- Light theme only (MVP). Token names allow a dark theme later.
- WCAG 2.2 AA.
- Mobile first (360px).

## Rejected Directions
- **Option A — Calm** (white cards, blue action, thin borders, utility feel). Rejected by the captain on 2026-09-14 in favor of a warmer, more playful look. Preview: `specs/design/previews/direction-calm.html`.

## Deferred Decisions
- **Loading Nunito:** rounded system fonts exist only on Apple devices, so Windows and Android fall back to Segoe UI / Roboto. Recommendation: self-host Nunito so every device looks the same. This adds an npm dependency, so dev flags it as a tradeoff in the first frontend plan. Captain decides.
- **Icon library:** Lucide style is the direction; the package (e.g. `lucide-react`) is a dev decision flagged in the first frontend plan.
- **Option reorder copy:** Move up / Move down buttons on option rows (captain decision 2026-09-14, needed for WCAG 2.5.7) need accessible labels and a move announcement. Waiting on a `/product` change to `specs/features/2026-09-14-create-poll.md`. Preview marks them PENDING.
- **Brand assets:** no logo or brand color supplied. The preview's tilted bars mark is a placeholder until the captain provides or approves a logo.

## Changelog
- 2026-09-14 — Brief created. Option B — Playful chosen by the captain; Option A — Calm rejected. Changes from the preview: `--shadow-lg` made direction-neutral for sheets and dialogs; `--ease-emphasized` added so data animations use a non-overshooting `--ease-standard`.
- 2026-09-14 — Added Transform tokens `--rotate-tilt-sm` (-2deg) and `--rotate-tilt-md` (-6deg) for Create poll components (dragged option row, hero bars, success mark, logo mark). Same change in `tokens.css`. No tokens renamed or removed.
