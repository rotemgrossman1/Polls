// QA adversarial integration tests for Share and join poll (GET /api/invites/:inviteCode,
// POST /api/invites/:inviteCode/participants, and inviteCode on the creator's poll).
// Oracle: specs/features/2026-09-15-share-and-join-poll.md and the QA Report's captain answers.
const { randomUUID } = require('crypto');
const request = require('supertest');
const createApp = require('../../app');
const { Participant, sequelize } = require('../../models');
const { resetDatabase, closeDatabase } = require('../helpers/db');
const { createUser, createPoll } = require('../helpers/factories');

const INVITE_CODE = 'q7Kx2Wm9aZ';
const UNKNOWN_CODE = 'Zz9aB8cD7e';
const INVALID = 'Invalid request';
const NOT_FOUND = 'Poll not found';
const TAKEN = 'Nickname taken';
const INVITE_KEYS = ['details', 'optionCount', 'question', 'status'];
const POLL_KEYS = ['answerType', 'createdAt', 'details', 'id', 'inviteCode', 'options', 'question', 'status'];
// Anything that would reveal internals: stacks, ORM or SQL text, file paths.
const INTERNALS = /stack|sequelize|postgres|syntax error|violates|constraint|node_modules|[A-Za-z]:\\|\/server\/|\bat \S+ \(/i;

// Builds text from code points, so invisible and control characters stay readable in this file.
const ch = (...codePoints) => String.fromCodePoint(...codePoints);

const originalUsername = process.env.TEST_USER_USERNAME;

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
  } else {
    process.env[name] = value;
  }
}

const invitePath = (code = INVITE_CODE) => `/api/invites/${code}`;
const joinPath = (code = INVITE_CODE) => `/api/invites/${code}/participants`;
const joinBody = (overrides = {}) => ({ nickname: 'Noa', joinKey: randomUUID(), ...overrides });

// Body-parser failures (malformed JSON, oversized body) are rejected before the invites router
// runs, so they carry no X-Robots-Tag. They answer POST requests, which search engines never
// crawl, so the spec's "invite pages are not listed" doesn't apply to them.
function expectCleanError(res, status, message, { robots = true } = {}) {
  expect(res.status).toBe(status);
  expect(res.body).toEqual({ data: null, error: message });
  if (robots) {
    expect(res.headers['x-robots-tag']).toBe('noindex');
  }
  expect(res.text).not.toMatch(INTERNALS);
}

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

const participantCount = () => Participant.count();

async function storedNicknames(pollId) {
  const rows = await Participant.findAll({ where: { pollId }, attributes: ['nickname'], raw: true });
  return rows.map((row) => row.nickname).sort();
}

describe('QA: Share and join poll API (adversarial)', () => {
  const app = createApp();
  let creator;
  let poll;

  const join = (overrides, code) => request(app).post(joinPath(code)).send(joinBody(overrides));

  beforeEach(async () => {
    await resetDatabase();
    creator = await createUser();
    // Invite routes are public: no logged-in user unless a test acts as the creator.
    process.env.TEST_USER_USERNAME = `nobody-${randomUUID()}`;
    poll = await createPoll({ creatorId: creator.id, inviteCode: INVITE_CODE, options: ['Pizza', 'Sushi', 'Tacos'] });
  });

  afterEach(() => {
    restoreEnv('TEST_USER_USERNAME', originalUsername);
  });

  afterAll(closeDatabase);

  describe('nicknames that look the same are the same nickname', () => {
    test.each([
      ['a precomposed accent and a combining accent (NFC)', `No${ch(0xe9)}`, `Noe${ch(0x301)}`],
      ['a soft hyphen inside the text', 'Noa', `N${ch(0xad)}oa`],
      ['a word joiner inside the text', 'Noa', `No${ch(0x2060)}a`],
      ['a byte order mark inside the text', 'Noa', `N${ch(0xfeff)}oa`],
      ['a Hangul filler inside the text', 'Noa', `N${ch(0x3164)}oa`],
      ['no-break spaces around the text', 'Noa', `${ch(0xa0)}Noa${ch(0xa0)}`],
      ['ideographic spaces around the text and a case change', 'Noa', `${ch(0x3000)}NOA${ch(0x3000)}`],
      ['a right-to-left mark at the edge', 'Noa', `${ch(0x200f)}Noa`],
      ['a capital dotted I that lowercases to two characters', `${ch(0x130)}nci`, `i${ch(0x307)}nci`],
      ['a Hebrew presentation form that normalizes to three characters', ch(0xfb2c), ch(0x5e9, 0x5bc, 0x5c1)],
    ])('%s: the second join is taken and only the first is saved', async (label, first, second) => {
      const saved = await join({ nickname: first });
      expect(saved.status).toBe(201);

      const res = await join({ nickname: second });

      expectCleanError(res, 409, TAKEN);
      expect(await storedNicknames(poll.id)).toEqual([saved.body.data.nickname]);
    });

    test('a nickname that differs by a visible letter still joins', async () => {
      await join({ nickname: 'Noa' });

      const res = await join({ nickname: 'Noah' });

      expect(res.status).toBe(201);
      expect(await storedNicknames(poll.id)).toEqual(['Noa', 'Noah']);
    });
  });

  describe('blank-looking and invalid nicknames', () => {
    test.each([
      ['no-break spaces', ch(0xa0, 0xa0, 0xa0)],
      ['ideographic spaces', ch(0x3000, 0x3000)],
      ['Hangul fillers', ch(0x3164, 0x3164)],
      ['a halfwidth Hangul filler', ch(0xffa0)],
      ['soft hyphens', ch(0xad, 0xad)],
      ['a Mongolian vowel separator', ch(0x180e)],
      ['a variation selector', ch(0xfe0f)],
      ['tag characters', ch(0xe0041, 0xe0042)],
      ['spaces mixed with zero-width characters', ` ${ch(0x200b)} ${ch(0x2060)} `],
    ])('a nickname of only %s is rejected as empty and nothing is saved', async (label, nickname) => {
      const res = await join({ nickname });

      expectCleanError(res, 400, INVALID);
      expect(await participantCount()).toBe(0);
    });

    test('a nickname of only Braille blank characters is accepted (captain, 2026-09-15)', async () => {
      const nickname = ch(0x2800, 0x2800, 0x2800);

      const res = await join({ nickname });

      expect(res.status).toBe(201);
      expect(await storedNicknames(poll.id)).toEqual([nickname]);
    });

    test.each([
      ['a null byte', `No${ch(0)}a`],
      ['a bell character', `No${ch(7)}a`],
      ['a delete character', `No${ch(0x7f)}a`],
      ['a C1 control character', `No${ch(0x85)}a`],
      ['a lone high surrogate', `Noa${ch(0xd800)}`],
      ['a lone low surrogate', `${ch(0xdc00)}Noa`],
      ['a line separator', `No${ch(0x2028)}a`],
      ['a paragraph separator', `No${ch(0x2029)}a`],
      ['a carriage return', `No${ch(13)}a`],
      ['a left-to-right embedding', `No${ch(0x202a)}a`],
      ['a first strong isolate', `No${ch(0x2068)}a`],
    ])('a nickname with %s (sent as a JSON escape) is rejected and nothing is saved', async (label, nickname) => {
      const res = await join({ nickname });

      expectCleanError(res, 400, INVALID);
      expect(await participantCount()).toBe(0);
    });

    test('the limit is 20 UTF-16 units: 10 emoji join, 10 emoji plus one letter do not', async () => {
      const tenEmoji = ch(0x1f355).repeat(10);

      const tooLong = await join({ nickname: `${tenEmoji}a` });
      const nineteenAndEmoji = await join({ nickname: `${'a'.repeat(19)}${ch(0x1f355)}` });
      const exact = await join({ nickname: tenEmoji });

      expectCleanError(tooLong, 400, INVALID);
      expectCleanError(nineteenAndEmoji, 400, INVALID);
      expect(exact.status).toBe(201);
      expect(await storedNicknames(poll.id)).toEqual([tenEmoji]);
    });

    test('spaces around a 20-character nickname are trimmed before the limit is checked', async () => {
      const res = await join({ nickname: `  ${'n'.repeat(20)}  ` });

      expect(res.status).toBe(201);
      expect(await storedNicknames(poll.id)).toEqual(['n'.repeat(20)]);
    });

    test.each([
      ['20 capital dotted I (each lowercases to two characters)', ch(0x130).repeat(20)],
      ['20 Hebrew presentation forms (each normalizes to three characters)', ch(0xfb2c).repeat(20)],
      ['10 musical symbols (each normalizes to three astral characters)', ch(0x1d160).repeat(10)],
    ])('a maximum-length nickname of %s joins, and the same text again is taken', async (label, nickname) => {
      const first = await join({ nickname });
      const second = await join({ nickname });

      expect(first.status).toBe(201);
      expect(first.body).toEqual({ data: { nickname }, error: null });
      expectCleanError(second, 409, TAKEN);
      expect(await participantCount()).toBe(1);
    });
  });

  describe('types, extra fields, and body formats', () => {
    test.each([
      ['a null nickname', { nickname: null }],
      ['a number nickname', { nickname: 7 }],
      ['a boolean nickname', { nickname: true }],
      ['an array nickname', { nickname: ['Noa'] }],
      ['an object nickname', { nickname: { text: 'Noa' } }],
      ['a missing nickname', { nickname: undefined }],
      ['a number join key', { joinKey: 12345 }],
      ['a join key with extra characters', { joinKey: `${randomUUID()}x` }],
      ['a join key with braces', { joinKey: `{${randomUUID()}}` }],
      ['a join key without dashes', { joinKey: randomUUID().replace(/-/g, '') }],
    ])('%s is rejected and nothing is saved', async (label, overrides) => {
      const res = await join(overrides);

      expectCleanError(res, 400, INVALID);
      expect(await participantCount()).toBe(0);
    });

    test.each([
      ['id', () => ({ id: randomUUID() })],
      ['nicknameKey', () => ({ nicknameKey: 'someone-else' })],
      ['nickname_key', () => ({ nickname_key: 'someone-else' })],
      ['poll_id', () => ({ poll_id: randomUUID() })],
      ['createdAt', () => ({ createdAt: '2000-01-01T00:00:00.000Z' })],
      ['inviteCode', () => ({ inviteCode: UNKNOWN_CODE })],
    ])('an extra %s field is rejected and nothing is saved', async (label, extra) => {
      const res = await join(extra());

      expectCleanError(res, 400, INVALID);
      expect(await participantCount()).toBe(0);
    });

    test('a __proto__ key in the JSON body is rejected and nothing is saved', async () => {
      const raw = `{"nickname":"Noa","joinKey":"${randomUUID()}","__proto__":{"nicknameKey":"x"}}`;

      const res = await request(app).post(joinPath()).set('Content-Type', 'application/json').send(raw);

      expectCleanError(res, 400, INVALID);
      expect(await participantCount()).toBe(0);
    });

    test.each([
      ['valid JSON sent as text/plain', 'text/plain', () => JSON.stringify(joinBody()), true],
      ['a form-encoded body', 'application/x-www-form-urlencoded', () => `nickname=Noa&joinKey=${randomUUID()}`, true],
      ['a JSON array', 'application/json', () => JSON.stringify([joinBody()]), true],
      ['malformed JSON', 'application/json', () => '{"nickname": "Noa",', false],
      ['a JSON string', 'application/json', () => '"Noa"', false],
      ['JSON null', 'application/json', () => 'null', false],
    ])('%s is rejected and nothing is saved', async (label, contentType, payload, robots) => {
      const res = await request(app).post(joinPath()).set('Content-Type', contentType).send(payload());

      expectCleanError(res, 400, INVALID, { robots });
      expect(await participantCount()).toBe(0);
    });

    test('an oversized body is rejected with 413 and nothing is saved', async () => {
      const res = await join({ nickname: 'n'.repeat(30 * 1024) });

      expectCleanError(res, 413, 'Request too large', { robots: false });
      expect(await participantCount()).toBe(0);
    });
  });

  describe('links that open no poll', () => {
    const fullWidthLookAlike = encodeURIComponent(`${ch(0xff51)}${INVITE_CODE.slice(1)}`);

    const codes = [
      ['a 5,000-character code', 'a'.repeat(5000)],
      ['the code followed by an encoded null byte', `${INVITE_CODE.slice(0, 9)}%00`],
      ['the code with a full-width look-alike first letter', fullWidthLookAlike],
      ['the code followed by an encoded space', `${INVITE_CODE}%20`],
      ['the code preceded by an encoded space', `%20${INVITE_CODE.slice(1)}`],
      ['SQL-looking text', encodeURIComponent("' OR '1'='1")],
      ['a SQL wildcard', encodeURIComponent('q7Kx2Wm9a%')],
      ['a regular expression-looking code', encodeURIComponent('q7Kx2Wm9.*')],
      ['an encoded slash', `${INVITE_CODE.slice(0, 5)}%2F${INVITE_CODE.slice(5)}`],
    ];

    test.each(codes)('GET with %s answers exactly like an unknown code', async (label, code) => {
      const baseline = visibleResponse(await request(app).get(invitePath(UNKNOWN_CODE)));

      const res = await request(app).get(invitePath(code));

      expect(baseline.status).toBe(404);
      expect(visibleResponse(res)).toEqual(baseline);
      expect(res.text).not.toMatch(INTERNALS);
    });

    test.each(codes)('POST with %s answers exactly like an unknown code and saves nothing', async (label, code) => {
      const baseline = visibleResponse(await join({}, UNKNOWN_CODE));

      const res = await join({}, code);

      expect(baseline.status).toBe(404);
      expect(visibleResponse(res)).toEqual(baseline);
      expect(await participantCount()).toBe(0);
    });

    test('POST to a wrong-case, cut-off, made-up, or extended code answers exactly like an unknown code', async () => {
      const baseline = visibleResponse(await join({}, UNKNOWN_CODE));
      const variants = [INVITE_CODE.toUpperCase(), INVITE_CODE.slice(0, 9), 'Aa0Bb1Cc2D', `${INVITE_CODE}/extra`];

      const responses = await Promise.all(variants.map((code) => join({}, code)));

      responses.forEach((res) => expect(visibleResponse(res)).toEqual(baseline));
      expect(await participantCount()).toBe(0);
    });

    test('an invalid body gets the same response whether or not the code opens a poll', async () => {
      const invalid = { nickname: '' };

      const real = visibleResponse(await request(app).post(joinPath()).send(invalid));
      const others = await Promise.all(
        [UNKNOWN_CODE, INVITE_CODE.toUpperCase()].map((code) => request(app).post(joinPath(code)).send(invalid)),
      );

      expect(real.status).toBe(400);
      others.forEach((res) => expect(visibleResponse(res)).toEqual(real));
      expect(await participantCount()).toBe(0);
    });
  });

  describe('concurrency', () => {
    test('10 parallel joins with case, space and invisible variants of one nickname save exactly one participant', async () => {
      const variants = ['Noa', ' noa', 'NOA', `N${ch(0x200b)}oa`, `No${ch(0xad)}a`];

      const responses = await Promise.all([...variants, ...variants].map((nickname) => join({ nickname })));

      expect(responses.filter((res) => res.status === 201)).toHaveLength(1);
      responses.filter((res) => res.status !== 201).forEach((res) => expectCleanError(res, 409, TAKEN));
      expect(await participantCount()).toBe(1);
    });

    test('one join key sent with 5 different nicknames in parallel saves one participant, and every response names it', async () => {
      const joinKey = randomUUID();

      const responses = await Promise.all(
        ['Noa', 'Dan', 'Maya', 'Omer', 'Lior'].map((nickname) => join({ nickname, joinKey })),
      );

      const stored = await storedNicknames(poll.id);
      expect(stored).toHaveLength(1);
      expect(responses.filter((res) => res.status === 201)).toHaveLength(1);
      expect(responses.filter((res) => res.status === 200)).toHaveLength(4);
      responses.forEach((res) => expect(res.body).toEqual({ data: { nickname: stored[0] }, error: null }));
    });

    test('10 people joining in parallel with different nicknames are all saved', async () => {
      const nicknames = Array.from({ length: 10 }, (_, i) => `Guest ${i}`);

      const responses = await Promise.all(nicknames.map((nickname) => join({ nickname })));

      responses.forEach((res) => expect(res.status).toBe(201));
      expect(await storedNicknames(poll.id)).toEqual([...nicknames].sort());
    });

    test('the same nickname joining two polls in parallel saves one participant in each', async () => {
      const other = await createPoll({ creatorId: creator.id });

      await Promise.all([
        ...Array.from({ length: 4 }, () => join({ nickname: 'Noa' })),
        ...Array.from({ length: 4 }, () => join({ nickname: 'Noa' }, other.inviteCode)),
      ]);

      expect(await storedNicknames(poll.id)).toEqual(['Noa']);
      expect(await storedNicknames(other.id)).toEqual(['Noa']);
    });

    test("a join key used in one poll joins another poll as a new participant and never gets the first poll's nickname", async () => {
      const other = await createPoll({ creatorId: creator.id });
      const joinKey = randomUUID();
      await join({ nickname: 'Secret name', joinKey });

      const res = await join({ nickname: 'Dan', joinKey }, other.inviteCode);

      expect(res.status).toBe(201);
      expect(res.body).toEqual({ data: { nickname: 'Dan' }, error: null });
      expect(res.text).not.toContain('Secret name');
      expect(await storedNicknames(other.id)).toEqual(['Dan']);
    });
  });

  describe('responses never leak participants or internals', () => {
    test('a join and its replay return only the nickname', async () => {
      const joinKey = randomUUID();

      const created = await join({ nickname: 'Noa', joinKey });
      const replay = await join({ nickname: 'Noa', joinKey });

      const [participant] = await Participant.findAll({ attributes: ['id'], raw: true });
      [created, replay].forEach((res) => {
        expect(Object.keys(res.body).sort()).toEqual(['data', 'error']);
        expect(Object.keys(res.body.data)).toEqual(['nickname']);
        [joinKey, poll.id, creator.id, creator.username, participant.id, INVITE_CODE].forEach((secret) =>
          expect(res.text).not.toContain(secret),
        );
      });
    });

    test('a taken error reveals neither the saved nickname nor its join key', async () => {
      const joinKey = randomUUID();
      await join({ nickname: 'NoaSaved', joinKey });

      const res = await join({ nickname: 'noasaved' });

      expectCleanError(res, 409, TAKEN);
      expect(res.text).not.toContain('NoaSaved');
      expect(res.text).not.toContain(joinKey);
    });

    test('the invite never includes participants, even after people joined', async () => {
      const joinKey = randomUUID();
      await join({ nickname: 'Hidden Noa', joinKey });

      const res = await request(app).get(invitePath());

      expect(res.status).toBe(200);
      expect(Object.keys(res.body.data).sort()).toEqual(INVITE_KEYS);
      ['Hidden Noa', joinKey, poll.id, creator.id, creator.username, INVITE_CODE, 'Pizza'].forEach((secret) =>
        expect(res.text).not.toContain(secret),
      );
    });

    test("the creator's poll never includes participants, even after people joined", async () => {
      const joinKey = randomUUID();
      await join({ nickname: 'Hidden Noa', joinKey });
      process.env.TEST_USER_USERNAME = creator.username;

      const res = await request(app).get(`/api/polls/${poll.id}`);

      expect(res.status).toBe(200);
      expect(Object.keys(res.body.data).sort()).toEqual(POLL_KEYS);
      expect(res.text).not.toContain('Hidden Noa');
      expect(res.text).not.toContain(joinKey);
    });

    test('search engines are told not to list invite responses: 200, 201, 400, 404 and 409', async () => {
      await join({ nickname: 'Noa' });

      const responses = await Promise.all([
        request(app).get(invitePath()),
        join({ nickname: 'Dan' }),
        join({ nickname: '' }),
        join({}, UNKNOWN_CODE),
        request(app).get('/api/invites'),
        join({ nickname: 'NOA' }),
      ]);

      expect(responses.map((res) => res.status)).toEqual([200, 201, 400, 404, 404, 409]);
      responses.forEach((res) => expect(res.headers['x-robots-tag']).toBe('noindex'));
    });
  });

  describe('regression tests for open bugs', () => {
    const BROKEN_PERCENT_ENCODING = 'q7Kx2Wm%E0%A4%A';

    test.failing('BUG-01: GET with broken percent-encoding in the code answers exactly like an unknown code', async () => {
      const baseline = visibleResponse(await request(app).get(invitePath(UNKNOWN_CODE)));

      const res = await request(app).get(invitePath(BROKEN_PERCENT_ENCODING));

      expect(baseline.status).toBe(404);
      expect(visibleResponse(res)).toEqual(baseline);
    });

    test.failing('BUG-01: POST with broken percent-encoding in the code answers exactly like an unknown code and saves nothing', async () => {
      const baseline = visibleResponse(await join({}, UNKNOWN_CODE));

      const res = await join({}, BROKEN_PERCENT_ENCODING);

      expect(baseline.status).toBe(404);
      expect(visibleResponse(res)).toEqual(baseline);
      expect(await participantCount()).toBe(0);
    });
  });

  describe('invite code lifecycle', () => {
    test('a poll inserted without an invite code, as polls were before this feature, gets a working link', async () => {
      const [rows] = await sequelize.query(
        "INSERT INTO polls (creator_id, question, answer_type, client_request_id) VALUES (:creatorId, 'Older poll?', 'single', gen_random_uuid()) RETURNING id, invite_code",
        { replacements: { creatorId: creator.id } },
      );
      const { id, invite_code: code } = rows[0];
      await sequelize.query(
        "INSERT INTO poll_options (poll_id, text, position) VALUES (:id, 'Yes', 0), (:id, 'No', 1)",
        { replacements: { id } },
      );

      const invite = await request(app).get(invitePath(code));
      const joined = await join({ nickname: 'Noa' }, code);

      expect(invite.body).toEqual({
        data: { question: 'Older poll?', details: null, status: 'open', optionCount: 2 },
        error: null,
      });
      expect(joined.status).toBe(201);
      expect(await storedNicknames(id)).toEqual(['Noa']);
    });

    test("the creator's invite code is the same when creating, on every later load, and it opens that poll", async () => {
      process.env.TEST_USER_USERNAME = creator.username;
      const created = await request(app)
        .post('/api/polls')
        .send({ question: 'Stable link?', answerType: 'single', options: ['Yes', 'No'], clientRequestId: randomUUID() });
      const { id, inviteCode } = created.body.data;

      const loads = await Promise.all([request(app).get(`/api/polls/${id}`), request(app).get(`/api/polls/${id}`)]);
      const invite = await request(app).get(invitePath(inviteCode));

      expect(inviteCode).toMatch(/^[0-9A-Za-z]{10}$/);
      expect(inviteCode).not.toContain(id);
      loads.forEach((res) => expect(res.body.data.inviteCode).toBe(inviteCode));
      expect(invite.body.data.question).toBe('Stable link?');
    });

    test('after a poll is deleted, its link answers like an unknown code, a replay is not found, and its participants are gone', async () => {
      const joinKey = randomUUID();
      await join({ nickname: 'Noa', joinKey });
      const baselineGet = visibleResponse(await request(app).get(invitePath(UNKNOWN_CODE)));
      const baselinePost = visibleResponse(await join({}, UNKNOWN_CODE));

      await sequelize.query('DELETE FROM polls WHERE id = :id', { replacements: { id: poll.id } });

      expect(visibleResponse(await request(app).get(invitePath()))).toEqual(baselineGet);
      expect(visibleResponse(await join({ nickname: 'Noa', joinKey }))).toEqual(baselinePost);
      expect(await participantCount()).toBe(0);
    });
  });
});
