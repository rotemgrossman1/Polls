const { UniqueConstraintError } = require('sequelize');
const { Poll, PollOption, Participant } = require('../models');
const { NicknameTakenError, PollNotFoundError } = require('../utils/httpErrors');
const { PARTICIPANT_CONSTRAINTS } = require('../utils/participantRules');
const { normalizeText } = require('../utils/textRules');

const INVITE_ATTRIBUTES = ['id', 'question', 'details', 'status'];

// Every code that doesn't open a poll gets the same error, so nobody can tell whether a poll exists.
async function findPollByInviteCode(inviteCode, attributes) {
  const poll = await Poll.findOne({ where: { inviteCode }, attributes });
  if (!poll) {
    throw new PollNotFoundError();
  }
  return poll;
}

function findParticipant(pollId, joinKey) {
  return Participant.findOne({ where: { pollId, joinKey }, attributes: ['nickname'] });
}

// What anyone with the invite link sees: no poll id, creator, options, or participants.
async function getInvite({ inviteCode }) {
  const poll = await findPollByInviteCode(inviteCode, INVITE_ATTRIBUTES);
  const optionCount = await PollOption.count({ where: { pollId: poll.id } });

  return { question: poll.question, details: poll.details, status: poll.status, optionCount };
}

// Joins the poll behind an invite code. A join key that already joined this poll gets that
// participant's nickname back (created: false), so double submits and retries never add a second
// participant and are never told their own nickname is taken.
async function joinPoll({ inviteCode, nickname, joinKey }) {
  const { id: pollId } = await findPollByInviteCode(inviteCode, ['id']);

  const existing = await findParticipant(pollId, joinKey);
  if (existing) {
    return { participant: { nickname: existing.nickname }, created: false };
  }

  try {
    const participant = await Participant.create({
      pollId,
      nickname,
      nicknameKey: normalizeText(nickname),
      joinKey,
    });
    return { participant: { nickname: participant.nickname }, created: true };
  } catch (err) {
    if (!(err instanceof UniqueConstraintError)) {
      throw err;
    }
    // Checked first: a concurrent join with the same key can fail on either unique constraint.
    const concurrent = await findParticipant(pollId, joinKey);
    if (concurrent) {
      return { participant: { nickname: concurrent.nickname }, created: false };
    }
    if (err.parent?.constraint === PARTICIPANT_CONSTRAINTS.NICKNAME) {
      throw new NicknameTakenError();
    }
    throw err;
  }
}

module.exports = { getInvite, joinPoll };
