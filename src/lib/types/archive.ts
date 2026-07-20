import type { EntryDate } from "./entry";

/** Archive UI で使う日記データ（Firestore 非依存） */
export type ArchiveDayEntry = {
  entryDate: EntryDate;
  color: string;
  photoUrl?: string;
};

export type MonthGridCell = {
  entryDate: EntryDate | null;
  entry?: ArchiveDayEntry;
};
