import type { Timestamp } from "firebase/firestore";

export type ColorStat = {
  color: string;
  useCount: number;
  lastUsedAt: Timestamp;
};
