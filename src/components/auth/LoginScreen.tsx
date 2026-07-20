"use client";

import { useAuth } from "@/contexts/AuthContext";

export function LoginScreen() {
  const { configured, error, signInWithGoogle, clearError } = useAuth();

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-white px-8">
      <p className="text-sm tracking-wide text-stone-400">毎月日記</p>
      <h1 className="mt-4 text-center text-2xl font-medium tracking-tight text-stone-800">
        思い出を、色で残す
      </h1>
      <p className="mt-3 max-w-xs text-center text-sm leading-relaxed text-stone-500">
        Googleアカウントでログインして、あなただけの日記を始めましょう
      </p>

      {!configured ? (
        <p className="mt-10 max-w-sm text-center text-sm leading-relaxed text-stone-500">
          Firebaseが設定されていません。.env.local に設定値を記入してください。
        </p>
      ) : (
        <button
          type="button"
          onClick={() => {
            clearError();
            void signInWithGoogle();
          }}
          className="mt-10 w-full max-w-xs touch-manipulation rounded-full border border-stone-200/90 bg-white/65 py-4 text-base font-medium text-stone-700 shadow-sm shadow-stone-300/25 backdrop-blur-sm transition-[transform,opacity] active:scale-[0.98]"
        >
          Googleでログイン
        </button>
      )}

      {error ? (
        <p className="mt-4 max-w-xs text-center text-sm text-red-500" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
