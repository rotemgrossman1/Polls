# Roadmap — MVP

Build order for the MVP. `/product` writes one spec per feature in `specs/features/`, in this order unless the captain says otherwise.
Use cases come from `specs/initial-spec.md`.
Status mirrors each feature spec's **Status** field; features without a spec yet are `Not started`.

| # | Feature | Status | Reason |
|---|---------|--------|--------|
| 1 | Create poll | Done | The poll is the core object; nothing else can be built or tested without one. |
| 2 | Share and join poll | Approved | The invite link is the only way participants reach a poll, and joining with a nickname is the entry point for every participant; needed before anyone can answer. |
| 3 | ~~Join poll with nickname~~ | Merged into #2 | Captain merged it into Share and join poll (2026-09-15). |
| 4 | Answer poll | Not started | The core participant action; produces the data that results need. |
| 5 | View results | Not started | The payoff of the app: graphical results for participants after they answer, and for the creator. Needs answers to exist. |
| 6 | My polls | Not started | The creator's way back to their polls; most useful once polls have answers and results to show. |
| 7 | Close poll | Not started | Creator-only control reached from My polls; it changes how answering and results behave, so it comes after both exist. |
| 8 | View participant nicknames | Not started | Creator-only view of who took part; needs answers with nicknames. |
| 9 | Register and log in | Not started | Deferred by captain: build the core poll flow first, add auth last. Until then the app acts as one fixed test user. |

## Open Questions
To resolve in the related feature spec. Not blocking the build order.

- **Answer poll:** Can a guest change their answer? (Repeat guests are recognized per device, and nicknames are unique within a poll: decided in Share and join poll.)
- **Answer poll:** Can the creator answer their own poll?
- **View results / Close poll:** When a poll is closed, can someone who never answered see its results?
- **View participant nicknames:** Does the creator see only who took part, or also which answer each nickname picked?
