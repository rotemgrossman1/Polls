// Removes characters the API rejects, as they are typed or pasted: control characters, lone
// surrogates, and direction embedding, override and isolate characters. Tabs and line breaks stay;
// single-line fields turn them into spaces (toSingleLine).
const REJECTED = /(?![\t\n\r])[\p{Cc}\p{Cs}]|[\u202A-\u202E\u2066-\u2069]/gu;

export function cleanText(text) {
  return text.replace(REJECTED, '');
}
