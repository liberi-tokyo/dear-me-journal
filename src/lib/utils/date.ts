import type { EntryDate } from "@/lib/types/entry";
import type { ArchiveDayEntry, MonthGridCell } from "@/lib/types/archive";

/** ローカルタイムゾーンで YYYY-MM-DD を生成 */
export function toEntryDate(year: number, month: number, day: number): EntryDate {
  const y = String(year);
  const m = String(month).padStart(2, "0");
  const d = String(day).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseEntryDate(entryDate: EntryDate): {
  year: number;
  month: number;
  day: number;
} {
  const [year, month, day] = entryDate.split("-").map(Number);
  return { year, month, day };
}

/** 今日の YYYY-MM-DD（Asia/Tokyo） */
export function todayEntryDate(): EntryDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());

  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  return toEntryDate(year, month, day);
}

/** entryDate から MM-DD を取得 */
export function toMonthDay(entryDate: EntryDate): string {
  const { month, day } = parseEntryDate(entryDate);
  return `${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

/**
 * 暦日ベースで日数を加算（時刻・UTCずれを避けるため UTC 正午相当の暦演算）
 */
export function addCalendarDays(entryDate: EntryDate, deltaDays: number): EntryDate {
  const { year, month, day } = parseEntryDate(entryDate);
  const date = new Date(Date.UTC(year, month - 1, day));
  date.setUTCDate(date.getUTCDate() + deltaDays);
  return toEntryDate(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

/** reference - past の暦日差（同じ日なら 0、past が前なら正） */
export function calendarDaysBetween(
  referenceEntryDate: EntryDate,
  pastEntryDate: EntryDate,
): number {
  const reference = parseEntryDate(referenceEntryDate);
  const past = parseEntryDate(pastEntryDate);
  const referenceUtc = Date.UTC(reference.year, reference.month - 1, reference.day);
  const pastUtc = Date.UTC(past.year, past.month - 1, past.day);
  return Math.round((referenceUtc - pastUtc) / 86_400_000);
}

/** ja: 2026年7月5日 */
export function formatEntryDateLabel(entryDate: EntryDate): string {
  const { year, month, day } = parseEntryDate(entryDate);
  return `${year}年${month}月${day}日`;
}

/** 投稿日を基準に、過去日記の「Nか月前の今日 / N年前の今日」ラベルを返す */
export function formatPastTodayLabel(
  referenceEntryDate: EntryDate,
  pastEntryDate: EntryDate,
): string {
  const days = calendarDaysBetween(referenceEntryDate, pastEntryDate);

  if (days <= 0) {
    return "過去の日記";
  }
  if (days === 1) {
    return "1日前";
  }
  if (days < 7) {
    return `${days}日前`;
  }
  if (days <= 10) {
    return "約1週間前";
  }
  if (days <= 45) {
    return "約1か月前";
  }
  if (days < 300) {
    const months = Math.max(2, Math.round(days / 30));
    return `約${months}か月前`;
  }

  const years = Math.max(1, Math.round(days / 365));
  return `約${years}年前`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

/** 月の1日の曜日（0 = 日曜） */
export function getFirstWeekday(year: number, month: number): number {
  return new Date(year, month - 1, 1).getDay();
}

export function indexEntriesByDate(
  entries: ArchiveDayEntry[],
): Map<EntryDate, ArchiveDayEntry> {
  return new Map(entries.map((entry) => [entry.entryDate, entry]));
}

/**
 * 7列グリッド用のセル配列を生成する。
 * 月の前後を null セルで埋め、最終行も週単位で揃える。
 */
export function buildMonthGrid(
  year: number,
  month: number,
  entriesByDate: Map<EntryDate, ArchiveDayEntry>,
  weekStartsOn: 0 | 1 = 0,
): MonthGridCell[] {
  const daysInMonth = getDaysInMonth(year, month);
  let startOffset = getFirstWeekday(year, month) - weekStartsOn;
  if (startOffset < 0) {
    startOffset += 7;
  }

  const cells: MonthGridCell[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ entryDate: null });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const entryDate = toEntryDate(year, month, day);
    cells.push({
      entryDate,
      entry: entriesByDate.get(entryDate),
    });
  }

  const trailing = (7 - (cells.length % 7)) % 7;
  for (let i = 0; i < trailing; i += 1) {
    cells.push({ entryDate: null });
  }

  return cells;
}
