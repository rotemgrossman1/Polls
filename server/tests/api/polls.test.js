const { randomUUID } = require('crypto');
const request = require('supertest');
const createApp = require('../../app');
const { Poll } = require('../../models');
const { resetDatabase, closeDatabase } = require('../helpers/db');
const { createUser, createPoll } = require('../helpers/factories');

const originalUsername = process.env.TEST_USER_USERNAME;

function validBody(overrides = {}) {
  return {
    question: 'Where should we eat on Friday?',
    answerType: 'single',
    options: ['Pizza', 'Sushi'],
    clientRequestId: randomUUID(),
    ...overrides,
  };
}

describe('/api/polls', () => {
  const app = createApp();
  let user;

  beforeEach(async () => {
    await resetDatabase();
    user = await createUser();
    process.env.TEST_USER_USERNAME = user.username;
  });

  afterEach(() => {
    process.env.TEST_USER_USERNAME = originalUsername;
  });

  afterAll(closeDatabase);

  describe('POST /api/polls', () => {
    test('creates an open poll for the logged-in user and returns 201', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send(
          validBody({
            question: '  Where should we eat on Friday?  ',
            details: '  Team lunch.\nBudget is small.  ',
            answerType: 'multiple',
            options: [' Tacos ', 'Pizza', 'Sushi  '],
          }),
        );

      expect(res.status).toBe(201);
      expect(res.body.error).toBeNull();
      expect(res.body.data).toEqual({
        id: expect.any(String),
        question: 'Where should we eat on Friday?',
        details: 'Team lunch.\nBudget is small.',
        answerType: 'multiple',
        status: 'open',
        createdAt: expect.any(String),
        options: [
          { id: expect.any(String), text: 'Tacos', position: 0 },
          { id: expect.any(String), text: 'Pizza', position: 1 },
          { id: expect.any(String), text: 'Sushi', position: 2 },
        ],
      });

      const stored = await Poll.findByPk(res.body.data.id);
      expect(stored.creatorId).toBe(user.id);
    });

    test('does not expose the creator id or client request id', async () => {
      const res = await request(app).post('/api/polls').send(validBody());

      expect(res.body.data).not.toHaveProperty('creatorId');
      expect(res.body.data).not.toHaveProperty('clientRequestId');
    });

    test('saves no details when none are sent', async () => {
      const res = await request(app).post('/api/polls').send(validBody({ details: null }));

      expect(res.status).toBe(201);
      expect(res.body.data.details).toBeNull();
    });

    test('stores markup and script text verbatim as plain text', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send(validBody({ question: '<script>alert(1)</script>', options: ['<b>Yes</b>', 'No'] }));

      expect(res.status).toBe(201);
      expect(res.body.data.question).toBe('<script>alert(1)</script>');
      expect(res.body.data.options[0].text).toBe('<b>Yes</b>');
    });

    test('a retry with the same client request id returns the existing poll with 200', async () => {
      const body = validBody();
      const first = await request(app).post('/api/polls').send(body);

      const retry = await request(app).post('/api/polls').send(body);

      expect(retry.status).toBe(200);
      expect(retry.body.data.id).toBe(first.body.data.id);
      expect(await Poll.count()).toBe(1);
    });

    test('parallel identical submissions create exactly one poll', async () => {
      const body = validBody();

      const responses = await Promise.all(
        Array.from({ length: 5 }, () => request(app).post('/api/polls').send(body)),
      );

      expect(await Poll.count()).toBe(1);
      expect(responses.filter((res) => res.status === 201)).toHaveLength(1);
      expect(responses.filter((res) => res.status === 200)).toHaveLength(4);
    });

    test.each([
      ['an empty question', { question: '' }],
      ['a spaces-only question', { question: '   ' }],
      ['a question over 200 characters', { question: 'q'.repeat(201) }],
      ['details over 1000 characters', { details: 'd'.repeat(1001) }],
      ['an unknown answer type', { answerType: 'ranked' }],
      ['one option', { options: ['Pizza'] }],
      ['nine options', { options: Array.from({ length: 9 }, (_, i) => `Option ${i}`) }],
      ['a spaces-only option', { options: ['Pizza', '   '] }],
      ['an option over 100 characters', { options: ['Pizza', 'o'.repeat(101)] }],
      ['duplicate options ignoring case and spaces', { options: ['Yes', ' yes'] }],
      ['a line break in an option', { options: ['Pizza', 'Su\nshi'] }],
      ['an invalid client request id', { clientRequestId: 'not-a-uuid' }],
      ['a client-supplied creator id', { creatorId: randomUUID() }],
      ['a client-supplied status', { status: 'closed' }],
    ])('rejects %s with 400 and saves nothing', async (label, overrides) => {
      const res = await request(app).post('/api/polls').send(validBody(overrides));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ data: null, error: 'Invalid request' });
      expect(await Poll.count()).toBe(0);
    });

    test('rejects a request with no body with 400', async () => {
      const res = await request(app).post('/api/polls');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ data: null, error: 'Invalid request' });
    });

    test('rejects malformed JSON with 400', async () => {
      const res = await request(app)
        .post('/api/polls')
        .set('Content-Type', 'application/json')
        .send('{"question": "Lunch?"');

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ data: null, error: 'Invalid request' });
    });

    test('rejects an oversized body with 413', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send(validBody({ details: 'd'.repeat(25 * 1024) }));

      expect(res.status).toBe(413);
      expect(res.body).toEqual({ data: null, error: 'Request too large' });
    });

    test('rejects the request with 401 and saves nothing when there is no logged-in user', async () => {
      process.env.TEST_USER_USERNAME = 'nobody';

      const res = await request(app).post('/api/polls').send(validBody());

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ data: null, error: 'Authentication required' });
      expect(await Poll.count()).toBe(0);
    });
  });

  describe('GET /api/polls/:pollId', () => {
    test("returns the user's own poll with options in saved order", async () => {
      const created = await request(app)
        .post('/api/polls')
        .send(validBody({ options: ['Sushi', 'Pizza', 'Tacos'] }));

      const res = await request(app).get(`/api/polls/${created.body.data.id}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({ data: created.body.data, error: null });
      expect(res.body.data.options.map((option) => option.text)).toEqual(['Sushi', 'Pizza', 'Tacos']);
    });

    test("answers another user's poll exactly like a missing poll", async () => {
      const foreignPoll = await createPoll();

      const foreign = await request(app).get(`/api/polls/${foreignPoll.id}`);
      const missing = await request(app).get(`/api/polls/${randomUUID()}`);

      expect(foreign.status).toBe(404);
      expect(foreign.body).toEqual({ data: null, error: 'Poll not found' });
      expect(missing.status).toBe(404);
      expect(missing.body).toEqual(foreign.body);
    });

    test.each(['abc', '123', 'not-a-uuid'])('returns 404 for the malformed id %p', async (pollId) => {
      const res = await request(app).get(`/api/polls/${pollId}`);

      expect(res.status).toBe(404);
      expect(res.body).toEqual({ data: null, error: 'Poll not found' });
    });

    test('returns 401 when there is no logged-in user', async () => {
      const poll = await createPoll({ creatorId: user.id });
      process.env.TEST_USER_USERNAME = 'nobody';

      const res = await request(app).get(`/api/polls/${poll.id}`);

      expect(res.status).toBe(401);
      expect(res.body).toEqual({ data: null, error: 'Authentication required' });
    });
  });
});
