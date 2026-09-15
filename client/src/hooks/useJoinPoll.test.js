import { act, renderHook } from '@testing-library/react';
import useJoinPoll, { JOIN_RESULT } from './useJoinPoll';
import { joinPoll } from '../services/inviteService';

jest.mock('../services/inviteService', () => ({ joinPoll: jest.fn() }));

const CODE = 'q7Kx2Wm9aZ';
const STORAGE_KEY = 'polls.joins';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JOIN_KEY = '0b7f1c3e-2a4d-4f6b-9c8e-1d2f3a4b5c6d';

const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY));
const storeJoin = (joins) => window.localStorage.setItem(STORAGE_KEY, JSON.stringify(joins));
const apiError = (status) => Object.assign(new Error('Request failed'), { status });

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function renderJoin(code = CODE) {
  return renderHook(() => useJoinPoll(code));
}

function type(result, value) {
  act(() => {
    result.current.setNickname(value);
  });
}

async function submit(result) {
  let outcome;
  await act(async () => {
    outcome = await result.current.submit();
  });
  return outcome;
}

describe('useJoinPoll', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  test('starts empty and not joined on a device that has not joined', () => {
    const { result } = renderJoin();

    expect(result.current).toMatchObject({
      nickname: '',
      error: null,
      joining: false,
      joinFailed: false,
      joinedNickname: null,
    });
  });

  test('a device that already joined starts on the joined state with its nickname', () => {
    storeJoin({ [CODE]: { joinKey: JOIN_KEY, nickname: 'Noa' } });

    const { result } = renderJoin();

    expect(result.current.joinedNickname).toBe('Noa');
  });

  test('a join key without a nickname (a join that never finished) is not joined', () => {
    storeJoin({ [CODE]: { joinKey: JOIN_KEY } });

    const { result } = renderJoin();

    expect(result.current.joinedNickname).toBeNull();
  });

  test.each([
    ['empty', ''],
    ['spaces only', '   '],
    ['invisible characters only', '\u200B\u2060'],
  ])('a %s nickname shows the empty error and sends nothing', async (label, value) => {
    const { result } = renderJoin();
    type(result, value);

    expect(await submit(result)).toEqual({ status: JOIN_RESULT.INVALID });

    expect(result.current.error).toBe('empty');
    expect(joinPoll).not.toHaveBeenCalled();
    expect(stored()).toBeNull();
  });

  test('the empty error stays while the nickname is still blank and clears once it is not', async () => {
    const { result } = renderJoin();
    await submit(result);

    type(result, '  ');
    expect(result.current.error).toBe('empty');

    type(result, '  N');
    expect(result.current.error).toBeNull();
  });

  test('joins with the nickname and a new join key, remembers the join, and shows the saved nickname', async () => {
    const request = deferred();
    joinPoll.mockReturnValue(request.promise);
    const { result } = renderJoin();
    type(result, '  Noa ');

    let pending;
    act(() => {
      pending = result.current.submit();
    });

    expect(result.current.joining).toBe(true);
    expect(joinPoll).toHaveBeenCalledWith(CODE, { nickname: '  Noa ', joinKey: expect.stringMatching(UUID) });
    const { joinKey } = joinPoll.mock.calls[0][1];
    expect(stored()).toEqual({ [CODE]: { joinKey } });

    await act(async () => {
      request.resolve({ nickname: 'Noa' });
      await pending;
    });

    expect(result.current).toMatchObject({ joining: false, joinedNickname: 'Noa', error: null, joinFailed: false });
    expect(stored()).toEqual({ [CODE]: { joinKey, nickname: 'Noa' } });
  });

  test('the nickname cannot change while joining', () => {
    joinPoll.mockReturnValue(new Promise(() => {}));
    const { result } = renderJoin();
    type(result, 'Noa');

    act(() => {
      result.current.submit();
    });
    type(result, 'Dana');

    expect(result.current.nickname).toBe('Noa');
  });

  test('repeated submits before the first finishes send exactly one request', async () => {
    joinPoll.mockResolvedValue({ nickname: 'Noa' });
    const { result } = renderJoin();
    type(result, 'Noa');

    let outcomes;
    await act(async () => {
      outcomes = await Promise.all([result.current.submit(), result.current.submit(), result.current.submit()]);
    });

    expect(joinPoll).toHaveBeenCalledTimes(1);
    expect(outcomes.map((outcome) => outcome.status)).toEqual([JOIN_RESULT.JOINED, JOIN_RESULT.BUSY, JOIN_RESULT.BUSY]);
  });

  test('submitting after joining sends nothing', async () => {
    joinPoll.mockResolvedValue({ nickname: 'Noa' });
    const { result } = renderJoin();
    type(result, 'Noa');
    await submit(result);

    expect(await submit(result)).toEqual({ status: JOIN_RESULT.BUSY });
    expect(joinPoll).toHaveBeenCalledTimes(1);
  });

  test('a taken nickname shows the taken error, keeps the nickname and unlocks the form', async () => {
    joinPoll.mockRejectedValue(apiError(409));
    const { result } = renderJoin();
    type(result, 'noa');

    expect(await submit(result)).toEqual({ status: JOIN_RESULT.TAKEN });

    expect(result.current).toMatchObject({
      nickname: 'noa',
      error: 'taken',
      joining: false,
      joinFailed: false,
      joinedNickname: null,
    });
    expect(stored()[CODE].nickname).toBeUndefined();
  });

  test('the taken error clears on any change to the nickname', async () => {
    joinPoll.mockRejectedValue(apiError(409));
    const { result } = renderJoin();
    type(result, 'noa');
    await submit(result);

    type(result, 'noa');
    expect(result.current.error).toBe('taken');

    type(result, 'noa2');
    expect(result.current.error).toBeNull();
  });

  test.each([
    ['a network failure', null],
    ['a server error', 500],
    ['a bad request', 400],
  ])('%s shows the join failed state, keeps the nickname and unlocks the form', async (label, status) => {
    joinPoll.mockRejectedValue(apiError(status));
    const { result } = renderJoin();
    type(result, 'Noa');

    expect(await submit(result)).toEqual({ status: JOIN_RESULT.FAILED });

    expect(result.current).toMatchObject({ nickname: 'Noa', error: null, joining: false, joinFailed: true });
  });

  test('retrying after a failure reuses the same join key and clears the failure', async () => {
    joinPoll.mockRejectedValueOnce(apiError(null)).mockResolvedValueOnce({ nickname: 'Noa' });
    const { result } = renderJoin();
    type(result, 'Noa');
    await submit(result);

    await submit(result);

    expect(joinPoll.mock.calls[1][1].joinKey).toBe(joinPoll.mock.calls[0][1].joinKey);
    expect(result.current).toMatchObject({ joinFailed: false, joinedNickname: 'Noa' });
  });

  test('a blank submit after a failure clears the failure', async () => {
    joinPoll.mockRejectedValue(apiError(null));
    const { result } = renderJoin();
    type(result, 'Noa');
    await submit(result);

    type(result, '');
    await submit(result);

    expect(result.current).toMatchObject({ joinFailed: false, error: 'empty' });
  });

  test('when another tab already joined, shows that nickname without sending a request', async () => {
    const { result } = renderJoin();
    type(result, 'Dana');
    storeJoin({ [CODE]: { joinKey: JOIN_KEY, nickname: 'Noa' } });

    expect(await submit(result)).toEqual({ status: JOIN_RESULT.JOINED });

    expect(joinPoll).not.toHaveBeenCalled();
    expect(result.current.joinedNickname).toBe('Noa');
  });

  test('shows the nickname the API returns when this join key had already joined', async () => {
    storeJoin({ [CODE]: { joinKey: JOIN_KEY } });
    joinPoll.mockResolvedValue({ nickname: 'Noa' });
    const { result } = renderJoin();
    type(result, 'Dana');

    await submit(result);

    expect(joinPoll).toHaveBeenCalledWith(CODE, { nickname: 'Dana', joinKey: JOIN_KEY });
    expect(result.current.joinedNickname).toBe('Noa');
    expect(stored()).toEqual({ [CODE]: { joinKey: JOIN_KEY, nickname: 'Noa' } });
  });
});
