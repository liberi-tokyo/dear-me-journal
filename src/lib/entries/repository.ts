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
import { selectPastEntriesForDisplay } from "@/lib/entries/selectPastEntries";
import { getClientFirestore } from "@/lib/firebase/client";
import { COLLECTIONS } from "@/lib/firebase/constants";
import type { DiaryEntry, DiaryEntryWriteInput, EntryDate } from "@/lib/types/entry";
import { addCalendarDays, toMonthDay } from "@/lib/utils/date";

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
 * 投稿完了後の過去日記候補。
 * 全件取得せず、直近 + 記念日付近の範囲だけを並列取得して優先順位付けする。
 */
export async function listPastEntriesForCompose(
  userId: string,
  entryDate: EntryDate,
): Promise<DiaryEntry[]> {
  const ranges: Array<[EntryDate, EntryDate]> = [
    [addCalendarDays(entryDate, -40), addCalendarDays(entryDate, -2)],
    [addCalendarDays(entryDate, -385), addCalendarDays(entryDate, -345)],
    [addCalendarDays(entryDate, -750), addCalendarDays(entryDate, -710)],
    [addCalendarDays(entryDate, -1125), addCalendarDays(entryDate, -1065)],
  ];

  const [recent, ...rangeResults] = await Promise.all([
    listEntriesBefore(userId, entryDate, 40),
    ...ranges.map(([start, end]) => listEntriesInRange(userId, start, end)),
  ]);

  const byId = new Map<string, DiaryEntry>();
  for (const entry of [...recent, ...rangeResults.flat()]) {
    if (entry.entryDate < entryDate) {
      byId.set(entry.id, entry);
    }
  }

  return selectPastEntriesForDisplay(entryDate, Array.from(byId.values()));
}

/** @deprecated 同月日検索。compose では listPastEntriesForCompose を使う */
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
    .filter((entry) => entry.entryDate !== entryDate);
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
