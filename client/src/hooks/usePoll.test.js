import { renderHook, waitFor } from '@testing-library/react';
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

  test('does not update after unmounting', async () => {
    let resolve;
    getPoll.mockReturnValue(
      new Promise((res) => {
        resolve = res;
      }),
    );
    const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const { unmount } = renderHook(() => usePoll('poll-1', null));
    unmount();
    resolve(POLL);
    await Promise.resolve();

    expect(errorSpy).not.toHaveBeenCalled();
    errorSpy.mockRestore();
  });
});
