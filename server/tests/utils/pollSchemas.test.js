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
    ['question with a line break', { question: 'Where\nshould we eat?' }],
    ['missing question', { question: undefined }],
    ['details over 1000 characters', { details: 'd'.repeat(1001) }],
    ['unknown answer type', { answerType: 'ranked' }],
    ['one option', { options: ['Pizza'] }],
    ['nine options', { options: Array.from({ length: 9 }, (_, i) => `Option ${i}`) }],
    ['empty option', { options: ['Pizza', ''] }],
    ['spaces-only option', { options: ['Pizza', '   '] }],
    ['option over 100 characters', { options: ['Pizza', 'o'.repeat(101)] }],
    ['option with a line break', { options: ['Pizza', 'Su\nshi'] }],
    ['options differing only in case and spaces', { options: ['Yes', ' yes'] }],
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
