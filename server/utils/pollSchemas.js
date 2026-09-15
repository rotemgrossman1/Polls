const { z } = require('zod');
const { POLL_LIMITS, ANSWER_TYPES } = require('./pollRules');

const LINE_BREAK = /[\r\n]/;

// Trimmed, non-empty, single-line text up to `max` characters.
const singleLineText = (max) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !LINE_BREAK.test(value), { message: 'Must be a single line' });

const normalizeOption = (text) => text.toLowerCase();

const createPollBody = z.strictObject({
  question: singleLineText(POLL_LIMITS.QUESTION_MAX_LENGTH),
  details: z
    .string()
    .trim()
    .max(POLL_LIMITS.DETAILS_MAX_LENGTH)
    .nullish()
    .transform((value) => value || null),
  answerType: z.enum(ANSWER_TYPES),
  options: z
    .array(singleLineText(POLL_LIMITS.OPTION_MAX_LENGTH))
    .min(POLL_LIMITS.MIN_OPTIONS)
    .max(POLL_LIMITS.MAX_OPTIONS)
    .refine((options) => new Set(options.map(normalizeOption)).size === options.length, {
      message: 'Options must be unique',
    }),
  clientRequestId: z.uuid(),
});

const pollIdParams = z.object({
  pollId: z.uuid(),
});

module.exports = { createPollBody, pollIdParams };
