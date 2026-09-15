const { randomUUID } = require('crypto');
const { createPollBody, pollIdParams } = require('../../utils/pollSchemas');

function validBody(overrides = {}) {
  return {
    question: 'Where should we eat on Friday?',
    answerType: 'single',
    options: ['Pizza', 'Sushi'],
    clientRequestId: randomUUID(),
    ...overrides,
  };
}

const parse = (body) => createPollBody.safeParse(body);

describe('createPollBody', () => {
  test('accepts a valid poll and trims text', () => {
    const result = parse(
      validBody({
        question: '  Where should we eat?  ',
        details: '  Team lunch.\nBudget is small.  ',
        options: [' Pizza ', 'Sushi  '],
      }),
    );

    expect(result.success).toBe(true);
    expect(result.data.question).toBe('Where should we eat?');
    expect(result.data.details).toBe('Team lunch.\nBudget is small.');
    expect(result.data.options).toEqual(['Pizza', 'Sushi']);
  });

  test.each([
    ['missing', undefined],
    ['null', null],
    ['empty', ''],
    ['only spaces', '   '],
  ])('turns %s details into null', (label, details) => {
    const result = parse(validBody({ details }));

    expect(result.success).toBe(true);
    expect(result.data.details).toBeNull();
  });

  test('details keep tabs and line breaks inside the text', () => {
    const result = parse(validBody({ details: 'Menu:\n\tPizza\r\n\tSushi' }));

    expect(result.success).toBe(true);
    expect(result.data.details).toBe('Menu:\n\tPizza\r\n\tSushi');
  });

  test('counts limits in UTF-16 units: 100 emoji question, 500 emoji details, 50 emoji option', () => {
    const emoji = '\u{1F600}';
    const result = parse(
      validBody({ question: emoji.repeat(100), details: emoji.repeat(500), options: [emoji.repeat(50), 'Sushi'] }),
    );

    expect(result.success).toBe(true);
  });

  test('trims spaces and invisible characters at the edges but keeps emoji variation selectors and flag tags', () => {
    const heart = 'I \u2764\uFE0F';
    const flag = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0073}\u{E0063}\u{E0074}\u{E007F}';
    const result = parse(
      validBody({
        question: '\u200B Lunch? \u2060',
        details: ' \u200DContext\u200B ',
        options: ['\uFEFFPizza\u00AD', heart, flag],
      }),
    );

    expect(result.success).toBe(true);
    expect(result.data.question).toBe('Lunch?');
    expect(result.data.details).toBe('Context');
    expect(result.data.options).toEqual(['Pizza', heart, flag]);
  });

  test('keeps invisible characters inside the text', () => {
    const result = parse(validBody({ question: 'Lun\u200Bch?' }));

    expect(result.data.question).toBe('Lun\u200Bch?');
  });

  test('details of only spaces and invisible characters become null', () => {
    const result = parse(validBody({ details: ' \u200B\u2060 ' }));

    expect(result.success).toBe(true);
    expect(result.data.details).toBeNull();
  });

  test('flags that differ only in their tag characters are not duplicates', () => {
    const england = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0065}\u{E006E}\u{E0067}\u{E007F}';
    const wales = '\u{1F3F4}\u{E0067}\u{E0062}\u{E0077}\u{E006C}\u{E0073}\u{E007F}';

    expect(parse(validBody({ options: [england, wales] })).success).toBe(true);
  });

  test('keeps right-to-left marks, which are not direction overrides', () => {
    const result = parse(validBody({ question: 'מה אוכלים\u200F?' }));

    expect(result.success).toBe(true);
    expect(result.data.question).toBe('מה אוכלים\u200F?');
  });

  test('accepts multiple choice', () => {
    expect(parse(validBody({ answerType: 'multiple' })).success).toBe(true);
  });

  test('accepts limits exactly: 200-char question, 1000-char details, 8 options of 100 chars', () => {
    const options = Array.from({ length: 8 }, (_, i) => `${i}`.padEnd(100, 'x'));
    const result = parse(
      validBody({ question: 'q'.repeat(200), details: 'd'.repeat(1000), options }),
    );

    expect(result.success).toBe(true);
  });

  test('keeps right-to-left text, emoji, and markup as entered', () => {
    const result = parse(
      validBody({ question: 'לאן נצא? 🍕', options: ['<script>alert(1)</script>', '<b>Sushi</b>'] }),
    );

    expect(result.success).toBe(true);
    expect(result.data.question).toBe('לאן נצא? 🍕');
    expect(result.data.options).toEqual(['<script>alert(1)</script>', '<b>Sushi</b>']);
  });

  test('keeps invisible characters that sit between visible ones', () => {
    const family = '\u{1F468}\u200D\u{1F469}\u200D\u{1F467}';
    const result = parse(validBody({ question: `Who comes? ${family}`, options: [family, 'Soft\u00ADhyphen'] }));

    expect(result.success).toBe(true);
    expect(result.data.options).toEqual([family, 'Soft\u00ADhyphen']);
  });

  test.each([
    ['empty question', { question: '' }],
    ['spaces-only question', { question: '    ' }],
    ['question of only zero-width spaces', { question: '\u200B\u200B\u200B' }],
    ['option of only zero-width joiners, word joiners, a BOM, and spaces', { options: ['Pizza', ' \u200D\u2060\uFEFF '] }],
    ['question over 200 characters', { question: 'q'.repeat(201) }],
    ['question of 101 emoji (202 UTF-16 units)', { question: '\u{1F600}'.repeat(101) }],
    ['option of 51 emoji (102 UTF-16 units)', { options: ['Pizza', '\u{1F600}'.repeat(51)] }],
    ['details of 501 emoji (1002 UTF-16 units)', { details: '\u{1F600}'.repeat(501) }],
    ['question with a line break', { question: 'Where\nshould we eat?' }],
    ['missing question', { question: undefined }],
    ['question with a null byte', { question: 'Lunch\u0000?' }],
    ['question with a tab inside', { question: 'Lunch\tnow?' }],
    ['option with an escape character', { options: ['Pizza', 'Sushi\u001B[31m'] }],
    ['option with a C1 control character', { options: ['Pizza', 'Su\u009Bshi'] }],
    ['option with a lone low surrogate', { options: ['Pizza', 'Su\uDC00shi'] }],
    ['details over 1000 characters', { details: 'd'.repeat(1001) }],
    ['details with a null byte', { details: 'Context\u0000here' }],
    ['details with a bell character', { details: 'Context\u0007' }],
    ['details with a lone high surrogate', { details: 'Context \uD800' }],
    ['unknown answer type', { answerType: 'ranked' }],
    ['one option', { options: ['Pizza'] }],
    ['nine options', { options: Array.from({ length: 9 }, (_, i) => `Option ${i}`) }],
    ['empty option', { options: ['Pizza', ''] }],
    ['spaces-only option', { options: ['Pizza', '   '] }],
    ['option over 100 characters', { options: ['Pizza', 'o'.repeat(101)] }],
    ['option with a line break', { options: ['Pizza', 'Su\nshi'] }],
    ['question with a paragraph separator', { question: 'Lunch\u2029today?' }],
    ['option with a line separator', { options: ['Pizza', 'Su\u2028shi'] }],
    ['options differing only in case and spaces', { options: ['Yes', ' yes'] }],
    ['options equal after Unicode normalization', { options: ['Café', 'CAFE\u0301'] }],
    ['options equal after ignoring invisible characters', { options: ['Yes', 'Y\u200BES'] }],
    ['question with a right-to-left override', { question: 'Lunch\u202E?' }],
    ['option with a left-to-right isolate', { options: ['Pizza', 'Su\u2066shi'] }],
    ['details with a pop directional formatting character', { details: 'Context\u202C here' }],
    ['question of only a left-to-right override', { question: '\u202D' }],
    ['non-string option', { options: ['Pizza', 42] }],
    ['options not an array', { options: 'Pizza,Sushi' }],
    ['invalid client request id', { clientRequestId: 'abc' }],
    ['missing client request id', { clientRequestId: undefined }],
    ['unknown field', { status: 'closed' }],
    ['creator id supplied by the client', { creatorId: randomUUID() }],
  ])('rejects %s', (label, overrides) => {
    expect(parse(validBody(overrides)).success).toBe(false);
  });

  test('rejects a non-object body', () => {
    expect(parse(undefined).success).toBe(false);
    expect(parse(['Pizza']).success).toBe(false);
  });
});

describe('pollIdParams', () => {
  test('accepts a UUID', () => {
    expect(pollIdParams.safeParse({ pollId: randomUUID() }).success).toBe(true);
  });

  test.each(['123', 'not-a-uuid', ''])('rejects %p', (pollId) => {
    expect(pollIdParams.safeParse({ pollId }).success).toBe(false);
  });
});
