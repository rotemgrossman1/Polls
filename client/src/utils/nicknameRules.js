import { isBlank } from './textRules';

// Mirrors server/utils/participantRules.js.
export const NICKNAME_MAX_LENGTH = 20;

// A nickname of only spaces or invisible characters counts as empty (the API rejects it too).
export const isBlankNickname = (nickname) => isBlank(nickname);
