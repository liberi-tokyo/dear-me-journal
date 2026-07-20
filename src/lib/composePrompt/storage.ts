import { useCallback, useSyncExternalStore } from "react";

import {
  COMPOSE_PROMPT_STORAGE_KEY,
  DEFAULT_COMPOSE_PROMPT,
  DEFAULT_USE_PROMPT_AS_TEMPLATE,
  LEGACY_COMPOSE_PROMPTS_STORAGE_KEY,
  MAX_COMPOSE_PROMPT_LENGTH,
  USE_PROMPT_AS_TEMPLATE_STORAGE_KEY,
} from "@/lib/constants/composePrompt";

function isValidPrompt(value: unknown): value is string {
  return (
    typeof value === "string" &&
    value.trim().length > 0 &&
    value.length <= MAX_COMPOSE_PROMPT_LENGTH
  );
}

/** 保存前に正規化 — 前後空白除去、空欄時はデフォルトへ */
export function normalizeComposePrompt(prompt: string): string {
  const trimmed = prompt.trim();

  if (!trimmed) {
    return DEFAULT_COMPOSE_PROMPT;
  }

  return trimmed.slice(0, MAX_COMPOSE_PROMPT_LENGTH);
}

function parseStoredPrompt(raw: string): string | null {
  try {
    const parsed: unknown = JSON.parse(raw);

    if (typeof parsed === "string") {
      return isValidPrompt(parsed) ? parsed.trim() : null;
    }

    if (
      Array.isArray(parsed) &&
      parsed.length > 0 &&
      typeof parsed[0] === "string" &&
      parsed[0].trim().length > 0
    ) {
      return normalizeComposePrompt(parsed[0]);
    }
  } catch {
    if (raw.trim().length > 0) {
      return normalizeComposePrompt(raw);
    }
  }

  return null;
}

function readComposePrompt(): string {
  if (typeof window === "undefined") {
    return DEFAULT_SNAPSHOT;
  }

  try {
    const raw =
      window.localStorage.getItem(COMPOSE_PROMPT_STORAGE_KEY) ??
      window.localStorage.getItem(LEGACY_COMPOSE_PROMPTS_STORAGE_KEY);

    if (!raw) {
      return DEFAULT_SNAPSHOT;
    }

    const prompt = parseStoredPrompt(raw);
    return prompt ?? DEFAULT_SNAPSHOT;
  } catch {
    return DEFAULT_SNAPSHOT;
  }
}

const DEFAULT_SNAPSHOT = DEFAULT_COMPOSE_PROMPT;
const DEFAULT_TEMPLATE_SNAPSHOT = DEFAULT_USE_PROMPT_AS_TEMPLATE;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (
      event.key === COMPOSE_PROMPT_STORAGE_KEY ||
      event.key === LEGACY_COMPOSE_PROMPTS_STORAGE_KEY ||
      event.key === USE_PROMPT_AS_TEMPLATE_STORAGE_KEY
    ) {
      listener();
    }
  };

  if (typeof window !== "undefined") {
    window.addEventListener("storage", onStorage);
  }

  return () => {
    listeners.delete(listener);
    if (typeof window !== "undefined") {
      window.removeEventListener("storage", onStorage);
    }
  };
}

function getServerSnapshot(): string {
  return DEFAULT_SNAPSHOT;
}

export function saveComposePrompt(prompt: string): string {
  const normalized = normalizeComposePrompt(prompt);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      COMPOSE_PROMPT_STORAGE_KEY,
      JSON.stringify(normalized),
    );
    window.localStorage.removeItem(LEGACY_COMPOSE_PROMPTS_STORAGE_KEY);
    emitChange();
  }

  return normalized;
}

function readUsePromptAsTemplate(): boolean {
  if (typeof window === "undefined") {
    return DEFAULT_TEMPLATE_SNAPSHOT;
  }

  try {
    const raw = window.localStorage.getItem(USE_PROMPT_AS_TEMPLATE_STORAGE_KEY);
    if (raw === null) {
      return DEFAULT_TEMPLATE_SNAPSHOT;
    }

    return JSON.parse(raw) === true;
  } catch {
    return DEFAULT_TEMPLATE_SNAPSHOT;
  }
}

function getTemplateServerSnapshot(): boolean {
  return DEFAULT_TEMPLATE_SNAPSHOT;
}

export function saveUsePromptAsTemplate(value: boolean): boolean {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      USE_PROMPT_AS_TEMPLATE_STORAGE_KEY,
      JSON.stringify(value),
    );
    emitChange();
  }

  return value;
}

export type ComposePromptSettings = {
  prompt: string;
  usePromptAsTemplate: boolean;
};

export function saveComposePromptSettings(
  prompt: string,
  usePromptAsTemplate: boolean,
): ComposePromptSettings {
  return {
    prompt: saveComposePrompt(prompt),
    usePromptAsTemplate: saveUsePromptAsTemplate(usePromptAsTemplate),
  };
}

export function useComposePromptStore(): string {
  return useSyncExternalStore(subscribe, readComposePrompt, getServerSnapshot);
}

export function useUsePromptAsTemplateStore(): boolean {
  return useSyncExternalStore(
    subscribe,
    readUsePromptAsTemplate,
    getTemplateServerSnapshot,
  );
}

export function useSaveComposePromptSettings(): (
  prompt: string,
  usePromptAsTemplate: boolean,
) => ComposePromptSettings {
  return useCallback(
    (prompt: string, usePromptAsTemplate: boolean) =>
      saveComposePromptSettings(prompt, usePromptAsTemplate),
    [],
  );
}
