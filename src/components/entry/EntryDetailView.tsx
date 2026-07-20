"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

import { EntryCard } from "@/components/entry/EntryCard";
import { useAuth } from "@/contexts/AuthContext";
import { getCachedEntryByDate } from "@/lib/entries/cache";
import { toPastEntryDisplay } from "@/lib/entries/mappers";
import { getEntryByDate } from "@/lib/entries/repository";
import type { EntryDate } from "@/lib/types/entry";
import type { PastEntryDisplay } from "@/lib/types/pastEntry";

type EntryDetailViewProps = {
  entryDate: EntryDate;
};

const ENTRY_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export function EntryDetailView({ entryDate }: EntryDetailViewProps) {
  const { user } = useAuth();
  const userId = user?.uid;
  const isValidDate = ENTRY_DATE_PATTERN.test(entryDate);
  const initialCached =
    isValidDate && userId ? getCachedEntryByDate(userId, entryDate) : undefined;
  const hadInitialCacheRef = useRef(Boolean(initialCached));

  const [entry, setEntry] = useState<PastEntryDisplay | null>(() =>
    initialCached ? toPastEntryDisplay(initialCached) : null,
  );
  const [loading, setLoading] = useState(isValidDate && !initialCached);
  const [missing, setMissing] = useState(
    !isValidDate || initialCached === null,
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isValidDate || !userId) {
      return;
    }

    let cancelled = false;

    void (async () => {
      try {
        const diaryEntry = await getEntryByDate(userId, entryDate);
        if (cancelled) {
          return;
        }
        if (!diaryEntry) {
          setMissing(true);
          setEntry(null);
        } else {
          setEntry(toPastEntryDisplay(diaryEntry));
          setMissing(false);
          setError(null);
        }
      } catch {
        if (!cancelled && !hadInitialCacheRef.current) {
          setMissing(true);
          setError("日記を読み込めませんでした");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [entryDate, isValidDate, userId]);

  if (loading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-stone-400">
        読み込み中…
      </div>
    );
  }

  if (missing || !entry) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-6">
        <p className="text-sm text-stone-500">
          {error ?? "日記が見つかりません"}
        </p>
        <Link
          href="/"
          className="mt-6 text-sm text-stone-400 transition-colors hover:text-stone-600"
        >
          ← アーカイブ
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-10 bg-[#FFF] px-5 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="text-sm text-stone-400 transition-colors hover:text-stone-600"
          >
            ← アーカイブ
          </Link>
          <Link
            href={`/compose?date=${entryDate}`}
            className="text-sm text-stone-500 transition-colors hover:text-stone-700"
          >
            編集
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-md px-6 pb-16 pt-4">
        <EntryCard entry={entry} />
      </main>
    </div>
  );
}
