"use client";

import {
  useCallback,
  useId,
  useRef,
  useState,
  type ChangeEvent,
} from "react";

import { EntryDateButton } from "@/components/compose/EntryDateButton";
import { useVisualViewportBottomInset } from "@/lib/hooks/useVisualViewportBottomInset";
import type { EntryDate } from "@/lib/types/entry";

type ComposeWriteStepProps = {
  mode: "create" | "edit";
  entryDate: EntryDate;
  body: string;
  composePrompt: string;
  photoPreviewUrl?: string;
  hasPhoto?: boolean;
  onBodyChange: (body: string) => void;
  onEntryDateChange: (entryDate: EntryDate) => void;
  onPhotoSelect: (file: File) => void;
  onPhotoRemove: () => void;
  onFinish: () => void;
};

export function ComposeWriteStep({
  mode,
  entryDate,
  body,
  composePrompt,
  photoPreviewUrl,
  hasPhoto = false,
  onBodyChange,
  onEntryDateChange,
  onPhotoSelect,
  onPhotoRemove,
  onFinish,
}: ComposeWriteStepProps) {
  const libraryInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const finishLockRef = useRef(false);
  const sheetTitleId = useId();
  const keyboardInset = useVisualViewportBottomInset();
  const [photoMenuOpen, setPhotoMenuOpen] = useState(false);

  const handleFinish = useCallback(() => {
    if (finishLockRef.current) {
      return;
    }
    finishLockRef.current = true;
    window.setTimeout(() => {
      finishLockRef.current = false;
    }, 400);

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    onFinish();
  }, [onFinish]);

  const handleFileChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file) {
        onPhotoSelect(file);
      }
      event.target.value = "";
      setPhotoMenuOpen(false);
    },
    [onPhotoSelect],
  );

  const openLibrary = () => {
    libraryInputRef.current?.click();
  };

  const openCamera = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-5 pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <p className="text-center text-sm text-stone-500">
          {mode === "edit" ? "編集" : "新しい日記"}
        </p>
        <EntryDateButton entryDate={entryDate} onChange={onEntryDateChange} />

        <textarea
          value={body}
          onChange={(event) => onBodyChange(event.target.value)}
          placeholder={composePrompt}
          className="mt-8 block min-h-48 w-full resize-none bg-transparent text-lg leading-relaxed text-stone-800 placeholder:text-stone-400 focus:outline-none"
        />

        <div className="mt-6 flex items-end gap-4 pb-4" aria-live="polite">
          {hasPhoto && photoPreviewUrl ? (
            <div className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreviewUrl}
                alt="選択した写真"
                className="aspect-square size-20 rounded-2xl object-cover"
              />
              <button
                type="button"
                onClick={onPhotoRemove}
                aria-label="写真を削除"
                className="absolute -top-2 -right-2 flex size-6 items-center justify-center rounded-full bg-stone-800 text-xs text-white"
              >
                ×
              </button>
              <button
                type="button"
                onClick={() => setPhotoMenuOpen(true)}
                className="mt-2 block text-xs text-stone-400 transition-colors hover:text-stone-600"
              >
                選び直す
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setPhotoMenuOpen(true)}
              aria-label="写真を追加"
              className="flex size-20 touch-manipulation items-center justify-center rounded-2xl border border-dashed border-stone-300 text-2xl text-stone-400 transition-colors hover:border-stone-400 hover:text-stone-500"
            >
              +
            </button>
          )}
        </div>
      </div>

      {/* 非表示の file input。ブラウザ標準の「ファイルを選択」UIは表示しない */}
      <input
        ref={libraryInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleFileChange}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        onChange={handleFileChange}
      />

      {photoMenuOpen ? (
        <div className="fixed inset-0 z-40 flex items-end justify-center">
          <button
            type="button"
            className="absolute inset-0 bg-stone-900/30"
            aria-label="閉じる"
            onClick={() => setPhotoMenuOpen(false)}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={sheetTitleId}
            className="relative z-10 w-full max-w-lg rounded-t-3xl bg-white px-5 pt-5 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] shadow-lg"
          >
            <h2
              id={sheetTitleId}
              className="mb-4 text-center text-base font-medium text-stone-800"
            >
              写真を追加
            </h2>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={openLibrary}
                className="min-h-11 touch-manipulation rounded-2xl bg-stone-100 px-4 py-3.5 text-left text-base text-stone-800 transition-colors active:bg-stone-200"
              >
                写真ライブラリから選ぶ
              </button>
              <button
                type="button"
                onClick={openCamera}
                className="min-h-11 touch-manipulation rounded-2xl bg-stone-100 px-4 py-3.5 text-left text-base text-stone-800 transition-colors active:bg-stone-200"
              >
                写真を撮る
              </button>
              <button
                type="button"
                onClick={() => setPhotoMenuOpen(false)}
                className="min-h-11 touch-manipulation rounded-2xl px-4 py-3.5 text-center text-base text-stone-500 transition-colors active:bg-stone-50"
              >
                キャンセル
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div
        className="shrink-0 bg-white px-5 pt-2"
        style={{
          marginBottom: keyboardInset > 0 ? keyboardInset : undefined,
          paddingBottom:
            keyboardInset > 0
              ? "0.75rem"
              : "max(2rem, env(safe-area-inset-bottom, 0px))",
        }}
      >
        <button
          type="button"
          onClick={handleFinish}
          className="relative z-10 w-full touch-manipulation rounded-full border border-stone-200/90 bg-white/65 py-4 text-base font-medium text-stone-700 shadow-sm shadow-stone-300/25 backdrop-blur-sm transition-[transform,opacity,background-color] active:scale-[0.98]"
        >
          書けた！
        </button>
      </div>
    </div>
  );
}
