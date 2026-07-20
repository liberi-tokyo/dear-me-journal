"use client";

import type { CSSProperties } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { ArchiveListFab } from "@/components/archive/ArchiveListFab";
import { EntryCard } from "@/components/entry/EntryCard";
import { FeaturedPastEntry } from "@/components/entry/FeaturedPastEntry";
import { SavedEntryCard } from "@/components/entry/SavedEntryCard";
import type { EntryDate } from "@/lib/types/entry";
import type { PastEntryDisplay } from "@/lib/types/pastEntry";
import { getPostHeroGradientBackground } from "@/lib/utils/color";

/** 投稿カードの縁シャドウ演出（globals.css と同期） */
const SAVED_CARD_SHADOW_MS = 1000;
/** シャドー完了後、過去アーカイブを表示するまでの待ち */
const PAST_ARCHIVE_DELAY_MS = 750;

export type SavedEntrySnapshot = {
  entryDate: EntryDate;
  body: string;
  color: string;
  photoUrl?: string;
};

type PastEntriesStepProps = {
  savedEntry: SavedEntrySnapshot;
  entries: PastEntryDisplay[];
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
};

export function PastEntriesStep({
  savedEntry,
  entries,
  loading = false,
  error = null,
  onRetry,
}: PastEntriesStepProps) {
  const [showPastArchive, setShowPastArchive] = useState(false);
  const [visibleCount, setVisibleCount] = useState(1);
  const [hasScrolled, setHasScrolled] = useState(false);
  const [entriesKey, setEntriesKey] = useState(() =>
    entries.map((entry) => entry.id).join("|"),
  );
  const sentinelRef = useRef<HTMLDivElement>(null);

  const nextEntriesKey = entries.map((entry) => entry.id).join("|");
  if (nextEntriesKey !== entriesKey) {
    setEntriesKey(nextEntriesKey);
    setVisibleCount(1);
  }

  const primaryEntry = entries[0];
  const additionalEntries = entries.slice(1, visibleCount);
  const hasMore = visibleCount < entries.length;

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShowPastArchive(true);
    }, SAVED_CARD_SHADOW_MS + PAST_ARCHIVE_DELAY_MS);

    return () => window.clearTimeout(timer);
  }, []);

  const loadMore = useCallback(() => {
    setVisibleCount((current) => Math.min(current + 1, entries.length));
  }, [entries.length]);

  useEffect(() => {
    if (!showPastArchive) {
      return;
    }

    const onScroll = () => setHasScrolled(true);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [showPastArchive]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!showPastArchive || !sentinel || !hasMore || !hasScrolled) {
      return;
    }

    const observer = new IntersectionObserver(
      (records) => {
        if (records[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "80px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, hasScrolled, loadMore, showPastArchive, visibleCount]);

  return (
    <div className="bg-white pb-[max(7rem,calc(5rem+env(safe-area-inset-bottom,0px)))]">
      <section
        aria-label="保存した日記"
        className="flex min-h-dvh flex-col items-center justify-center px-6 pt-16 pb-24"
        style={
          {
            background: getPostHeroGradientBackground(savedEntry.color),
          } as CSSProperties
        }
      >
        <div className="w-full max-w-md">
          <SavedEntryCard
            key={`${savedEntry.entryDate}-${savedEntry.color}`}
            entryDate={savedEntry.entryDate}
            body={savedEntry.body}
            color={savedEntry.color}
            photoUrl={savedEntry.photoUrl}
          />
        </div>
      </section>

      {showPastArchive ? (
        <div className="animate-past-archive-reveal px-6 pt-4 pb-8">
          <div className="mx-auto w-full max-w-md">
            <section aria-label="返ってきた日記" className="flex flex-col gap-6">
              {loading ? (
                <p className="py-8 text-center text-sm text-stone-400">
                  過去の日記を読み込み中…
                </p>
              ) : null}

              {!loading && error ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-red-500" role="alert">
                    {error}
                  </p>
                  {onRetry ? (
                    <button
                      type="button"
                      onClick={onRetry}
                      className="mt-3 text-sm text-stone-500 underline"
                    >
                      再試行
                    </button>
                  ) : null}
                </div>
              ) : null}

              {!loading && !error && primaryEntry ? (
                <FeaturedPastEntry
                  entry={primaryEntry}
                  referenceEntryDate={savedEntry.entryDate}
                />
              ) : null}

              {!loading && !error && !primaryEntry ? (
                <p className="py-8 text-center text-sm text-stone-400">
                  まだほかの日記はありません
                </p>
              ) : null}

              {additionalEntries.map((entry) => (
                <div key={entry.id} className="animate-fade-in-up">
                  <EntryCard entry={entry} />
                </div>
              ))}
            </section>

            {hasMore ? (
              <div className="mt-6 flex flex-col items-center gap-3 pb-8">
                <p className="text-center text-sm text-stone-400">
                  ほかの思い出も、のこっている
                </p>
                <span className="text-stone-300" aria-hidden>
                  ↓
                </span>
                <div ref={sentinelRef} className="h-px w-full" aria-hidden />
              </div>
            ) : null}
          </div>
        </div>
      ) : null}
      <ArchiveListFab />
    </div>
  );
}
