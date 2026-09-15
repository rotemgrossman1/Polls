// Removes characters the API rejects, as they are typed or pasted: control characters and lone
// surrogates. Tabs and line breaks stay; single-line fields turn them into spaces (toSingleLine).
const CONTROL_OR_LONE_SURROGATE = /(?![\t\n\r])[\p{Cc}\p{Cs}]/gu;

export function cleanText(text) {
  return text.replace(CONTROL_OR_LONE_SURROGATE, '');
}
