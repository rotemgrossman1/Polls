const { randomUUID } = require('crypto');
const { User } = require('../../models');

function createUser(overrides = {}) {
  return User.create({ username: `user-${randomUUID()}`, ...overrides });
}

module.exports = { createUser };
