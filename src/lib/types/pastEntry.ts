import type { EntryDate } from "./entry";

/** 過去日記表示用（Firestore 非依存） */
export type PastEntryDisplay = {
  id: string;
  entryDate: EntryDate;
  body: string;
  color: string;
  photoUrl?: string;
  /** 選定スロット由来の表示ラベル（例: 1か月前の今日） */
  pastLabel?: string;
};
