"use client";

import { useId, useState } from "react";

import type { EntryDate } from "@/lib/types/entry";
import {
  formatEntryDateLabel,
  getDaysInMonth,
  getFirstWeekday,
  parseEntryDate,
  toEntryDate,
  todayEntryDate,
} from "@/lib/utils/date";

const WEEKDAY_LABELS = ["日", "月", "火", "水", "木", "金", "土"] as const;
const MIN_YEAR = 2015;

type AppDatePickerProps = {
  value: EntryDate;
  max?: EntryDate;
  onConfirm: (entryDate: EntryDate) => void;
  onCancel: () => void;
};

type CalendarCell =
  | { kind: "empty"; key: string }
  | { kind: "day"; key: string; date: EntryDate; day: number; disabled: boolean };

function buildCalendarCells(
  year: number,
  month: number,
  maxDate: EntryDate,
): CalendarCell[] {
  const daysInMonth = getDaysInMonth(year, month);
  const startOffset = getFirstWeekday(year, month);
  const cells: CalendarCell[] = [];

  for (let i = 0; i < startOffset; i += 1) {
    cells.push({ kind: "empty", key: `empty-${i}` });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = toEntryDate(year, month, day);
    cells.push({
      kind: "day",
      key: date,
      date,
      day,
      disabled: date > maxDate,
    });
  }

  return cells;
}

/**
 * アプリ内蔵の日付ピッカー。
 * iOS Safari（プライベート含む）でも確実に動くよう、OS標準の date input は使わない。
 */
export function AppDatePicker({
  value,
  max = todayEntryDate(),
  onConfirm,
  onCancel,
}: AppDatePickerProps) {
  const titleId = useId();
  const initial = parseEntryDate(value <= max ? value : max);
  const [draft, setDraft] = useState<EntryDate>(value <= max ? value : max);
  const [viewYear, setViewYear] = useState(initial.year);
  const [viewMonth, setViewMonth] = useState(initial.month);

  const maxParsed = parseEntryDate(max);
  const cells = buildCalendarCells(viewYear, viewMonth, max);

  const canGoPrev =
    viewYear > MIN_YEAR || (viewYear === MIN_YEAR && viewMonth > 1);
  const canGoNext =
    viewYear < maxParsed.year ||
    (viewYear === maxParsed.year && viewMonth < maxParsed.month);

  const goPrevMonth = () => {
    if (!canGoPrev) {
      return;
    }
    if (viewMonth === 1) {
      setViewYear((year) => year - 1);
      setViewMonth(12);
      return;
    }
    setViewMonth((month) => month - 1);
  };

  const goNextMonth = () => {
    if (!canGoNext) {
      return;
    }
    if (viewMonth === 12) {
      setViewYear((year) => year + 1);
      setViewMonth(1);
      return;
    }
    setViewMonth((month) => month + 1);
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-2">
        <h1 id={titleId} className="text-base font-medium text-stone-800">
          日付を選ぶ
        </h1>
        <button
          type="button"
          onClick={onCancel}
          className="min-h-11 min-w-11 touch-manipulation rounded-full px-3 text-sm text-stone-500"
        >
          キャンセル
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5">
        <p className="mb-6 text-center text-2xl font-medium text-stone-800">
          {formatEntryDateLabel(draft)}
        </p>

        <div className="mb-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={goPrevMonth}
            disabled={!canGoPrev}
            aria-label="前の月"
            className="flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-full text-lg text-stone-600 disabled:opacity-30"
          >
            ‹
          </button>
          <p className="text-base font-medium text-stone-700">
            {viewYear}年{viewMonth}月
          </p>
          <button
            type="button"
            onClick={goNextMonth}
            disabled={!canGoNext}
            aria-label="次の月"
            className="flex min-h-11 min-w-11 touch-manipulation items-center justify-center rounded-full text-lg text-stone-600 disabled:opacity-30"
          >
            ›
          </button>
        </div>

        <div
          className="grid grid-cols-7 gap-1"
          role="grid"
          aria-labelledby={titleId}
        >
          {WEEKDAY_LABELS.map((label) => (
            <div
              key={label}
              className="flex h-9 items-center justify-center text-xs text-stone-400"
              role="columnheader"
            >
              {label}
            </div>
          ))}
          {cells.map((cell) => {
            if (cell.kind === "empty") {
              return <div key={cell.key} className="min-h-11" />;
            }

            const selected = cell.date === draft;
            return (
              <button
                key={cell.key}
                type="button"
                role="gridcell"
                disabled={cell.disabled}
                aria-selected={selected}
                aria-label={formatEntryDateLabel(cell.date)}
                onClick={() => setDraft(cell.date)}
                className={`flex min-h-11 touch-manipulation items-center justify-center rounded-xl text-base transition-colors disabled:opacity-25 ${
                  selected
                    ? "bg-stone-800 font-medium text-white"
                    : "text-stone-700 active:bg-stone-100"
                }`}
              >
                {cell.day}
              </button>
            );
          })}
        </div>
      </div>

      <div className="shrink-0 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={() => onConfirm(draft)}
          className="min-h-12 w-full touch-manipulation rounded-full bg-stone-800 py-3.5 text-base font-medium text-white active:scale-[0.98]"
        >
          この日付にする
        </button>
      </div>
    </div>
  );
}
