"use client";

import { useSyncExternalStore } from "react";
import { createPortal } from "react-dom";

function subscribeToUrl(onStoreChange: () => void) {
  window.addEventListener("popstate", onStoreChange);
  return () => window.removeEventListener("popstate", onStoreChange);
}

function getDebugColorEnabled() {
  return new URLSearchParams(window.location.search).get("debugColor") === "1";
}

function getServerSnapshot() {
  return false;
}

/**
 * ?debugColor=1 のとき、ページ表示直後から強制的に見えるパネルを出す。
 * これが見えない = 本番バンドル未反映 / 条件分岐で未描画の可能性が高い。
 */
export function ColorPickerForceDebugPanel() {
  const enabled = useSyncExternalStore(
    subscribeToUrl,
    getDebugColorEnabled,
    getServerSnapshot,
  );

  if (!enabled || typeof document === "undefined") {
    return null;
  }

  return createPortal(
    <div
      id="color-picker-force-debug"
      data-testid="color-picker-force-debug"
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
        padding: 20,
        boxShadow: "0 12px 40px rgba(0,0,0,0.35)",
        pointerEvents: "auto",
      }}
    >
      <p
        style={{
          margin: 0,
          fontSize: 22,
          fontWeight: 800,
          color: "#b91c1c",
          lineHeight: 1.3,
        }}
      >
        COLOR PICKER DEBUG VISIBLE
      </p>
      <p style={{ margin: "12px 0 0", fontSize: 14, color: "#334155" }}>
        debugColor=1 強制表示モードです。backdrop なし / opacity:1 /
        transform:none / z-index 最大。
      </p>
      <p style={{ margin: "8px 0 0", fontSize: 12, color: "#64748b" }}>
        この赤枠が見えれば portal + fixed は iPhone でも描画できています。
      </p>
    </div>,
    document.body,
  );
}
