const { randomUUID } = require('crypto');
const {
  DatabaseError,
  ForeignKeyConstraintError,
  UniqueConstraintError,
} = require('sequelize');
const { sequelize, Poll, PollOption, User } = require('../../models');
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

  describe('invite code', () => {
    const INVITE_CODE = /^[0-9A-Za-z]{10}$/;

    test('a new poll gets a 10-character base62 invite code from the database', async () => {
      const poll = await createPoll({ creatorId: user.id });

      expect(poll.inviteCode).toMatch(INVITE_CODE);
      const stored = await Poll.findByPk(poll.id, { attributes: ['inviteCode'] });
      expect(stored.inviteCode).toBe(poll.inviteCode);
    });

    test('a poll inserted with raw SQL gets an invite code too', async () => {
      const [rows] = await sequelize.query(
        "INSERT INTO polls (creator_id, question, answer_type, client_request_id) VALUES (:creatorId, 'Lunch?', 'single', gen_random_uuid()) RETURNING invite_code",
        { replacements: { creatorId: user.id } },
      );

      expect(rows[0].invite_code).toMatch(INVITE_CODE);
    });

    test('generate_invite_code makes distinct codes that use the whole base62 alphabet', async () => {
      const [rows] = await sequelize.query(
        'SELECT generate_invite_code() AS code FROM generate_series(1, 1000)',
      );
      const codes = rows.map((row) => row.code);

      codes.forEach((code) => expect(code).toMatch(INVITE_CODE));
      expect(new Set(codes).size).toBe(1000);
      expect(new Set(codes.join('')).size).toBe(62);
    });

    test.each([
      ['too short', 'Ab3dE9'],
      ['too long', 'Ab3dE9xYz2Q'],
      ['with characters outside base62', 'Ab3dE9-Yz_'],
    ])('the database rejects an invite code that is %s', async (label, inviteCode) => {
      await expect(
        Poll.create(pollAttributes(user.id, { inviteCode }), { validate: false }),
      ).rejects.toBeInstanceOf(DatabaseError);
    });

    test('invite codes are unique and case-sensitive', async () => {
      await Poll.create(pollAttributes(user.id, { inviteCode: 'AbCdEfGhIj' }));

      await expect(
        Poll.create(pollAttributes(user.id, { inviteCode: 'AbCdEfGhIj' })),
      ).rejects.toBeInstanceOf(UniqueConstraintError);
      await expect(
        Poll.create(pollAttributes(user.id, { inviteCode: 'abcdefghij' })),
      ).resolves.toBeInstanceOf(Poll);
    });
  });
});
