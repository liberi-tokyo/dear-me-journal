"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ComposeColorStep } from "@/components/compose/ComposeColorStep";
import { ComposeWriteStep } from "@/components/compose/ComposeWriteStep";
import { PastEntriesStep } from "@/components/compose/PastEntriesStep";
import { PhotoCropStep } from "@/components/compose/PhotoCropStep";
import { useAuth } from "@/contexts/AuthContext";
import { useComposePrompt } from "@/contexts/ComposePromptContext";
import { resolveComposeBody } from "@/lib/composePrompt/resolveBody";
import { getCachedEntryByDate, upsertCachedEntry } from "@/lib/entries/cache";
import { toPastEntryDisplay } from "@/lib/entries/mappers";
import {
  getEntryByDate,
  listPastSameDayMemories,
} from "@/lib/entries/repository";
import { saveDiaryEntry } from "@/lib/entries/save";
import { prepareImageForCompose } from "@/lib/image";
import { useMyColorsStore, useRecordMyColor } from "@/lib/myColors/storage";
import { perfEnd, perfLog, perfStart } from "@/lib/perf";
import type { ComposeStep } from "@/lib/types/compose";
import type { DiaryEntry, EntryDate } from "@/lib/types/entry";
import type { PastEntryDisplay } from "@/lib/types/pastEntry";
import { normalizeHex } from "@/lib/utils/color";
import { todayEntryDate } from "@/lib/utils/date";

type ComposeFlowProps = {
  initialDate?: string;
};

function revokeBlobUrl(url?: string) {
  if (url?.startsWith("blob:")) {
    URL.revokeObjectURL(url);
  }
}

export function ComposeFlow({ initialDate }: ComposeFlowProps) {
  const router = useRouter();
  const { user } = useAuth();
  const { prompt: composePrompt, usePromptAsTemplate } = useComposePrompt();
  const myColors = useMyColorsStore();
  const recordMyColor = useRecordMyColor();
  const userId = user?.uid;

  const [bootLoading, setBootLoading] = useState(true);
  const [bootError, setBootError] = useState<string | null>(null);
  const [step, setStep] = useState<ComposeStep>("write");
  const [mode, setMode] = useState<"create" | "edit">("create");
  const [entryDate, setEntryDate] = useState<EntryDate>(
    initialDate ?? todayEntryDate(),
  );
  const [body, setBody] = useState("");
  const [color, setColor] = useState("");
  const [photoPreviewUrl, setPhotoPreviewUrl] = useState<string | undefined>();
  const [croppedPhotoBlob, setCroppedPhotoBlob] = useState<Blob | undefined>();
  const [photoRemoved, setPhotoRemoved] = useState(false);
  const [cropSourceUrl, setCropSourceUrl] = useState<string | undefined>();
  const [pastEntries, setPastEntries] = useState<PastEntryDisplay[]>([]);
  const [pastLoading, setPastLoading] = useState(false);
  const [pastError, setPastError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const savingLockRef = useRef(false);
  const pastRequestIdRef = useRef(0);
  const composePromptRef = useRef(composePrompt);
  const usePromptAsTemplateRef = useRef(usePromptAsTemplate);

  useEffect(() => {
    composePromptRef.current = composePrompt;
    usePromptAsTemplateRef.current = usePromptAsTemplate;
  }, [composePrompt, usePromptAsTemplate]);

  const hasCroppedPhoto = Boolean(
    croppedPhotoBlob || (photoPreviewUrl && !photoRemoved),
  );

  const applyEntry = useCallback(
    (entry: DiaryEntry | null, date: EntryDate) => {
      setEntryDate(date);
      setCroppedPhotoBlob(undefined);
      setPhotoRemoved(false);
      setSaveError(null);

      if (entry) {
        setMode("edit");
        setBody(entry.text);
        setColor(entry.color);
        setPhotoPreviewUrl(entry.imageUrl ?? undefined);
      } else {
        setMode("create");
        setBody(
          resolveComposeBody(
            "create",
            "",
            composePromptRef.current,
            usePromptAsTemplateRef.current,
          ),
        );
        setColor("");
        setPhotoPreviewUrl(undefined);
      }
    },
    [],
  );

  useEffect(() => {
    if (!userId) {
      return;
    }

    let cancelled = false;
    const date = initialDate ?? todayEntryDate();

    void (async () => {
      setBootLoading(true);
      setBootError(null);

      const cached = getCachedEntryByDate(userId, date);
      if (cached !== undefined) {
        applyEntry(cached, date);
        setBootLoading(false);
      }

      try {
        const entry = await getEntryByDate(userId, date);
        if (!cancelled) {
          applyEntry(entry, date);
        }
      } catch {
        if (!cancelled && cached === undefined) {
          applyEntry(null, date);
          setBootError("日記を読み込めませんでした");
        }
      } finally {
        if (!cancelled) {
          setBootLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [applyEntry, initialDate, userId]);

  useEffect(() => {
    return () => {
      revokeBlobUrl(photoPreviewUrl);
      revokeBlobUrl(cropSourceUrl);
    };
  }, [cropSourceUrl, photoPreviewUrl]);

  const handlePhotoSelect = useCallback(
    async (file: File) => {
      try {
        const prepared = await prepareImageForCompose(file);
        revokeBlobUrl(cropSourceUrl);
        setCropSourceUrl(URL.createObjectURL(prepared));
        setStep("crop");
      } catch {
        setSaveError("写真の読み込みに失敗しました");
      }
    },
    [cropSourceUrl],
  );

  const handleCropConfirm = useCallback(
    (blob: Blob) => {
      revokeBlobUrl(cropSourceUrl);
      if (photoPreviewUrl?.startsWith("blob:")) {
        revokeBlobUrl(photoPreviewUrl);
      }
      setCropSourceUrl(undefined);
      setCroppedPhotoBlob(blob);
      setPhotoRemoved(false);
      setPhotoPreviewUrl(URL.createObjectURL(blob));
      setStep("write");
    },
    [cropSourceUrl, photoPreviewUrl],
  );

  const handleCropCancel = useCallback(() => {
    revokeBlobUrl(cropSourceUrl);
    setCropSourceUrl(undefined);
    setStep("write");
  }, [cropSourceUrl]);

  const handlePhotoRemove = useCallback(() => {
    if (photoPreviewUrl?.startsWith("blob:")) {
      revokeBlobUrl(photoPreviewUrl);
    }
    setPhotoPreviewUrl(undefined);
    setCroppedPhotoBlob(undefined);
    setPhotoRemoved(true);
  }, [photoPreviewUrl]);

  const handleEntryDateChange = useCallback(
    async (nextDate: EntryDate) => {
      if (!userId || nextDate === entryDate) {
        return;
      }

      // 表示日付を即時反映（保存もこの state を使う）
      setEntryDate(nextDate);

      if (photoPreviewUrl?.startsWith("blob:")) {
        revokeBlobUrl(photoPreviewUrl);
      }

      const cached = getCachedEntryByDate(userId, nextDate);
      if (cached !== undefined) {
        applyEntry(cached, nextDate);
      } else {
        // キャッシュが無い間は新規扱いにし、誤って別日の下書きを載せない
        applyEntry(null, nextDate);
      }

      try {
        const entry = await getEntryByDate(userId, nextDate);
        applyEntry(entry, nextDate);
      } catch {
        // キャッシュ適用済み / 新規リセット済み
      }
    },
    [applyEntry, entryDate, photoPreviewUrl, userId],
  );

  const loadPastEntries = useCallback(
    async (savedDate: EntryDate) => {
      if (!userId) {
        return;
      }

      const requestId = ++pastRequestIdRef.current;
      setPastLoading(true);
      setPastError(null);
      try {
        const past = await listPastSameDayMemories(userId, savedDate);
        // Strict Mode や連打で古い応答を捨てる
        if (requestId !== pastRequestIdRef.current) {
          perfLog("past:loadIgnoredStaleResponse", { savedDate, requestId });
          return;
        }
        setPastEntries(
          past.map((item) => toPastEntryDisplay(item.entry, item.label)),
        );
      } catch {
        if (requestId !== pastRequestIdRef.current) {
          return;
        }
        setPastEntries([]);
        setPastError("過去の日記を読み込めませんでした");
      } finally {
        if (requestId === pastRequestIdRef.current) {
          setPastLoading(false);
        }
      }
    },
    [userId],
  );

  const persistAndShowPast = useCallback(
    async (selectedColor: string) => {
      if (!userId || savingLockRef.current) {
        return;
      }

      savingLockRef.current = true;
      setSaving(true);
      setSaveError(null);

      const normalized = normalizeHex(selectedColor);
      setColor(normalized);

      const toPastScreenKey = perfStart("compose:saveToPastScreen");
      const fullyDoneKey = perfStart("compose:saveToFullyDone");

      try {
        const cachedExisting = getCachedEntryByDate(userId, entryDate);
        const saved = await saveDiaryEntry({
          userId,
          entryDate,
          text: body,
          color: normalized,
          newPhotoBlob: croppedPhotoBlob,
          photoRemoved,
          existing:
            cachedExisting === undefined ? undefined : cachedExisting,
        });

        // upsertEntry 内でも cache 更新済みだが、画面 state と揃える
        upsertCachedEntry(userId, saved);
        recordMyColor(normalized);
        setMode("edit");
        setCroppedPhotoBlob(undefined);
        setPhotoRemoved(false);
        if (saved.imageUrl) {
          if (photoPreviewUrl?.startsWith("blob:")) {
            revokeBlobUrl(photoPreviewUrl);
          }
          setPhotoPreviewUrl(saved.imageUrl);
        } else if (photoRemoved) {
          setPhotoPreviewUrl(undefined);
        }

        // 保存完了時点で投稿完了画面へ。過去日記は後続で読み込む
        setPastEntries([]);
        setPastError(null);
        setPastLoading(true);
        setStep("past");
        setSaving(false);
        savingLockRef.current = false;
        perfEnd(toPastScreenKey);
        perfLog("compose:pastScreenShown", { entryDate });

        void loadPastEntries(entryDate).finally(() => {
          perfEnd(fullyDoneKey);
        });
      } catch {
        perfEnd(toPastScreenKey);
        perfEnd(fullyDoneKey);
        setSaveError("保存に失敗しました。もう一度お試しください");
        setSaving(false);
        savingLockRef.current = false;
      }
    },
    [
      body,
      croppedPhotoBlob,
      entryDate,
      loadPastEntries,
      photoPreviewUrl,
      photoRemoved,
      recordMyColor,
      userId,
    ],
  );

  const handleColorSelect = useCallback(
    (selectedColor: string) => {
      void persistAndShowPast(selectedColor);
    },
    [persistAndShowPast],
  );

  const savedEntry = useMemo(
    () => ({
      entryDate,
      body,
      color: color || "#d6d3d1",
      photoUrl:
        photoPreviewUrl && !photoPreviewUrl.startsWith("blob:")
          ? photoPreviewUrl
          : photoPreviewUrl,
    }),
    [body, color, entryDate, photoPreviewUrl],
  );

  if (bootLoading && !body && mode === "create") {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-white text-stone-400">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="relative min-h-dvh bg-white">
      {bootError ? (
        <p
          className="absolute top-[max(3rem,env(safe-area-inset-top,0px))] right-0 left-0 z-20 px-6 text-center text-sm text-red-500"
          role="alert"
        >
          {bootError}
        </p>
      ) : null}

      {step === "write" ? (
        <>
          <div className="absolute top-[max(1rem,env(safe-area-inset-top,0px))] left-[max(1.25rem,env(safe-area-inset-left,0px))] z-10">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="text-sm text-stone-400 transition-colors hover:text-stone-600"
            >
              キャンセル
            </button>
          </div>
          <ComposeWriteStep
            mode={mode}
            entryDate={entryDate}
            body={body}
            composePrompt={composePrompt}
            photoPreviewUrl={photoRemoved ? undefined : photoPreviewUrl}
            hasPhoto={hasCroppedPhoto}
            onBodyChange={setBody}
            onEntryDateChange={(date) => {
              void handleEntryDateChange(date);
            }}
            onPhotoSelect={(file) => {
              void handlePhotoSelect(file);
            }}
            onPhotoRemove={handlePhotoRemove}
            onFinish={() => setStep("color")}
          />
        </>
      ) : null}

      {step === "crop" && cropSourceUrl ? (
        <PhotoCropStep
          key={cropSourceUrl}
          imageUrl={cropSourceUrl}
          onConfirm={handleCropConfirm}
          onCancel={handleCropCancel}
        />
      ) : null}

      {step === "color" ? (
        <div className="relative">
          {saving ? (
            <div className="pointer-events-none absolute top-4 right-0 left-0 z-30 flex justify-center">
              <span className="rounded-full bg-white/90 px-4 py-2 text-sm text-stone-500 shadow-sm">
                保存中…
              </span>
            </div>
          ) : null}
          {saveError ? (
            <div className="absolute top-4 right-0 left-0 z-20 px-6 text-center">
              <p className="text-sm text-red-500" role="alert">
                {saveError}
              </p>
              <button
                type="button"
                onClick={() => setSaveError(null)}
                className="mt-2 text-sm text-stone-500 underline"
              >
                閉じる
              </button>
            </div>
          ) : null}
          <ComposeColorStep
            recentColors={myColors}
            initialColor={color || undefined}
            entryDate={entryDate}
            body={body}
            photoPreviewUrl={
              photoRemoved ? undefined : photoPreviewUrl
            }
            saving={saving}
            onConfirm={handleColorSelect}
          />
        </div>
      ) : null}

      {step === "past" ? (
        <PastEntriesStep
          savedEntry={savedEntry}
          entries={pastEntries}
          loading={pastLoading}
          error={pastError}
          onRetry={() => {
            void loadPastEntries(entryDate);
          }}
        />
      ) : null}
    </div>
  );
}
