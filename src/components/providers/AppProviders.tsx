"use client";

import type { ReactNode } from "react";

import { AuthGate } from "@/components/auth/AuthGate";
import { ColorPickerForceDebugPanel } from "@/components/compose/ColorPickerForceDebugPanel";
import { AuthProvider } from "@/contexts/AuthContext";
import { ComposePromptProvider } from "@/contexts/ComposePromptContext";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <ComposePromptProvider>
        <AuthGate>{children}</AuthGate>
        <ColorPickerForceDebugPanel />
      </ComposePromptProvider>
    </AuthProvider>
  );
}
