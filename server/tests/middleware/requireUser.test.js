jest.mock('../../utils/logger', () => ({ info: jest.fn(), error: jest.fn() }));

const requireUser = require('../../middleware/requireUser');
const { UnauthorizedError } = require('../../utils/httpErrors');
const { resetDatabase, closeDatabase } = require('../helpers/db');
const { createUser } = require('../helpers/factories');

const originalUsername = process.env.TEST_USER_USERNAME;

// Runs the middleware and resolves with whatever it passes to next().
function run(req) {
  return new Promise((resolve) => {
    requireUser(req, {}, resolve);
  });
}

function mockReq() {
  return { method: 'POST', originalUrl: '/api/polls' };
}

describe('requireUser', () => {
  beforeEach(resetDatabase);

  afterEach(() => {
    process.env.TEST_USER_USERNAME = originalUsername;
  });

  afterAll(closeDatabase);

  test('attaches the test user to the request', async () => {
    const user = await createUser();
    process.env.TEST_USER_USERNAME = user.username;
    const req = mockReq();

    const result = await run(req);

    expect(result).toBeUndefined();
    expect(req.user).toEqual({ id: user.id, username: user.username });
  });

  test('rejects with 401 when the test user does not exist', async () => {
    process.env.TEST_USER_USERNAME = 'missing-user';
    const req = mockReq();

    const result = await run(req);

    expect(result).toBeInstanceOf(UnauthorizedError);
    expect(req.user).toBeUndefined();
  });

  test('rejects with 401 when no test user is configured', async () => {
    delete process.env.TEST_USER_USERNAME;
    const req = mockReq();

    const result = await run(req);

    expect(result).toBeInstanceOf(UnauthorizedError);
  });
});
