import { cleanText } from './cleanText';

describe('cleanText', () => {
  test.each([
    ['a null byte', 'Lunch\u0000?', 'Lunch?'],
    ['a bell character', 'Lunch\u0007?', 'Lunch?'],
    ['an escape character', 'Sushi\u001B[31m', 'Sushi[31m'],
    ['a delete character', 'Su\u007Fshi', 'Sushi'],
    ['a C1 control character', 'Su\u009Bshi', 'Sushi'],
    ['a lone high surrogate', 'Lunch \uD800?', 'Lunch ?'],
    ['a lone low surrogate', 'Lunch \uDC00?', 'Lunch ?'],
    ['a right-to-left override', 'abc\u202Edef', 'abcdef'],
    ['left-to-right isolate characters', 'a\u2066b\u2069c', 'abc'],
  ])('removes %s', (label, input, expected) => {
    expect(cleanText(input)).toBe(expected);
  });

  test('keeps right-to-left marks', () => {
    expect(cleanText('מה\u200F?')).toBe('מה\u200F?');
  });

  test('keeps tabs, line breaks, emoji, and right-to-left text', () => {
    const text = 'Menu:\r\n\t\u{1F355} פיצה\n\t\u{1F468}\u200D\u{1F469}';

    expect(cleanText(text)).toBe(text);
  });
});
