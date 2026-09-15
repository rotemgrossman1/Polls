const { randomUUID } = require('crypto');
const { Participant } = require('../../models');
const { getInvite, joinPoll } = require('../../services/inviteService');
const { NicknameTakenError, PollNotFoundError } = require('../../utils/httpErrors');
const { resetDatabase, closeDatabase } = require('../helpers/db');
const { createPoll } = require('../helpers/factories');

describe('inviteService', () => {
  let poll;

  beforeEach(async () => {
    await resetDatabase();
    poll = await createPoll({ options: ['Pizza', 'Sushi', 'Tacos'], details: 'Team lunch.' });
  });

  afterAll(closeDatabase);

  describe('getInvite', () => {
    test('returns only the question, details, status and number of options', async () => {
      await expect(getInvite({ inviteCode: poll.inviteCode })).resolves.toEqual({
        question: 'Where should we eat on Friday?',
        details: 'Team lunch.',
        status: 'open',
        optionCount: 3,
      });
    });

    test('rejects an unknown code as not found', async () => {
      const promise = getInvite({ inviteCode: 'q7Kx2Wm9aZ' });

      await expect(promise).rejects.toBeInstanceOf(PollNotFoundError);
      await expect(promise).rejects.toMatchObject({ status: 404, publicMessage: 'Poll not found' });
    });

    test('treats a code with different letter case as a different, unknown code', async () => {
      const cased = await createPoll({ inviteCode: 'AbCdEfGhIj' });

      await expect(getInvite({ inviteCode: cased.inviteCode })).resolves.toMatchObject({ optionCount: 2 });
      await expect(getInvite({ inviteCode: 'abcdefghij' })).rejects.toBeInstanceOf(PollNotFoundError);
    });
  });

  describe('joinPoll', () => {
    const join = (overrides = {}) =>
      joinPoll({ inviteCode: poll.inviteCode, nickname: 'Noa', joinKey: randomUUID(), ...overrides });

    test('saves a participant with the nickname and its comparison key', async () => {
      const joinKey = randomUUID();

      const result = await join({ nickname: 'Noa', joinKey });

      expect(result).toEqual({ participant: { nickname: 'Noa' }, created: true });
      const stored = await Participant.findOne({ where: { joinKey } });
      expect(stored.pollId).toBe(poll.id);
      expect(stored.nickname).toBe('Noa');
      expect(stored.nicknameKey).toBe('noa');
    });

    test('a repeated join key returns the original nickname and saves no second participant', async () => {
      const joinKey = randomUUID();
      await join({ nickname: 'Noa', joinKey });

      const replay = await join({ nickname: 'Dan', joinKey });

      expect(replay).toEqual({ participant: { nickname: 'Noa' }, created: false });
      expect(await Participant.count()).toBe(1);
    });

    test('a retry with the same nickname and join key is not told the nickname is taken', async () => {
      const joinKey = randomUUID();
      await join({ joinKey });

      await expect(join({ joinKey })).resolves.toEqual({ participant: { nickname: 'Noa' }, created: false });
    });

    test.each([
      ['case', 'Noa', 'NOA'],
      ['an invisible character inside', 'Noa', 'N\u200Boa'],
      ['Unicode composition', 'Noé', 'Noe\u0301'],
    ])('rejects a nickname that differs only by %s as taken', async (label, first, second) => {
      await join({ nickname: first });

      await expect(join({ nickname: second })).rejects.toBeInstanceOf(NicknameTakenError);
      expect(await Participant.count()).toBe(1);
    });

    test('the same nickname can join two different polls', async () => {
      const otherPoll = await createPoll();
      await join({ nickname: 'Noa' });

      await expect(join({ inviteCode: otherPoll.inviteCode, nickname: 'Noa' })).resolves.toMatchObject({
        created: true,
      });
    });

    test('rejects an unknown invite code as not found and saves nothing', async () => {
      await expect(join({ inviteCode: 'q7Kx2Wm9aZ' })).rejects.toBeInstanceOf(PollNotFoundError);
      expect(await Participant.count()).toBe(0);
    });

    test('concurrent joins with the same nickname save exactly one participant', async () => {
      const results = await Promise.allSettled(Array.from({ length: 5 }, () => join({ nickname: 'Noa' })));

      expect(await Participant.count()).toBe(1);
      expect(results.filter((result) => result.status === 'fulfilled')).toHaveLength(1);
      results
        .filter((result) => result.status === 'rejected')
        .forEach((result) => expect(result.reason).toBeInstanceOf(NicknameTakenError));
    });

    test('concurrent joins with the same join key save one participant and none is told it is taken', async () => {
      const joinKey = randomUUID();

      const results = await Promise.all(Array.from({ length: 5 }, () => join({ joinKey })));

      expect(await Participant.count()).toBe(1);
      expect(results.filter((result) => result.created)).toHaveLength(1);
      results.forEach((result) => expect(result.participant).toEqual({ nickname: 'Noa' }));
    });
  });
});
