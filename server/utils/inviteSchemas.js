const { z } = require('zod');
const { INVITE_CODE_PATTERN } = require('./pollRules');
const { NICKNAME_MAX_LENGTH } = require('./participantRules');
const { singleLineText } = require('./textRules');

// Codes are case-sensitive, so the code is matched exactly as sent.
const inviteCodeParams = z.object({
  inviteCode: z.string().regex(INVITE_CODE_PATTERN),
});

const joinBody = z.strictObject({
  nickname: singleLineText(NICKNAME_MAX_LENGTH),
  joinKey: z.uuid(),
});

module.exports = { inviteCodeParams, joinBody };
