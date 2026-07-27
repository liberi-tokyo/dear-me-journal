"use client";

import { useId } from "react";

import type { EntryDate } from "@/lib/types/entry";
import { formatEntryDateLabel, todayEntryDate } from "@/lib/utils/date";

type EntryDateButtonProps = {
  entryDate: EntryDate;
  onChange: (entryDate: EntryDate) => void;
};

/**
 * iPhone Safari / Chrome でも日付ピッカーが開くよう、
 * 透明オーバーレイではなく実体のある input[type=date] をタップさせる。
 */
export function EntryDateButton({ entryDate, onChange }: EntryDateButtonProps) {
  const inputId = useId();
  const maxDate = todayEntryDate();

  return (
    <div className="mx-auto mt-1 flex w-full max-w-[16rem] flex-col items-center">
      <label htmlFor={inputId} className="sr-only">
        日記の日付（現在: {formatEntryDateLabel(entryDate)}）
      </label>
      <input
        id={inputId}
        type="date"
        value={entryDate}
        max={maxDate}
        onChange={(event) => {
          const nextDate = event.target.value;
          if (nextDate && nextDate <= maxDate) {
            onChange(nextDate);
          }
        }}
        className="min-h-11 w-full touch-manipulation rounded-xl border border-stone-200 bg-stone-50 px-3 text-center text-lg font-medium text-stone-700 outline-none transition-[border-color,background-color] focus:border-stone-400 active:bg-stone-100"
      />
    </div>
  );
}
