import type { DiaryEntry, EntryDate } from "@/lib/types/entry";
import {
  addCalendarDays,
  calendarDaysBetween,
  formatDaysAgoTodayLabel,
  formatYearsAgoTodayLabel,
  parseEntryDate,
  shiftCalendarMonthsStrict,
  shiftCalendarYearsStrict,
} from "@/lib/utils/date";

/** 過去日記の表示上限 */
export const MAX_PAST_SAME_DAY_ENTRIES = 10;

/** 基準日から遡る年数の上限（1〜10年前） */
export const MAX_PAST_YEARS_AGO = 10;

export type PastEntrySlot =
  | "one-month"
  | "one-week-fallback"
  | "random-fallback"
  | "six-months"
  | "years-ago";

export type PastEntrySelection = {
  entry: DiaryEntry;
  label: string;
  slot: PastEntrySlot;
};

export type SameDayTargetDates = {
  oneMonthAgo: EntryDate | null;
  sixMonthsAgo: EntryDate | null;
  oneWeekAgo: EntryDate;
  /** 1年前〜maxYearsAgo年前（存在する暦日のみ） */
  yearsAgo: EntryDate[];
};

/**
 * 基準日に対する「同じ日」ターゲットを生成する。
 * 月末などで日が存在しない月・年は null / 配列から除外（丸めない）。
 */
export function buildSameDayTargetDates(
  referenceDate: EntryDate,
  maxYearsAgo = MAX_PAST_YEARS_AGO,
): SameDayTargetDates {
  const yearsAgo: EntryDate[] = [];
  for (let years = 1; years <= maxYearsAgo; years += 1) {
    const date = shiftCalendarYearsStrict(referenceDate, -years);
    if (date) {
      yearsAgo.push(date);
    }
  }

  return {
    oneMonthAgo: shiftCalendarMonthsStrict(referenceDate, -1),
    sixMonthsAgo: shiftCalendarMonthsStrict(referenceDate, -6),
    oneWeekAgo: addCalendarDays(referenceDate, -7),
    yearsAgo,
  };
}

function yearsBetween(referenceDate: EntryDate, pastDate: EntryDate): number {
  return parseEntryDate(referenceDate).year - parseEntryDate(pastDate).year;
}

/**
 * 取得済みの日記マップから、同じ日の過去枠を優先順位どおりに組み立てる。
 * 最大 MAX_PAST_SAME_DAY_ENTRIES 件。欠けた枠は飛ばし、最大10年前まで埋める。
 *
 * 1. 1か月前の同じ日
 *    - なければ 1週間前
 *    - それもなければ randomCandidates から1件（「N日前の今日」）
 * 2. 半年前の同じ日
 * 3. 1年前〜10年前（存在する年だけ）
 */
export function selectSameDayPastEntries(
  referenceDate: EntryDate,
  entriesByDate: Map<EntryDate, DiaryEntry>,
  randomCandidates: DiaryEntry[] = [],
): PastEntrySelection[] {
  const targets = buildSameDayTargetDates(referenceDate);
  const usedIds = new Set<string>();
  const result: PastEntrySelection[] = [];

  const takeExact = (
    date: EntryDate | null,
    label: string,
    slot: PastEntrySlot,
  ) => {
    if (result.length >= MAX_PAST_SAME_DAY_ENTRIES) {
      return false;
    }
    if (!date) {
      return false;
    }
    const entry = entriesByDate.get(date);
    if (!entry || entry.entryDate >= referenceDate || usedIds.has(entry.id)) {
      return false;
    }
    usedIds.add(entry.id);
    result.push({ entry, label, slot });
    return true;
  };

  // 1. 1か月前 → 1週間前 → ランダム
  if (!takeExact(targets.oneMonthAgo, "1か月前の今日", "one-month")) {
    if (
      !takeExact(
        targets.oneWeekAgo,
        formatDaysAgoTodayLabel(7),
        "one-week-fallback",
      )
    ) {
      if (result.length < MAX_PAST_SAME_DAY_ENTRIES) {
        const pool = randomCandidates.filter(
          (entry) =>
            entry.entryDate < referenceDate && !usedIds.has(entry.id),
        );
        if (pool.length > 0) {
          const picked = pool[Math.floor(Math.random() * pool.length)];
          const days = calendarDaysBetween(referenceDate, picked.entryDate);
          usedIds.add(picked.id);
          result.push({
            entry: picked,
            label: formatDaysAgoTodayLabel(days),
            slot: "random-fallback",
          });
        }
      }
    }
  }

  // 2. 半年前の同じ日
  takeExact(targets.sixMonthsAgo, "半年前の今日", "six-months");

  // 3. 1〜10年前の同じ日（欠けた年は飛ばし、上限まで埋める）
  for (const yearDate of targets.yearsAgo) {
    if (result.length >= MAX_PAST_SAME_DAY_ENTRIES) {
      break;
    }
    const years = yearsBetween(referenceDate, yearDate);
    takeExact(yearDate, formatYearsAgoTodayLabel(years), "years-ago");
  }

  return result;
}
