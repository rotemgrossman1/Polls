import api from './api';
import { getInvite, joinPoll } from './inviteService';

jest.mock('./api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

const JOIN_KEY = '0b7f1c3e-2a4d-4f6b-9c8e-1d2f3a4b5c6d';

describe('inviteService', () => {
  test('getInvite requests the invite by code', async () => {
    const invite = { question: 'Lunch?', details: null, status: 'open', optionCount: 3 };
    api.get.mockResolvedValue(invite);

    await expect(getInvite('q7Kx2Wm9aZ')).resolves.toEqual(invite);
    expect(api.get).toHaveBeenCalledWith('/invites/q7Kx2Wm9aZ');
  });

  test('joinPoll posts the nickname and join key', async () => {
    api.post.mockResolvedValue({ nickname: 'Noa' });

    await expect(joinPoll('q7Kx2Wm9aZ', { nickname: 'Noa', joinKey: JOIN_KEY })).resolves.toEqual({
      nickname: 'Noa',
    });
    expect(api.post).toHaveBeenCalledWith('/invites/q7Kx2Wm9aZ/participants', {
      nickname: 'Noa',
      joinKey: JOIN_KEY,
    });
  });

  test('encodes the code so it cannot change the path', async () => {
    api.get.mockResolvedValue({});
    api.post.mockResolvedValue({});

    await getInvite('../polls');
    await joinPoll('../polls', { nickname: 'Noa', joinKey: JOIN_KEY });

    expect(api.get).toHaveBeenCalledWith('/invites/..%2Fpolls');
    expect(api.post).toHaveBeenCalledWith('/invites/..%2Fpolls/participants', expect.any(Object));
  });

  test('passes API errors through', async () => {
    const error = Object.assign(new Error('Request failed with status 409'), { status: 409 });
    api.post.mockRejectedValue(error);

    await expect(joinPoll('q7Kx2Wm9aZ', { nickname: 'Noa', joinKey: JOIN_KEY })).rejects.toBe(error);
  });
});
