import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { getClientStorage } from "@/lib/firebase/client";
import { STORAGE_PATHS } from "@/lib/firebase/constants";

export type UploadedEntryImage = {
  imageUrl: string;
  imagePath: string;
};

export async function uploadEntryImage(
  userId: string,
  entryId: string,
  blob: Blob,
): Promise<UploadedEntryImage> {
  const imagePath = STORAGE_PATHS.entryImage(userId, entryId);
  const storageRef = ref(getClientStorage(), imagePath);
  const contentType = blob.type || "image/jpeg";
  await uploadBytes(storageRef, blob, { contentType });
  const imageUrl = await getDownloadURL(storageRef);
  return { imageUrl, imagePath };
}

export async function deleteEntryImage(imagePath: string): Promise<void> {
  if (!imagePath || imagePath.startsWith("blob:")) {
    return;
  }

  try {
    await deleteObject(ref(getClientStorage(), imagePath));
  } catch (error) {
    const code =
      typeof error === "object" &&
      error !== null &&
      "code" in error &&
      typeof (error as { code: unknown }).code === "string"
        ? (error as { code: string }).code
        : "";

    // 既に無い場合は無視
    if (code === "storage/object-not-found") {
      return;
    }
    throw error;
  }
}
