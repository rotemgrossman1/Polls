import { isBlank } from './textRules';

// Mirrors server/utils/participantRules.js.
export const NICKNAME_MAX_LENGTH = 20;

export const NICKNAME_ERROR = {
  EMPTY: 'empty',
  TAKEN: 'taken',
};

// A nickname of only spaces or invisible characters counts as empty (the API rejects it too).
export const isBlankNickname = (nickname) => isBlank(nickname);
