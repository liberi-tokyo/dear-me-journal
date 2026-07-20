import type { CSSProperties } from "react";

import type { PastEntryDisplay } from "@/lib/types/pastEntry";
import { getEntryColorShadow } from "@/lib/utils/color";
import { formatEntryDateLabel } from "@/lib/utils/date";

type EntryCardProps = {
  entry: PastEntryDisplay;
};

export function EntryCard({ entry }: EntryCardProps) {
  return (
    <article
      className="w-full rounded-2xl bg-white p-5"
      style={{ boxShadow: getEntryColorShadow(entry.color) } as CSSProperties}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: entry.color }}
          aria-hidden
        />
        <time className="text-sm text-stone-500">
          {formatEntryDateLabel(entry.entryDate)}
        </time>
      </div>

      {entry.photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={entry.photoUrl}
          alt=""
          className="mb-4 aspect-[4/3] w-full rounded-xl object-cover"
        />
      ) : null}

      <p className="whitespace-pre-wrap text-base leading-relaxed text-stone-700">
        {entry.body}
      </p>
    </article>
  );
}
