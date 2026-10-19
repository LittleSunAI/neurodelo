"use client";

import { useEffect } from "react";
import type { AppearanceSettings } from "@/types/platform";

export function AccessibilitySync({ appearance }: { appearance: AppearanceSettings }) {
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = appearance.theme;
    root.dataset.textScale = appearance.textScale;
    root.dataset.reduceMotion = appearance.reduceMotion ? "true" : "false";
    root.dataset.highContrast = appearance.highContrast ? "true" : "false";
    root.lang = appearance.language;
    root.style.colorScheme = appearance.theme === "light" ? "light" : appearance.theme === "dark" ? "dark" : "light dark";
  }, [appearance]);
  return null;
}
