const { randomUUID } = require('crypto');
const request = require('supertest');
const createApp = require('../../app');
const { Participant } = require('../../models');
const { resetDatabase, closeDatabase } = require('../helpers/db');
const { createPoll } = require('../helpers/factories');

const INVITE_CODE = 'q7Kx2Wm9aZ';
const originalUsername = process.env.TEST_USER_USERNAME;

const NOT_FOUND_BODY = { data: null, error: 'Poll not found' };

// The parts of a response that could tell one non-working link from another.
function visibleResponse(res) {
  return {
    status: res.status,
    body: res.body,
    contentType: res.headers['content-type'],
    contentLength: res.headers['content-length'],
    robots: res.headers['x-robots-tag'],
  };
}

describe('/api/invites', () => {
  const app = createApp();
  let poll;

  beforeEach(async () => {
    await resetDatabase();
    // Invite links are public, so these tests run without a logged-in user.
    process.env.TEST_USER_USERNAME = 'nobody';
    poll = await createPoll({
      inviteCode: INVITE_CODE,
      details: 'Team lunch.',
      options: ['Pizza', 'Sushi', 'Tacos'],
    });
  });

  afterEach(() => {
    // Assigning undefined to process.env stores the string "undefined", so delete instead.
    if (originalUsername === undefined) {
      delete process.env.TEST_USER_USERNAME;
    } else {
      process.env.TEST_USER_USERNAME = originalUsername;
    }
  });

  afterAll(closeDatabase);

  describe('GET /api/invites/:inviteCode', () => {
    test('returns the question, details, status and number of options to anyone', async () => {
      const res = await request(app).get(`/api/invites/${INVITE_CODE}`);

      expect(res.status).toBe(200);
      expect(res.body).toEqual({
        data: {
          question: 'Where should we eat on Friday?',
          details: 'Team lunch.',
          status: 'open',
          optionCount: 3,
        },
        error: null,
      });
      expect(res.headers['x-robots-tag']).toBe('noindex');
    });

    test('never exposes the poll id, the creator, the options or the answer type', async () => {
      const res = await request(app).get(`/api/invites/${INVITE_CODE}`);

      expect(res.text).not.toContain(poll.id);
      expect(res.text).not.toContain(poll.creatorId);
      expect(res.text).not.toContain('Pizza');
      expect(res.text).not.toContain('single');
    });

    test('a query string added by a chat app still opens the poll', async () => {
      const res = await request(app).get(`/api/invites/${INVITE_CODE}?utm_source=chat&fbclid=abc`);

      expect(res.status).toBe(200);
      expect(res.body.data.optionCount).toBe(3);
    });

    test.each([
      ['an unknown code', '/api/invites/Zz9aB8cD7e'],
      ['the code with its letter case changed', '/api/invites/Q7kX2wM9Az'],
      ['a cut-off code', '/api/invites/q7Kx2Wm9a'],
      ['a code with an extra character', '/api/invites/q7Kx2Wm9aZZ'],
      ['a code with a symbol', '/api/invites/q7Kx2Wm9a%21'],
      ['an encoded path', '/api/invites/..%2F..%2Fpolls'],
      ['an extra path segment', `/api/invites/${INVITE_CODE}/extra`],
      ['no code', '/api/invites/'],
    ])('answers %s exactly like every other link that opens no poll', async (label, path) => {
      const baseline = visibleResponse(await request(app).get('/api/invites/Aa0Bb1Cc2D'));

      const res = visibleResponse(await request(app).get(path));

      expect(baseline).toEqual({
        status: 404,
        body: NOT_FOUND_BODY,
        contentType: expect.stringContaining('application/json'),
        contentLength: expect.any(String),
        robots: 'noindex',
      });
      expect(res).toEqual(baseline);
    });
  });

  describe('POST /api/invites/:inviteCode/participants', () => {
    const joinPath = `/api/invites/${INVITE_CODE}/participants`;
    const body = (overrides = {}) => ({ nickname: 'Noa', joinKey: randomUUID(), ...overrides });

    test('joins with the trimmed nickname and returns 201', async () => {
      const joinKey = randomUUID();

      const res = await request(app).post(joinPath).send(body({ nickname: '  Noa\u200B ', joinKey }));

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ data: { nickname: 'Noa' }, error: null });
      expect(res.headers['x-robots-tag']).toBe('noindex');
      const stored = await Participant.findOne({ where: { joinKey } });
      expect(stored.pollId).toBe(poll.id);
      expect(stored.nickname).toBe('Noa');
    });

    test('a repeated join key returns 200 with the original nickname and saves nothing new', async () => {
      const joinKey = randomUUID();
      await request(app).post(joinPath).send(body({ nickname: 'Noa', joinKey }));

      const retry = await request(app).post(joinPath).send(body({ nickname: 'Dan', joinKey }));

      expect(retry.status).toBe(200);
      expect(retry.body).toEqual({ data: { nickname: 'Noa' }, error: null });
      expect(await Participant.count()).toBe(1);
    });

    test.each([' noa', 'NOA', 'N\u200Boa'])(
      'returns 409 for %p when "Noa" already joined, and saves nothing',
      async (nickname) => {
        await request(app).post(joinPath).send(body({ nickname: 'Noa' }));

        const res = await request(app).post(joinPath).send(body({ nickname }));

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ data: null, error: 'Nickname taken' });
        expect(await Participant.count()).toBe(1);
      },
    );

    test('the same nickname can join another poll', async () => {
      const otherPoll = await createPoll();
      await request(app).post(joinPath).send(body());

      const res = await request(app).post(`/api/invites/${otherPoll.inviteCode}/participants`).send(body());

      expect(res.status).toBe(201);
    });

    test('parallel joins with the same nickname save exactly one participant', async () => {
      const responses = await Promise.all(
        Array.from({ length: 5 }, () => request(app).post(joinPath).send(body())),
      );

      expect(await Participant.count()).toBe(1);
      expect(responses.filter((res) => res.status === 201)).toHaveLength(1);
      expect(responses.filter((res) => res.status === 409)).toHaveLength(4);
    });

    test('parallel retries with the same join key save one participant and never return 409', async () => {
      const payload = body();

      const responses = await Promise.all(
        Array.from({ length: 5 }, () => request(app).post(joinPath).send(payload)),
      );

      expect(await Participant.count()).toBe(1);
      expect(responses.filter((res) => res.status === 201)).toHaveLength(1);
      expect(responses.filter((res) => res.status === 200)).toHaveLength(4);
    });

    test('stores markup in a nickname as plain text', async () => {
      const res = await request(app).post(joinPath).send(body({ nickname: '<b>Noa</b>' }));

      expect(res.status).toBe(201);
      expect(res.body.data.nickname).toBe('<b>Noa</b>');
    });

    test.each([
      ['an empty nickname', { nickname: '' }],
      ['a spaces-only nickname', { nickname: '   ' }],
      ['an invisible-only nickname', { nickname: '\u200B\u2060' }],
      ['a nickname over 20 characters', { nickname: 'n'.repeat(21) }],
      ['a line break in the nickname', { nickname: 'No\na' }],
      ['a tab in the nickname', { nickname: 'No\ta' }],
      ['a direction override in the nickname', { nickname: 'No\u202Ea' }],
      ['an invalid join key', { joinKey: 'abc' }],
      ['a missing join key', { joinKey: undefined }],
      ['a client-supplied poll id', { pollId: randomUUID() }],
    ])('rejects %s with 400 and saves nothing', async (label, overrides) => {
      const res = await request(app).post(joinPath).send(body(overrides));

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ data: null, error: 'Invalid request' });
      expect(await Participant.count()).toBe(0);
    });

    test('rejects a request with no body with 400', async () => {
      const res = await request(app).post(joinPath);

      expect(res.status).toBe(400);
      expect(res.body).toEqual({ data: null, error: 'Invalid request' });
    });

    test('rejects an oversized body with 413', async () => {
      const res = await request(app).post(joinPath).send(body({ nickname: 'n'.repeat(25 * 1024) }));

      expect(res.status).toBe(413);
      expect(res.body).toEqual({ data: null, error: 'Request too large' });
    });

    test.each([
      ['an unknown code', 'Zz9aB8cD7e'],
      ['the code with its letter case changed', 'Q7kX2wM9Az'],
      ['a malformed code', 'q7Kx2'],
    ])('returns the same 404 for %s and saves nothing', async (label, inviteCode) => {
      const res = await request(app).post(`/api/invites/${inviteCode}/participants`).send(body());

      expect(res.status).toBe(404);
      expect(res.body).toEqual(NOT_FOUND_BODY);
      expect(await Participant.count()).toBe(0);
    });

    test('a malformed code with an invalid body still gets the 404', async () => {
      const res = await request(app).post('/api/invites/bad/participants').send({});

      expect(res.status).toBe(404);
      expect(res.body).toEqual(NOT_FOUND_BODY);
    });
  });
});
