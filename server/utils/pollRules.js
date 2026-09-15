// Poll limits and allowed values shared by models and validation schemas.
const POLL_LIMITS = {
  QUESTION_MAX_LENGTH: 200,
  DETAILS_MAX_LENGTH: 1000,
  OPTION_MAX_LENGTH: 100,
  MIN_OPTIONS: 2,
  MAX_OPTIONS: 8,
};

const ANSWER_TYPES = ['single', 'multiple'];

const POLL_STATUS = {
  OPEN: 'open',
  CLOSED: 'closed',
};

// Invite links end in a random, case-sensitive code of this many base62 characters, made by the
// database (see the add-invite-code-to-polls migration).
const INVITE_CODE_LENGTH = 10;
const INVITE_CODE_PATTERN = new RegExp(`^[0-9A-Za-z]{${INVITE_CODE_LENGTH}}$`);

module.exports = { POLL_LIMITS, ANSWER_TYPES, POLL_STATUS, INVITE_CODE_LENGTH, INVITE_CODE_PATTERN };
