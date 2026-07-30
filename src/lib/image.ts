/**
 * 日記画像の処理入口。
 *
 * 現状: 表示・保存とも同一アセット（クロップ済み JPEG）。
 * 将来: original / display / print を分けて保存できるよう、
 * プリセットと prepare / upload の責務をここに集約する。
 */

import {
  PHOTO_JPEG_QUALITY,
  PHOTO_OUTPUT_SIZE,
  PHOTO_SOURCE_MAX_LONG_EDGE,
  cropImageToSquare,
  prepareImageForCrop,
  type CropTransform,
} from "@/lib/utils/imageCrop";
import { perfLog, perfMeasure } from "@/lib/perf";

/** アプリ表示・現状のアップロード用 */
export const IMAGE_PRESET_DISPLAY = {
  maxLongEdge: PHOTO_SOURCE_MAX_LONG_EDGE,
  outputSize: PHOTO_OUTPUT_SIZE,
  quality: PHOTO_JPEG_QUALITY,
  format: "image/jpeg" as const,
};

/**
 * 将来の印刷・フォトブック用プリセット（未使用。移行時にここを参照）。
 * 長辺 ~2048 / 品質 ~0.9 / JPEG or WebP。
 */
export const IMAGE_PRESET_PRINT = {
  maxLongEdge: 2048,
  outputSize: 2048,
  quality: 0.9,
  format: "image/jpeg" as const,
};

export type PreparedUploadImage = {
  blob: Blob;
  contentType: string;
  byteSize: number;
};

/**
 * Storage へ送る直前の共通前処理。
 * 現状はクロップ済み Blob をそのまま使い、計測だけ行う。
 * EXIF 向き補正や print 用再エンコードは将来ここに追加する。
 */
export async function prepareImageForUpload(
  source: Blob,
): Promise<PreparedUploadImage> {
  return perfMeasure("image:prepareForUpload", async () => {
    const contentType = source.type || "image/jpeg";
    const prepared: PreparedUploadImage = {
      blob: source,
      contentType,
      byteSize: source.size,
    };
    perfLog("image:prepareForUpload:meta", {
      byteSize: prepared.byteSize,
      contentType: prepared.contentType,
      note: "no extra recompress (crop pipeline already encoded)",
    });
    return prepared;
  });
}

/** クロップ UI 用のソース準備（向き・サイズ） */
export async function prepareImageForCompose(file: Blob): Promise<Blob> {
  return perfMeasure("image:prepareForCrop", () => prepareImageForCrop(file));
}

export async function cropEntryImage(
  image: HTMLImageElement,
  transform: CropTransform,
): Promise<Blob> {
  return perfMeasure("image:cropToSquare", async () => {
    const blob = await cropImageToSquare(image, transform);
    perfLog("image:cropToSquare:meta", {
      byteSize: blob.size,
      outputSize: PHOTO_OUTPUT_SIZE,
      quality: PHOTO_JPEG_QUALITY,
    });
    return blob;
  });
}

export {
  PHOTO_JPEG_QUALITY,
  PHOTO_OUTPUT_SIZE,
  PHOTO_SOURCE_MAX_LONG_EDGE,
  cropImageToSquare,
  prepareImageForCrop,
};
