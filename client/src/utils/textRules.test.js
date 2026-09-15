import { isBlank, removeInvisible, trimText } from './textRules';
import { NICKNAME_MAX_LENGTH, isBlankNickname } from './nicknameRules';

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

describe('isBlank', () => {
  test.each([
    ['empty text', ''],
    ['spaces, tabs and line breaks', ' \t\n '],
    ['zero-width characters and a BOM', '\u200B\u2060\uFEFF'],
    ['a no-break space and an ideographic space', '\u00A0\u3000'],
  ])('%s is blank', (label, text) => {
    expect(isBlank(text)).toBe(true);
  });

  test.each([
    ['a letter', ' a '],
    ['an emoji', '\u{1F33B}'],
    ['right-to-left text', 'נועה'],
  ])('%s is not blank', (label, text) => {
    expect(isBlank(text)).toBe(false);
  });
});

describe('nickname rules', () => {
  test('a nickname of spaces or invisible characters is blank, and the limit matches the API', () => {
    expect(isBlankNickname(' \u200B ')).toBe(true);
    expect(isBlankNickname('Noa')).toBe(false);
    expect(NICKNAME_MAX_LENGTH).toBe(20);
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
