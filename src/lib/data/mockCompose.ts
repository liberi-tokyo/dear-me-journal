import { MOCK_ARCHIVE_ENTRIES } from "@/lib/data/mockArchive";
import type { EntryDate } from "@/lib/types/entry";
import { todayEntryDate } from "@/lib/utils/date";

export type MockComposeInitial = {
  mode: "create" | "edit";
  entryDate: EntryDate;
  body: string;
  color: string;
  photoPreviewUrl?: string;
};

/** 編集モード用: アーカイブのダミーデータから該当日を読み込む */
export function getMockComposeInitial(date?: string): MockComposeInitial {
  const entryDate = date ?? todayEntryDate();
  const existing = MOCK_ARCHIVE_ENTRIES.find((e) => e.entryDate === entryDate);

  if (existing) {
    return {
      mode: "edit",
      entryDate,
      body: "（編集モードのダミー本文）この日の思い出を書き直せます。",
      color: existing.color,
      photoPreviewUrl: existing.photoUrl,
    };
  }

  return {
    mode: "create",
    entryDate,
    body: "",
    color: "",
  };
}
