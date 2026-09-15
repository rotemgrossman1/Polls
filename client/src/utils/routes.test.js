import { ROUTES, invitePath, pollCreatedPath } from './routes';

describe('routes', () => {
  test('invite links use /i/ followed by the code', () => {
    expect(ROUTES.invite).toBe('/i/:inviteCode');
    expect(invitePath('q7Kx2Wm9aZ')).toBe('/i/q7Kx2Wm9aZ');
  });

  test('invitePath encodes the code so it cannot change the path', () => {
    expect(invitePath('../polls?x=1#y')).toBe('/i/..%2Fpolls%3Fx%3D1%23y');
  });

  test('pollCreatedPath encodes the poll id', () => {
    expect(pollCreatedPath('a/b')).toBe('/polls/a%2Fb/created');
  });
});
