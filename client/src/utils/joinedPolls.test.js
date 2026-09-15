const STORAGE_KEY = 'polls.joins';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const JOIN_KEY = '0b7f1c3e-2a4d-4f6b-9c8e-1d2f3a4b5c6d';

// A fresh module per test, so the in-memory fallback starts empty.
function loadModule() {
  let joinedPolls;
  jest.isolateModules(() => {
    joinedPolls = require('./joinedPolls');
  });
  return joinedPolls;
}

const stored = () => JSON.parse(window.localStorage.getItem(STORAGE_KEY));

describe('joinedPolls', () => {
  beforeEach(() => {
    window.localStorage.clear();
    jest.restoreAllMocks();
  });

  test('a poll that was never joined has no join', () => {
    const { getJoin } = loadModule();

    expect(getJoin('q7Kx2Wm9aZ')).toBeNull();
  });

  test('getOrCreateJoinKey creates a random key once and returns the same key after that', () => {
    const { getJoin, getOrCreateJoinKey } = loadModule();

    const joinKey = getOrCreateJoinKey('q7Kx2Wm9aZ');

    expect(joinKey).toMatch(UUID);
    expect(getOrCreateJoinKey('q7Kx2Wm9aZ')).toBe(joinKey);
    expect(getJoin('q7Kx2Wm9aZ')).toEqual({ joinKey });
    expect(stored()).toEqual({ q7Kx2Wm9aZ: { joinKey } });
  });

  test('each poll gets its own key', () => {
    const { getOrCreateJoinKey } = loadModule();

    expect(getOrCreateJoinKey('pollAAAAAA')).not.toBe(getOrCreateJoinKey('pollBBBBBB'));
  });

  test('saveJoin stores the nickname under the invite code, keeping other polls', () => {
    const { getJoin, getOrCreateJoinKey, saveJoin } = loadModule();
    const otherKey = getOrCreateJoinKey('pollBBBBBB');

    saveJoin('pollAAAAAA', { joinKey: JOIN_KEY, nickname: 'Noa' });

    expect(getJoin('pollAAAAAA')).toEqual({ joinKey: JOIN_KEY, nickname: 'Noa' });
    expect(stored()).toEqual({
      pollAAAAAA: { joinKey: JOIN_KEY, nickname: 'Noa' },
      pollBBBBBB: { joinKey: otherKey },
    });
  });

  test('reads storage fresh, so a join saved in another tab is seen', () => {
    const { getJoin } = loadModule();
    expect(getJoin('q7Kx2Wm9aZ')).toBeNull();

    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ q7Kx2Wm9aZ: { joinKey: JOIN_KEY, nickname: 'Noa' } }));

    expect(getJoin('q7Kx2Wm9aZ')).toEqual({ joinKey: JOIN_KEY, nickname: 'Noa' });
  });

  test.each([
    ['not JSON', '{oops'],
    ['an array', '[1,2]'],
    ['a malformed join key', JSON.stringify({ q7Kx2Wm9aZ: { joinKey: 'not-a-uuid', nickname: 'Noa' } })],
    ['an entry that is not an object', JSON.stringify({ q7Kx2Wm9aZ: 'Noa' })],
  ])('damaged storage (%s) reads as not joined and gets a new valid key', (label, value) => {
    window.localStorage.setItem(STORAGE_KEY, value);
    const { getJoin, getOrCreateJoinKey } = loadModule();

    expect(getJoin('q7Kx2Wm9aZ')).toBeNull();
    expect(getOrCreateJoinKey('q7Kx2Wm9aZ')).toMatch(UUID);
  });

  test('ignores a nickname that is not text', () => {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ q7Kx2Wm9aZ: { joinKey: JOIN_KEY, nickname: 7 } }));
    const { getJoin } = loadModule();

    expect(getJoin('q7Kx2Wm9aZ')).toEqual({ joinKey: JOIN_KEY });
  });

  test('invite codes that match object property names are plain keys', () => {
    const { getJoin, saveJoin } = loadModule();

    expect(getJoin('__proto__')).toBeNull();
    expect(getJoin('constructor')).toBeNull();

    saveJoin('__proto__', { joinKey: JOIN_KEY, nickname: 'Noa' });

    expect(getJoin('__proto__')).toEqual({ joinKey: JOIN_KEY, nickname: 'Noa' });
    expect(getJoin('constructor')).toBeNull();
  });

  test('when storage is blocked, joins are kept in memory for this page', () => {
    jest.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });
    const { getJoin, getOrCreateJoinKey, saveJoin } = loadModule();

    expect(getJoin('q7Kx2Wm9aZ')).toBeNull();
    const joinKey = getOrCreateJoinKey('q7Kx2Wm9aZ');
    expect(joinKey).toMatch(UUID);
    expect(getOrCreateJoinKey('q7Kx2Wm9aZ')).toBe(joinKey);

    saveJoin('q7Kx2Wm9aZ', { joinKey, nickname: 'Noa' });
    expect(getJoin('q7Kx2Wm9aZ')).toEqual({ joinKey, nickname: 'Noa' });

    // A reload starts a new page: nothing is remembered.
    expect(loadModule().getJoin('q7Kx2Wm9aZ')).toBeNull();
  });

  test('when only writing is blocked (storage full), the join still works for this page', () => {
    jest.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('QuotaExceededError');
    });
    const { getJoin, saveJoin } = loadModule();

    saveJoin('q7Kx2Wm9aZ', { joinKey: JOIN_KEY, nickname: 'Noa' });

    expect(getJoin('q7Kx2Wm9aZ')).toEqual({ joinKey: JOIN_KEY, nickname: 'Noa' });
  });
});
