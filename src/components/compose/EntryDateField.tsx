"use client";

import { useId } from "react";

import type { EntryDate } from "@/lib/types/entry";
import { formatEntryDateLabel, todayEntryDate } from "@/lib/utils/date";

type EntryDateFieldProps = {
  entryDate: EntryDate;
  onChange: (entryDate: EntryDate) => void;
};

/**
 * ネイティブの input[type=date] をそのまま表示する。
 * showPicker / 透明オーバーレイ / 別ボタン起動は使わない。
 */
export function EntryDateField({ entryDate, onChange }: EntryDateFieldProps) {
  const inputId = useId();
  const maxDate = todayEntryDate();

  return (
    <div className="mx-auto mt-2 flex w-full max-w-[16rem] flex-col items-center">
      <label
        htmlFor={inputId}
        className="mb-1.5 text-center text-sm text-stone-500"
      >
        {formatEntryDateLabel(entryDate)}
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
        className="box-border min-h-11 w-full touch-manipulation rounded-xl border border-stone-200 bg-stone-50 px-3 text-center text-base leading-normal text-stone-700 outline-none focus:border-stone-400"
      />
    </div>
  );
}
