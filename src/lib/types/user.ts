import type { Timestamp } from "firebase/firestore";

import type { AppLocale } from "./locale";

export type UserPlan = "free" | "premium";

export type UserProfile = {
  uid: string;
  displayName?: string;
  email?: string;
  locale: AppLocale;
  plan: UserPlan;
  /** 投稿画面で本文入力前に表示する問いかけ文 */
  composePrompt?: string;
  /** true のとき新規投稿で問いかけ文を本文の初期値として入れる */
  usePromptAsTemplate?: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
};

export type UserProfileInput = {
  displayName?: string;
  email?: string;
  locale?: AppLocale;
};
