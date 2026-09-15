export const ROUTES = {
  home: '/',
  newPoll: '/polls/new',
  pollCreated: '/polls/:pollId/created',
};

export const pollCreatedPath = (pollId) => `/polls/${encodeURIComponent(pollId)}/created`;
