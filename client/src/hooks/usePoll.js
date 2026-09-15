import { useEffect, useState } from 'react';
import { getPoll } from '../services/pollService';

/**
 * Loads a poll by id. When `initialPoll` is that poll (handed over right after creating it),
 * it is shown immediately without a request. Returns { data, loading, error }.
 */
export default function usePoll(pollId, initialPoll) {
  const provided = initialPoll && initialPoll.id === pollId ? initialPoll : null;
  const [state, setState] = useState({ data: null, loading: !provided, error: null });

  useEffect(() => {
    if (provided) {
      return undefined;
    }

    let active = true;
    setState({ data: null, loading: true, error: null });
    getPoll(pollId).then(
      (poll) => {
        if (active) {
          setState({ data: poll, loading: false, error: null });
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
  }, [pollId, provided]);

  return provided ? { data: provided, loading: false, error: null } : state;
}
