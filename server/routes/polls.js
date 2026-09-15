const express = require('express');
const requireUser = require('../middleware/requireUser');
const validate = require('../middleware/validate');
const pollController = require('../controllers/pollController');
const { createPollBody, pollIdParams } = require('../utils/pollSchemas');
const { PollNotFoundError } = require('../utils/httpErrors');

const router = express.Router();

router.use(requireUser);

router.post('/', validate({ body: createPollBody }), pollController.create);

// A malformed id gets the same 404 as a missing poll.
router.get(
  '/:pollId',
  validate({ params: pollIdParams }, { error: () => new PollNotFoundError() }),
  pollController.getById,
);

module.exports = router;
