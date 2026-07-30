"use client";

import { useState } from "react";

import { AppDatePicker } from "@/components/compose/AppDatePicker";
import type { EntryDate } from "@/lib/types/entry";
import { formatEntryDateLabel, todayEntryDate } from "@/lib/utils/date";

type EntryDateFieldProps = {
  entryDate: EntryDate;
  onChange: (entryDate: EntryDate) => void;
};

/**
 * 日付表示ボタン + アプリ内蔵カレンダー。
 * iOS Safari プライベートでも OS の date picker に依存しない。
 */
export function EntryDateField({ entryDate, onChange }: EntryDateFieldProps) {
  const [open, setOpen] = useState(false);
  const maxDate = todayEntryDate();

  return (
    <>
      <div className="mx-auto mt-2 flex w-full max-w-[16rem] flex-col items-center">
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label={`日付を選ぶ（現在: ${formatEntryDateLabel(entryDate)}）`}
          className="box-border flex min-h-11 w-full touch-manipulation items-center justify-center rounded-xl border border-stone-200 bg-stone-50 px-3 text-center text-base font-medium text-stone-700 active:bg-stone-100"
        >
          {formatEntryDateLabel(entryDate)}
        </button>
        <p className="mt-1.5 text-xs text-stone-400">タップして日付を変更</p>
      </div>

      {open ? (
        <AppDatePicker
          value={entryDate}
          max={maxDate}
          onCancel={() => setOpen(false)}
          onConfirm={(nextDate) => {
            if (nextDate && nextDate <= maxDate) {
              onChange(nextDate);
            }
            setOpen(false);
          }}
        />
      ) : null}
    </>
  );
}
