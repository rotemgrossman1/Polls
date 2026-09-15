const express = require('express');
const pollsRouter = require('./polls');

const router = express.Router();

router.use('/polls', pollsRouter);

module.exports = router;
