const { randomUUID } = require('crypto');
const { User, Poll, PollOption, Participant } = require('../../models');
const { normalizeText } = require('../../utils/textRules');

function createUser(overrides = {}) {
  return User.create({ username: `user-${randomUUID()}`, ...overrides });
}

// Creates a poll with options. Pass creatorId, or a user is created for it.
async function createPoll({ creatorId, options = ['Pizza', 'Sushi'], ...overrides } = {}) {
  const ownerId = creatorId || (await createUser()).id;

  return Poll.create(
    {
      creatorId: ownerId,
      question: 'Where should we eat on Friday?',
      answerType: 'single',
      clientRequestId: randomUUID(),
      ...overrides,
      options: options.map((text, position) => ({ text, position })),
    },
    { include: [{ model: PollOption, as: 'options' }] },
  );
}

// Creates a participant. Pass pollId, or a poll is created for it.
async function createParticipant({ pollId, nickname = 'Noa', ...overrides } = {}) {
  const ownerPollId = pollId || (await createPoll()).id;

  return Participant.create({
    pollId: ownerPollId,
    nickname,
    nicknameKey: normalizeText(nickname),
    joinKey: randomUUID(),
    ...overrides,
  });
}

module.exports = { createUser, createPoll, createParticipant };
