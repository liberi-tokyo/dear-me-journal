/** 未設定時のデフォルト問いかけ（users/{uid}.composePrompt 未設定時と同じ） */
export const DEFAULT_COMPOSE_PROMPT = "今日、忘れたくないことは？";

/** 未設定時は placeholder 表示（users/{uid}.usePromptAsTemplate 未設定時と同じ） */
export const DEFAULT_USE_PROMPT_AS_TEMPLATE = false;

export const MAX_COMPOSE_PROMPT_LENGTH = 200;

export const COMPOSE_PROMPT_STORAGE_KEY = "monthly-diary:compose-prompt";

export const USE_PROMPT_AS_TEMPLATE_STORAGE_KEY =
  "monthly-diary:use-prompt-as-template";

/** @deprecated 旧 localStorage キー — 読み取り時の移行用 */
export const LEGACY_COMPOSE_PROMPTS_STORAGE_KEY = "monthly-diary:compose-prompts";
