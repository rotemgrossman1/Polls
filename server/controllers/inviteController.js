const inviteService = require('../services/inviteService');
const asyncHandler = require('../utils/asyncHandler');

async function show(req, res) {
  const invite = await inviteService.getInvite({ inviteCode: req.params.inviteCode });
  res.status(200).json({ data: invite, error: null });
}

async function join(req, res) {
  const { participant, created } = await inviteService.joinPoll({
    inviteCode: req.params.inviteCode,
    nickname: req.body.nickname,
    joinKey: req.body.joinKey,
  });
  res.status(created ? 201 : 200).json({ data: participant, error: null });
}

module.exports = {
  show: asyncHandler(show),
  join: asyncHandler(join),
};
