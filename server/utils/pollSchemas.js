const { z } = require('zod');
const { POLL_LIMITS, ANSWER_TYPES } = require('./pollRules');

// Line breaks, including the Unicode line and paragraph separators.
const LINE_BREAK = /[\r\n\u2028\u2029]/;

// Only whitespace and invisible characters (zero-width spaces, joiners, BOM): counts as empty.
const BLANK = /^[\p{White_Space}\p{Default_Ignorable_Code_Point}]*$/u;

// Control characters and lone surrogates are rejected; details may keep tabs and line breaks.
const CONTROL_OR_LONE_SURROGATE = /[\p{Cc}\p{Cs}]/u;
const DETAILS_CONTROL_OR_LONE_SURROGATE = /(?![\t\n\r])[\p{Cc}\p{Cs}]/u;

// Length limits count UTF-16 units, like the form's maxLength (Zod's .max counts code points).
const withinLength = (max) => (value) => value.length <= max;

// Trimmed, non-empty, single-line text up to `max` characters.
const singleLineText = (max) =>
  z
    .string()
    .trim()
    .min(1)
    .refine(withinLength(max), { message: 'Too long' })
    .refine((value) => !BLANK.test(value), { message: 'Must not be empty' })
    .refine((value) => !LINE_BREAK.test(value), { message: 'Must be a single line' })
    .refine((value) => !CONTROL_OR_LONE_SURROGATE.test(value), { message: 'Must not contain control characters' });

// Options match ignoring case and Unicode composition (precomposed "é" equals "e" + accent).
const normalizeOption = (text) => text.toLowerCase().normalize('NFC');

const createPollBody = z.strictObject({
  question: singleLineText(POLL_LIMITS.QUESTION_MAX_LENGTH),
  details: z
    .string()
    .trim()
    .refine(withinLength(POLL_LIMITS.DETAILS_MAX_LENGTH), { message: 'Too long' })
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
