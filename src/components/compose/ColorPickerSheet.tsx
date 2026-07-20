"use client";

import { useEffect, useId, useRef } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";

import { ColorSwatch } from "@/components/compose/ColorSwatch";
import { normalizeHex } from "@/lib/utils/color";

type ColorPickerSheetProps = {
  open: boolean;
  color: string;
  recentColors: string[];
  onColorChange: (color: string) => void;
  onClose: () => void;
};

export function ColorPickerSheet({
  open,
  color,
  recentColors,
  onColorChange,
  onClose,
}: ColorPickerSheetProps) {
  const titleId = useId();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const normalized = normalizeHex(color);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <button
        type="button"
        className="absolute inset-0 bg-stone-900/35"
        aria-label="カラーピッカーを閉じる"
        onClick={onClose}
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="relative z-10 flex max-h-[min(78dvh,36rem)] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-xl sm:mx-4 sm:rounded-3xl"
      >
        <div className="flex items-center justify-between px-5 pt-4 pb-2">
          <h2 id={titleId} className="text-base font-medium text-stone-800">
            色を選ぶ
          </h2>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={onClose}
            className="min-h-11 min-w-11 touch-manipulation rounded-full text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
          >
            閉じる
          </button>
        </div>

        <div className="overflow-y-auto overscroll-contain px-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
          <div className="mb-5 flex items-center gap-4">
            <div
              className="size-16 shrink-0 rounded-full border border-stone-200/80 shadow-sm"
              style={{ backgroundColor: normalized }}
              aria-label={`選択中の色 ${normalized}`}
              role="img"
            />
            <label className="min-w-0 flex-1">
              <span className="mb-1 block text-xs text-stone-500">HEX</span>
              <HexColorInput
                color={normalized}
                onChange={(next) => onColorChange(normalizeHex(next))}
                prefixed
                aria-label="カラーコード"
                className="min-h-11 w-full rounded-2xl border border-stone-200/90 bg-stone-50 px-4 font-mono text-base text-stone-800 outline-none focus:border-stone-300"
              />
            </label>
          </div>

          <div className="color-picker-sheet">
            <HexColorPicker
              color={normalized}
              onChange={(next) => onColorChange(normalizeHex(next))}
              aria-label="彩度と明るさ、色相の選択"
            />
          </div>

          {recentColors.length > 0 ? (
            <section className="mt-6" aria-labelledby="sheet-recent-colors-heading">
              <h3
                id="sheet-recent-colors-heading"
                className="mb-3 text-sm text-stone-500"
              >
                最近使った色
              </h3>
              <div className="flex flex-wrap gap-3">
                {recentColors.map((recent) => (
                  <ColorSwatch
                    key={recent}
                    color={recent}
                    selected={normalizeHex(recent) === normalized}
                    onSelect={(next) => onColorChange(normalizeHex(next))}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <button
            type="button"
            onClick={onClose}
            className="mt-6 min-h-11 w-full touch-manipulation rounded-full border border-stone-200/90 bg-stone-800 py-3.5 text-base font-medium text-white transition-[transform,opacity] active:scale-[0.98]"
          >
            この色を使う
          </button>
        </div>
      </div>
    </div>
  );
}
