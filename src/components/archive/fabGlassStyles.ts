import type { CSSProperties } from "react";

export const FAB_GLASS_STYLE: CSSProperties = {
  background: "rgba(120, 120, 120, 0.18)",
  backdropFilter: "blur(18px) saturate(130%)",
  WebkitBackdropFilter: "blur(18px) saturate(130%)",
  border: "1px solid rgba(255, 255, 255, 0.55)",
  boxShadow: [
    "inset 0 1px 1px rgba(255, 255, 255, 0.45)",
    "0 10px 28px rgba(0, 0, 0, 0.1)",
  ].join(", "),
};

export const FAB_GLASS_REFLECTION_STYLE: CSSProperties = {
  background:
    "linear-gradient(145deg, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0.06) 40%, transparent 65%)",
};

export const FAB_WHITE_ICON_SHADOW: CSSProperties = {
  textShadow: "0 2px 8px rgba(0, 0, 0, 0.18)",
};

export const FAB_WHITE_SVG_SHADOW: CSSProperties = {
  filter: "drop-shadow(0 2px 8px rgba(0, 0, 0, 0.18))",
};

export const FAB_BASE_CLASS =
  "z-20 flex size-20 touch-manipulation items-center justify-center overflow-hidden rounded-full transition-transform active:scale-95";

export const FAB_BOTTOM_CLASS =
  "bottom-[max(2.25rem,env(safe-area-inset-bottom,0px))]";

export const FAB_LEFT_CLASS =
  "left-[max(2rem,env(safe-area-inset-left,0px))]";

export const FAB_RIGHT_CLASS =
  "right-[max(2rem,env(safe-area-inset-right,0px))]";

export const SETTINGS_GLASS_STYLE: CSSProperties = {
  background: "rgba(120, 120, 120, 0.18)",
  backdropFilter: "blur(18px) saturate(130%)",
  WebkitBackdropFilter: "blur(18px) saturate(130%)",
  border: "1px solid rgba(255, 255, 255, 0.55)",
  boxShadow: [
    "inset 0 1px 1px rgba(255, 255, 255, 0.45)",
    "0 6px 16px rgba(0, 0, 0, 0.07)",
  ].join(", "),
};

export const SETTINGS_BUTTON_CLASS =
  "relative z-20 flex size-11 touch-manipulation items-center justify-center overflow-hidden rounded-full transition-transform active:scale-95";

export const SETTINGS_ICON_SHADOW: CSSProperties = {
  filter: "drop-shadow(0 1px 4px rgba(0, 0, 0, 0.14))",
};
