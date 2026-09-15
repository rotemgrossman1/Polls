import { useRef, useState } from 'react';
import { joinPoll } from '../services/inviteService';
import { getJoin, getOrCreateJoinKey, saveJoin } from '../utils/joinedPolls';
import { NICKNAME_ERROR, isBlankNickname } from '../utils/nicknameRules';

export const JOIN_RESULT = {
  BUSY: 'busy',
  INVALID: 'invalid',
  JOINED: 'joined',
  TAKEN: 'taken',
  FAILED: 'failed',
};

const HTTP_CONFLICT = 409;

/**
 * State and actions for joining a poll with a nickname.
 * - `joinedNickname`: the nickname this device joined with (from device memory), or null.
 * - `error`: 'empty' | 'taken' | null. The empty error clears once the nickname is not blank;
 *   the taken error clears on any change.
 * - `joinFailed`: the last join request failed for another reason (network, server).
 * `submit()` resolves with { status } from JOIN_RESULT, so the page can move focus on field errors.
 */
export default function useJoinPoll(inviteCode) {
  const [nickname, setNicknameValue] = useState('');
  const [error, setError] = useState(null);
  const [joining, setJoining] = useState(false);
  const [joinFailed, setJoinFailed] = useState(false);
  const [joinedNickname, setJoinedNickname] = useState(() => {
    const join = getJoin(inviteCode);
    return join && join.nickname ? join.nickname : null;
  });
  const joiningRef = useRef(false);

  function setNickname(value) {
    if (joiningRef.current) {
      return;
    }
    if (error === NICKNAME_ERROR.EMPTY && !isBlankNickname(value)) {
      setError(null);
    } else if (error === NICKNAME_ERROR.TAKEN && value !== nickname) {
      setError(null);
    }
    setNicknameValue(value);
  }

  async function submit() {
    // Synchronous guard: repeated clicks or Enter presses before re-render still join once.
    if (joiningRef.current || joinedNickname) {
      return { status: JOIN_RESULT.BUSY };
    }

    if (isBlankNickname(nickname)) {
      setError(NICKNAME_ERROR.EMPTY);
      setJoinFailed(false);
      return { status: JOIN_RESULT.INVALID };
    }

    // Read device memory fresh: another tab may have joined since this page loaded.
    const stored = getJoin(inviteCode);
    if (stored && stored.nickname) {
      joiningRef.current = true;
      setJoinedNickname(stored.nickname);
      return { status: JOIN_RESULT.JOINED };
    }

    joiningRef.current = true;
    setError(null);
    setJoinFailed(false);
    setJoining(true);
    const joinKey = getOrCreateJoinKey(inviteCode);

    let participant;
    try {
      participant = await joinPoll(inviteCode, { nickname, joinKey });
    } catch (joinError) {
      joiningRef.current = false;
      setJoining(false);
      if (joinError && joinError.status === HTTP_CONFLICT) {
        setError(NICKNAME_ERROR.TAKEN);
        return { status: JOIN_RESULT.TAKEN };
      }
      setJoinFailed(true);
      return { status: JOIN_RESULT.FAILED };
    }

    saveJoin(inviteCode, { joinKey, nickname: participant.nickname });
    setJoinedNickname(participant.nickname);
    setJoining(false);
    return { status: JOIN_RESULT.JOINED };
  }

  return { nickname, error, joining, joinFailed, joinedNickname, setNickname, submit };
}
