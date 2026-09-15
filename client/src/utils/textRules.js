// Text rules for comparing options. Mirrors server/utils/pollSchemas.js.

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
