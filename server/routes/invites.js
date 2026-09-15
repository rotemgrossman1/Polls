const express = require('express');
const noIndex = require('../middleware/noIndex');
const validate = require('../middleware/validate');
const inviteController = require('../controllers/inviteController');
const { inviteCodeParams, joinBody } = require('../utils/inviteSchemas');
const { PollNotFoundError } = require('../utils/httpErrors');

const router = express.Router();

// Invite links work like a key: anyone who has one can open the poll and join, so there is no
// requireUser on this router.
router.use(noIndex);

// A malformed code gets the same 404 as a code that opens no poll.
const validInviteCode = validate({ params: inviteCodeParams }, { error: () => new PollNotFoundError() });

router.get('/:inviteCode', validInviteCode, inviteController.show);

router.post(
  '/:inviteCode/participants',
  validInviteCode,
  validate({ body: joinBody }),
  inviteController.join,
);

// Anything else under /invites (no code, extra path segments) gets that same 404 too.
router.use((req, res, next) => next(new PollNotFoundError()));

module.exports = router;
