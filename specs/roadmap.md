# Roadmap — MVP

Build order for the MVP. `/product` writes one spec per feature in `specs/features/`, in this order unless the captain says otherwise.
Use cases come from `specs/initial-spec.md`.
Status mirrors each feature spec's **Status** field; features without a spec yet are `Not started`.

The MVP is finished when all four features below are `Done`. Nothing else gets built.

| # | Feature | Status | Reason |
|---|---------|--------|--------|
| 1 | Create poll | Done | The poll is the core object; nothing else can be built or tested without one. |
| 2 | Share and join poll | Approved | The invite link is the only way participants reach a poll, and joining with a nickname is the entry point for every participant; needed before anyone can vote. |
| 3 | Vote on poll | Not started | The core participant action; produces the votes that results need. |
| 4 | View poll results | Not started | The payoff of the app: counts, percentages and the total. Needs votes to exist. |

## Feature Scope
The captain's requirements for the remaining features. A spec may add detail, not scope.

**Vote on poll**
- A participant selects one option per poll.
- Current vote counts are displayed, only after the participant has voted (never before).
- The same nickname cannot vote twice in the same poll.

**View poll results**
- Vote count for each option.
- Percentage for each option.
- Total number of votes.

## Dropped From the MVP
Captain decision, 2026-09-15. Do not spec, build or test these. Where an existing spec, plan, catalog entry or code comment says one of them will come later, treat that as void.

- **Register and log in:** no registration, login, logout or JWT. The app keeps acting as the one fixed test user named by `TEST_USER_USERNAME`.
- **My polls:** no list of the creator's polls.
- **Close poll:** polls stay open; the `closed` status is never used.
- **View participant nicknames:** no creator view of who took part.
- **Multiple choice:** removed from Create poll; every poll is single choice.

## Open Questions
To resolve in the related feature spec. Not blocking the build order.

- **Vote on poll:** Can a participant change their vote? (Repeat participants are recognized per device, and nicknames are unique within a poll: decided in Share and join poll.)
- **Vote on poll:** Can the creator vote in their own poll? (They can already join it through their own link.)
- **View poll results:** Can the creator see results without voting, for example from the confirmation screen?
- **View poll results:** Are Vote on poll's counts and the results the same screen?
