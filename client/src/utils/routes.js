export const ROUTES = {
  home: '/',
  newPoll: '/polls/new',
  pollCreated: '/polls/:pollId/created',
  // A trailing slash and query parameters (e.g. tracking codes from chat apps) still match.
  invite: '/i/:inviteCode',
  // Invite paths without a code or with extra segments show the link doesn't work page.
  inviteMissingCode: '/i',
  inviteExtraSegments: '/i/*',
};

export const pollCreatedPath = (pollId) => `/polls/${encodeURIComponent(pollId)}/created`;

export const invitePath = (inviteCode) => `/i/${encodeURIComponent(inviteCode)}`;
