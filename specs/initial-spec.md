## Target Users
- User
- Guest

## Product Rules
- A poll stays open until its creator closes it. A closed poll accepts no more answers.
- A guest sees a poll's results only after answering it, never before.
- The poll creator can see the nicknames of the people who answered their poll.
- A registered user who opens another user's invite link takes part as a guest.

## Use Cases (Per User)

### Guest
No account and no login required.
- Accepts an invite to a poll (given a URL)
- Enters a nickname
- Views the poll question and can pick an answer (while the poll is open)
- Views the poll results after answering

### User
Registers and logs in with a simple username and password. No email verification, password reset, OAuth or 2FA.

Has all Guest use cases plus:
- Can register with a username and password
- Can log in with a username and password
- Can create a poll
- Can send link to guests to participate in the poll
- Can see a list of their own polls (My polls)
- Can view the results of their own polls
- Can view the nicknames of the people who answered their own polls
- Can close their own poll
