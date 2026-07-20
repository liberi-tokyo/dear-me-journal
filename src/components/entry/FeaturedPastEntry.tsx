import type { CSSProperties } from "react";

import type { EntryDate } from "@/lib/types/entry";
import type { PastEntryDisplay } from "@/lib/types/pastEntry";
import { getEntryColorShadow } from "@/lib/utils/color";
import { formatEntryDateLabel, formatPastTodayLabel } from "@/lib/utils/date";

type FeaturedPastEntryProps = {
  entry: PastEntryDisplay;
  referenceEntryDate: EntryDate;
};

/** 返ってきた1件目 — じっくり読める見せ方 */
export function FeaturedPastEntry({
  entry,
  referenceEntryDate,
}: FeaturedPastEntryProps) {
  return (
    <article
      className="w-full rounded-2xl bg-white px-5 py-6"
      style={{ boxShadow: getEntryColorShadow(entry.color) } as CSSProperties}
    >
      <div
        className="mb-6 h-1 w-12 rounded-full"
        style={{ backgroundColor: entry.color }}
        aria-hidden
      />

      <header className="mb-6 flex items-baseline justify-between gap-4">
        <p className="text-lg font-medium text-stone-800">
          {formatPastTodayLabel(referenceEntryDate, entry.entryDate)}
        </p>
        <time className="shrink-0 text-sm text-stone-500">
          {formatEntryDateLabel(entry.entryDate)}
        </time>
      </header>

      {entry.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="aspect-[4/3] w-full rounded-xl object-cover"
        />
      ) : null}

      <p className="mt-6 whitespace-pre-wrap text-xl leading-[1.85] text-stone-800">
        {entry.body}
      </p>
    </article>
  );
}
