const { randomUUID } = require('crypto');
const { UniqueConstraintError } = require('sequelize');
const { Poll, PollOption } = require('../../models');
const { createPoll, getPollForCreator } = require('../../services/pollService');
const { PollNotFoundError } = require('../../utils/httpErrors');
const { resetDatabase, closeDatabase } = require('../helpers/db');
const { createUser } = require('../helpers/factories');

function pollInput(creatorId, overrides = {}) {
  return {
    creatorId,
    question: 'Where should we eat on Friday?',
    details: null,
    answerType: 'multiple',
    options: ['Sushi', 'Pizza', 'Tacos'],
    clientRequestId: randomUUID(),
    ...overrides,
  };
}

describe('pollService', () => {
  let user;

  beforeEach(async () => {
    await resetDatabase();
    user = await createUser();
  });

  afterAll(closeDatabase);

  describe('createPoll', () => {
    test('saves an open poll for the creator with options in the given order', async () => {
      const input = pollInput(user.id, { details: 'Team lunch, budget is small.' });

      const { poll, created } = await createPoll(input);

      expect(created).toBe(true);
      expect(poll).toEqual({
        id: expect.any(String),
        question: 'Where should we eat on Friday?',
        details: 'Team lunch, budget is small.',
        answerType: 'multiple',
        status: 'open',
        inviteCode: expect.stringMatching(/^[0-9A-Za-z]{10}$/),
        createdAt: expect.any(Date),
        options: [
          { id: expect.any(String), text: 'Sushi', position: 0 },
          { id: expect.any(String), text: 'Pizza', position: 1 },
          { id: expect.any(String), text: 'Tacos', position: 2 },
        ],
      });

      const stored = await Poll.findByPk(poll.id);
      expect(stored.creatorId).toBe(user.id);
      expect(stored.clientRequestId).toBe(input.clientRequestId);
    });

    test('retries with a new invite code when the generated one is already taken', async () => {
      const takenCode = new UniqueConstraintError({
        parent: Object.assign(new Error('duplicate key'), { constraint: 'polls_invite_code_key' }),
      });
      const create = jest.spyOn(Poll, 'create').mockRejectedValueOnce(takenCode);

      try {
        const { poll, created } = await createPoll(pollInput(user.id));

        expect(created).toBe(true);
        expect(poll.inviteCode).toMatch(/^[0-9A-Za-z]{10}$/);
        expect(create).toHaveBeenCalledTimes(2);
        expect(await Poll.count()).toBe(1);
      } finally {
        create.mockRestore();
      }
    });

    test('gives up after three invite code conflicts and saves nothing', async () => {
      const takenCode = () =>
        new UniqueConstraintError({
          parent: Object.assign(new Error('duplicate key'), { constraint: 'polls_invite_code_key' }),
        });
      const create = jest
        .spyOn(Poll, 'create')
        .mockRejectedValueOnce(takenCode())
        .mockRejectedValueOnce(takenCode())
        .mockRejectedValueOnce(takenCode());

      try {
        await expect(createPoll(pollInput(user.id))).rejects.toBeInstanceOf(UniqueConstraintError);
        expect(create).toHaveBeenCalledTimes(3);
        expect(await Poll.count()).toBe(0);
      } finally {
        create.mockRestore();
      }
    });

    test('never returns the creator id or client request id', async () => {
      const { poll } = await createPoll(pollInput(user.id));

      expect(poll).not.toHaveProperty('creatorId');
      expect(poll).not.toHaveProperty('clientRequestId');
    });

    test('stores details as null when none are given', async () => {
      const { poll } = await createPoll(pollInput(user.id));

      expect(poll.details).toBeNull();
    });

    test('stores markup as plain text', async () => {
      const { poll } = await createPoll(
        pollInput(user.id, { question: '<img src=x onerror=alert(1)>', options: ['<b>Yes</b>', 'No'] }),
      );

      expect(poll.question).toBe('<img src=x onerror=alert(1)>');
      expect(poll.options[0].text).toBe('<b>Yes</b>');
    });

    test('a repeated client request id returns the existing poll without creating another', async () => {
      const input = pollInput(user.id);
      const first = await createPoll(input);

      const replay = await createPoll({ ...input, question: 'A different question' });

      expect(replay.created).toBe(false);
      expect(replay.poll).toEqual(first.poll);
      expect(await Poll.count()).toBe(1);
    });

    test('the same client request id from another creator creates a separate poll', async () => {
      const otherUser = await createUser();
      const clientRequestId = randomUUID();

      await createPoll(pollInput(user.id, { clientRequestId }));
      const { created } = await createPoll(pollInput(otherUser.id, { clientRequestId }));

      expect(created).toBe(true);
      expect(await Poll.count()).toBe(2);
    });

    test('concurrent requests with the same client request id create exactly one poll', async () => {
      const input = pollInput(user.id);

      const results = await Promise.all(Array.from({ length: 5 }, () => createPoll(input)));

      expect(await Poll.count()).toBe(1);
      expect(await PollOption.count()).toBe(3);
      expect(results.filter((result) => result.created)).toHaveLength(1);
      expect(new Set(results.map((result) => result.poll.id)).size).toBe(1);
    });

    test('rolls back the poll when saving an option fails', async () => {
      const input = pollInput(user.id, { options: ['Pizza', 'o'.repeat(101)] });

      await expect(createPoll(input)).rejects.toThrow();

      expect(await Poll.count()).toBe(0);
      expect(await PollOption.count()).toBe(0);
    });
  });

  describe('getPollForCreator', () => {
    test("returns the creator's poll with options ordered by position", async () => {
      const stored = await Poll.create({
        creatorId: user.id,
        question: 'Best day for the retro?',
        answerType: 'single',
        clientRequestId: randomUUID(),
      });
      await PollOption.bulkCreate([
        { pollId: stored.id, text: 'Friday', position: 2 },
        { pollId: stored.id, text: 'Monday', position: 0 },
        { pollId: stored.id, text: 'Wednesday', position: 1 },
      ]);

      const poll = await getPollForCreator({ pollId: stored.id, creatorId: user.id });

      expect(poll.question).toBe('Best day for the retro?');
      expect(poll.status).toBe('open');
      expect(poll.options.map((option) => option.text)).toEqual(['Monday', 'Wednesday', 'Friday']);
    });

    test("rejects another user's poll as not found", async () => {
      const otherUser = await createUser();
      const { poll } = await createPoll(pollInput(otherUser.id));

      await expect(getPollForCreator({ pollId: poll.id, creatorId: user.id })).rejects.toBeInstanceOf(
        PollNotFoundError,
      );
    });

    test('rejects a poll that does not exist as not found', async () => {
      const promise = getPollForCreator({ pollId: randomUUID(), creatorId: user.id });

      await expect(promise).rejects.toBeInstanceOf(PollNotFoundError);
      await expect(promise).rejects.toMatchObject({ status: 404, publicMessage: 'Poll not found' });
    });
  });
});
