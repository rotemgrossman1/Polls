const { z } = require('zod');
const { POLL_LIMITS, ANSWER_TYPES } = require('./pollRules');
const {
  isBlank,
  trimText,
  hasMultilineControl,
  noDirectionControl,
  withinLength,
  singleLineText,
  normalizeText,
} = require('./textRules');

const createPollBody = z.strictObject({
  question: singleLineText(POLL_LIMITS.QUESTION_MAX_LENGTH),
  details: z
    .string()
    .refine(noDirectionControl, { message: 'Must not contain direction controls' })
    .overwrite(trimText)
    .refine(withinLength(POLL_LIMITS.DETAILS_MAX_LENGTH), { message: 'Too long' })
    .refine((value) => !hasMultilineControl(value), {
      message: 'Must not contain control characters',
    })
    .nullish()
    .transform((value) => (value && !isBlank(value) ? value : null)),
  answerType: z.enum(ANSWER_TYPES),
  // Options must be unique ignoring case, Unicode composition and invisible characters.
  options: z
    .array(singleLineText(POLL_LIMITS.OPTION_MAX_LENGTH))
    .min(POLL_LIMITS.MIN_OPTIONS)
    .max(POLL_LIMITS.MAX_OPTIONS)
    .refine((options) => new Set(options.map(normalizeText)).size === options.length, {
      message: 'Options must be unique',
    }),
  clientRequestId: z.uuid(),
});

const pollIdParams = z.object({
  pollId: z.uuid(),
});

module.exports = { createPollBody, pollIdParams };
