import type { DiaryEntry, EntryDate } from "./entry";

export type ComposeMode = "create" | "edit";

export type ComposeStep = "write" | "crop" | "color" | "past";

export type ComposeDraft = {
  mode: ComposeMode;
  entryDate: EntryDate;
  body: string;
  color: string;
  /** トリミング済み正方形画像のプレビュー URL */
  photoPreviewUrl?: string;
  /** トリミング済み正方形画像（Storage 保存用） */
  croppedPhotoBlob?: Blob;
  /** Set when editing an existing entry */
  existingEntry?: DiaryEntry;
  removePhoto?: boolean;
};
