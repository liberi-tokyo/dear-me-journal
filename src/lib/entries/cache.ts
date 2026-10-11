import { Timestamp } from "firebase/firestore";

import type { DiaryEntry, EntryDate } from "@/lib/types/entry";

type EntriesCache = {
  userId: string;
  entriesById: Map<string, DiaryEntry>;
  /** 全件ロード済みか（範囲ロードのみの場合は false） */
  complete: boolean;
  updatedAt: number;
};

type PersistedEntry = Omit<DiaryEntry, "createdAt" | "updatedAt"> & {
  createdAtMillis: number | null;
  updatedAtMillis: number | null;
};

type PersistedEntriesCache = {
  version: 1;
  userId: string;
  entries: PersistedEntry[];
  complete: boolean;
  updatedAt: number;
};

const SESSION_CACHE_KEY = "dear-me-journal:entries-cache:v1";

let cache: EntriesCache | null = null;

function toPersistedEntry(entry: DiaryEntry): PersistedEntry {
  const { createdAt, updatedAt, ...persisted } = entry;
  return {
    ...persisted,
    createdAtMillis: createdAt?.toMillis?.() ?? null,
    updatedAtMillis: updatedAt?.toMillis?.() ?? null,
  };
}

function persistCache(): void {
  if (!cache || typeof window === "undefined") {
    return;
  }

  const persisted: PersistedEntriesCache = {
    version: 1,
    userId: cache.userId,
    entries: Array.from(cache.entriesById.values()).map(toPersistedEntry),
    complete: cache.complete,
    updatedAt: cache.updatedAt,
  };

  try {
    window.sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(persisted));
  } catch {
    // 容量制限・プライベートブラウズ等ではメモリキャッシュだけを使う
  }
}

function hydrateCache(userId: string): void {
  if (cache || typeof window === "undefined") {
    return;
  }

  try {
    const raw = window.sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) {
      return;
    }
    const persisted = JSON.parse(raw) as PersistedEntriesCache;
    if (
      persisted.version !== 1 ||
      persisted.userId !== userId ||
      !Array.isArray(persisted.entries)
    ) {
      window.sessionStorage.removeItem(SESSION_CACHE_KEY);
      return;
    }

    cache = {
      userId,
      entriesById: new Map(
        persisted.entries.map((entry) => {
          const { createdAtMillis, updatedAtMillis, ...restored } = entry;
          return [
            entry.id,
            {
              ...restored,
              createdAt: createdAtMillis
                ? Timestamp.fromMillis(createdAtMillis)
                : Timestamp.fromMillis(0),
              updatedAt: updatedAtMillis
                ? Timestamp.fromMillis(updatedAtMillis)
                : Timestamp.fromMillis(0),
            },
          ];
        }),
      ),
      complete: persisted.complete,
      updatedAt: persisted.updatedAt,
    };
  } catch {
    window.sessionStorage.removeItem(SESSION_CACHE_KEY);
  }
}

function toMap(entries: DiaryEntry[]): Map<string, DiaryEntry> {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

export function getCachedEntries(userId: string): DiaryEntry[] | null {
  hydrateCache(userId);
  if (!cache || cache.userId !== userId) {
    return null;
  }
  return Array.from(cache.entriesById.values()).sort((a, b) =>
    a.entryDate < b.entryDate ? 1 : -1,
  );
}

export function isEntriesCacheComplete(userId: string): boolean {
  return Boolean(cache && cache.userId === userId && cache.complete);
}

export function setCachedEntries(
  userId: string,
  entries: DiaryEntry[],
  complete: boolean,
): void {
  cache = {
    userId,
    entriesById: toMap(entries),
    complete,
    updatedAt: Date.now(),
  };
  persistCache();
}

export function mergeCachedEntries(
  userId: string,
  entries: DiaryEntry[],
  markComplete?: boolean,
): DiaryEntry[] {
  if (!cache || cache.userId !== userId) {
    setCachedEntries(userId, entries, markComplete ?? false);
    return getCachedEntries(userId) ?? entries;
  }

  for (const entry of entries) {
    cache.entriesById.set(entry.id, entry);
  }
  if (markComplete) {
    cache.complete = true;
  }
  cache.updatedAt = Date.now();
  persistCache();
  return getCachedEntries(userId) ?? entries;
}

export function upsertCachedEntry(userId: string, entry: DiaryEntry): void {
  if (!cache || cache.userId !== userId) {
    setCachedEntries(userId, [entry], false);
    return;
  }
  cache.entriesById.set(entry.id, entry);
  cache.updatedAt = Date.now();
  persistCache();
}

export function clearEntriesCache(): void {
  cache = null;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.removeItem(SESSION_CACHE_KEY);
    } catch {
      // 利用不可なら何もしない
    }
  }
}

export function getCachedEntryByDate(
  userId: string,
  entryDate: EntryDate,
): DiaryEntry | null | undefined {
  hydrateCache(userId);
  if (!cache || cache.userId !== userId) {
    return undefined;
  }
  const entry = cache.entriesById.get(entryDate);
  if (entry) {
    return entry;
  }
  // 全件未取得のときは「無い」と断定しない
  if (!cache.complete) {
    return undefined;
  }
  return null;
}
