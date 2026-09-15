// Remembers, on this device, which polls were joined: { [inviteCode]: { joinKey, nickname? } }.
// `joinKey` is created before the first join request and reused for retries, so a lost response
// never creates a second participant. `nickname` is added once the join succeeds.
// If storage is blocked (private mode, disabled cookies), joins are kept in memory for this page.

const STORAGE_KEY = 'polls.joins';
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Entries that could not be written to storage.
const memory = new Map();

// Keeps only well-formed entries, so a damaged value never reaches the API.
function toEntry(value) {
  if (!value || typeof value !== 'object' || typeof value.joinKey !== 'string' || !UUID.test(value.joinKey)) {
    return null;
  }
  return typeof value.nickname === 'string' && value.nickname
    ? { joinKey: value.joinKey, nickname: value.nickname }
    : { joinKey: value.joinKey };
}

// Reads the stored map into an object without a prototype, so any invite code is a plain key.
function readStored() {
  const joins = Object.create(null);
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      Object.keys(parsed).forEach((code) => {
        joins[code] = parsed[code];
      });
    }
  } catch {
    // Blocked or damaged storage reads as empty; memory still has this page's joins.
  }
  return joins;
}

function writeEntry(inviteCode, entry) {
  try {
    const joins = readStored();
    joins[inviteCode] = entry;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(joins));
    memory.delete(inviteCode);
  } catch {
    memory.set(inviteCode, entry);
  }
}

// Reads fresh each time, so a join saved in another tab is seen.
export function getJoin(inviteCode) {
  if (memory.has(inviteCode)) {
    return memory.get(inviteCode);
  }
  const joins = readStored();
  return Object.hasOwn(joins, inviteCode) ? toEntry(joins[inviteCode]) : null;
}

export function getOrCreateJoinKey(inviteCode) {
  const existing = getJoin(inviteCode);
  if (existing) {
    return existing.joinKey;
  }
  const joinKey = crypto.randomUUID();
  writeEntry(inviteCode, { joinKey });
  return joinKey;
}

export function saveJoin(inviteCode, { joinKey, nickname }) {
  writeEntry(inviteCode, { joinKey, nickname });
}
