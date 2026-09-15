const { z } = require('zod');
const { POLL_LIMITS, ANSWER_TYPES } = require('./pollRules');

const LINE_BREAK = /[\r\n]/;

// Only whitespace and invisible characters (zero-width spaces, joiners, BOM): counts as empty.
const BLANK = /^[\p{White_Space}\p{Default_Ignorable_Code_Point}]*$/u;

// Control characters and lone surrogates are rejected; details may keep tabs and line breaks.
const CONTROL_OR_LONE_SURROGATE = /[\p{Cc}\p{Cs}]/u;
const DETAILS_CONTROL_OR_LONE_SURROGATE = /(?![\t\n\r])[\p{Cc}\p{Cs}]/u;

// Trimmed, non-empty, single-line text up to `max` characters.
const singleLineText = (max) =>
  z
    .string()
    .trim()
    .min(1)
    .max(max)
    .refine((value) => !BLANK.test(value), { message: 'Must not be empty' })
    .refine((value) => !LINE_BREAK.test(value), { message: 'Must be a single line' })
    .refine((value) => !CONTROL_OR_LONE_SURROGATE.test(value), { message: 'Must not contain control characters' });

const normalizeOption = (text) => text.toLowerCase();

const createPollBody = z.strictObject({
  question: singleLineText(POLL_LIMITS.QUESTION_MAX_LENGTH),
  details: z
    .string()
    .trim()
    .max(POLL_LIMITS.DETAILS_MAX_LENGTH)
    .refine((value) => !DETAILS_CONTROL_OR_LONE_SURROGATE.test(value), {
      message: 'Must not contain control characters',
    })
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
