import {
  collection,
  deleteDoc,
  doc,
  documentId,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";

import {
  getCachedEntryByDate,
  mergeCachedEntries,
  upsertCachedEntry,
} from "@/lib/entries/cache";
import {
  buildSameDayTargetDates,
  selectSameDayPastEntries,
  type PastEntrySelection,
} from "@/lib/entries/selectPastEntries";
import { getClientFirestore } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/firebase/constants";
import type { DiaryEntry, DiaryEntryWriteInput, EntryDate } from "@/lib/types/entry";
import { toMonthDay } from "@/lib/utils/date";
import { perfLog, perfMeasure } from "@/lib/perf";

const FIRESTORE_IN_QUERY_LIMIT = 30;

function entriesCollection(userId: string) {
  return collection(
    getClientFirestore(),
    COLLECTIONS.users,
    userId,
    COLLECTIONS.entries,
  );
}

function entryDoc(userId: string, entryId: string) {
  return doc(
    getClientFirestore(),
    COLLECTIONS.users,
    userId,
    COLLECTIONS.entries,
    entryId,
  );
}

function mapEntry(id: string, data: DocumentData): DiaryEntry {
  return {
    id,
    userId: String(data.userId ?? ""),
    entryDate: String(data.entryDate ?? id),
    monthDay: String(data.monthDay ?? toMonthDay(String(data.entryDate ?? id))),
    text: String(data.text ?? ""),
    color: String(data.color ?? ""),
    imageUrl: data.imageUrl ?? null,
    imagePath: data.imagePath ?? null,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/** entryDate をドキュメント ID として 1日1件を保証する */
export function entryIdFromDate(entryDate: EntryDate): string {
  return entryDate;
}

export async function getEntryByDate(
  userId: string,
  entryDate: EntryDate,
): Promise<DiaryEntry | null> {
  const snapshot = await getDoc(entryDoc(userId, entryIdFromDate(entryDate)));
  if (!snapshot.exists()) {
    return null;
  }
  return mapEntry(snapshot.id, snapshot.data());
}

function chunkDates(dates: EntryDate[], size: number): EntryDate[][] {
  const chunks: EntryDate[][] = [];
  for (let i = 0; i < dates.length; i += size) {
    chunks.push(dates.slice(i, i + size));
  }
  return chunks;
}

/**
 * 複数 entryDate をドキュメント ID でまとめて取得（最大 30 件/クエリ、並列）。
 * 存在しない日付は結果に含まれない。
 */
export async function getEntriesByDates(
  userId: string,
  entryDates: EntryDate[],
): Promise<Map<EntryDate, DiaryEntry>> {
  const unique = [...new Set(entryDates)];
  const result = new Map<EntryDate, DiaryEntry>();
  if (unique.length === 0) {
    return result;
  }

  const missing: EntryDate[] = [];
  for (const date of unique) {
    const cached = getCachedEntryByDate(userId, date);
    if (cached === undefined) {
      missing.push(date);
    } else if (cached) {
      result.set(date, cached);
    }
  }

  if (missing.length === 0) {
    perfLog("past:getEntriesByDates:allCache", { count: unique.length });
    return result;
  }

  await perfMeasure("past:getEntriesByDates:network", async () => {
    const chunks = chunkDates(missing, FIRESTORE_IN_QUERY_LIMIT);
    const snapshots = await Promise.all(
      chunks.map((chunk) =>
        getDocs(
          query(
            entriesCollection(userId),
            where(documentId(), "in", chunk.map(entryIdFromDate)),
          ),
        ),
      ),
    );

    const fetched: DiaryEntry[] = [];
    for (const snapshot of snapshots) {
      for (const item of snapshot.docs) {
        const entry = mapEntry(item.id, item.data());
        result.set(entry.entryDate, entry);
        fetched.push(entry);
      }
    }
    if (fetched.length > 0) {
      mergeCachedEntries(userId, fetched, false);
    }
    perfLog("past:getEntriesByDates:fetched", {
      requested: missing.length,
      found: fetched.length,
      chunks: chunks.length,
    });
  });

  return result;
}

/** 全件取得（後方互換）。可能なら listEntriesInRange / listRecentEntries を使う */
export async function listEntries(userId: string): Promise<DiaryEntry[]> {
  const snapshot = await getDocs(
    query(entriesCollection(userId), orderBy("entryDate", "desc")),
  );
  const entries = snapshot.docs.map((item) => mapEntry(item.id, item.data()));
  mergeCachedEntries(userId, entries, true);
  return entries;
}

/** entryDate の閉区間で取得 */
export async function listEntriesInRange(
  userId: string,
  startInclusive: EntryDate,
  endInclusive: EntryDate,
): Promise<DiaryEntry[]> {
  const snapshot = await getDocs(
    query(
      entriesCollection(userId),
      where("entryDate", ">=", startInclusive),
      where("entryDate", "<=", endInclusive),
      orderBy("entryDate", "desc"),
    ),
  );
  const entries = snapshot.docs.map((item) => mapEntry(item.id, item.data()));
  mergeCachedEntries(userId, entries, false);
  return entries;
}

/** 指定日より前の日記を新しい順に limit 件 */
export async function listEntriesBefore(
  userId: string,
  beforeExclusive: EntryDate,
  maxCount: number,
): Promise<DiaryEntry[]> {
  const snapshot = await getDocs(
    query(
      entriesCollection(userId),
      where("entryDate", "<", beforeExclusive),
      orderBy("entryDate", "desc"),
      limit(maxCount),
    ),
  );
  const entries = snapshot.docs.map((item) => mapEntry(item.id, item.data()));
  mergeCachedEntries(userId, entries, false);
  return entries;
}

/**
 * 基準日の「同じ日の過去」を優先取得する（投稿完了・詳細で共用）。
 *
 * - 1か月前 / 半年前 / 1〜10年前: documentId で並列バッチ取得
 * - 1週間前・直近ランダムは、1か月枠が空のときだけ追加取得
 * - 表示は最大10件
 */
export async function listPastSameDayMemories(
  userId: string,
  referenceDate: EntryDate,
): Promise<PastEntrySelection[]> {
  return perfMeasure("past:listPastSameDayMemories", async () => {
    const targets = buildSameDayTargetDates(referenceDate);
    const primaryDates = [
      targets.oneMonthAgo,
      targets.sixMonthsAgo,
      ...targets.yearsAgo,
    ].filter((date): date is EntryDate => Boolean(date));

    const entriesByDate = await getEntriesByDates(userId, primaryDates);

    // 基準日より未来・当日は除外
    for (const [date, entry] of [...entriesByDate.entries()]) {
      if (entry.entryDate >= referenceDate) {
        entriesByDate.delete(date);
      }
    }

    const needsMonthFallback =
      !targets.oneMonthAgo || !entriesByDate.has(targets.oneMonthAgo);

    let randomCandidates: DiaryEntry[] = [];

    if (needsMonthFallback) {
      // 1週間前は必要なときだけ
      const weekEntries = await getEntriesByDates(userId, [
        targets.oneWeekAgo,
      ]);
      for (const [date, entry] of weekEntries) {
        if (entry.entryDate < referenceDate) {
          entriesByDate.set(date, entry);
        }
      }

      const hasWeekFallback = entriesByDate.has(targets.oneWeekAgo);
      if (!hasWeekFallback) {
        randomCandidates = await perfMeasure("past:listEntriesBeforeFallback", () =>
          listEntriesBefore(userId, referenceDate, 40),
        );
      }
    }

    const selected = selectSameDayPastEntries(
      referenceDate,
      entriesByDate,
      randomCandidates,
    );

    perfLog("past:listPastSameDayMemories:done", {
      primaryRequested: primaryDates.length,
      selected: selected.length,
      usedWeekFallback: needsMonthFallback,
      usedRandomFallback: randomCandidates.length > 0,
    });

    return selected;
  });
}

/** @deprecated listPastSameDayMemories を使う */
export async function listPastEntriesForCompose(
  userId: string,
  entryDate: EntryDate,
): Promise<DiaryEntry[]> {
  const selected = await listPastSameDayMemories(userId, entryDate);
  return selected.map((item) => item.entry);
}

/** 同じ月日（MM-DD）の過去日記。当日の投稿は除外 */
export async function listPastEntriesByMonthDay(
  userId: string,
  entryDate: EntryDate,
): Promise<DiaryEntry[]> {
  const monthDay = toMonthDay(entryDate);
  const snapshot = await getDocs(
    query(
      entriesCollection(userId),
      where("monthDay", "==", monthDay),
      orderBy("entryDate", "desc"),
    ),
  );

  return snapshot.docs
    .map((item) => mapEntry(item.id, item.data()))
    .filter((entry) => entry.entryDate !== entryDate && entry.entryDate < entryDate);
}

export async function upsertEntry(
  userId: string,
  input: DiaryEntryWriteInput,
  existing?: DiaryEntry | null,
): Promise<DiaryEntry> {
  const entryId = entryIdFromDate(input.entryDate);
  const ref = entryDoc(userId, entryId);
  const monthDay = toMonthDay(input.entryDate);
  const knownExisting =
    existing === undefined
      ? (await getDoc(ref)).exists()
      : existing !== null;

  if (knownExisting) {
    await setDoc(
      ref,
      {
        text: input.text,
        color: input.color,
        imageUrl: input.imageUrl,
        imagePath: input.imagePath,
        monthDay,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  } else {
    await setDoc(ref, {
      id: entryId,
      userId,
      entryDate: input.entryDate,
      monthDay,
      text: input.text,
      color: input.color,
      imageUrl: input.imageUrl,
      imagePath: input.imagePath,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  }

  const saved: DiaryEntry = {
    id: entryId,
    userId,
    entryDate: input.entryDate,
    monthDay,
    text: input.text,
    color: input.color,
    imageUrl: input.imageUrl,
    imagePath: input.imagePath,
    createdAt: existing?.createdAt as DiaryEntry["createdAt"],
    updatedAt: existing?.updatedAt as DiaryEntry["updatedAt"],
  };

  upsertCachedEntry(userId, saved);
  return saved;
}

export async function deleteEntry(
  userId: string,
  entryId: string,
): Promise<void> {
  await deleteDoc(entryDoc(userId, entryId));
}
