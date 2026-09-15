const express = require('express');
const pollsRouter = require('./polls');
const invitesRouter = require('./invites');

const router = express.Router();

router.use('/polls', pollsRouter);
router.use('/invites', invitesRouter);

module.exports = router;
