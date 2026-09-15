import api from './api';

// Resolves with { question, details, status, optionCount }.
export function getInvite(inviteCode) {
  return api.get(`/invites/${encodeURIComponent(inviteCode)}`);
}

// Resolves with { nickname }: the saved nickname, or the original one if this joinKey already joined.
export function joinPoll(inviteCode, { nickname, joinKey }) {
  return api.post(`/invites/${encodeURIComponent(inviteCode)}/participants`, { nickname, joinKey });
}
