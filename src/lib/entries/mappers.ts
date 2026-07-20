import type { ArchiveDayEntry } from "@/lib/types/archive";
import type { DiaryEntry } from "@/lib/types/entry";
import type { PastEntryDisplay } from "@/lib/types/pastEntry";
import { parseEntryDate } from "@/lib/utils/date";

export function toArchiveDayEntry(entry: DiaryEntry): ArchiveDayEntry {
  return {
    entryDate: entry.entryDate,
    color: entry.color,
    photoUrl: entry.imageUrl ?? undefined,
  };
}

export function toPastEntryDisplay(entry: DiaryEntry): PastEntryDisplay {
  return {
    id: entry.id,
    entryDate: entry.entryDate,
    body: entry.text,
    color: entry.color,
    photoUrl: entry.imageUrl ?? undefined,
  };
}

export function monthsFromEntries(
  entries: DiaryEntry[],
): { year: number; month: number }[] {
  const seen = new Set<string>();
  const months: { year: number; month: number }[] = [];

  for (const entry of entries) {
    const { year, month } = parseEntryDate(entry.entryDate);
    const key = `${year}-${month}`;
    if (!seen.has(key)) {
      seen.add(key);
      months.push({ year, month });
    }
  }

  // エントリが無くても今月は表示
  if (months.length === 0) {
    const nowParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tokyo",
      year: "numeric",
      month: "2-digit",
    }).formatToParts(new Date());
    const year = Number(nowParts.find((p) => p.type === "year")?.value);
    const month = Number(nowParts.find((p) => p.type === "month")?.value);
    return [{ year, month }];
  }

  return months.sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year;
    }
    return b.month - a.month;
  });
}
