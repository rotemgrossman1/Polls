import api from './api';
import { createPoll, getPoll } from './pollService';

jest.mock('./api', () => ({
  __esModule: true,
  default: { post: jest.fn(), get: jest.fn() },
}));

describe('pollService', () => {
  test('createPoll posts the payload and resolves with the created poll', async () => {
    const payload = {
      question: 'Lunch?',
      details: null,
      answerType: 'single',
      options: ['Pizza', 'Sushi'],
      clientRequestId: '0b7f1c3e-2a4d-4f6b-9c8e-1d2f3a4b5c6d',
    };
    api.post.mockResolvedValue({ id: 'poll-1' });

    await expect(createPoll(payload)).resolves.toEqual({ id: 'poll-1' });
    expect(api.post).toHaveBeenCalledWith('/polls', payload);
  });

  test('getPoll requests the poll by id', async () => {
    api.get.mockResolvedValue({ id: 'poll-1' });

    await expect(getPoll('poll-1')).resolves.toEqual({ id: 'poll-1' });
    expect(api.get).toHaveBeenCalledWith('/polls/poll-1');
  });

  test('getPoll encodes the id so it cannot change the path', async () => {
    api.get.mockResolvedValue({});

    await getPoll('../users');

    expect(api.get).toHaveBeenCalledWith('/polls/..%2Fusers');
  });

  test('passes API errors through', async () => {
    const error = new Error('Request failed with status 404');
    api.get.mockRejectedValue(error);

    await expect(getPoll('missing')).rejects.toBe(error);
  });
});
