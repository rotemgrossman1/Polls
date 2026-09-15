import { buildInviteLink } from './inviteLink';

describe('buildInviteLink', () => {
  test("is the app's own address followed by the invite path", () => {
    expect(buildInviteLink('q7Kx2Wm9aZ')).toBe(`${window.location.origin}/i/q7Kx2Wm9aZ`);
  });

  test('encodes the code', () => {
    expect(buildInviteLink('a/b')).toBe(`${window.location.origin}/i/a%2Fb`);
  });
});
