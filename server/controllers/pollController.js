const pollService = require('../services/pollService');
const asyncHandler = require('../utils/asyncHandler');

async function create(req, res) {
  const { poll, created } = await pollService.createPoll({ ...req.body, creatorId: req.user.id });
  res.status(created ? 201 : 200).json({ data: poll, error: null });
}

async function getById(req, res) {
  const poll = await pollService.getPollForCreator({
    pollId: req.params.pollId,
    creatorId: req.user.id,
  });
  res.status(200).json({ data: poll, error: null });
}

module.exports = {
  create: asyncHandler(create),
  getById: asyncHandler(getById),
};
