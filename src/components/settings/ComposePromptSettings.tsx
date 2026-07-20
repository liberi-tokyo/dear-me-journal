"use client";

import Link from "next/link";
import { useState } from "react";

import {
  canSaveComposePromptDraft,
  useComposePrompt,
} from "@/contexts/ComposePromptContext";
import { useAuth } from "@/contexts/AuthContext";
import { MAX_COMPOSE_PROMPT_LENGTH } from "@/lib/constants/composePrompt";
import type { ComposePromptSettings } from "@/lib/composePrompt/storage";

type ComposePromptFormProps = {
  initialPrompt: string;
  initialUsePromptAsTemplate: boolean;
  onSave: (prompt: string, usePromptAsTemplate: boolean) => ComposePromptSettings;
};

type PromptTemplateToggleProps = {
  id: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
};

function PromptTemplateToggle({ id, checked, onChange }: PromptTemplateToggleProps) {
  return (
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${
        checked ? "bg-stone-700" : "bg-stone-200"
      }`}
    >
      <span
        aria-hidden
        className={`inline-block size-5 rounded-full bg-white shadow-sm transition-transform ${
          checked ? "translate-x-6" : "translate-x-1"
        }`}
      />
    </button>
  );
}

function ComposePromptForm({
  initialPrompt,
  initialUsePromptAsTemplate,
  onSave,
}: ComposePromptFormProps) {
  const [draft, setDraft] = useState(initialPrompt);
  const [usePromptAsTemplate, setUsePromptAsTemplate] = useState(
    initialUsePromptAsTemplate,
  );
  const [saved, setSaved] = useState(false);

  const canSave = canSaveComposePromptDraft(draft);

  const handleSave = () => {
    if (!canSave) {
      return;
    }

    const normalized = onSave(draft, usePromptAsTemplate);
    setDraft(normalized.prompt);
    setUsePromptAsTemplate(normalized.usePromptAsTemplate);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2000);
  };

  return (
    <>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder="問いかけ文を入力"
        rows={4}
        maxLength={MAX_COMPOSE_PROMPT_LENGTH}
        className="mt-6 min-h-[6.5rem] w-full resize-y rounded-xl border border-stone-200 bg-white px-4 py-3 text-base leading-relaxed text-stone-800 placeholder:text-stone-400 focus:border-stone-300 focus:outline-none"
      />

      <div className="mt-6 flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <label
            htmlFor="use-prompt-as-template"
            className="block cursor-pointer text-sm font-medium text-stone-800"
          >
            問いかけを残して書く
          </label>
          <p className="mt-1 text-sm leading-relaxed text-stone-500">
            オンにすると、問いかけを残したまま書き足せます
          </p>
        </div>
        <PromptTemplateToggle
          id="use-prompt-as-template"
          checked={usePromptAsTemplate}
          onChange={setUsePromptAsTemplate}
        />
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={!canSave}
        className="mt-8 w-full rounded-full border border-stone-200/90 bg-white/65 py-4 text-base font-medium text-stone-700 shadow-sm shadow-stone-300/25 backdrop-blur-sm transition-[transform,opacity,background-color] active:scale-[0.98] disabled:cursor-not-allowed disabled:border-stone-200/50 disabled:bg-stone-100/50 disabled:text-stone-400 disabled:shadow-none"
      >
        保存する
      </button>

      {saved ? (
        <p className="mt-3 text-center text-sm text-stone-500" role="status">
          保存しました
        </p>
      ) : null}
    </>
  );
}

export function ComposePromptSettings() {
  const { prompt, usePromptAsTemplate, saveSettings } = useComposePrompt();
  const { user, signOut, error: authError } = useAuth();

  return (
    <div className="min-h-dvh bg-white">
      <header className="sticky top-0 z-10 bg-[#FFF] px-5 pb-4 pt-[max(1rem,env(safe-area-inset-top,0px))]">
        <Link
          href="/"
          className="text-sm text-stone-400 transition-colors hover:text-stone-600"
        >
          ← アーカイブ
        </Link>
      </header>

      <main className="mx-auto max-w-md px-6 pb-16 pt-2">
        <h1 className="text-xl font-medium text-stone-800">設定</h1>

        <section className="mt-10" aria-labelledby="compose-prompt-heading">
          <h2
            id="compose-prompt-heading"
            className="text-base font-medium text-stone-800"
          >
            日記の問いかけ
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-stone-500">
            本文を書く前に表示する問いを設定できます
          </p>

          <ComposePromptForm
            key={`${prompt}\u0000${usePromptAsTemplate}`}
            initialPrompt={prompt}
            initialUsePromptAsTemplate={usePromptAsTemplate}
            onSave={saveSettings}
          />
        </section>

        <section className="mt-14 border-t border-stone-100 pt-10">
          <h2 className="text-base font-medium text-stone-800">アカウント</h2>
          {user?.email ? (
            <p className="mt-2 text-sm text-stone-500">{user.email}</p>
          ) : null}
          <button
            type="button"
            onClick={() => {
              void signOut();
            }}
            className="mt-6 w-full touch-manipulation rounded-full border border-stone-200/90 bg-white/65 py-4 text-base font-medium text-stone-700 shadow-sm shadow-stone-300/25 backdrop-blur-sm transition-[transform,opacity] active:scale-[0.98]"
          >
            ログアウト
          </button>
          {authError ? (
            <p className="mt-3 text-center text-sm text-red-500" role="alert">
              {authError}
            </p>
          ) : null}
        </section>
      </main>
    </div>
  );
}
