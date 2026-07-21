"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
} from "react";

import {
  ColorPickerDebugHud,
  EMPTY_COLOR_PICKER_DEBUG,
  type ColorPickerDebugSnapshot,
} from "@/components/compose/ColorPickerDebugHud";
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
  /** URL ?debugColor=1 */
  debugColor?: boolean;
};

export function ComposeColorStep({
  recentColors,
  initialColor,
  entryDate,
  body,
  photoPreviewUrl,
  saving = false,
  onConfirm,
  debugColor = false,
}: ComposeColorStepProps) {
  const headingId = useId();
  const [draftColor, setDraftColor] = useState(() =>
    normalizeHex(initialColor || recentColors[0] || DEFAULT_DRAFT_COLOR),
  );
  const [pickerOpen, setPickerOpen] = useState(debugColor);
  const colorBeforePickerRef = useRef(draftColor);
  const openedAtRef = useRef<number | null>(null);
  const toastTimerRef = useRef<number | null>(null);

  const [debug, setDebug] = useState<ColorPickerDebugSnapshot>(() => ({
    ...EMPTY_COLOR_PICKER_DEBUG,
    openState: debugColor,
  }));

  const patchDebug = useCallback((patch: Partial<ColorPickerDebugSnapshot>) => {
    setDebug((current) => ({ ...current, ...patch }));
  }, []);

  const showToast = useCallback(
    (message: string) => {
      patchDebug({ toast: message });
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
      toastTimerRef.current = window.setTimeout(() => {
        patchDebug({ toast: null });
        toastTimerRef.current = null;
      }, 2000);
    },
    [patchDebug],
  );

  useEffect(() => {
    return () => {
      if (toastTimerRef.current !== null) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const eventLogRef = useRef<string[]>([]);

  const openPicker = useCallback(
    (eventName: string) => {
      eventLogRef.current = [...eventLogRef.current.slice(-4), eventName];
      const eventLog = eventLogRef.current.join(" → ");
      patchDebug({
        tap: true,
        lastEvent: eventLog,
      });
      // トーストは「開く操作」のときだけ（多重イベントで連打しない）
      if (!pickerOpen && !saving) {
        showToast("色ボタンが押されました");
      }

      if (saving) {
        patchDebug({
          tap: true,
          lastEvent: `${eventLog} (blocked: saving)`,
        });
        return;
      }

      if (pickerOpen) {
        patchDebug({
          tap: true,
          lastEvent: `${eventLog} (already open)`,
        });
        return;
      }

      colorBeforePickerRef.current = draftColor;
      openedAtRef.current = Date.now();
      setPickerOpen(true);
      patchDebug({
        openState: true,
        openDurationMs: 0,
      });
    },
    [draftColor, patchDebug, pickerOpen, saving, showToast],
  );

  const handleSheetCancel = useCallback(
    (reason: "backdrop" | "cancel-button" | "escape") => {
      const duration =
        openedAtRef.current === null
          ? null
          : Date.now() - openedAtRef.current;
      setDraftColor(colorBeforePickerRef.current);
      setPickerOpen(false);
      patchDebug({
        closeReason: reason,
        openDurationMs: duration,
        openState: false,
      });
    },
    [patchDebug],
  );

  const handleSheetConfirm = useCallback(() => {
    const duration =
      openedAtRef.current === null ? null : Date.now() - openedAtRef.current;
    setPickerOpen(false);
    patchDebug({
      closeReason: "confirm",
      openDurationMs: duration,
      openState: false,
    });
  }, [patchDebug]);

  const handleSave = () => {
    onConfirm(normalizeHex(draftColor));
  };

  // preventDefault は使わない（iOS の click 抑制を避ける）
  const onCirclePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }
    openPicker(`pointerup:${event.pointerType}`);
  };

  const onCircleTouchEnd = () => {
    // preventDefault しない
    openPicker("touchend");
  };

  const onCircleClick = () => {
    openPicker("click");
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
      <ColorPickerDebugHud
        debug={{
          ...debug,
          openState: pickerOpen,
        }}
      />

      <div className="flex flex-1 flex-col px-6 pb-[max(2.5rem,env(safe-area-inset-bottom,0px))] pt-[max(5.5rem,env(safe-area-inset-top,0px))]">
        <h1
          id={headingId}
          className="mb-8 text-center text-2xl font-medium tracking-tight text-stone-800"
        >
          どんな色で残す？
        </h1>

        <div
          className={`relative z-0 flex flex-1 flex-col gap-8 ${saving ? "pointer-events-none opacity-60" : ""}`}
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
            className="relative z-10 mx-auto flex w-full max-w-md flex-col items-center gap-3"
          >
            <button
              type="button"
              onPointerUp={onCirclePointerUp}
              onTouchEnd={onCircleTouchEnd}
              onClick={onCircleClick}
              aria-label={`選択中の色 ${draftColor}。タップして色を選ぶ`}
              aria-haspopup="dialog"
              aria-expanded={pickerOpen}
              className="relative z-20 flex size-24 touch-manipulation items-center justify-center rounded-full border-2 border-stone-800/20 shadow-md"
              style={{
                backgroundColor: draftColor,
                WebkitTapHighlightColor: "rgba(0,0,0,0.15)",
                touchAction: "manipulation",
              }}
            >
              <span
                aria-hidden
                className="pointer-events-none size-full rounded-full"
              />
              <span className="sr-only">色を選ぶ</span>
            </button>
            <button
              type="button"
              onPointerUp={(event) =>
                openPicker(`label-pointerup:${event.pointerType}`)
              }
              onTouchEnd={() => openPicker("label-touchend")}
              onClick={() => openPicker("label-click")}
              className="relative z-20 min-h-11 touch-manipulation px-4 text-sm text-stone-500"
              style={{ touchAction: "manipulation" }}
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
        forceDebugVisible={debugColor}
        onSheetMountChange={(mounted) =>
          patchDebug({ sheetMounted: mounted })
        }
        onPortalMountChange={(mounted) =>
          patchDebug({ portalMounted: mounted })
        }
        onBackdropAttempt={({ blockedByGuard, elapsedMs }) => {
          patchDebug({
            lastEvent: blockedByGuard
              ? `backdrop blocked (${elapsedMs}ms < 400)`
              : `backdrop close (${elapsedMs}ms)`,
          });
        }}
      />
    </div>
  );
}
