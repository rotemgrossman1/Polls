# Roadmap — MVP

Build order for the MVP. `/product` writes one spec per feature in `specs/features/`, in this order unless the captain says otherwise.
Use cases come from `specs/initial-spec.md`.

| # | Feature | Reason |
|---|---------|--------|
| 1 | Create poll | The poll is the core object; nothing else can be built or tested without one. |
| 2 | Share invite link | The invite link is the only way participants reach a poll; small, and follows creation directly. |
| 3 | Join poll with nickname | Entry point for every participant (guests and other registered users); needed before anyone can answer. |
| 4 | Answer poll | The core participant action; produces the data that results need. |
| 5 | View results | The payoff of the app: graphical results for participants after they answer, and for the creator. Needs answers to exist. |
| 6 | My polls | The creator's way back to their polls; most useful once polls have answers and results to show. |
| 7 | Close poll | Creator-only control reached from My polls; it changes how answering and results behave, so it comes after both exist. |
| 8 | View participant nicknames | Creator-only view of who took part; needs answers with nicknames. |
| 9 | Register and log in | Deferred by captain: build the core poll flow first, add auth last. Until then the app acts as one fixed test user. |

## Open Questions
To resolve in the related feature spec. Not blocking the build order.

- **Join poll / Answer poll:** How do we recognize the same guest answering twice when they have no account? Can a guest change their answer?
- **Join poll:** Must nicknames be unique within a poll?
- **Answer poll:** Can the creator answer their own poll?
- **View results / Close poll:** When a poll is closed, can someone who never answered see its results?
- **View participant nicknames:** Does the creator see only who took part, or also which answer each nickname picked?
