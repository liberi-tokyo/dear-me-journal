"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  type ReactNode,
  type SyntheticEvent,
} from "react";
import { createPortal } from "react-dom";
import { HexColorInput, HexColorPicker } from "react-colorful";

import { ColorSwatch } from "@/components/compose/ColorSwatch";
import { normalizeHex } from "@/lib/utils/color";

/** 開いた直後の pointerup が背景に当たって即閉じるのを防ぐ */
const CLOSE_GUARD_MS = 400;

export const COLOR_PICKER_PORTAL_ROOT_ID = "color-picker-portal-root";

type ColorPickerSheetProps = {
  open: boolean;
  color: string;
  recentColors: string[];
  onColorChange: (color: string) => void;
  onConfirm: () => void;
  onCancel: (reason: "backdrop" | "cancel-button" | "escape") => void;
  /** ?debugColor=1 強制表示（backdropなし・赤枠） */
  forceDebugVisible?: boolean;
  onSheetMountChange?: (mounted: boolean) => void;
  onPortalMountChange?: (mounted: boolean) => void;
  onBackdropAttempt?: (info: {
    blockedByGuard: boolean;
    elapsedMs: number;
  }) => void;
};

function BodyPortal({
  children,
  onPortalMountChange,
}: {
  children: ReactNode;
  onPortalMountChange?: (mounted: boolean) => void;
}) {
  useEffect(() => {
    const root = document.getElementById(COLOR_PICKER_PORTAL_ROOT_ID);
    const mounted = Boolean(root && root.parentElement === document.body);
    onPortalMountChange?.(mounted);
    return () => onPortalMountChange?.(false);
  }, [onPortalMountChange]);

  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(children, document.body);
}

export function ColorPickerSheet({
  open,
  color,
  recentColors,
  onColorChange,
  onConfirm,
  onCancel,
  forceDebugVisible = false,
  onSheetMountChange,
  onPortalMountChange,
  onBackdropAttempt,
}: ColorPickerSheetProps) {
  const titleId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const openedAtRef = useRef(0);
  const normalized = normalizeHex(color);

  useEffect(() => {
    onSheetMountChange?.(open);
    return () => onSheetMountChange?.(false);
  }, [onSheetMountChange, open]);

  useEffect(() => {
    if (!open || forceDebugVisible) {
      return;
    }

    openedAtRef.current = Date.now();

    const body = document.body;
    const html = document.documentElement;
    const scrollY = window.scrollY;
    const previous = {
      bodyOverflow: body.style.overflow,
      bodyPosition: body.style.position,
      bodyTop: body.style.top,
      bodyWidth: body.style.width,
      bodyTouchAction: body.style.touchAction,
      htmlOverflow: html.style.overflow,
    };

    body.style.overflow = "hidden";
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.width = "100%";
    body.style.touchAction = "none";
    html.style.overflow = "hidden";

    window.requestAnimationFrame(() => {
      dialogRef.current?.focus();
    });

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onCancel("escape");
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      body.style.overflow = previous.bodyOverflow;
      body.style.position = previous.bodyPosition;
      body.style.top = previous.bodyTop;
      body.style.width = previous.bodyWidth;
      body.style.touchAction = previous.bodyTouchAction;
      html.style.overflow = previous.htmlOverflow;
      window.scrollTo(0, scrollY);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [forceDebugVisible, onCancel, open]);

  useEffect(() => {
    if (open && forceDebugVisible) {
      openedAtRef.current = Date.now();
    }
  }, [forceDebugVisible, open]);

  const handleBackdropClose = useCallback(() => {
    const elapsedMs = Date.now() - openedAtRef.current;
    const blockedByGuard = elapsedMs < CLOSE_GUARD_MS;
    onBackdropAttempt?.({ blockedByGuard, elapsedMs });
    if (blockedByGuard) {
      return;
    }
    onCancel("backdrop");
  }, [onBackdropAttempt, onCancel]);

  const stopSheetPointer = useCallback((event: SyntheticEvent) => {
    event.stopPropagation();
  }, []);

  if (!open) {
    return null;
  }

  if (forceDebugVisible) {
    return (
      <BodyPortal onPortalMountChange={onPortalMountChange}>
        <div
          id={COLOR_PICKER_PORTAL_ROOT_ID}
          data-testid="color-picker-sheet-debug"
          style={{
            position: "fixed",
            top: 20,
            left: 20,
            right: 20,
            zIndex: 2147483647,
            opacity: 1,
            transform: "none",
            visibility: "visible",
            background: "#ffffff",
            border: "4px solid #ef4444",
            borderRadius: 16,
            padding: 16,
            maxHeight: "80vh",
            overflow: "auto",
          }}
        >
          <p
            style={{
              margin: "0 0 12px",
              fontSize: 20,
              fontWeight: 800,
              color: "#b91c1c",
            }}
          >
            COLOR PICKER DEBUG VISIBLE
          </p>
          <div className="color-picker-sheet">
            <HexColorPicker
              color={normalized}
              onChange={(next) => onColorChange(normalizeHex(next))}
            />
          </div>
          <p style={{ marginTop: 12, fontFamily: "monospace" }}>{normalized}</p>
        </div>
      </BodyPortal>
    );
  }

  return (
    <BodyPortal onPortalMountChange={onPortalMountChange}>
      <div
        id={COLOR_PICKER_PORTAL_ROOT_ID}
        className="fixed inset-0 z-[10000] flex items-end justify-center sm:items-center sm:p-4"
        style={{ minHeight: "100dvh" }}
        data-testid="color-picker-sheet"
      >
        <button
          type="button"
          className="absolute inset-0 touch-manipulation bg-stone-900/40"
          aria-label="キャンセルして閉じる"
          onClick={handleBackdropClose}
        />

        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onClick={stopSheetPointer}
          onPointerDown={stopSheetPointer}
          className="relative z-10 flex max-h-[min(85dvh,40rem)] w-full max-w-lg flex-col rounded-t-3xl bg-white shadow-2xl outline-none sm:rounded-3xl"
        >
          <div className="flex shrink-0 items-center justify-between gap-3 px-5 pt-4 pb-2">
            <h2 id={titleId} className="text-base font-medium text-stone-800">
              色を選ぶ
            </h2>
            <button
              type="button"
              onClick={() => onCancel("cancel-button")}
              className="min-h-11 min-w-11 touch-manipulation rounded-full px-3 text-sm text-stone-500 transition-colors hover:bg-stone-100 hover:text-stone-700"
            >
              キャンセル
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-[max(1.25rem,env(safe-area-inset-bottom,0px))] [-webkit-overflow-scrolling:touch]">
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
              <section
                className="mt-6"
                aria-labelledby="sheet-recent-colors-heading"
              >
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
              onClick={onConfirm}
              className="mt-6 min-h-12 w-full touch-manipulation rounded-full bg-stone-800 py-3.5 text-base font-medium text-white transition-[transform,opacity] active:scale-[0.98]"
            >
              この色にする
            </button>
          </div>
        </div>
      </div>
    </BodyPortal>
  );
}
