const { randomUUID } = require('crypto');
const { DatabaseError, ForeignKeyConstraintError, UniqueConstraintError } = require('sequelize');
const { Participant, Poll } = require('../../models');
const { PARTICIPANT_CONSTRAINTS } = require('../../utils/participantRules');
const { resetDatabase, closeDatabase } = require('../helpers/db');
const { createPoll, createParticipant } = require('../helpers/factories');

function participantAttributes(pollId, overrides = {}) {
  return { pollId, nickname: 'Noa', nicknameKey: 'noa', joinKey: randomUUID(), ...overrides };
}

async function constraintOf(promise) {
  const err = await promise.catch((error) => error);
  expect(err).toBeInstanceOf(UniqueConstraintError);
  return err.parent.constraint;
}

describe('Participant model', () => {
  let poll;

  beforeEach(async () => {
    await resetDatabase();
    poll = await createPoll();
  });

  afterAll(closeDatabase);

  test('saves a participant for a poll', async () => {
    const participant = await createParticipant({ pollId: poll.id, nickname: 'Noa' });

    expect(participant.nickname).toBe('Noa');
    expect(participant.nicknameKey).toBe('noa');
    expect(await poll.countParticipants()).toBe(1);
  });

  test('two participants of one poll cannot share a nickname key', async () => {
    await Participant.create(participantAttributes(poll.id));

    const constraint = await constraintOf(
      Participant.create(participantAttributes(poll.id, { nickname: 'NOA' })),
    );

    expect(constraint).toBe(PARTICIPANT_CONSTRAINTS.NICKNAME);
  });

  test('the same nickname key can be used in another poll', async () => {
    const otherPoll = await createPoll();
    await Participant.create(participantAttributes(poll.id));

    await expect(Participant.create(participantAttributes(otherPoll.id))).resolves.toBeInstanceOf(Participant);
  });

  test('a join key is unique per poll but can be used in another poll', async () => {
    const otherPoll = await createPoll();
    const joinKey = randomUUID();
    await Participant.create(participantAttributes(poll.id, { joinKey }));

    const constraint = await constraintOf(
      Participant.create(participantAttributes(poll.id, { nickname: 'Dan', nicknameKey: 'dan', joinKey })),
    );

    expect(constraint).toBe(PARTICIPANT_CONSTRAINTS.JOIN_KEY);
    await expect(
      Participant.create(participantAttributes(otherPoll.id, { joinKey })),
    ).resolves.toBeInstanceOf(Participant);
  });

  test('the database rejects an empty nickname key', async () => {
    await expect(
      Participant.create(participantAttributes(poll.id, { nicknameKey: '' }), { validate: false }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });

  test('the database rejects a nickname longer than 20 characters', async () => {
    await expect(
      Participant.create(participantAttributes(poll.id, { nickname: 'n'.repeat(21) }), { validate: false }),
    ).rejects.toBeInstanceOf(DatabaseError);
  });

  test('a participant needs an existing poll', async () => {
    await expect(Participant.create(participantAttributes(randomUUID()))).rejects.toBeInstanceOf(
      ForeignKeyConstraintError,
    );
  });

  test('deleting a poll deletes its participants', async () => {
    await createParticipant({ pollId: poll.id });

    await Poll.destroy({ where: { id: poll.id } });

    expect(await Participant.count()).toBe(0);
  });
});
