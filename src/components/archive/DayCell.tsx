import type { CSSProperties } from "react";
import Link from "next/link";

import type { MonthGridCell } from "@/lib/types/archive";
import { parseEntryDate } from "@/lib/utils/date";
import {
  getArchiveBlobPattern,
  getArchiveBlobPatternIndex,
  getArchiveBlobShadow,
  getMutedArchiveColor,
} from "@/lib/utils/color";

type DayCellProps = {
  cell: MonthGridCell;
};

const DATE_LABEL_CLASS =
  "pointer-events-none absolute inset-0 flex items-center justify-center text-xs font-semibold leading-none sm:text-sm";

const PHOTO_DATE_CLASS = `${DATE_LABEL_CLASS} text-white drop-shadow-[0_1px_3px_rgba(0,0,0,0.55)]`;

const COLOR_DATE_CLASS = `${DATE_LABEL_CLASS} text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]`;

const EMPTY_DATE_CLASS = `${DATE_LABEL_CLASS} text-stone-300`;

function CenteredDayNumber({ day, className }: { day: number; className: string }) {
  return (
    <span className={className} aria-hidden>
      {day}
    </span>
  );
}

export function DayCell({ cell }: DayCellProps) {
  if (!cell.entryDate) {
    return <div className="aspect-square" aria-hidden />;
  }

  const { day } = parseEntryDate(cell.entryDate);
  const entry = cell.entry;

  if (!entry) {
    return (
      <div className="relative aspect-square">
        <CenteredDayNumber day={day} className={EMPTY_DATE_CLASS} />
      </div>
    );
  }

  const href = `/entry/${entry.entryDate}`;

  if (entry.photoUrl) {
    return (
      <Link
        href={href}
        className="relative block aspect-square touch-manipulation overflow-hidden"
        aria-label={`${day}日の日記を見る`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={entry.photoUrl}
          alt=""
          loading="lazy"
          decoding="async"
          className="size-full object-cover"
        />
        <CenteredDayNumber day={day} className={PHOTO_DATE_CLASS} />
      </Link>
    );
  }

  const blob = getArchiveBlobPattern(getArchiveBlobPatternIndex(entry.entryDate));

  return (
    <Link
      href={href}
      className="relative block aspect-square touch-manipulation"
      aria-label={`${day}日の日記を見る`}
    >
      <div
        className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        style={
          {
            width: blob.width,
            height: blob.height,
            borderRadius: blob.borderRadius,
            backgroundColor: getMutedArchiveColor(entry.color),
            boxShadow: getArchiveBlobShadow(entry.color),
          } as CSSProperties
        }
        aria-hidden
      />
      <CenteredDayNumber day={day} className={COLOR_DATE_CLASS} />
    </Link>
  );
}
