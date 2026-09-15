const request = require('supertest');
const createApp = require('../../app');

describe('app', () => {
  const app = createApp();

  test('unknown API route returns a 404 envelope', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.status).toBe(404);
    expect(res.body).toEqual({ data: null, error: 'Not found' });
  });

  test('malformed JSON returns 400 without internal details', async () => {
    const res = await request(app)
      .post('/api/does-not-exist')
      .set('Content-Type', 'application/json')
      .send('{"question": ');

    expect(res.status).toBe(400);
    expect(res.body).toEqual({ data: null, error: 'Invalid request' });
  });

  test('a body over the size limit returns 413', async () => {
    const res = await request(app)
      .post('/api/does-not-exist')
      .send({ question: 'x'.repeat(25 * 1024) });

    expect(res.status).toBe(413);
    expect(res.body).toEqual({ data: null, error: 'Request too large' });
  });

  test('sets security headers', async () => {
    const res = await request(app).get('/api/does-not-exist');

    expect(res.headers['x-content-type-options']).toBe('nosniff');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
