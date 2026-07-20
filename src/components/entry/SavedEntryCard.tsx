import type { CSSProperties } from "react";

import type { EntryDate } from "@/lib/types/entry";
import {
  getEntryColorShadow,
  getEntryColorShadowStart,
} from "@/lib/utils/color";
import { formatEntryDateLabel } from "@/lib/utils/date";

type SavedEntryCardProps = {
  entryDate: EntryDate;
  body: string;
  color: string;
  photoUrl?: string;
  /** true のとき縁にじみアニメを省略（カラー選択プレビュー用） */
  preview?: boolean;
};

/** 保存直後の日記カード — 縁から外側へ選択色がやわらかくにじむ */
export function SavedEntryCard({
  entryDate,
  body,
  color,
  photoUrl,
  preview = false,
}: SavedEntryCardProps) {
  return (
    <article
      className={
        preview
          ? "rounded-2xl bg-white p-5"
          : "animate-entry-card-edge-bloom rounded-2xl bg-white p-5"
      }
      style={
        {
          "--entry-shadow-start": getEntryColorShadowStart(color),
          "--entry-resting-shadow": getEntryColorShadow(color),
          boxShadow: preview ? getEntryColorShadow(color) : undefined,
        } as CSSProperties
      }
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="size-3 shrink-0 rounded-full"
          style={{ backgroundColor: color }}
          aria-hidden
        />
        <time className="text-sm text-stone-500">
          {formatEntryDateLabel(entryDate)}
        </time>
      </div>

      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={photoUrl}
          alt=""
          className="mb-4 aspect-square w-full max-w-[12rem] rounded-xl object-cover"
        />
      ) : null}

      {body ? (
        <p className="whitespace-pre-wrap text-base leading-relaxed text-stone-700">
          {body}
        </p>
      ) : (
        <p className="text-base text-stone-400">（本文なし）</p>
      )}
    </article>
  );
}
