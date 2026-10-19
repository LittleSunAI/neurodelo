"use client";

import { useEffect } from "react";
import { fallbackConfig } from "@/lib/fallback-config";
import type { AppearanceSettings } from "@/types/platform";

const defaults: AppearanceSettings = { theme: "dark", textScale: "normal", reduceMotion: false, highContrast: false, language: "ru" };

function apply(appearance: AppearanceSettings) {
  const root = document.documentElement;
  root.dataset.theme = appearance.theme;
  root.dataset.textScale = appearance.textScale;
  root.dataset.reduceMotion = appearance.reduceMotion ? "true" : "false";
  root.dataset.highContrast = appearance.highContrast ? "true" : "false";
  root.lang = appearance.language;
  root.style.colorScheme = appearance.theme === "light" ? "light" : appearance.theme === "dark" ? "dark" : "light dark";
}

export function AccessibilityBootstrap() {
  useEffect(() => {
    const keys = [fallbackConfig.storageKey, fallbackConfig.previousStorageKey, fallbackConfig.legacyStorageKey, fallbackConfig.oldestStorageKey, fallbackConfig.ancientStorageKey];
    for (const key of keys) {
      try {
        const raw = window.localStorage.getItem(key);
        if (!raw) continue;
        const parsed = JSON.parse(raw) as { preferences?: { appearance?: Partial<AppearanceSettings> } };
        apply({ ...defaults, ...(parsed.preferences?.appearance ?? {}) });
        return;
      } catch { /* corrupted local fallback must not block rendering */ }
    }
    const systemReduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    apply({ ...defaults, theme: "system", reduceMotion: systemReduceMotion });
  }, []);
  return null;
}
