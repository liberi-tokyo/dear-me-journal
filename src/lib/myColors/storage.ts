import { useCallback, useSyncExternalStore } from "react";

import { MY_COLORS_STORAGE_KEY } from "@/lib/constants/myColors";
import {
  clampMyColors,
  isValidMyColors,
  touchMyColor,
} from "@/lib/myColors/touch";

const DEFAULT_SNAPSHOT: string[] = [];

let cachedRaw: string | null | undefined;
let cachedSnapshot: string[] = DEFAULT_SNAPSHOT;

const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function readMyColors(): string[] {
  if (typeof window === "undefined") {
    return DEFAULT_SNAPSHOT;
  }

  try {
    const raw = window.localStorage.getItem(MY_COLORS_STORAGE_KEY);
    if (raw === cachedRaw) {
      return cachedSnapshot;
    }

    if (!raw) {
      cachedRaw = raw;
      cachedSnapshot = DEFAULT_SNAPSHOT;
      return cachedSnapshot;
    }

    const parsed: unknown = JSON.parse(raw);
    if (!isValidMyColors(parsed)) {
      cachedRaw = raw;
      cachedSnapshot = DEFAULT_SNAPSHOT;
      return cachedSnapshot;
    }

    cachedRaw = raw;
    cachedSnapshot = clampMyColors(parsed);
    return cachedSnapshot;
  } catch {
    cachedRaw = undefined;
    cachedSnapshot = DEFAULT_SNAPSHOT;
    return cachedSnapshot;
  }
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);

  const onStorage = (event: StorageEvent) => {
    if (event.key === MY_COLORS_STORAGE_KEY) {
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

function getServerSnapshot(): string[] {
  return DEFAULT_SNAPSHOT;
}

export function saveMyColors(colors: string[]): string[] {
  if (typeof window !== "undefined") {
    const serialized = JSON.stringify(colors);
    window.localStorage.setItem(MY_COLORS_STORAGE_KEY, serialized);
    cachedRaw = serialized;
    cachedSnapshot = colors;
    emitChange();
  }

  return colors;
}

export function recordMyColor(color: string): string[] {
  const next = touchMyColor(readMyColors(), color);
  return saveMyColors(next);
}

export function useMyColorsStore(): string[] {
  return useSyncExternalStore(subscribe, readMyColors, getServerSnapshot);
}

export function useRecordMyColor(): (color: string) => string[] {
  return useCallback((color: string) => recordMyColor(color), []);
}
