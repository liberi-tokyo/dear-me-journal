"use client";

import { useSyncExternalStore, type ReactNode } from "react";

import { LoginScreen } from "@/components/auth/LoginScreen";
import { useAuth } from "@/contexts/AuthContext";

function subscribe() {
  return () => {};
}

function AuthLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-white text-stone-400">
      読み込み中…
    </div>
  );
}

export function AuthGate({ children }: { children: ReactNode }) {
  const { user, loading, configured } = useAuth();
  // SSR では false、hydrate 後に true（意図的な再描画で mismatch を避ける）
  const isClient = useSyncExternalStore(subscribe, () => true, () => false);

  if (!isClient || (configured && loading)) {
    return <AuthLoading />;
  }

  if (!user) {
    return <LoginScreen />;
  }

  return <>{children}</>;
}
