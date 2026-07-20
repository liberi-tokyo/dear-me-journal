import type { DiaryEntry, EntryDate } from "@/lib/types/entry";
import { calendarDaysBetween } from "@/lib/utils/date";

type DayTarget = {
  targetDays: number;
  tolerance: number;
};

const ANNIVERSARY_TARGETS: DayTarget[] = [
  { targetDays: 7, tolerance: 2 },
  { targetDays: 30, tolerance: 5 },
  { targetDays: 365, tolerance: 20 },
  { targetDays: 730, tolerance: 25 },
  { targetDays: 1095, tolerance: 30 },
];

function pickClosestToTarget(
  candidates: DiaryEntry[],
  referenceDate: EntryDate,
  targetDays: number,
  tolerance: number,
  usedIds: Set<string>,
): DiaryEntry | undefined {
  let best: DiaryEntry | undefined;
  let bestDelta = Number.POSITIVE_INFINITY;

  for (const entry of candidates) {
    if (usedIds.has(entry.id)) {
      continue;
    }
    const days = calendarDaysBetween(referenceDate, entry.entryDate);
    const delta = Math.abs(days - targetDays);
    if (delta > tolerance) {
      continue;
    }
    if (delta < bestDelta) {
      best = entry;
      bestDelta = delta;
    }
  }

  return best;
}

/**
 * 投稿完了後に表示する過去日記を優先順位で並べる。
 *
 * 1. 今回より前の最も新しい日記
 * 2. 2〜7日前
 * 3. 約1週間前
 * 4. 約1か月前
 * 5〜7. 約1〜3年前
 * 8. その他
 *
 * 重複なし。未来・当日は呼び出し側で除外済み想定。
 * 候補が1件だけならその1件を必ず返す。
 */
export function selectPastEntriesForDisplay(
  referenceDate: EntryDate,
  candidates: DiaryEntry[],
): DiaryEntry[] {
  const past = candidates
    .filter((entry) => entry.entryDate < referenceDate)
    .sort((a, b) => (a.entryDate < b.entryDate ? 1 : -1));

  if (past.length <= 1) {
    return past;
  }

  const usedIds = new Set<string>();
  const result: DiaryEntry[] = [];

  const take = (entry: DiaryEntry | undefined) => {
    if (!entry || usedIds.has(entry.id)) {
      return;
    }
    usedIds.add(entry.id);
    result.push(entry);
  };

  // 1. 最も新しい過去日記
  take(past[0]);

  // 2. 2日前〜7日前（新しい順）
  for (const entry of past) {
    const days = calendarDaysBetween(referenceDate, entry.entryDate);
    if (days >= 2 && days <= 7) {
      take(entry);
    }
  }

  // 3〜7. 約1週間 / 1か月 / 1〜3年前
  for (const target of ANNIVERSARY_TARGETS) {
    take(
      pickClosestToTarget(
        past,
        referenceDate,
        target.targetDays,
        target.tolerance,
        usedIds,
      ),
    );
  }

  // 8. その他（新しい順）
  for (const entry of past) {
    take(entry);
  }

  return result;
}
