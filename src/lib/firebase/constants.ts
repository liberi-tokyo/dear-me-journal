export const COLLECTIONS = {
  users: "users",
  entries: "entries",
  colorStats: "colorStats",
} as const;

export const STORAGE_PATHS = {
  /** users/{uid}/entries/{entryId}/image */
  entryImage: (userId: string, entryId: string) =>
    `users/${userId}/entries/${entryId}/image`,
} as const;
