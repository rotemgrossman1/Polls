const { randomUUID } = require('crypto');
const {
  DatabaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
} = require('sequelize');
const { Poll, PollOption, User } = require('../../models');
const { resetDatabase, closeDatabase } = require('../helpers/db');
const { createUser, createPoll } = require('../helpers/factories');

function pollAttributes(creatorId, overrides = {}) {
  return {
    creatorId,
    question: 'Where should we eat on Friday?',
    answerType: 'single',
    clientRequestId: randomUUID(),
    ...overrides,
  };
}

describe('Poll and PollOption models', () => {
  let user;

  beforeEach(async () => {
    await resetDatabase();
    user = await createUser();
  });

  afterAll(closeDatabase);

  test('creates an open poll with options through the association', async () => {
    const poll = await Poll.create(
      {
        ...pollAttributes(user.id),
        options: [
          { text: 'Pizza', position: 0 },
          { text: 'Sushi', position: 1 },
        ],
      },
      { include: [{ model: PollOption, as: 'options' }] },
    );

    expect(poll.status).toBe('open');
    expect(poll.details).toBeNull();
    const options = await poll.getOptions({ order: [['position', 'ASC']] });
    expect(options.map((option) => option.text)).toEqual(['Pizza', 'Sushi']);
  });

  test('the database rejects an unknown answer type', async () => {
    await expect(
      Poll.create(pollAttributes(user.id, { answerType: 'ranked' }), { validate: false }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });

  test('the database rejects an unknown status', async () => {
    await expect(
      Poll.create(pollAttributes(user.id, { status: 'draft' }), { validate: false }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });

  test('the database rejects a question longer than 200 characters', async () => {
    await expect(
      Poll.create(pollAttributes(user.id, { question: 'q'.repeat(201) }), { validate: false }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });

  test('a creator cannot reuse a client request id', async () => {
    const clientRequestId = randomUUID();
    await Poll.create(pollAttributes(user.id, { clientRequestId }));

    await expect(
      Poll.create(pollAttributes(user.id, { clientRequestId })),
    ).rejects.toBeInstanceOf(UniqueConstraintError);
  });

  test('different creators may use the same client request id', async () => {
    const otherUser = await createUser();
    const clientRequestId = randomUUID();
    await Poll.create(pollAttributes(user.id, { clientRequestId }));

    await expect(
      Poll.create(pollAttributes(otherUser.id, { clientRequestId })),
    ).resolves.toBeInstanceOf(Poll);
  });

  test('a poll needs an existing creator', async () => {
    await expect(Poll.create(pollAttributes(randomUUID()))).rejects.toBeInstanceOf(
      ForeignKeyConstraintError,
    );
  });

  test('two options of one poll cannot share a position', async () => {
    const poll = await createPoll({ creatorId: user.id });

    await expect(
      PollOption.create({ pollId: poll.id, text: 'Tacos', position: 0 }),
    ).rejects.toBeInstanceOf(UniqueConstraintError);
  });

  test('the database rejects a position outside 0-7', async () => {
    const poll = await createPoll({ creatorId: user.id });

    await expect(
      PollOption.create({ pollId: poll.id, text: 'Tacos', position: 8 }, { validate: false }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });

  test('deleting a poll deletes its options, and deleting a user deletes their polls', async () => {
    const poll = await createPoll({ creatorId: user.id });
    const otherPoll = await createPoll({ creatorId: user.id });

    await poll.destroy();
    expect(await PollOption.count({ where: { pollId: poll.id } })).toBe(0);

    await User.destroy({ where: { id: user.id } });
    expect(await Poll.count({ where: { id: otherPoll.id } })).toBe(0);
    expect(await PollOption.count()).toBe(0);
  });
});
