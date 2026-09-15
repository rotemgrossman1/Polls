const { randomUUID } = require('crypto');
const { inviteCodeParams, joinBody } = require('../../utils/inviteSchemas');

describe('inviteCodeParams', () => {
  test('accepts 10 base62 characters and keeps their case', () => {
    const result = inviteCodeParams.safeParse({ inviteCode: 'q7Kx2Wm9aZ' });

    expect(result.success).toBe(true);
    expect(result.data.inviteCode).toBe('q7Kx2Wm9aZ');
  });

  test.each([
    ['empty', ''],
    ['cut off', 'q7Kx2Wm9a'],
    ['too long', 'q7Kx2Wm9aZ1'],
    ['with a dash', 'q7Kx2Wm9a-'],
    ['with a trailing space', 'q7Kx2Wm9a '],
    ['with an accented letter', 'q7Kx2Wm9aé'],
    ['a path', '../../etc/'],
  ])('rejects a code that is %s', (label, inviteCode) => {
    expect(inviteCodeParams.safeParse({ inviteCode }).success).toBe(false);
  });
});

describe('joinBody', () => {
  const parse = (overrides = {}) => joinBody.safeParse({ nickname: 'Noa', joinKey: randomUUID(), ...overrides });

  test('trims spaces and invisible characters at the edges of the nickname', () => {
    expect(parse({ nickname: '  Noa  ' }).data.nickname).toBe('Noa');
    expect(parse({ nickname: '\u200BNoa\u2060' }).data.nickname).toBe('Noa');
  });

  test.each([
    ['20 characters', 'n'.repeat(20)],
    ['10 emoji (20 UTF-16 units)', '\u{1F600}'.repeat(10)],
    ['right-to-left text with a right-to-left mark inside', 'נועה\u200F!'],
    ['an emoji family joined by zero-width joiners', 'Noa \u{1F468}\u200D\u{1F469}'],
    ['markup, kept as text', '<b>Noa</b>'],
  ])('accepts a nickname of %s', (label, nickname) => {
    const result = parse({ nickname });

    expect(result.success).toBe(true);
    expect(result.data.nickname).toBe(nickname);
  });

  test.each([
    ['an empty nickname', { nickname: '' }],
    ['a spaces-only nickname', { nickname: '   ' }],
    ['an invisible-only nickname', { nickname: '\u200B\u2060\uFEFF' }],
    ['a nickname over 20 characters', { nickname: 'n'.repeat(21) }],
    ['a nickname of 11 emoji (22 UTF-16 units)', { nickname: '\u{1F600}'.repeat(11) }],
    ['a line break', { nickname: 'No\na' }],
    ['a line separator', { nickname: 'No\u2028a' }],
    ['a tab', { nickname: 'No\ta' }],
    ['a control character', { nickname: 'No\u0007a' }],
    ['a lone surrogate', { nickname: 'No\uD800a' }],
    ['a direction override', { nickname: 'No\u202Ea' }],
    ['a non-string nickname', { nickname: 42 }],
    ['a missing nickname', { nickname: undefined }],
    ['a missing join key', { joinKey: undefined }],
    ['an invalid join key', { joinKey: 'not-a-uuid' }],
    ['an unknown field', { pollId: randomUUID() }],
  ])('rejects %s', (label, overrides) => {
    expect(parse(overrides).success).toBe(false);
  });

  test('rejects a non-object body', () => {
    expect(joinBody.safeParse(undefined).success).toBe(false);
    expect(joinBody.safeParse(['Noa']).success).toBe(false);
  });
});
