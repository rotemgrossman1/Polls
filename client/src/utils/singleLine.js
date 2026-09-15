// Question and option fields are single line: typed or pasted line breaks (including the Unicode
// line and paragraph separators) and tabs become spaces.
export function toSingleLine(text) {
  return text.replace(/\r\n|[\r\n\t\u2028\u2029]/g, ' ');
}
