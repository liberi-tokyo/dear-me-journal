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

/**
 * 暦月をずらす。日が存在しない月は丸めず null（例: 3/31 の1か月前 → null）。
 * うるう年の 2/29 も同様に判定する。
 */
export function shiftCalendarMonthsStrict(
  entryDate: EntryDate,
  deltaMonths: number,
): EntryDate | null {
  const { year, month, day } = parseEntryDate(entryDate);
  const totalMonths = year * 12 + (month - 1) + deltaMonths;
  const nextYear = Math.floor(totalMonths / 12);
  const nextMonth = (totalMonths % 12) + 1;
  if (day > getDaysInMonth(nextYear, nextMonth)) {
    return null;
  }
  return toEntryDate(nextYear, nextMonth, day);
}

/**
 * 暦年をずらす。2/29 → 非うるう年は null（丸めない）。
 */
export function shiftCalendarYearsStrict(
  entryDate: EntryDate,
  deltaYears: number,
): EntryDate | null {
  const { year, month, day } = parseEntryDate(entryDate);
  const nextYear = year + deltaYears;
  if (day > getDaysInMonth(nextYear, month)) {
    return null;
  }
  return toEntryDate(nextYear, month, day);
}

/** ja: 2026年7月5日 */
export function formatEntryDateLabel(entryDate: EntryDate): string {
  const { year, month, day } = parseEntryDate(entryDate);
  return `${year}年${month}月${day}日`;
}

/** N日前の今日 */
export function formatDaysAgoTodayLabel(days: number): string {
  if (days <= 0) {
    return "過去の今日";
  }
  return `${days}日前の今日`;
}

/** N年前の今日 */
export function formatYearsAgoTodayLabel(years: number): string {
  if (years <= 0) {
    return "過去の今日";
  }
  return `${years}年前の今日`;
}

/**
 * 投稿日を基準に、過去日記ラベルを返す（スロット不明時のフォールバック）。
 * スロット付き表示では PastEntryDisplay.pastLabel を優先する。
 */
export function formatPastTodayLabel(
  referenceEntryDate: EntryDate,
  pastEntryDate: EntryDate,
): string {
  const days = calendarDaysBetween(referenceEntryDate, pastEntryDate);
  if (days <= 0) {
    return "過去の今日";
  }

  const oneMonth = shiftCalendarMonthsStrict(referenceEntryDate, -1);
  if (oneMonth && pastEntryDate === oneMonth) {
    return "1か月前の今日";
  }

  const sixMonths = shiftCalendarMonthsStrict(referenceEntryDate, -6);
  if (sixMonths && pastEntryDate === sixMonths) {
    return "半年前の今日";
  }

  const reference = parseEntryDate(referenceEntryDate);
  const past = parseEntryDate(pastEntryDate);
  if (reference.month === past.month && reference.day === past.day) {
    const years = reference.year - past.year;
    if (years >= 1) {
      return formatYearsAgoTodayLabel(years);
    }
  }

  return formatDaysAgoTodayLabel(days);
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
