"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";

import { DEFAULT_COMPOSE_PROMPT } from "@/lib/constants/composePrompt";
import {
  saveComposePromptSettings,
  useComposePromptStore,
  useSaveComposePromptSettings,
  useUsePromptAsTemplateStore,
} from "@/lib/composePrompt/storage";

type ComposePromptContextValue = {
  prompt: string;
  usePromptAsTemplate: boolean;
  saveSettings: (
    prompt: string,
    usePromptAsTemplate: boolean,
  ) => { prompt: string; usePromptAsTemplate: boolean };
  resetToDefault: () => { prompt: string; usePromptAsTemplate: boolean };
};

const ComposePromptContext = createContext<ComposePromptContextValue | undefined>(
  undefined,
);

export function ComposePromptProvider({ children }: { children: ReactNode }) {
  const prompt = useComposePromptStore();
  const usePromptAsTemplate = useUsePromptAsTemplateStore();
  const persistSettings = useSaveComposePromptSettings();

  const value = useMemo(
    () => ({
      prompt,
      usePromptAsTemplate,
      saveSettings: persistSettings,
      resetToDefault: () => saveComposePromptSettings("", false),
    }),
    [persistSettings, prompt, usePromptAsTemplate],
  );

  return (
    <ComposePromptContext.Provider value={value}>
      {children}
    </ComposePromptContext.Provider>
  );
}

export function useComposePrompt(): ComposePromptContextValue {
  const context = useContext(ComposePromptContext);
  if (!context) {
    throw new Error("useComposePrompt must be used within ComposePromptProvider");
  }
  return context;
}

/** 保存前バリデーション — 空欄では保存不可 */
export function canSaveComposePromptDraft(prompt: string): boolean {
  return prompt.trim().length > 0;
}

export { DEFAULT_COMPOSE_PROMPT };
