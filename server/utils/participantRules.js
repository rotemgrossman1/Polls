// Participant limits shared by the model and validation schemas.
const NICKNAME_MAX_LENGTH = 20;

// Lowercasing can turn one character into several, so the comparison key gets more room.
const NICKNAME_KEY_MAX_LENGTH = 80;

// Unique constraints on participants (see the create-participants migration).
const PARTICIPANT_CONSTRAINTS = {
  NICKNAME: 'participants_poll_id_nickname_key_key',
  JOIN_KEY: 'participants_poll_id_join_key_key',
};

module.exports = { NICKNAME_MAX_LENGTH, NICKNAME_KEY_MAX_LENGTH, PARTICIPANT_CONSTRAINTS };
