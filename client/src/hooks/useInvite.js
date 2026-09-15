import { useCallback, useEffect, useState } from 'react';
import { getInvite } from '../services/inviteService';

/**
 * Loads the poll behind an invite code. Returns { data, loading, error, reload }.
 * `reload` loads it again ("Try again"). A response for an earlier code or attempt is ignored.
 */
export default function useInvite(inviteCode) {
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState({ data: null, loading: true, error: null });

  useEffect(() => {
    let active = true;
    setState({ data: null, loading: true, error: null });
    getInvite(inviteCode).then(
      (invite) => {
        if (active) {
          setState({ data: invite, loading: false, error: null });
        }
      },
      (error) => {
        if (active) {
          setState({ data: null, loading: false, error });
        }
      },
    );

    return () => {
      active = false;
    };
  }, [inviteCode, attempt]);

  const reload = useCallback(() => setAttempt((count) => count + 1), []);

  return { ...state, reload };
}
