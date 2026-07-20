import type { DiaryEntry, EntryDate } from "@/lib/types/entry";

type EntriesCache = {
  userId: string;
  entriesById: Map<string, DiaryEntry>;
  /** 全件ロード済みか（範囲ロードのみの場合は false） */
  complete: boolean;
  updatedAt: number;
};

let cache: EntriesCache | null = null;

function toMap(entries: DiaryEntry[]): Map<string, DiaryEntry> {
  return new Map(entries.map((entry) => [entry.id, entry]));
}

export function getCachedEntries(userId: string): DiaryEntry[] | null {
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
  return getCachedEntries(userId) ?? entries;
}

export function upsertCachedEntry(userId: string, entry: DiaryEntry): void {
  if (!cache || cache.userId !== userId) {
    setCachedEntries(userId, [entry], false);
    return;
  }
  cache.entriesById.set(entry.id, entry);
  cache.updatedAt = Date.now();
}

export function clearEntriesCache(): void {
  cache = null;
}

export function getCachedEntryByDate(
  userId: string,
  entryDate: EntryDate,
): DiaryEntry | null | undefined {
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
