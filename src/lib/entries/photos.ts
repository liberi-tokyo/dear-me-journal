import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { prepareImageForUpload } from "@/lib/image";
import { getClientStorage } from "@/lib/firebase/client";
import { STORAGE_PATHS } from "@/lib/firebase/constants";
import { perfLog, perfMeasure } from "@/lib/perf";

export type UploadedEntryImage = {
  imageUrl: string;
  imagePath: string;
};

export async function uploadEntryImage(
  userId: string,
  entryId: string,
  blob: Blob,
): Promise<UploadedEntryImage> {
  return perfMeasure("image:uploadEntryImage", async () => {
    const prepared = await prepareImageForUpload(blob);
    const imagePath = STORAGE_PATHS.entryImage(userId, entryId);
    const storageRef = ref(getClientStorage(), imagePath);

    await perfMeasure("image:storageUploadBytes", async () => {
      await uploadBytes(storageRef, prepared.blob, {
        contentType: prepared.contentType,
      });
    });

    const imageUrl = await perfMeasure("image:getDownloadURL", () =>
      getDownloadURL(storageRef),
    );

    perfLog("image:uploadEntryImage:done", {
      byteSize: prepared.byteSize,
      contentType: prepared.contentType,
      imagePath,
    });

    return { imageUrl, imagePath };
  });
}

export async function deleteEntryImage(imagePath: string): Promise<void> {
  if (!imagePath || imagePath.startsWith("blob:")) {
    return;
  }

  return perfMeasure("image:deleteEntryImage", async () => {
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

      if (code === "storage/object-not-found") {
        return;
      }
      throw error;
    }
  });
}
