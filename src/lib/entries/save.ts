import {
  deleteEntryImage,
  uploadEntryImage,
} from "@/lib/entries/photos";
import {
  entryIdFromDate,
  getEntryByDate,
  upsertEntry,
} from "@/lib/entries/repository";
import type { DiaryEntry, EntryDate } from "@/lib/types/entry";

export type SaveDiaryParams = {
  userId: string;
  entryDate: EntryDate;
  text: string;
  color: string;
  /** 新しくクロップした写真。undefined なら変更なし / 削除は photoRemoved */
  newPhotoBlob?: Blob;
  photoRemoved?: boolean;
};

function isBlobUrl(url: string | null | undefined): boolean {
  return Boolean(url?.startsWith("blob:"));
}

export async function saveDiaryEntry(
  params: SaveDiaryParams,
): Promise<DiaryEntry> {
  const { userId, entryDate, text, color, newPhotoBlob, photoRemoved } =
    params;
  const entryId = entryIdFromDate(entryDate);
  const existing = await getEntryByDate(userId, entryDate);

  let imageUrl: string | null = existing?.imageUrl ?? null;
  let imagePath: string | null = existing?.imagePath ?? null;

  if (isBlobUrl(imageUrl)) {
    imageUrl = null;
    imagePath = null;
  }

  if (photoRemoved) {
    if (imagePath) {
      await deleteEntryImage(imagePath);
    }
    imageUrl = null;
    imagePath = null;
  }

  if (newPhotoBlob) {
    if (imagePath) {
      await deleteEntryImage(imagePath);
    }
    const uploaded = await uploadEntryImage(userId, entryId, newPhotoBlob);
    imageUrl = uploaded.imageUrl;
    imagePath = uploaded.imagePath;
  }

  return upsertEntry(
    userId,
    {
      entryDate,
      text,
      color,
      imageUrl,
      imagePath,
    },
    existing,
  );
}
