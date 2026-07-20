/** #RGB / #RRGGBB を #rrggbb に正規化 */
export function normalizeHex(color: string): string {
  const value = color.trim().toLowerCase();
  if (/^#[0-9a-f]{3}$/.test(value)) {
    const [, r, g, b] = value;
    return `#${r}${r}${g}${g}${b}${b}`;
  }
  if (/^#[0-9a-f]{6}$/.test(value)) {
    return value;
  }
  return color;
}

export function hexToRgb(color: string): { r: number; g: number; b: number } | null {
  const normalized = normalizeHex(color);
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/.exec(normalized);
  if (!match) {
    return null;
  }

  return {
    r: Number.parseInt(match[1], 16),
    g: Number.parseInt(match[2], 16),
    b: Number.parseInt(match[3], 16),
  };
}

type ColorShadowIntensity = {
  border?: number;
  midBlur?: number;
  midSpread?: number;
  midOpacity?: number;
  outerBlur?: number;
  outerSpread?: number;
  outerOpacity?: number;
};

function buildColorShadow(
  r: number,
  g: number,
  b: number,
  intensity: ColorShadowIntensity = {},
): string {
  const {
    border = 0.1,
    midBlur = 28,
    midSpread = 8,
    midOpacity = 0.08,
    outerBlur = 56,
    outerSpread = 20,
    outerOpacity = 0.05,
  } = intensity;

  return [
    `0 0 0 1px rgba(${r}, ${g}, ${b}, ${border})`,
    `0 0 ${midBlur}px ${midSpread}px rgba(${r}, ${g}, ${b}, ${midOpacity})`,
    `0 0 ${outerBlur}px ${outerSpread}px rgba(${r}, ${g}, ${b}, ${outerOpacity})`,
  ].join(", ");
}

/** 過去日記カード用 — 保存色が外側へやわらかくにじむ静止シャドー */
export function getEntryColorShadow(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "0 1px 3px rgba(120, 113, 108, 0.08)";
  }

  return buildColorShadow(rgb.r, rgb.g, rgb.b);
}

/** 投稿完了ヒーロー — 上に淡い選択色、下へ白へ抜ける */
export function getPostHeroGradientBackground(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "linear-gradient(180deg, #f5f5f4 0%, #ffffff 72%)";
  }

  const { r, g, b } = rgb;
  return [
    "linear-gradient(180deg,",
    `rgba(${r}, ${g}, ${b}, 0.2) 0%,`,
    `rgba(${r}, ${g}, ${b}, 0.08) 36%,`,
    "rgba(255, 255, 255, 1) 72%,",
    "rgba(255, 255, 255, 1) 100%)",
  ].join(" ");
}

type ArchiveBlobPattern = {
  borderRadius: string;
  width: string;
  height: string;
};

const ARCHIVE_BLOB_PATTERNS: ArchiveBlobPattern[] = [
  {
    borderRadius: "58% 42% 48% 52% / 45% 55% 45% 55%",
    width: "60%",
    height: "53%",
  },
  {
    borderRadius: "42% 58% 52% 48% / 55% 45% 55% 45%",
    width: "53%",
    height: "60%",
  },
  {
    borderRadius: "68% 32% 54% 46% / 52% 48% 40% 60%",
    width: "57%",
    height: "57%",
  },
  {
    borderRadius: "32% 68% 46% 54% / 48% 52% 60% 40%",
    width: "57%",
    height: "57%",
  },
  {
    borderRadius: "45% 55% 62% 38% / 58% 42% 48% 52%",
    width: "55%",
    height: "58%",
  },
  {
    borderRadius: "62% 38% 58% 42% / 38% 62% 38% 62%",
    width: "58%",
    height: "52%",
  },
];

/** 日付から決定的に blob パターン（0–5）を選ぶ */
export function getArchiveBlobPatternIndex(entryDate: string): number {
  let hash = 0;
  for (let i = 0; i < entryDate.length; i += 1) {
    hash = (hash * 31 + entryDate.charCodeAt(i)) >>> 0;
  }
  return hash % ARCHIVE_BLOB_PATTERNS.length;
}

export function getArchiveBlobPattern(patternIndex: number): ArchiveBlobPattern {
  return ARCHIVE_BLOB_PATTERNS[patternIndex % ARCHIVE_BLOB_PATTERNS.length];
}

/** アーカイブ blob 用 — 選択色を白と軽く混ぜて淡くする */
export function getMutedArchiveColor(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "rgb(196, 190, 186)";
  }

  const mix = 0.32;
  const r = Math.round(rgb.r + (255 - rgb.r) * mix);
  const g = Math.round(rgb.g + (255 - rgb.g) * mix);
  const b = Math.round(rgb.b + (255 - rgb.b) * mix);
  return `rgb(${r}, ${g}, ${b})`;
}

/** アーカイブ blob 用 — ごく薄い柔らかなシャドウ */
export function getArchiveBlobShadow(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "none";
  }

  return `0 2px 8px rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.16)`;
}

/** アーカイブの丸アイテム用 — カードシャドーと同系の淡いグロー */
export function getArchiveDotGlow(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "none";
  }

  return buildColorShadow(rgb.r, rgb.g, rgb.b, {
    border: 0.06,
    midBlur: 10,
    midSpread: 2,
    midOpacity: 0.1,
    outerBlur: 20,
    outerSpread: 5,
    outerOpacity: 0.06,
  });
}

/** 投稿直後アニメーション開始 — 縁付近にとどまった同系色のシャドー */
export function getEntryColorShadowStart(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "0 0 0 0 transparent";
  }

  return buildColorShadow(rgb.r, rgb.g, rgb.b, {
    border: 0.05,
    midBlur: 2,
    midSpread: 0,
    midOpacity: 0.04,
    outerBlur: 6,
    outerSpread: 1,
    outerOpacity: 0.02,
  });
}

/** カレンダー丸内の日付数字用 — 背景色に応じて白または濃い色を返す */
export function getReadableLabelColor(color: string): string {
  const rgb = hexToRgb(color);
  if (!rgb) {
    return "#44403c";
  }

  const luminance = (0.299 * rgb.r + 0.587 * rgb.g + 0.114 * rgb.b) / 255;
  return luminance > 0.62 ? "#292524" : "#ffffff";
}
