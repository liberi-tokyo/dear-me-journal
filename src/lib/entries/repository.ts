import {
  collection,
  deleteDoc,
  doc,
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
 * - 1か月前 / 半年前 / 1週間前（代替）/ 1〜10年前: 対象日の getDoc
 * - 1か月枠の最終代替: 必要時のみ直近過去からランダム1件
 * - 表示は最大10件
 */
export async function listPastSameDayMemories(
  userId: string,
  referenceDate: EntryDate,
): Promise<PastEntrySelection[]> {
  const targets = buildSameDayTargetDates(referenceDate);
  const exactDates = [
    targets.oneMonthAgo,
    targets.sixMonthsAgo,
    targets.oneWeekAgo,
    ...targets.yearsAgo,
  ].filter((date): date is EntryDate => Boolean(date));

  // 同じ日付が複数枠に入らないよう一意化（例:  theoretically overlapping）
  const uniqueDates = [...new Set(exactDates)];

  const exactEntries = await Promise.all(
    uniqueDates.map((date) => getEntryByDate(userId, date)),
  );

  const entriesByDate = new Map<EntryDate, DiaryEntry>();
  for (const entry of exactEntries) {
    if (entry && entry.entryDate < referenceDate) {
      entriesByDate.set(entry.entryDate, entry);
    }
  }

  const needsMonthFallback =
    !targets.oneMonthAgo || !entriesByDate.has(targets.oneMonthAgo);
  const hasWeekFallback = Boolean(
    targets.oneWeekAgo && entriesByDate.has(targets.oneWeekAgo),
  );

  let randomCandidates: DiaryEntry[] = [];
  if (needsMonthFallback && !hasWeekFallback) {
    randomCandidates = await listEntriesBefore(userId, referenceDate, 40);
  }

  return selectSameDayPastEntries(
    referenceDate,
    entriesByDate,
    randomCandidates,
  );
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
