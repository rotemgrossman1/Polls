# Roadmap — MVP

Build order for the MVP. `/product` writes one spec per feature in `specs/features/`, in this order unless the captain says otherwise.
Use cases come from `specs/initial-spec.md`.

| # | Feature | Reason |
|---|---------|--------|
| 1 | Register and log in | Creating polls needs an account; every user-only feature depends on login and the JWT. |
| 2 | Create poll | The poll is the core object; nothing else can be built or tested without one. |
| 3 | Share invite link | The invite link is the only way participants reach a poll; small, and follows creation directly. |
| 4 | Join poll with nickname | Entry point for every participant (guests and other registered users); needed before anyone can answer. |
| 5 | Answer poll | The core participant action; produces the data that results need. |
| 6 | View results | The payoff of the app: graphical results for participants after they answer, and for the creator. Needs answers to exist. |
| 7 | My polls | The creator's way back to their polls; most useful once polls have answers and results to show. |
| 8 | Close poll | Creator-only control reached from My polls; it changes how answering and results behave, so it comes after both exist. |
| 9 | View participant nicknames | Creator-only view of who took part; needs answers with nicknames. |

## Open Questions
To resolve in the related feature spec. Not blocking the build order.

- **Join poll / Answer poll:** How do we recognize the same guest answering twice when they have no account? Can a guest change their answer?
- **Join poll:** Must nicknames be unique within a poll?
- **Answer poll:** Can the creator answer their own poll?
- **View results / Close poll:** When a poll is closed, can someone who never answered see its results?
- **View participant nicknames:** Does the creator see only who took part, or also which answer each nickname picked?
