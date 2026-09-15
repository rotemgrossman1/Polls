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

module.exports = { POLL_LIMITS, ANSWER_TYPES, POLL_STATUS };
