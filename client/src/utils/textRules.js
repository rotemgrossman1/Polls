// Shared text rules for poll and nickname fields. Mirrors server/utils/textRules.js.

// Only whitespace and invisible characters (zero-width spaces, joiners, BOM): counts as empty.
const BLANK = /^[\p{White_Space}\p{Default_Ignorable_Code_Point}]*$/u;

export const isBlank = (text) => BLANK.test(text);

// Invisible format characters, except variation selectors and tag characters, which belong to the
// emoji before them (a red heart, a flag).
const INVISIBLE_FORMAT = String.raw`(?:(?![\p{Variation_Selector}\u{E0000}-\u{E007F}])\p{Default_Ignorable_Code_Point})`;
const EDGE_SPACE_OR_INVISIBLE = new RegExp(
  String.raw`^(?:\p{White_Space}|${INVISIBLE_FORMAT})+|(?:\p{White_Space}|${INVISIBLE_FORMAT})+$`,
  'gu',
);
const INVISIBLE_ANYWHERE = new RegExp(INVISIBLE_FORMAT, 'gu');

// Removes leading and trailing spaces and invisible characters.
export const trimText = (text) => text.replace(EDGE_SPACE_OR_INVISIBLE, '');

// Removes invisible characters anywhere in the text; spaces stay.
export const removeInvisible = (text) => text.replace(INVISIBLE_ANYWHERE, '');
