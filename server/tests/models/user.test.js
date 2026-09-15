const { UniqueConstraintError } = require('sequelize');
const { User } = require('../../models');
const { resetDatabase, closeDatabase } = require('../helpers/db');

describe('User model', () => {
  beforeEach(resetDatabase);
  afterAll(closeDatabase);

  test('creates a user with a generated UUID', async () => {
    const user = await User.create({ username: 'alice' });

    expect(user.id).toMatch(/^[0-9a-f-]{36}$/);
    expect(user.username).toBe('alice');
  });

  test('rejects a duplicate username', async () => {
    await User.create({ username: 'alice' });

    await expect(User.create({ username: 'alice' })).rejects.toBeInstanceOf(UniqueConstraintError);
  });

  test('rejects a missing username', async () => {
    await expect(User.create({})).rejects.toThrow();
  });
});
