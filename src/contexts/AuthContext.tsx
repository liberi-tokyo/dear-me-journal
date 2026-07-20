"use client";

import {
  GoogleAuthProvider,
  User,
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut as firebaseSignOut,
} from "firebase/auth";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { getAuthErrorMessage } from "@/lib/auth/errors";
import { clearEntriesCache } from "@/lib/entries/cache";
import { getClientAuth } from "@/lib/firebase/client";
import { isFirebaseConfigured } from "@/lib/firebase/config";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  configured: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const googleProvider = new GoogleAuthProvider();

function shouldFallbackToRedirect(error: unknown): boolean {
  const code =
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof (error as { code: unknown }).code === "string"
      ? (error as { code: string }).code
      : "";

  // ユーザーが閉じた場合はリダイレクトしない
  return code === "auth/popup-blocked";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const configured = isFirebaseConfigured();
  const [user, setUser] = useState<User | null>(null);
  // 初回は常に true（SSR とクライアントの初回描画を一致させる）
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!configured) {
      return;
    }

    const auth = getClientAuth();

    // redirect フロー復帰時の結果を処理（失敗しても onAuthStateChanged で拾える）
    void getRedirectResult(auth).catch(() => {
      // 未ログイン復帰などは無視
    });

    const unsubscribe = onAuthStateChanged(auth, (nextUser) => {
      if (!nextUser) {
        clearEntriesCache();
      }
      setUser(nextUser);
      setLoading(false);
    });

    return unsubscribe;
  }, [configured]);

  const signInWithGoogle = useCallback(async () => {
    if (!configured) {
      setError("Firebaseが設定されていません。.env.local を確認してください");
      return;
    }

    setError(null);
    const auth = getClientAuth();

    try {
      // 同一タブは localhost:3000 のまま。ポップアップのみ Google / authDomain へ
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      if (shouldFallbackToRedirect(err)) {
        try {
          // 現在の URL（localhost:3000）へ戻る
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch (redirectErr) {
          setError(getAuthErrorMessage(redirectErr));
          return;
        }
      }
      setError(getAuthErrorMessage(err));
    }
  }, [configured]);

  const signOut = useCallback(async () => {
    setError(null);
    try {
      await firebaseSignOut(getClientAuth());
      clearEntriesCache();
    } catch (err) {
      setError(getAuthErrorMessage(err));
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);

  const value = useMemo(
    () => ({
      user,
      loading,
      configured,
      error,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [
      user,
      loading,
      configured,
      error,
      signInWithGoogle,
      signOut,
      clearError,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
