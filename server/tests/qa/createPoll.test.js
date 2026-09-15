// QA adversarial integration tests for Create poll (POST/GET /api/polls).
// Oracle: specs/features/2026-09-14-create-poll.md and the QA Report's captain answers.
const { randomUUID } = require('crypto');
const request = require('supertest');
const createApp = require('../../app');
const { Poll, PollOption } = require('../../models');
const { resetDatabase, closeDatabase } = require('../helpers/db');
const { createUser } = require('../helpers/factories');

const INVALID = 'Invalid request';
const NOT_FOUND = 'Poll not found';
// Anything that would reveal internals: stacks, ORM or SQL text, file paths.
const INTERNALS = /stack|sequelize|postgres|syntax error|violates|node_modules|[A-Za-z]:\\|\/server\/|\bat \S+ \(/i;

const originalUsername = process.env.TEST_USER_USERNAME;
const originalClientUrl = process.env.CLIENT_URL;

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

function actAs(user) {
  process.env.TEST_USER_USERNAME = user.username;
}

function pollBody(overrides = {}) {
  return {
    question: `Where should we eat? ${randomUUID()}`,
    answerType: 'single',
    options: ['Pizza', 'Sushi'],
    clientRequestId: randomUUID(),
    ...overrides,
  };
}

async function rowCounts() {
  return { polls: await Poll.count(), options: await PollOption.count() };
}

function expectCleanError(res, status, message) {
  expect(res.status).toBe(status);
  expect(Object.keys(res.body).sort()).toEqual(['data', 'error']);
  expect(res.body.data).toBeNull();
  expect(res.body.error).toBe(message);
  expect(res.text).not.toMatch(INTERNALS);
}

// Repeats a string's code points until it reaches exactly `units` UTF-16 code units.
function toUtf16Length(text, units) {
  let result = '';
  const chars = Array.from(text);
  for (let i = 0; result.length < units; i += 1) {
    const next = chars[i % chars.length];
    if (result.length + next.length > units) break;
    result += next;
  }
  return result;
}

// JSON with every non-ASCII character written as a \uXXXX escape.
function asciiJson(value) {
  return JSON.stringify(value).replace(/[-￿]/g, (c) => `\\u${c.charCodeAt(0).toString(16).padStart(4, '0')}`);
}

describe('QA: Create poll API (adversarial)', () => {
  const app = createApp();
  let alice;
  let bob;

  beforeEach(async () => {
    await resetDatabase();
    alice = await createUser();
    bob = await createUser();
    actAs(alice);
  });

  afterEach(() => {
    restoreEnv('TEST_USER_USERNAME', originalUsername);
    restoreEnv('CLIENT_URL', originalClientUrl);
  });

  afterAll(closeDatabase);

  async function expectRejectedAndNothingSaved(overrides) {
    const res = await request(app).post('/api/polls').send(pollBody(overrides));

    expectCleanError(res, 400, INVALID);
    expect(await rowCounts()).toEqual({ polls: 0, options: 0 });
  }

  describe('authorization and existence', () => {
    test("a second user reusing the first user's clientRequestId gets a new poll of their own, never the first user's", async () => {
      const clientRequestId = randomUUID();
      const alicePoll = await request(app)
        .post('/api/polls')
        .send(pollBody({ clientRequestId, question: 'Alice private question' }));
      expect(alicePoll.status).toBe(201);

      actAs(bob);
      const bobPoll = await request(app)
        .post('/api/polls')
        .send(pollBody({ clientRequestId, question: 'Bob question' }));

      expect(bobPoll.status).toBe(201);
      expect(bobPoll.body.data.id).not.toBe(alicePoll.body.data.id);
      expect(bobPoll.body.data.question).toBe('Bob question');
      expect(bobPoll.text).not.toContain('Alice private question');
      const stored = await Poll.findAll({ attributes: ['id', 'creatorId', 'question'], raw: true });
      expect(stored).toHaveLength(2);
      expect(stored.find((p) => p.id === alicePoll.body.data.id).creatorId).toBe(alice.id);
      expect(stored.find((p) => p.id === bobPoll.body.data.id).creatorId).toBe(bob.id);
    });

    test('a foreign poll, the same id in upper case, and a random id all get the identical 404', async () => {
      const created = await request(app).post('/api/polls').send(pollBody({ question: 'Alice only' }));
      const { id } = created.body.data;

      actAs(bob);
      const responses = await Promise.all([
        request(app).get(`/api/polls/${id}`),
        request(app).get(`/api/polls/${id.toUpperCase()}`),
        request(app).get(`/api/polls/${randomUUID()}`),
      ]);

      responses.forEach((res) => {
        expectCleanError(res, 404, NOT_FOUND);
        expect(res.text).not.toContain('Alice only');
      });
    });

    test.each([
      ['creatorId set to another user', () => ({ creatorId: bob.id })],
      ['status set to closed', () => ({ status: 'closed' })],
      ['a chosen poll id', () => ({ id: randomUUID() })],
      ['a chosen createdAt', () => ({ createdAt: '2000-01-01T00:00:00.000Z' })],
      ['a creator object', () => ({ creator: { id: bob.id, username: bob.username } })],
      ['options as objects with positions', () => ({ options: [{ text: 'Pizza', position: 7 }, { text: 'Sushi', position: 0 }] })],
    ])('mass assignment of %s is rejected and nothing is saved', async (label, extra) => {
      await expectRejectedAndNothingSaved(extra());
    });

    test('there are no list, edit, or delete routes, and an existing poll is left untouched', async () => {
      const created = await request(app).post('/api/polls').send(pollBody({ question: 'Keep me' }));
      const { id } = created.body.data;

      const responses = await Promise.all([
        request(app).get('/api/polls'),
        request(app).put(`/api/polls/${id}`).send({ question: 'Changed' }),
        request(app).patch(`/api/polls/${id}`).send({ status: 'closed' }),
        request(app).delete(`/api/polls/${id}`),
        request(app).post(`/api/polls/${id}`).send(pollBody()),
      ]);

      responses.forEach((res) => {
        expect(res.status).toBe(404);
        expect(res.body.data).toBeNull();
        expect(res.text).not.toMatch(INTERNALS);
      });
      const stored = await Poll.findByPk(id, { attributes: ['question', 'status'] });
      expect(stored.question).toBe('Keep me');
      expect(stored.status).toBe('open');
      expect(await Poll.count()).toBe(1);
    });

    test.each([
      ['a path traversal', '..%2F..%2Fusers'],
      ['a null byte', '%00'],
      ['SQL injection', "1' OR '1'='1"],
      ['a UUID with SQL appended', `${randomUUID()}'--`],
      ['a very long id', 'a'.repeat(4000)],
      ['a negative number', '-1'],
    ])('a poll id with %s gets the poll-not-found 404 without internals', async (label, pollId) => {
      const res = await request(app).get(`/api/polls/${pollId}`);

      expectCleanError(res, 404, NOT_FOUND);
    });
  });

  describe('input the spec treats as empty or invalid', () => {
    test.each([
      ['a question of only non-breaking spaces', { question: '  ' }],
      ['a question of only tabs', { question: '\t\t' }],
      ['options differing only by letter case in Greek', { options: ['ΝΑΙ', 'ναι'] }],
      ['an answer type in a different letter case', { answerType: 'Single' }],
      ['a null option', { options: ['Pizza', null] }],
      ['details as a number', { details: 42 }],
      ['details as an object', { details: { text: 'Context' } }],
      ['a question as an array', { question: ['Lunch?'] }],
    ])('rejects %s and saves nothing', async (label, overrides) => {
      await expectRejectedAndNothingSaved(overrides);
    });

    test.each(['__proto__', 'constructor', 'prototype'])('an extra "%s" key is rejected and nothing is saved', async (key) => {
      const raw = JSON.stringify(pollBody()).replace(/}$/, `,"${key}":{"status":"closed"}}`);

      const res = await request(app).post('/api/polls').set('Content-Type', 'application/json').send(raw);

      expectCleanError(res, 400, INVALID);
      expect(await rowCounts()).toEqual({ polls: 0, options: 0 });
    });

    test('a valid JSON body sent as text/plain is rejected and nothing is saved', async () => {
      const res = await request(app)
        .post('/api/polls')
        .set('Content-Type', 'text/plain')
        .send(JSON.stringify(pollBody()));

      expectCleanError(res, 400, INVALID);
      expect(await Poll.count()).toBe(0);
    });

    test.each(['[]', '"a poll"', '42', 'null', 'true'])('a JSON body of %s is rejected', async (raw) => {
      const res = await request(app).post('/api/polls').set('Content-Type', 'application/json').send(raw);

      expectCleanError(res, 400, INVALID);
      expect(await Poll.count()).toBe(0);
    });

    test('SQL-looking text is stored verbatim and the tables stay intact', async () => {
      const question = "Robert'); DROP TABLE polls;--";
      const options = ["' OR '1'='1", 'Sushi; DELETE FROM users;'];

      const created = await request(app).post('/api/polls').send(pollBody({ question, options }));
      const fetched = await request(app).get(`/api/polls/${created.body.data.id}`);

      expect(created.status).toBe(201);
      expect(fetched.body.data.question).toBe(question);
      expect(fetched.body.data.options.map((o) => o.text)).toEqual(options);
      expect(await Poll.count()).toBe(1);
      expect(await createUser()).toBeTruthy();
    });

    test('the largest legal poll is accepted even when every non-ASCII character is JSON-escaped', async () => {
      const body = pollBody({
        question: toUtf16Length('😀', 200),
        details: toUtf16Length('ש', 1000),
        answerType: 'multiple',
        options: Array.from({ length: 8 }, (_, i) => toUtf16Length(`${i}🎉`, 100)),
      });

      const res = await request(app).post('/api/polls').set('Content-Type', 'application/json').send(asciiJson(body));

      expect(res.status).toBe(201);
      const stored = await request(app).get(`/api/polls/${res.body.data.id}`);
      expect(stored.body.data.question).toBe(body.question);
      expect(stored.body.data.details).toBe(body.details);
      expect(stored.body.data.options.map((o) => o.text)).toEqual(body.options);
    });

    test('tabs and non-breaking spaces around text are trimmed before saving', async () => {
      const res = await request(app)
        .post('/api/polls')
        .send(pollBody({ question: '\t Lunch? \t', details: ' Context\t', options: [' Pizza', 'Sushi\t'] }));

      expect(res.status).toBe(201);
      const stored = await Poll.findByPk(res.body.data.id, {
        attributes: ['question', 'details'],
        include: [{ model: PollOption, as: 'options', attributes: ['text', 'position'] }],
        order: [[{ model: PollOption, as: 'options' }, 'position', 'ASC']],
      });
      expect(stored.question).toBe('Lunch?');
      expect(stored.details).toBe('Context');
      expect(stored.options.map((o) => o.text)).toEqual(['Pizza', 'Sushi']);
    });
  });

  describe('idempotency and concurrency', () => {
    test('a replay with the clientRequestId in upper case returns the same poll', async () => {
      const clientRequestId = randomUUID();
      const first = await request(app).post('/api/polls').send(pollBody({ clientRequestId }));

      const replay = await request(app)
        .post('/api/polls')
        .send(pollBody({ clientRequestId: clientRequestId.toUpperCase() }));

      expect(first.status).toBe(201);
      expect(replay.status).toBe(200);
      expect(replay.body.data).toEqual(first.body.data);
      expect(await Poll.count()).toBe(1);
    });

    test('20 parallel creates with one clientRequestId and different content store exactly one poll and one set of options', async () => {
      const clientRequestId = randomUUID();

      const responses = await Promise.all(
        Array.from({ length: 20 }, (_, i) =>
          request(app)
            .post('/api/polls')
            .send(pollBody({ clientRequestId, question: `Variant ${i}`, options: [`A${i}`, `B${i}`, `C${i}`] })),
        ),
      );

      expect(responses.filter((res) => res.status === 201)).toHaveLength(1);
      expect(responses.filter((res) => res.status === 200)).toHaveLength(19);
      const ids = new Set(responses.map((res) => res.body.data.id));
      expect(ids.size).toBe(1);
      responses.forEach((res) => expect(res.body.data).toEqual(responses[0].body.data));
      expect(await rowCounts()).toEqual({ polls: 1, options: 3 });
    });

    test('10 parallel creates with identical content but different clientRequestIds create 10 polls', async () => {
      const content = { question: 'Same question', options: ['Yes', 'No'] };

      const responses = await Promise.all(
        Array.from({ length: 10 }, () => request(app).post('/api/polls').send(pollBody(content))),
      );

      responses.forEach((res) => expect(res.status).toBe(201));
      expect(await rowCounts()).toEqual({ polls: 10, options: 20 });
    });

    test('a rejected request reusing a clientRequestId never changes the poll saved under it', async () => {
      const clientRequestId = randomUUID();
      const original = await request(app)
        .post('/api/polls')
        .send(pollBody({ clientRequestId, question: 'Original', options: ['Yes', 'No'] }));

      const invalid = await request(app)
        .post('/api/polls')
        .send(pollBody({ clientRequestId, question: 'Changed', options: ['Only one'] }));
      const replay = await request(app)
        .post('/api/polls')
        .send(pollBody({ clientRequestId, question: 'Changed again', options: ['Maybe', 'Later'] }));

      expectCleanError(invalid, 400, INVALID);
      expect(replay.status).toBe(200);
      expect(replay.body.data).toEqual(original.body.data);
      expect(await rowCounts()).toEqual({ polls: 1, options: 2 });
    });
  });

  describe('response hygiene', () => {
    test.each([
      ['an unknown poll id', (app_) => request(app_).get(`/api/polls/${randomUUID()}`), 404],
      ['an invalid body', (app_) => request(app_).post('/api/polls').send({ question: '' }), 400],
      ['malformed JSON', (app_) => request(app_).post('/api/polls').set('Content-Type', 'application/json').send('{"question":'), 400],
      ['an oversized body', (app_) => request(app_).post('/api/polls').send(pollBody({ details: 'd'.repeat(30 * 1024) })), 413],
      ['an unknown API route', (app_) => request(app_).get('/api/nope'), 404],
      ['an unsupported method', (app_) => request(app_).delete('/api/polls/x'), 404],
    ])('%s returns a bare error envelope with no internals', async (label, send, status) => {
      const res = await send(app);

      expect(res.status).toBe(status);
      expect(Object.keys(res.body).sort()).toEqual(['data', 'error']);
      expect(res.body.data).toBeNull();
      expect(typeof res.body.error).toBe('string');
      expect(res.text).not.toMatch(INTERNALS);
    });

    test('success responses expose only the poll fields, never creator or request ids', async () => {
      const created = await request(app).post('/api/polls').send(pollBody({ details: 'Context' }));
      const fetched = await request(app).get(`/api/polls/${created.body.data.id}`);

      [created, fetched].forEach((res) => {
        expect(Object.keys(res.body).sort()).toEqual(['data', 'error']);
        expect(Object.keys(res.body.data).sort()).toEqual(['answerType', 'createdAt', 'details', 'id', 'options', 'question', 'status']);
        res.body.data.options.forEach((o) => expect(Object.keys(o).sort()).toEqual(['id', 'position', 'text']));
        expect(res.text).not.toContain(alice.id);
        expect(res.text).not.toContain(alice.username);
      });
    });

    test('a preflight from another site is not granted access', async () => {
      process.env.CLIENT_URL = 'http://localhost:5173';
      const corsApp = createApp();

      const res = await request(corsApp)
        .options('/api/polls')
        .set('Origin', 'https://evil.example')
        .set('Access-Control-Request-Method', 'POST');

      expect(res.headers['access-control-allow-origin']).not.toBe('https://evil.example');
      expect(res.headers['access-control-allow-origin']).not.toBe('*');
    });
  });

  // Regression tests for open bugs (QA Report, Bugs). Expected to fail until dev fixes each bug
  // and removes `.failing` in the fix commit.
  describe('regression tests for open bugs', () => {
    test.failing.each([
      ['a question of only zero-width spaces', { question: '​​​' }],
      ['an option of only zero-width spaces', { options: ['Pizza', '​​'] }],
      ['an option of only zero-width joiners, word joiners, and a BOM', { options: ['Pizza', '‍⁠﻿'] }],
    ])('BUG-01: rejects %s as empty and saves nothing', async (label, overrides) => {
      await expectRejectedAndNothingSaved(overrides);
    });

    test.failing.each([
      ['a null byte in the question', { question: 'Lunch ?' }],
      ['a null byte in an option', { options: ['Pizza', 'Su shi'] }],
      ['a null byte in the details', { details: 'Context here' }],
      ['a bell control character in the question', { question: 'Lunch?' }],
      ['an escape control character in an option', { options: ['Pizza', 'Sushi[31m'] }],
      ['a lone surrogate in the question', { question: 'Lunch \uD800?' }],
    ])('BUG-02: rejects %s and saves nothing', async (label, overrides) => {
      await expectRejectedAndNothingSaved(overrides);
    });

    test.failing('BUG-02: a poll whose last option has a null byte leaves no poll or options behind', async () => {
      await request(app)
        .post('/api/polls')
        .send(pollBody({ options: ['Pizza', 'Sushi', 'Tacos', 'Bad option'] }));

      expect(await rowCounts()).toEqual({ polls: 0, options: 0 });
    });

    test.failing('BUG-03: options equal after Unicode normalization (NFC) are rejected as duplicates', async () => {
      await expectRejectedAndNothingSaved({ options: ['Café', 'Café'] });
    });

    test.failing.each([
      ['a Unicode line separator in an option', { options: ['Pizza', 'Su shi'] }],
      ['a paragraph separator in the question', { question: 'Lunch today?' }],
    ])('BUG-04: rejects %s in a single-line field and saves nothing', async (label, overrides) => {
      await expectRejectedAndNothingSaved(overrides);
    });

    test.failing('BUG-05: 101 emoji in the question (202 UTF-16 units) is over the 200 limit and rejected', async () => {
      await expectRejectedAndNothingSaved({ question: '😀'.repeat(101) });
    });
  });
});
