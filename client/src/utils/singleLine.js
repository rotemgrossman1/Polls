// Question and option fields are single line: typed or pasted line breaks become spaces.
export function toSingleLine(text) {
  return text.replace(/\r\n|\r|\n/g, ' ');
}
