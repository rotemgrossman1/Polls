import { removeInvisible, trimText } from './textRules';

const HEART = 'I \u2764\uFE0F';
const SCOTLAND_FLAG = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}';

describe('trimText', () => {
  test.each([
    ['spaces and zero-width characters', ' \u200B Lunch? \u2060\u200D ', 'Lunch?'],
    ['a BOM and a soft hyphen', '\uFEFFPizza\u00AD', 'Pizza'],
    ['nothing', 'Pizza', 'Pizza'],
  ])('removes %s at the edges', (label, input, expected) => {
    expect(trimText(input)).toBe(expected);
  });

  test('keeps invisible characters inside the text, and emoji variation selectors and flag tags at the end', () => {
    expect(trimText('Y\u200Bes')).toBe('Y\u200Bes');
    expect(trimText(HEART)).toBe(HEART);
    expect(trimText(SCOTLAND_FLAG)).toBe(SCOTLAND_FLAG);
  });
});

describe('removeInvisible', () => {
  test('removes zero-width characters anywhere but keeps spaces', () => {
    expect(removeInvisible('Ice\u200B cream\u2060')).toBe('Ice cream');
  });

  test('keeps emoji variation selectors and flag tags', () => {
    expect(removeInvisible(HEART)).toBe(HEART);
    expect(removeInvisible(SCOTLAND_FLAG)).toBe(SCOTLAND_FLAG);
  });
});
