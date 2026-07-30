"use client";

import { useId } from "react";
import { HexColorInput, HexColorPicker } from "react-colorful";

import { ColorSwatch } from "@/components/compose/ColorSwatch";
import { normalizeHex } from "@/lib/utils/color";

type AppColorPickerProps = {
  color: string;
  recentColors: string[];
  onColorChange: (color: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * アプリ内蔵カラーピッカー（react-colorful）。
 * OS / ブラウザ標準の input[type=color] は使わない。
 */
export function AppColorPicker({
  color,
  recentColors,
  onColorChange,
  onConfirm,
  onCancel,
}: AppColorPickerProps) {
  const titleId = useId();
  const normalized = normalizeHex(color);

  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-[max(1rem,env(safe-area-inset-top,0px))] pb-2">
        <h1 id={titleId} className="text-base font-medium text-stone-800">
          色を選ぶ
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
        <div className="mb-6 flex items-center gap-4">
          <div
            className="size-20 shrink-0 rounded-2xl border border-stone-200/80 shadow-sm"
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
              className="min-h-11 w-full rounded-2xl border border-stone-200 bg-stone-50 px-4 font-mono text-base text-stone-800 outline-none focus:border-stone-300"
            />
          </label>
        </div>

        <div className="app-color-picker">
          <HexColorPicker
            color={normalized}
            onChange={(next) => onColorChange(normalizeHex(next))}
            aria-label="彩度と明るさ、色相の選択"
          />
        </div>

        {recentColors.length > 0 ? (
          <section className="mt-6 pb-4" aria-labelledby="picker-recent-colors">
            <h2
              id="picker-recent-colors"
              className="mb-3 text-sm text-stone-500"
            >
              最近使った色
            </h2>
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
      </div>

      <div className="shrink-0 px-5 pt-3 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))]">
        <button
          type="button"
          onClick={onConfirm}
          className="min-h-12 w-full touch-manipulation rounded-full bg-stone-800 py-3.5 text-base font-medium text-white active:scale-[0.98]"
        >
          この色にする
        </button>
      </div>
    </div>
  );
}
