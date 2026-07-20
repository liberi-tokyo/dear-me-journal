import type { Timestamp } from "firebase/firestore";

/** YYYY-MM-DD（Asia/Tokyo の暦日） */
export type EntryDate = string;

/** MM-DD — 過去日記検索用（entryDate から導出） */
export type MonthDay = string;

/** Firestore: users/{uid}/entries/{entryId} */
export type DiaryEntry = {
  id: string;
  userId: string;
  entryDate: EntryDate;
  /** 過去日記（同月日）検索用 */
  monthDay: MonthDay;
  text: string;
  color: string;
  imageUrl: string | null;
  imagePath: string | null;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type DiaryEntryWriteInput = {
  entryDate: EntryDate;
  text: string;
  color: string;
  imageUrl: string | null;
  imagePath: string | null;
};
