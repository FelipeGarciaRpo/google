/* eslint-disable react-hooks/immutability */
"use client";

import { useEffect, useState } from "react";

export type ThemeId =
  | "cyan" | "purple"
  | "cyan-split" | "purple-split"
  | "navy" | "classic" | "vscode"
  | "light-white" | "light-warm";

export type ThemeGroup = "Dark" | "Split" | "Studio" | "Light";

export interface Theme {
  id: ThemeId;
  label: string;
  color: string;
  splitColor?: string;
  description: string;
  group: ThemeGroup;
}

export const THEMES: Theme[] = [
  // ── Dark ──
  { id: "cyan",         group: "Dark",   label: "Cyber Cyan",     color: "#22d3ee",                description: "Dark background, cyan accent" },
  { id: "purple",       group: "Dark",   label: "Neon Purple",    color: "#a855f7",                description: "Dark background, violet accent" },

  // ── Split ──
  { id: "cyan-split",   group: "Split",  label: "Cyan / Slate",   color: "#22d3ee", splitColor: "#4a5568", description: "Slate sidebar, cyan accent" },
  { id: "purple-split", group: "Split",  label: "Purple / Slate", color: "#a855f7", splitColor: "#4a5568", description: "Slate sidebar, violet accent" },

  // ── Studio ──
  { id: "vscode",       group: "Studio", label: "VS Code",        color: "#4fc3f7",                description: "Dark gray, VS Code default" },
  { id: "navy",         group: "Studio", label: "Studio Navy",    color: "#6b9eff",                description: "Deep navy, electric blue accent" },
  { id: "classic",      group: "Studio", label: "Classic",        color: "#8fa8d6",                description: "Blue-gray, original studio look" },

  // ── Light ──
  { id: "light-white",  group: "Light",  label: "Light White",    color: "#f8fafc",                description: "Clean white, indigo accent" },
  { id: "light-warm",   group: "Light",  label: "Light Warm",     color: "#fdf6ec",                description: "Warm cream, terracotta accent" },
];

export const THEME_GROUPS: ThemeGroup[] = ["Dark", "Split", "Studio", "Light"];

const STORAGE_KEY = "telemetry-studio-theme";

export function useTheme() {
  const [theme, setThemeState] = useState<ThemeId>("vscode");

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as ThemeId | null;
    if (saved && THEMES.find((t) => t.id === saved)) {
      applyTheme(saved);
      setThemeState(saved);
    }
  }, []);

  function applyTheme(id: ThemeId) {
    document.documentElement.setAttribute("data-theme", id);
  }

  function setTheme(id: ThemeId) {
    applyTheme(id);
    setThemeState(id);
    localStorage.setItem(STORAGE_KEY, id);
  }

  return { theme, setTheme, themes: THEMES };
}