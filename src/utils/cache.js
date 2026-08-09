const store = new Map();

export const CACHE_TTL = {
  list: 30_000,
  featured: 60_000,
  stats: 60_000,
};

export function getCached(key) {
  const hit = store.get(key);
  if (!hit) return null;
  if (hit.expiresAt <= Date.now()) {
    store.delete(key);
    return null;
  }
  return hit.value;
}

export function setCached(key, value, ttlMs = CACHE_TTL.list) {
  store.set(key, { value, expiresAt: Date.now() + ttlMs });
  return value;
}

export function invalidateCache(prefix = '') {
  if (!prefix) {
    store.clear();
    return;
  }
  for (const key of store.keys()) {
    if (key.startsWith(prefix)) store.delete(key);
  }
}
