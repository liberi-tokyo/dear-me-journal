import type { ArchiveDayEntry } from "@/lib/types/archive";
import { toEntryDate } from "@/lib/utils/date";

const DENSE_MONTH_COLORS = [
  "#FF6B6B",
  "#FFD166",
  "#06D6A0",
  "#118AB2",
  "#8338EC",
  "#EF476F",
  "#F4A261",
  "#2A9D8F",
  "#9B5DE5",
  "#90BE6D",
  "#E76F51",
  "#577590",
] as const;

/** 開発確認用: 1か月に多数の投稿がある状態（写真・色混在） */
function createDenseMonthEntries(
  year: number,
  month: number,
  days: number[],
): ArchiveDayEntry[] {
  return days.map((day, index) => {
    const entryDate = toEntryDate(year, month, day);
    const color = DENSE_MONTH_COLORS[index % DENSE_MONTH_COLORS.length];
    const hasPhoto = index % 3 !== 2;

    return hasPhoto
      ? {
          entryDate,
          color,
          photoUrl: `https://picsum.photos/seed/archive-${year}-${month}-${day}/200`,
        }
      : { entryDate, color };
  });
}

/** 2026年7月 — 26件（連続投稿の見え方確認用） */
const MOCK_JULY_2026_DENSE = createDenseMonthEntries(2026, 7, [
  1, 2, 3, 4, 5, 7, 8, 9, 10, 11, 12, 14, 15, 16, 17, 18, 20, 21, 22, 23, 24, 26, 27, 28, 30, 31,
]);

/** 静的モック用のダミー日記データ */
export const MOCK_ARCHIVE_ENTRIES: ArchiveDayEntry[] = [
  // 2026年5月（まばら）
  { entryDate: "2026-05-03", color: "#F4A261" },
  { entryDate: "2026-05-07", color: "#2A9D8F", photoUrl: "https://picsum.photos/seed/may07/200" },
  { entryDate: "2026-05-12", color: "#E76F51" },
  { entryDate: "2026-05-18", color: "#8ECAE6", photoUrl: "https://picsum.photos/seed/may18/200" },
  { entryDate: "2026-05-24", color: "#E9C46A" },
  { entryDate: "2026-05-31", color: "#BC6C25", photoUrl: "https://picsum.photos/seed/may31/200" },

  // 2026年6月（中程度）
  { entryDate: "2026-06-02", color: "#90BE6D" },
  { entryDate: "2026-06-08", color: "#577590", photoUrl: "https://picsum.photos/seed/jun08/200" },
  { entryDate: "2026-06-14", color: "#F94144" },
  { entryDate: "2026-06-15", color: "#F3722C" },
  { entryDate: "2026-06-21", color: "#43AA8B", photoUrl: "https://picsum.photos/seed/jun21/200" },
  { entryDate: "2026-06-27", color: "#9B5DE5" },
  { entryDate: "2026-06-28", color: "#00BBF9", photoUrl: "https://picsum.photos/seed/jun28/200" },

  // 2026年7月（密集 — グリッド確認用）
  ...MOCK_JULY_2026_DENSE,
];

/** モックで表示する月（新しい順） */
export const MOCK_ARCHIVE_MONTHS: { year: number; month: number }[] = [
  { year: 2026, month: 7 },
  { year: 2026, month: 6 },
  { year: 2026, month: 5 },
];

export function findArchiveEntry(entryDate: string): ArchiveDayEntry | undefined {
  return MOCK_ARCHIVE_ENTRIES.find((entry) => entry.entryDate === entryDate);
}

/** 開発確認用の密集月データを単体で参照する場合 */
export const MOCK_DENSE_MONTH_ENTRIES = MOCK_JULY_2026_DENSE;
