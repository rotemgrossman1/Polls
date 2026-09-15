const { UniqueConstraintError } = require('sequelize');
const { sequelize, Poll, PollOption } = require('../models');
const { PollNotFoundError } = require('../utils/httpErrors');
const { POLL_STATUS } = require('../utils/pollRules');

const POLL_ATTRIBUTES = ['id', 'question', 'details', 'answerType', 'status', 'createdAt'];
const OPTION_ATTRIBUTES = ['id', 'text', 'position'];
const CLIENT_REQUEST_CONSTRAINT = 'polls_creator_id_client_request_id_key';

function findPoll(where) {
  return Poll.findOne({
    where,
    attributes: POLL_ATTRIBUTES,
    include: [{ model: PollOption, as: 'options', attributes: OPTION_ATTRIBUTES }],
    order: [[{ model: PollOption, as: 'options' }, 'position', 'ASC']],
  });
}

// The poll as clients see it: no creator id or client request id.
function toPollDto(poll) {
  return {
    id: poll.id,
    question: poll.question,
    details: poll.details,
    answerType: poll.answerType,
    status: poll.status,
    createdAt: poll.createdAt,
    options: poll.options.map((option) => ({
      id: option.id,
      text: option.text,
      position: option.position,
    })),
  };
}

function isClientRequestConflict(err) {
  return err instanceof UniqueConstraintError && err.parent?.constraint === CLIENT_REQUEST_CONSTRAINT;
}

// Creates an open poll with its options in display order. A repeat of the same
// clientRequestId by the same creator returns the poll already created (created: false).
async function createPoll({ creatorId, question, details, answerType, options, clientRequestId }) {
  const existing = await findPoll({ creatorId, clientRequestId });
  if (existing) {
    return { poll: toPollDto(existing), created: false };
  }

  try {
    const pollId = await sequelize.transaction(async (transaction) => {
      const poll = await Poll.create(
        { creatorId, question, details, answerType, status: POLL_STATUS.OPEN, clientRequestId },
        { transaction },
      );
      await PollOption.bulkCreate(
        options.map((text, position) => ({ pollId: poll.id, text, position })),
        { transaction },
      );
      return poll.id;
    });

    return { poll: toPollDto(await findPoll({ id: pollId })), created: true };
  } catch (err) {
    // A concurrent request with the same clientRequestId committed first.
    if (isClientRequestConflict(err)) {
      const concurrent = await findPoll({ creatorId, clientRequestId });
      if (concurrent) {
        return { poll: toPollDto(concurrent), created: false };
      }
    }
    throw err;
  }
}

async function getPollForCreator({ pollId, creatorId }) {
  const poll = await findPoll({ id: pollId, creatorId });
  if (!poll) {
    throw new PollNotFoundError();
  }
  return toPollDto(poll);
}

module.exports = { createPoll, getPollForCreator };
