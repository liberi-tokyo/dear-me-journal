"use client";

import { useCallback, useEffect, useState } from "react";

import { ArchiveFab } from "@/components/archive/ArchiveFab";
import { ArchiveSettingsButton } from "@/components/archive/ArchiveSettingsButton";
import { MonthSection } from "@/components/archive/MonthSection";
import { useAuth } from "@/contexts/AuthContext";
import {
  getCachedEntries,
  isEntriesCacheComplete,
  mergeCachedEntries,
} from "@/lib/entries/cache";
import { monthsFromEntries, toArchiveDayEntry } from "@/lib/entries/mappers";
import {
  listEntries,
  listEntriesInRange,
} from "@/lib/entries/repository";
import type { ArchiveDayEntry } from "@/lib/types/archive";
import type { AppLocale } from "@/lib/types/locale";
import { parseEntryDate, todayEntryDate } from "@/lib/utils/date";

type ArchiveViewProps = {
  locale?: AppLocale;
};

/** 初期表示で取る月数（それより古い分は背景で追加取得） */
const INITIAL_MONTHS = 6;

function groupEntriesByMonth(
  entries: ArchiveDayEntry[],
): Map<string, ArchiveDayEntry[]> {
  const grouped = new Map<string, ArchiveDayEntry[]>();

  for (const entry of entries) {
    const { year, month } = parseEntryDate(entry.entryDate);
    const key = `${year}-${month}`;
    const monthEntries = grouped.get(key) ?? [];
    monthEntries.push(entry);
    grouped.set(key, monthEntries);
  }

  return grouped;
}

function initialRangeStart(): string {
  const today = todayEntryDate();
  const { year, month } = parseEntryDate(today);
  // 約 INITIAL_MONTHS か月前の月初
  const startMonthIndex = year * 12 + (month - 1) - (INITIAL_MONTHS - 1);
  const startYear = Math.floor(startMonthIndex / 12);
  const startMonth = (startMonthIndex % 12) + 1;
  return `${startYear}-${String(startMonth).padStart(2, "0")}-01`;
}

export function ArchiveView({ locale = "ja" }: ArchiveViewProps) {
  const { user } = useAuth();
  const userId = user?.uid;
  const cached = userId ? getCachedEntries(userId) : null;

  const [entries, setEntries] = useState<ArchiveDayEntry[]>(() =>
    cached ? cached.map(toArchiveDayEntry) : [],
  );
  const [months, setMonths] = useState<{ year: number; month: number }[]>(() => {
    if (cached) {
      return monthsFromEntries(cached);
    }
    const today = todayEntryDate();
    const { year, month } = parseEntryDate(today);
    return [{ year, month }];
  });
  const [loading, setLoading] = useState(!cached);
  const [error, setError] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);

  const applyEntries = useCallback(
    (diaryEntries: ReturnType<typeof getCachedEntries>) => {
      if (!diaryEntries) {
        return;
      }
      setEntries(diaryEntries.map(toArchiveDayEntry));
      setMonths(monthsFromEntries(diaryEntries));
    },
    [],
  );

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;
    const hasCache = Boolean(getCachedEntries(userId));

    void (async () => {
      if (!hasCache) {
        setLoading(true);
      }
      setError(null);

      try {
        const today = todayEntryDate();
        const start = initialRangeStart();
        const recent = await listEntriesInRange(userId, start, today);
        if (cancelled) {
          return;
        }

        const merged = mergeCachedEntries(userId, recent, false);
        applyEntries(merged);
        setLoading(false);

        if (!isEntriesCacheComplete(userId)) {
          setLoadingOlder(true);
          try {
            const all = await listEntries(userId);
            if (!cancelled) {
              applyEntries(all);
            }
          } catch {
            // 初期範囲は表示済みなので致命傷にしない
          } finally {
            if (!cancelled) {
              setLoadingOlder(false);
            }
          }
        }
      } catch {
        if (!cancelled) {
          if (!hasCache) {
            setError("日記を読み込めませんでした");
            const today = todayEntryDate();
            const { year, month } = parseEntryDate(today);
            setMonths([{ year, month }]);
            setEntries([]);
          }
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyEntries, userId]);

  const entriesByMonth = groupEntriesByMonth(entries);

  const handleRetry = () => {
    if (!userId) {
      return;
    }
    setError(null);
    setLoading(true);
    void (async () => {
      try {
        const all = await listEntries(userId);
        applyEntries(all);
      } catch {
        setError("日記を読み込めませんでした");
      } finally {
        setLoading(false);
      }
    })();
  };

  if (loading) {
    return (
      <div className="relative min-h-dvh bg-white">
        <main className="relative w-full pb-[max(7rem,calc(5rem+env(safe-area-inset-bottom,0px)))] pt-2 md:mx-auto md:max-w-7xl md:px-8 lg:px-10">
          <div className="px-5 pt-24 text-center text-sm text-stone-400">
            読み込み中…
          </div>
        </main>
        <ArchiveFab />
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-white">
      <main className="relative w-full pb-[max(7rem,calc(5rem+env(safe-area-inset-bottom,0px)))] pt-2 md:mx-auto md:max-w-7xl md:px-8 lg:px-10">
        <div className="pointer-events-none absolute top-[max(1.25rem,env(safe-area-inset-top,0px))] right-[max(1.25rem,env(safe-area-inset-right,0px))] z-20 md:top-8 md:right-8 lg:top-10 lg:right-10">
          <div className="pointer-events-auto">
            <ArchiveSettingsButton />
          </div>
        </div>

        {error ? (
          <div className="px-5 pt-16 text-center">
            <p className="text-sm text-red-500" role="alert">
              {error}
            </p>
            <button
              type="button"
              onClick={handleRetry}
              className="mt-3 text-sm text-stone-500 underline"
            >
              再試行
            </button>
          </div>
        ) : null}

        {!error && entries.length === 0 ? (
          <p className="px-5 pt-24 text-center text-sm leading-relaxed text-stone-400">
            まだ日記がありません
            <br />
            右下の＋から、今日のことを残してみましょう
          </p>
        ) : null}

        {loadingOlder ? (
          <p className="px-5 pt-2 text-center text-xs text-stone-300">
            以前の日記を読み込み中…
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-y-14 md:grid-cols-2 md:gap-x-[clamp(2.5rem,8vw,5.5rem)] lg:grid-cols-3 lg:justify-items-center lg:gap-x-[clamp(2rem,5vw,4.5rem)]">
          {months.map(({ year, month }) => (
            <MonthSection
              key={`${year}-${month}`}
              year={year}
              month={month}
              entries={entriesByMonth.get(`${year}-${month}`) ?? []}
              locale={locale}
            />
          ))}
        </div>
      </main>
      <ArchiveFab />
    </div>
  );
}
