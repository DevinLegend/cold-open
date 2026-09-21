// Lane: match. Local KO history only. No network, no career service.
//
// Key: KO_HISTORY_KEY (`cold-open.ko-history.v1`)
// Shape: KoHistorySave = { version: 1, matches: SavedMatch[] }
// SavedMatch.kos entries are the KoRecords drained from match.koLog.

import type { Controller, FighterId, KoRecord, MatchState } from '../game/types.ts';
import { STOCKS } from '../stage/layout.ts';

export const KO_HISTORY_KEY = 'cold-open.ko-history.v1';
export const KO_HISTORY_VERSION = 1 as const;
/** Oldest summaries drop off after this many saved matches. */
export const KO_HISTORY_LIMIT = 40;

export interface SavedMatch {
  id: string;
  savedAt: number;
  fighters: [FighterId, FighterId];
  control: [Controller, Controller];
  /** Stocks each fighter started with. `STOCKS` in src/stage/layout.ts. */
  stocksEach: number;
  winner: 0 | 1 | null;
  draw: boolean;
  /** False when the log was drained because someone left before the match ended. */
  complete: boolean;
  kos: KoRecord[];
}

export interface KoHistorySave {
  version: typeof KO_HISTORY_VERSION;
  matches: SavedMatch[];
}

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

const memoryStore: KeyValueStore = (() => {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
})();

let cachedStore: KeyValueStore | null = null;

function browserStore(): KeyValueStore | null {
  try {
    if (typeof localStorage === 'undefined') return null;
    const probe = '__cold_open_probe__';
    localStorage.setItem(probe, '1');
    localStorage.removeItem(probe);
    return localStorage;
  } catch {
    return null;
  }
}

/** Browser localStorage when it works. Otherwise an in-memory store for headless tests. */
export function defaultKoStore(): KeyValueStore {
  if (!cachedStore) cachedStore = browserStore() ?? memoryStore;
  return cachedStore;
}

export function createMemoryStore(): KeyValueStore {
  const map = new Map<string, string>();
  return {
    getItem: (key) => (map.has(key) ? map.get(key)! : null),
    setItem: (key, value) => {
      map.set(key, value);
    },
  };
}

export function emptyKoHistory(): KoHistorySave {
  return { version: KO_HISTORY_VERSION, matches: [] };
}

export function loadKoHistory(store: KeyValueStore = defaultKoStore()): KoHistorySave {
  let raw: string | null = null;
  try {
    raw = store.getItem(KO_HISTORY_KEY);
  } catch {
    return emptyKoHistory();
  }
  if (!raw) return emptyKoHistory();
  try {
    const parsed = JSON.parse(raw) as Partial<KoHistorySave>;
    if (parsed.version !== KO_HISTORY_VERSION || !Array.isArray(parsed.matches)) return emptyKoHistory();
    return { version: KO_HISTORY_VERSION, matches: parsed.matches };
  } catch {
    return emptyKoHistory();
  }
}

function writeKoHistory(save: KoHistorySave, store: KeyValueStore): void {
  const trimmed: KoHistorySave = {
    version: KO_HISTORY_VERSION,
    matches: save.matches.slice(-KO_HISTORY_LIMIT),
  };
  try {
    store.setItem(KO_HISTORY_KEY, JSON.stringify(trimmed));
  } catch {
    // Quota or a locked store. The match keeps playing; history is best-effort.
  }
}

export function clearKoHistory(store: KeyValueStore = defaultKoStore()): void {
  writeKoHistory(emptyKoHistory(), store);
}

/**
 * Move `state.koLog` into the local save and clear it.
 * A second call with an empty log does not write another summary.
 * Returns the summary that was written, or null when there was nothing to drain.
 */
export function drainKoLog(state: MatchState, store: KeyValueStore = defaultKoStore()): SavedMatch | null {
  if (state.koLog.length === 0) return null;
  const saved: SavedMatch = {
    id: state.matchId,
    savedAt: Date.now(),
    fighters: [state.fighters[0].id, state.fighters[1].id],
    control: [state.control[0], state.control[1]],
    stocksEach: STOCKS,
    winner: state.winner,
    draw: state.draw,
    complete: state.winner !== null || state.draw,
    kos: state.koLog.map((ko) => ({ ...ko })),
  };
  const history = loadKoHistory(store);
  history.matches.push(saved);
  writeKoHistory(history, store);
  state.koLog.length = 0;
  return saved;
}
