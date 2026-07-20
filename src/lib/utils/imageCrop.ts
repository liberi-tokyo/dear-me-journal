/** クロップ前の長辺上限（メモリ・デコード負荷を抑える） */
export const PHOTO_SOURCE_MAX_LONG_EDGE = 1600;

/** Firebase Storage 保存時の正方形 JPEG サイズ */
export const PHOTO_OUTPUT_SIZE = 1024;

export const PHOTO_JPEG_QUALITY = 0.85;

export type CropTransform = {
  cropSizePx: number;
  offsetX: number;
  offsetY: number;
  baseScale: number;
  zoom: number;
};

export function getCoverBaseScale(
  naturalWidth: number,
  naturalHeight: number,
  cropSizePx: number,
): number {
  return Math.max(cropSizePx / naturalWidth, cropSizePx / naturalHeight);
}

export function clampCropOffset(
  offsetX: number,
  offsetY: number,
  naturalWidth: number,
  naturalHeight: number,
  cropSizePx: number,
  baseScale: number,
  zoom: number,
): { offsetX: number; offsetY: number } {
  const totalScale = baseScale * zoom;
  const scaledWidth = naturalWidth * totalScale;
  const scaledHeight = naturalHeight * totalScale;
  const maxOffsetX = Math.max(0, (scaledWidth - cropSizePx) / 2);
  const maxOffsetY = Math.max(0, (scaledHeight - cropSizePx) / 2);

  return {
    offsetX: Math.min(maxOffsetX, Math.max(-maxOffsetX, offsetX)),
    offsetY: Math.min(maxOffsetY, Math.max(-maxOffsetY, offsetY)),
  };
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(blob);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Failed to decode image."));
    };
    image.src = url;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  type: string,
  quality?: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) {
          resolve(blob);
        } else {
          reject(new Error("Failed to encode image."));
        }
      },
      type,
      quality,
    );
  });
}

/**
 * クロップ UI 用にソース画像を縮小する。
 * 透過 PNG/WebP は PNG のまま、それ以外は JPEG に圧縮する。
 */
export async function prepareImageForCrop(
  file: Blob,
  maxLongEdge = PHOTO_SOURCE_MAX_LONG_EDGE,
): Promise<Blob> {
  const image = await loadImageFromBlob(file);
  const longEdge = Math.max(image.naturalWidth, image.naturalHeight);

  const keepTransparency =
    file.type === "image/png" ||
    file.type === "image/webp" ||
    file.type === "image/gif";

  if (longEdge <= maxLongEdge && !keepTransparency) {
    // すでに小さい JPEG 等はそのまま（再エンコードしない）
    if (file.type === "image/jpeg" || file.type === "image/jpg") {
      return file;
    }
  }

  const scale = longEdge > maxLongEdge ? maxLongEdge / longEdge : 1;
  const width = Math.max(1, Math.round(image.naturalWidth * scale));
  const height = Math.max(1, Math.round(image.naturalHeight * scale));

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  context.drawImage(image, 0, 0, width, height);

  if (keepTransparency) {
    return canvasToBlob(canvas, "image/png");
  }

  return canvasToBlob(canvas, "image/jpeg", PHOTO_JPEG_QUALITY);
}

export async function cropImageToSquare(
  image: HTMLImageElement,
  transform: CropTransform,
  outputSize = PHOTO_OUTPUT_SIZE,
): Promise<Blob> {
  const { cropSizePx, offsetX, offsetY, baseScale, zoom } = transform;
  const totalScale = baseScale * zoom;
  const naturalWidth = image.naturalWidth;
  const naturalHeight = image.naturalHeight;

  const centerX = cropSizePx / 2 + offsetX;
  const centerY = cropSizePx / 2 + offsetY;
  const imageLeft = centerX - (naturalWidth * totalScale) / 2;
  const imageTop = centerY - (naturalHeight * totalScale) / 2;

  let srcX = (0 - imageLeft) / totalScale;
  let srcY = (0 - imageTop) / totalScale;
  let srcSize = cropSizePx / totalScale;

  srcX = Math.max(0, Math.min(naturalWidth - srcSize, srcX));
  srcY = Math.max(0, Math.min(naturalHeight - srcSize, srcY));
  srcSize = Math.min(srcSize, naturalWidth - srcX, naturalHeight - srcY);

  const canvas = document.createElement("canvas");
  canvas.width = outputSize;
  canvas.height = outputSize;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is not supported.");
  }

  context.drawImage(image, srcX, srcY, srcSize, srcSize, 0, 0, outputSize, outputSize);

  return canvasToBlob(canvas, "image/jpeg", PHOTO_JPEG_QUALITY);
}

export function getTouchDistance(
  touchA: { clientX: number; clientY: number },
  touchB: { clientX: number; clientY: number },
): number {
  const dx = touchA.clientX - touchB.clientX;
  const dy = touchA.clientY - touchB.clientY;
  return Math.hypot(dx, dy);
}
