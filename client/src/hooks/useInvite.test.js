import { act, renderHook, waitFor } from '@testing-library/react';
import useInvite from './useInvite';
import { getInvite } from '../services/inviteService';

jest.mock('../services/inviteService', () => ({ getInvite: jest.fn() }));

const INVITE = { question: 'Lunch?', details: null, status: 'open', optionCount: 3 };

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('useInvite', () => {
  test('loads the invite by code', async () => {
    getInvite.mockResolvedValue(INVITE);

    const { result } = renderHook(() => useInvite('q7Kx2Wm9aZ'));

    expect(result.current).toMatchObject({ data: null, loading: true, error: null });
    await waitFor(() => expect(result.current).toMatchObject({ data: INVITE, loading: false, error: null }));
    expect(getInvite).toHaveBeenCalledWith('q7Kx2Wm9aZ');
  });

  test('reports a load failure', async () => {
    const error = Object.assign(new Error('Request failed with status 404'), { status: 404 });
    getInvite.mockRejectedValue(error);

    const { result } = renderHook(() => useInvite('missing000'));

    await waitFor(() => expect(result.current).toMatchObject({ data: null, loading: false, error }));
  });

  test('reload loads the invite again, showing loading until it arrives', async () => {
    const error = Object.assign(new Error('Request failed without a response'), { status: null });
    getInvite.mockRejectedValueOnce(error);
    const { result } = renderHook(() => useInvite('q7Kx2Wm9aZ'));
    await waitFor(() => expect(result.current.error).toBe(error));

    const retry = deferred();
    getInvite.mockReturnValueOnce(retry.promise);
    act(() => {
      result.current.reload();
    });

    expect(result.current).toMatchObject({ data: null, loading: true, error: null });
    await act(async () => {
      retry.resolve(INVITE);
    });
    expect(result.current).toMatchObject({ data: INVITE, loading: false, error: null });
    expect(getInvite).toHaveBeenCalledTimes(2);
  });

  test('ignores a late response for a previous code', async () => {
    const first = deferred();
    const OTHER = { ...INVITE, question: 'Dinner?' };
    getInvite.mockImplementation((code) => (code === 'firstCode0' ? first.promise : Promise.resolve(OTHER)));

    const { result, rerender } = renderHook(({ code }) => useInvite(code), { initialProps: { code: 'firstCode0' } });
    rerender({ code: 'otherCode0' });
    await waitFor(() => expect(result.current.data).toEqual(OTHER));

    await act(async () => {
      first.resolve(INVITE);
    });

    expect(result.current).toMatchObject({ data: OTHER, loading: false, error: null });
  });

  test('ignores a late failure from before a reload', async () => {
    const first = deferred();
    getInvite.mockReturnValueOnce(first.promise).mockResolvedValueOnce(INVITE);
    const { result } = renderHook(() => useInvite('q7Kx2Wm9aZ'));

    act(() => {
      result.current.reload();
    });
    await waitFor(() => expect(result.current.data).toEqual(INVITE));

    await act(async () => {
      first.reject(Object.assign(new Error('Request failed'), { status: null }));
    });

    expect(result.current).toMatchObject({ data: INVITE, loading: false, error: null });
  });
});
