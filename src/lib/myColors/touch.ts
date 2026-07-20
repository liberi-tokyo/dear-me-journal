import {
  MAX_MY_COLORS,
  MAX_MY_COLORS_LEGACY,
} from "@/lib/constants/myColors";
import { normalizeHex } from "@/lib/utils/color";

/** 使用した色を先頭へ移動（重複なし・最大12色） */
export function touchMyColor(colors: readonly string[], color: string): string[] {
  const normalized = normalizeHex(color);
  const without = colors.filter((item) => normalizeHex(item) !== normalized);
  return [normalized, ...without].slice(0, MAX_MY_COLORS);
}

export function isValidMyColors(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length <= MAX_MY_COLORS_LEGACY &&
    value.every((item) => typeof item === "string" && item.trim().length > 0)
  );
}

/** 読み取り時に上限へ丸める */
export function clampMyColors(colors: string[]): string[] {
  return colors.slice(0, MAX_MY_COLORS).map((color) => normalizeHex(color));
}
