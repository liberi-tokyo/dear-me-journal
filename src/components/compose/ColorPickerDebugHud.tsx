"use client";

import { createPortal } from "react-dom";

export type ColorPickerDebugSnapshot = {
  tap: boolean;
  openState: boolean;
  sheetMounted: boolean;
  portalMounted: boolean;
  lastEvent: string;
  closeReason: string;
  openDurationMs: number | null;
  toast: string | null;
};

export const EMPTY_COLOR_PICKER_DEBUG: ColorPickerDebugSnapshot = {
  tap: false,
  openState: false,
  sheetMounted: false,
  portalMounted: false,
  lastEvent: "(none)",
  closeReason: "(none)",
  openDurationMs: null,
  toast: null,
};

type ColorPickerDebugHudProps = {
  debug: ColorPickerDebugSnapshot;
};

/** iPhone実機向け：画面上に段階ログを出す（原因特定後に削除） */
export function ColorPickerDebugHud({ debug }: ColorPickerDebugHudProps) {
  if (typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      id="color-picker-debug-hud"
      style={{
        position: "fixed",
        top: "max(8px, env(safe-area-inset-top))",
        left: 8,
        right: 8,
        zIndex: 2147483646,
        pointerEvents: "none",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        lineHeight: 1.45,
      }}
    >
      {debug.toast ? (
        <div
          style={{
            marginBottom: 8,
            borderRadius: 999,
            background: "#111827",
            color: "#fff",
            padding: "10px 14px",
            textAlign: "center",
            fontSize: 14,
            fontWeight: 600,
            pointerEvents: "none",
          }}
        >
          {debug.toast}
        </div>
      ) : null}

      <div
        style={{
          borderRadius: 12,
          background: "rgba(0,0,0,0.82)",
          color: "#f8fafc",
          padding: "10px 12px",
          boxShadow: "0 8px 24px rgba(0,0,0,0.35)",
        }}
      >
        <div style={{ fontWeight: 700, marginBottom: 6 }}>COLOR DEBUG</div>
        <div>tap: {debug.tap ? "yes" : "no"}</div>
        <div>open state: {debug.openState ? "true" : "false"}</div>
        <div>sheet mounted: {debug.sheetMounted ? "yes" : "no"}</div>
        <div>portal mounted: {debug.portalMounted ? "yes" : "no"}</div>
        <div>last event: {debug.lastEvent}</div>
        <div>close reason: {debug.closeReason}</div>
        <div>
          open duration:{" "}
          {debug.openDurationMs === null ? "—" : `${debug.openDurationMs}ms`}
        </div>
      </div>
    </div>,
    document.body,
  );
}
