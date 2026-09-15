const { User } = require('../models');
const asyncHandler = require('../utils/asyncHandler');
const { UnauthorizedError } = require('../utils/httpErrors');
const logger = require('../utils/logger');

// Stand-in until Register and log in ships: every request acts as the fixed test user
// named by TEST_USER_USERNAME. Register replaces this body with JWT verification.
const requireUser = asyncHandler(async (req, res, next) => {
  const username = process.env.TEST_USER_USERNAME;
  const user = username
    ? await User.findOne({ where: { username }, attributes: ['id', 'username'] })
    : null;

  if (!user) {
    logger.error(
      { method: req.method, path: req.originalUrl.split('?')[0] },
      'Test user not found; check TEST_USER_USERNAME and run the seeder',
    );
    throw new UnauthorizedError();
  }

  req.user = { id: user.id, username: user.username };
  next();
});

module.exports = requireUser;
