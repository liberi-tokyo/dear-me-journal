"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  clampCropOffset,
  cropImageToSquare,
  getCoverBaseScale,
  getTouchDistance,
} from "@/lib/utils/imageCrop";

type PhotoCropStepProps = {
  imageUrl: string;
  onConfirm: (blob: Blob) => void;
  onCancel: () => void;
};

const MIN_ZOOM = 1;
const MAX_ZOOM = 3;
const CROP_VIEWPORT_SIZE = 288;

export function PhotoCropStep({ imageUrl, onConfirm, onCancel }: PhotoCropStepProps) {
  const imageRef = useRef<HTMLImageElement>(null);
  const cropAreaRef = useRef<HTMLDivElement>(null);
  const pinchStartDistance = useRef<number | null>(null);
  const pinchStartZoom = useRef(1);
  const dragStart = useRef<{ x: number; y: number; offsetX: number; offsetY: number } | null>(
    null,
  );

  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [baseScale, setBaseScale] = useState(1);
  const [zoom, setZoom] = useState(MIN_ZOOM);
  const [offset, setOffset] = useState({ x: 0, y: 0 });

  const applyClampedOffset = useCallback(
    (nextX: number, nextY: number, nextZoom = zoom) => {
      if (naturalSize.width === 0) {
        return;
      }
      const clamped = clampCropOffset(
        nextX,
        nextY,
        naturalSize.width,
        naturalSize.height,
        CROP_VIEWPORT_SIZE,
        baseScale,
        nextZoom,
      );
      setOffset({ x: clamped.offsetX, y: clamped.offsetY });
    },
    [baseScale, naturalSize.height, naturalSize.width, zoom],
  );

  const handleImageLoad = useCallback(() => {
    const image = imageRef.current;
    if (!image) {
      return;
    }

    const width = image.naturalWidth;
    const height = image.naturalHeight;
    const coverScale = getCoverBaseScale(width, height, CROP_VIEWPORT_SIZE);

    setNaturalSize({ width, height });
    setBaseScale(coverScale);
    setZoom(MIN_ZOOM);
    setOffset({ x: 0, y: 0 });
    setIsReady(true);
  }, []);

  useEffect(() => {
    const cropArea = cropAreaRef.current;
    if (!cropArea) {
      return;
    }

    const preventScroll = (event: TouchEvent) => {
      if (event.touches.length > 0) {
        event.preventDefault();
      }
    };

    cropArea.addEventListener("touchmove", preventScroll, { passive: false });
    return () => cropArea.removeEventListener("touchmove", preventScroll);
  }, [imageUrl]);

  const handleZoomChange = (value: number) => {
    const nextZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, value));
    setZoom(nextZoom);
    applyClampedOffset(offset.x, offset.y, nextZoom);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      return;
    }
    dragStart.current = {
      x: event.clientX,
      y: event.clientY,
      offsetX: offset.x,
      offsetY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!dragStart.current || event.pointerType === "touch") {
      return;
    }
    const dx = event.clientX - dragStart.current.x;
    const dy = event.clientY - dragStart.current.y;
    applyClampedOffset(dragStart.current.offsetX + dx, dragStart.current.offsetY + dy);
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "touch") {
      return;
    }
    dragStart.current = null;
  };

  const handleTouchStart = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2) {
      pinchStartDistance.current = getTouchDistance(event.touches[0], event.touches[1]);
      pinchStartZoom.current = zoom;
      dragStart.current = null;
      return;
    }

    if (event.touches.length === 1) {
      dragStart.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        offsetX: offset.x,
        offsetY: offset.y,
      };
    }
  };

  const handleTouchMove = (event: React.TouchEvent<HTMLDivElement>) => {
    if (event.touches.length === 2 && pinchStartDistance.current) {
      event.preventDefault();
      const distance = getTouchDistance(event.touches[0], event.touches[1]);
      const ratio = distance / pinchStartDistance.current;
      handleZoomChange(pinchStartZoom.current * ratio);
      return;
    }

    if (event.touches.length === 1 && dragStart.current) {
      event.preventDefault();
      const dx = event.touches[0].clientX - dragStart.current.x;
      const dy = event.touches[0].clientY - dragStart.current.y;
      applyClampedOffset(dragStart.current.offsetX + dx, dragStart.current.offsetY + dy);
    }
  };

  const handleTouchEnd = () => {
    dragStart.current = null;
    pinchStartDistance.current = null;
  };

  const handleConfirm = async () => {
    const image = imageRef.current;
    if (!image || !isReady || isSaving) {
      return;
    }

    setIsSaving(true);
    try {
      const blob = await cropImageToSquare(image, {
        cropSizePx: CROP_VIEWPORT_SIZE,
        offsetX: offset.x,
        offsetY: offset.y,
        baseScale,
        zoom,
      });
      onConfirm(blob);
    } finally {
      setIsSaving(false);
    }
  };

  const totalScale = baseScale * zoom;
  const displayWidth = naturalSize.width * totalScale;
  const displayHeight = naturalSize.height * totalScale;

  return (
    <div className="flex min-h-dvh flex-col bg-white px-5 pb-8 pt-4">
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-stone-400 transition-colors hover:text-stone-600"
        >
          キャンセル
        </button>
        <p className="text-sm font-medium text-stone-600">写真を調整</p>
        <span className="w-12" aria-hidden />
      </div>

      <div className="flex flex-1 flex-col justify-center">
        <div className="mx-auto w-full max-w-xs">
          <div
            className="relative mx-auto touch-none select-none"
            style={{ width: CROP_VIEWPORT_SIZE, height: CROP_VIEWPORT_SIZE }}
          >
            <div
              ref={cropAreaRef}
              className="absolute inset-0 overflow-hidden bg-stone-200"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              onTouchCancel={handleTouchEnd}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                ref={imageRef}
                src={imageUrl}
                alt=""
                draggable={false}
                onLoad={handleImageLoad}
                className="pointer-events-none absolute max-w-none"
                style={{
                  width: displayWidth || "100%",
                  height: displayHeight || "auto",
                  left: "50%",
                  top: "50%",
                  transform: `translate(calc(-50% + ${offset.x}px), calc(-50% + ${offset.y}px))`,
                }}
              />
            </div>
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0 z-10 border border-white/80 shadow-[0_0_0_9999px_rgba(0,0,0,0.42)]"
            />
          </div>
          <p className="mt-4 text-center text-xs text-stone-400">
            ドラッグで位置調整 · ピンチまたはスライダーで拡大
          </p>
        </div>
      </div>

      <div className="mt-8">
        <label htmlFor="crop-zoom" className="mb-2 block text-xs text-stone-400">
          拡大
        </label>
        <input
          id="crop-zoom"
          type="range"
          min={MIN_ZOOM}
          max={MAX_ZOOM}
          step={0.01}
          value={zoom}
          onChange={(event) => handleZoomChange(Number(event.target.value))}
          className="w-full accent-stone-600"
        />
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        disabled={!isReady || isSaving}
        className="mt-8 w-full rounded-full border border-stone-200/90 bg-white/65 py-4 text-base font-medium text-stone-700 shadow-sm shadow-stone-300/25 backdrop-blur-sm transition-[transform,opacity,background-color] active:scale-[0.98] disabled:cursor-not-allowed disabled:border-stone-200/50 disabled:bg-stone-100/50 disabled:text-stone-400 disabled:shadow-none"
      >
        {isSaving ? "処理中…" : "決定"}
      </button>
    </div>
  );
}
