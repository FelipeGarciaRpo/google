"use client";

import { useCallback, useSyncExternalStore } from "react";

import { DEFAULT_MODEL_ID, isModelId } from "../models";

const STORAGE_KEY = "telemetry-studio-model";
const listeners = new Set<() => void>();

const readSelectedModel = () => {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return isModelId(value) ? value : DEFAULT_MODEL_ID;
  } catch {
    return DEFAULT_MODEL_ID;
  }
};

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  // Keep other tabs in sync
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
};

// The agent model picked in the selector, remembered per browser like Claude Code's /model
export const useSelectedModel = () => {
  const modelId = useSyncExternalStore(subscribe, readSelectedModel, () => DEFAULT_MODEL_ID);

  const setModelId = useCallback((id: string) => {
    try {
      localStorage.setItem(STORAGE_KEY, id);
    } catch {
      // Private mode or blocked storage: the choice just won't persist
    }
    listeners.forEach((listener) => listener());
  }, []);

  return [modelId, setModelId] as const;
};
