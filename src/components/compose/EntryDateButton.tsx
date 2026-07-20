"use client";

import { useRef } from "react";

import type { EntryDate } from "@/lib/types/entry";
import { formatEntryDateLabel, todayEntryDate } from "@/lib/utils/date";

type EntryDateButtonProps = {
  entryDate: EntryDate;
  onChange: (entryDate: EntryDate) => void;
};

export function EntryDateButton({ entryDate, onChange }: EntryDateButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const maxDate = todayEntryDate();

  const openPicker = () => {
    const input = inputRef.current;
    if (!input) {
      return;
    }
    if (typeof input.showPicker === "function") {
      input.showPicker();
      return;
    }
    input.click();
  };

  return (
    <>
      <button
        type="button"
        onClick={openPicker}
        aria-label={`日付を選ぶ（現在: ${formatEntryDateLabel(entryDate)}）`}
        className="mx-auto mt-1 flex touch-manipulation items-center gap-1.5 rounded-sm border-b border-stone-300/90 pb-0.5 text-lg font-medium text-stone-700 transition-colors active:border-stone-400 active:text-stone-900"
      >
        <span>{formatEntryDateLabel(entryDate)}</span>
        <span className="text-[0.65rem] leading-none text-stone-400" aria-hidden>
          ▼
        </span>
      </button>
      <input
        ref={inputRef}
        type="date"
        value={entryDate}
        max={maxDate}
        aria-hidden
        tabIndex={-1}
        className="pointer-events-none absolute h-0 w-0 opacity-0"
        onChange={(event) => {
          const nextDate = event.target.value;
          if (nextDate && nextDate <= maxDate) {
            onChange(nextDate);
          }
        }}
      />
    </>
  );
}
