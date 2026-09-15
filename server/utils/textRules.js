const { z } = require('zod');

// Text rules shared by every user-entered field (poll question, details, options, nickname).

// Line breaks, including the Unicode line and paragraph separators.
const LINE_BREAK = /[\r\n  ]/;

// Only whitespace and invisible characters (zero-width spaces, joiners, BOM): counts as empty.
const BLANK = /^[\p{White_Space}\p{Default_Ignorable_Code_Point}]*$/u;
const isBlank = (text) => BLANK.test(text);

// Invisible format characters, except variation selectors and tag characters, which belong to the
// emoji before them (a red heart, a flag).
const INVISIBLE_FORMAT = String.raw`(?:(?![\p{Variation_Selector}\u{E0000}-\u{E007F}])\p{Default_Ignorable_Code_Point})`;
const EDGE_SPACE_OR_INVISIBLE = new RegExp(
  String.raw`^(?:\p{White_Space}|${INVISIBLE_FORMAT})+|(?:\p{White_Space}|${INVISIBLE_FORMAT})+$`,
  'gu',
);
const INVISIBLE_ANYWHERE = new RegExp(INVISIBLE_FORMAT, 'gu');

// Leading and trailing spaces and invisible characters are removed before saving.
const trimText = (text) => text.replace(EDGE_SPACE_OR_INVISIBLE, '');

// Control characters and lone surrogates are rejected; multiline text may keep tabs and line breaks.
const CONTROL_OR_LONE_SURROGATE = /[\p{Cc}\p{Cs}]/u;
const MULTILINE_CONTROL_OR_LONE_SURROGATE = /(?![\t\n\r])[\p{Cc}\p{Cs}]/u;
const hasMultilineControl = (value) => MULTILINE_CONTROL_OR_LONE_SURROGATE.test(value);

// Direction embedding, override and isolate characters can disguise what text says, so they are
// rejected. Right-to-left and left-to-right marks stay allowed.
const DIRECTION_CONTROL = /[‪-‮⁦-⁩]/u;
const noDirectionControl = (value) => !DIRECTION_CONTROL.test(value);

// Length limits count UTF-16 units, like the form's maxLength (Zod's .max counts code points).
const withinLength = (max) => (value) => value.length <= max;

// Trimmed, non-empty, single-line text up to `max` characters.
const singleLineText = (max) =>
  z
    .string()
    .refine(noDirectionControl, { message: 'Must not contain direction controls' })
    .overwrite(trimText)
    .min(1)
    .refine(withinLength(max), { message: 'Too long' })
    .refine((value) => !isBlank(value), { message: 'Must not be empty' })
    .refine((value) => !LINE_BREAK.test(value), { message: 'Must be a single line' })
    .refine((value) => !CONTROL_OR_LONE_SURROGATE.test(value), { message: 'Must not contain control characters' });

// The form two texts are compared in: ignoring case, Unicode composition (precomposed "é" equals
// "e" + accent) and invisible characters ("Yes" equals "Y" + zero-width space + "es").
const normalizeText = (text) => text.replace(INVISIBLE_ANYWHERE, '').toLowerCase().normalize('NFC');

module.exports = {
  isBlank,
  trimText,
  hasMultilineControl,
  noDirectionControl,
  withinLength,
  singleLineText,
  normalizeText,
};
