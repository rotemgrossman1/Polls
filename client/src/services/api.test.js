import { AxiosError } from 'axios';
import api, { ApiError } from './api';

const originalAdapter = api.defaults.adapter;

// Replaces the HTTP layer with a fake that records the request and answers.
function respondWith(status, body) {
  const requests = [];
  api.defaults.adapter = async (config) => {
    requests.push(config);
    const response = { data: body, status, statusText: '', headers: {}, config };
    if (status >= 400) {
      throw new AxiosError('Request failed', AxiosError.ERR_BAD_RESPONSE, config, null, response);
    }
    return response;
  };
  return requests;
}

describe('api', () => {
  afterEach(() => {
    api.defaults.adapter = originalAdapter;
  });

  test('sends requests to the configured API base URL as JSON', async () => {
    const requests = respondWith(200, { data: {}, error: null });

    await api.post('/polls', { question: 'Lunch?' });

    expect(requests[0].baseURL).toBe('http://api.test/api');
    expect(requests[0].url).toBe('/polls');
    expect(requests[0].headers['Content-Type']).toBe('application/json');
  });

  test('unwraps the data from the response envelope', async () => {
    respondWith(201, { data: { id: 'poll-1' }, error: null });

    await expect(api.post('/polls', {})).resolves.toEqual({ id: 'poll-1' });
  });

  test('rejects with an ApiError carrying only the status', async () => {
    respondWith(404, { data: null, error: 'Poll not found' });

    const error = await api.get('/polls/abc').catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBe(404);
    expect(error.message).not.toContain('Poll not found');
  });

  test('rejects with a null status when there is no response', async () => {
    api.defaults.adapter = async (config) => {
      throw new AxiosError('Network Error', AxiosError.ERR_NETWORK, config);
    };

    const error = await api.get('/polls/abc').catch((err) => err);

    expect(error).toBeInstanceOf(ApiError);
    expect(error.status).toBeNull();
  });
});
