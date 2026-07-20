"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type CSSProperties,
} from "react";

import { ColorPickerSheet } from "@/components/compose/ColorPickerSheet";
import { ColorSwatch } from "@/components/compose/ColorSwatch";
import { SavedEntryCard } from "@/components/entry/SavedEntryCard";
import type { EntryDate } from "@/lib/types/entry";
import {
  getPostHeroGradientBackground,
  normalizeHex,
} from "@/lib/utils/color";

const DEFAULT_DRAFT_COLOR = "#ffd166";

type ComposeColorStepProps = {
  recentColors: string[];
  initialColor?: string;
  entryDate: EntryDate;
  body: string;
  photoPreviewUrl?: string;
  saving?: boolean;
  onConfirm: (color: string) => void;
};

export function ComposeColorStep({
  recentColors,
  initialColor,
  entryDate,
  body,
  photoPreviewUrl,
  saving = false,
  onConfirm,
}: ComposeColorStepProps) {
  const headingId = useId();
  const [draftColor, setDraftColor] = useState(() =>
    normalizeHex(initialColor || recentColors[0] || DEFAULT_DRAFT_COLOR),
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  /** シートを開いた時点の色（キャンセル時に復元） */
  const colorBeforePickerRef = useRef(draftColor);

  const openPicker = useCallback(() => {
    if (saving || pickerOpen) {
      return;
    }
    colorBeforePickerRef.current = draftColor;
    setPickerOpen(true);
  }, [draftColor, pickerOpen, saving]);

  const handleSheetCancel = useCallback(() => {
    setDraftColor(colorBeforePickerRef.current);
    setPickerOpen(false);
  }, []);

  const handleSheetConfirm = useCallback(() => {
    setPickerOpen(false);
  }, []);

  const handleSave = () => {
    onConfirm(normalizeHex(draftColor));
  };

  return (
    <div
      className="flex min-h-dvh flex-col"
      style={
        {
          background: getPostHeroGradientBackground(draftColor),
        } as CSSProperties
      }
    >
      <div className="flex flex-1 flex-col px-6 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(4rem,env(safe-area-inset-top,0px))]">
        <h1
          id={headingId}
          className="mb-8 text-center text-2xl font-medium tracking-tight text-stone-800"
        >
          どんな色で残す？
        </h1>

        <div
          className={`flex flex-1 flex-col gap-8 ${saving ? "pointer-events-none opacity-60" : ""}`}
          aria-busy={saving}
        >
          <div className="mx-auto w-full max-w-md">
            <SavedEntryCard
              entryDate={entryDate}
              body={body}
              color={draftColor}
              photoUrl={photoPreviewUrl}
              preview
            />
          </div>

          <section
            aria-labelledby={headingId}
            className="mx-auto flex w-full max-w-md flex-col items-center gap-3"
          >
            <button
              type="button"
              onClick={openPicker}
              aria-label={`選択中の色 ${draftColor}。タップして色を選ぶ`}
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              className="relative flex size-24 touch-manipulation items-center justify-center rounded-full border border-white/70 shadow-md transition-transform hover:scale-[1.02] active:scale-95"
              style={{ backgroundColor: draftColor }}
            >
              {/* iOS Safari は子要素のない button へのタップを無視することがある */}
              <span aria-hidden className="pointer-events-none size-full rounded-full" />
              <span className="sr-only">色を選ぶ</span>
            </button>
            <button
              type="button"
              onClick={openPicker}
              className="min-h-11 touch-manipulation px-4 text-sm text-stone-500 transition-colors hover:text-stone-700"
            >
              色を選ぶ
            </button>
            <p className="font-mono text-xs text-stone-400" aria-live="polite">
              {draftColor}
            </p>
          </section>

          {recentColors.length > 0 ? (
            <section
              aria-labelledby="recent-colors-heading"
              className="mx-auto w-full max-w-md"
            >
              <h2
                id="recent-colors-heading"
                className="mb-3 text-sm text-stone-500"
              >
                最近使った色
              </h2>
              <div className="flex flex-wrap gap-3">
                {recentColors.map((color) => (
                  <ColorSwatch
                    key={color}
                    color={color}
                    selected={normalizeHex(color) === normalizeHex(draftColor)}
                    onSelect={(next) => setDraftColor(normalizeHex(next))}
                  />
                ))}
              </div>
            </section>
          ) : null}

          <div className="mx-auto mt-auto w-full max-w-md pt-4">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="min-h-11 w-full touch-manipulation rounded-full border border-stone-200/90 bg-white/80 py-3.5 text-base font-medium text-stone-700 shadow-sm shadow-stone-300/25 backdrop-blur-sm transition-[transform,opacity,background-color] active:scale-[0.98] disabled:opacity-60"
            >
              この色で保存する
            </button>
          </div>
        </div>
      </div>

      <ColorPickerSheet
        open={pickerOpen}
        color={draftColor}
        recentColors={recentColors}
        onColorChange={setDraftColor}
        onConfirm={handleSheetConfirm}
        onCancel={handleSheetCancel}
      />
    </div>
  );
}
