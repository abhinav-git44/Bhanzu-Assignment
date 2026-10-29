// Safe wrappers around localStorage. Storage can be missing or throw
// (private windows, blocked site data, sandboxed previews), so every call
// degrades to in-memory behaviour instead of breaking the experience.

const PREFIX = 'bmm_';

export function load<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(PREFIX + key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
  } catch {
    /* storage unavailable: state lives in memory for this visit */
  }
}

export function clearAll(): void {
  try {
    Object.keys(window.localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => window.localStorage.removeItem(k));
  } catch {
    /* nothing to clear */
  }
}
