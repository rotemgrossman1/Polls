import { act, renderHook, waitFor } from '@testing-library/react';
import usePoll from './usePoll';
import { getPoll } from '../services/pollService';

jest.mock('../services/pollService', () => ({ getPoll: jest.fn() }));

const POLL = { id: 'poll-1', question: 'Lunch?', options: [] };

describe('usePoll', () => {
  test('shows a poll handed over after creation without requesting it', () => {
    const { result } = renderHook(() => usePoll('poll-1', POLL));

    expect(result.current).toEqual({ data: POLL, loading: false, error: null });
    expect(getPoll).not.toHaveBeenCalled();
  });

  test('loads the poll when nothing was handed over', async () => {
    getPoll.mockResolvedValue(POLL);

    const { result } = renderHook(() => usePoll('poll-1', null));

    expect(result.current.loading).toBe(true);
    await waitFor(() => expect(result.current).toEqual({ data: POLL, loading: false, error: null }));
    expect(getPoll).toHaveBeenCalledWith('poll-1');
  });

  test('ignores a handed-over poll with a different id', async () => {
    getPoll.mockResolvedValue(POLL);

    const { result } = renderHook(() => usePoll('poll-1', { ...POLL, id: 'other' }));

    await waitFor(() => expect(result.current.data).toEqual(POLL));
    expect(getPoll).toHaveBeenCalledWith('poll-1');
  });

  test('reports a load failure', async () => {
    const error = Object.assign(new Error('Request failed with status 404'), { status: 404 });
    getPoll.mockRejectedValue(error);

    const { result } = renderHook(() => usePoll('missing', null));

    await waitFor(() => expect(result.current).toEqual({ data: null, loading: false, error }));
  });

  test('ignores a late response for a previous poll id', async () => {
    const OTHER = { id: 'poll-2', question: 'Dinner?', options: [] };
    let resolveFirst;
    getPoll.mockImplementation((pollId) =>
      pollId === 'poll-1'
        ? new Promise((resolve) => {
            resolveFirst = resolve;
          })
        : Promise.resolve(OTHER),
    );

    const { result, rerender } = renderHook(({ pollId }) => usePoll(pollId, null), {
      initialProps: { pollId: 'poll-1' },
    });
    rerender({ pollId: 'poll-2' });
    await waitFor(() => expect(result.current.data).toEqual(OTHER));

    await act(async () => {
      resolveFirst(POLL);
    });

    expect(result.current).toEqual({ data: OTHER, loading: false, error: null });
  });
});
