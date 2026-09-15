import api from './api';

// payload: { question, details, answerType, options, clientRequestId }
export function createPoll(payload) {
  return api.post('/polls', payload);
}

export function getPoll(pollId) {
  return api.get(`/polls/${encodeURIComponent(pollId)}`);
}
