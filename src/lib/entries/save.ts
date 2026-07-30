import {
  deleteEntryImage,
  uploadEntryImage,
} from "@/lib/entries/photos";
import { getCachedEntryByDate } from "@/lib/entries/cache";
import {
  entryIdFromDate,
  getEntryByDate,
  upsertEntry,
} from "@/lib/entries/repository";
import type { DiaryEntry, EntryDate } from "@/lib/types/entry";
import { perfLog, perfMeasure } from "@/lib/perf";

export type SaveDiaryParams = {
  userId: string;
  entryDate: EntryDate;
  text: string;
  color: string;
  /** 新しくクロップした写真。undefined なら変更なし / 削除は photoRemoved */
  newPhotoBlob?: Blob;
  photoRemoved?: boolean;
  /**
   * 呼び出し側が既に把握している既存日記。
   * undefined = 未確認（キャッシュ→必要なら fetch）
   * null = 存在しないことが確定
   */
  existing?: DiaryEntry | null;
};

function isBlobUrl(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith("blob:"));
}

async function resolveExistingEntry(
  userId: string,
  entryDate: EntryDate,
  existing: DiaryEntry | null | undefined,
): Promise<DiaryEntry | null> {
  if (existing !== undefined) {
    return existing;
  }

  const cached = getCachedEntryByDate(userId, entryDate);
  if (cached !== undefined) {
    perfLog("save:getExisting:cacheHit", {
      exists: cached !== null,
    });
    return cached;
  }

  return perfMeasure("save:getExisting:network", () =>
    getEntryByDate(userId, entryDate),
  );
}

export async function saveDiaryEntry(
  params: SaveDiaryParams,
): Promise<DiaryEntry> {
  return perfMeasure("save:total", async () => {
    const { userId, entryDate, text, color, newPhotoBlob, photoRemoved } =
      params;
    const entryId = entryIdFromDate(entryDate);

    const existing = await resolveExistingEntry(
      userId,
      entryDate,
      params.existing,
    );

    let imageUrl: string | null = existing?.imageUrl ?? null;
    let imagePath: string | null = existing?.imagePath ?? null;

    if (isBlobUrl(imageUrl)) {
      imageUrl = null;
      imagePath = null;
    }

    // 写真削除のみ: Storage 削除と Firestore 更新は直列のまま（整合性優先）
    if (photoRemoved && !newPhotoBlob) {
      if (imagePath) {
        await deleteEntryImage(imagePath);
      }
      imageUrl = null;
      imagePath = null;
    }

    // 新規写真: 同一 path へ uploadBytes で上書きできるため、事前 delete は省略
    if (newPhotoBlob) {
      const previousPath = imagePath;
      const uploaded = await uploadEntryImage(userId, entryId, newPhotoBlob);
      imageUrl = uploaded.imageUrl;
      imagePath = uploaded.imagePath;

      // 万一 path が変わった場合のみ旧ファイルを後掃除（現状は同一 path）
      if (previousPath && previousPath !== uploaded.imagePath) {
        void deleteEntryImage(previousPath);
      }
    }

    const saved = await perfMeasure("save:firestoreUpsert", () =>
      upsertEntry(
        userId,
        {
          entryDate,
          text,
          color,
          imageUrl,
          imagePath,
        },
        existing,
      ),
    );

    perfLog("save:total:summary", {
      entryDate,
      hadPhoto: Boolean(newPhotoBlob),
      photoRemoved: Boolean(photoRemoved),
      wasExisting: Boolean(existing),
    });

    return saved;
  });
}
