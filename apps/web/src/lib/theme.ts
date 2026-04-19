import { THEMES, type ThemeKey, isThemeKey } from "@luminary/shared";

const COLOR_KEY = "luminary_theme";
const FONT_KEY = "luminary-font-size";

export function getStoredColorTheme(): ThemeKey {
  try {
    const v = localStorage.getItem(COLOR_KEY);
    if (v && isThemeKey(v)) return v;
  } catch {
    /* ignore */
  }
  return "purple";
}

export function applyColorTheme(themeKey: ThemeKey) {
  const t = THEMES[themeKey];
  const root = document.documentElement;
  root.style.setProperty("--accent", t.accent);
  root.style.setProperty("--accent-hover", t.accentHover);
  root.style.setProperty("--accent-subtle", t.accentSubtle);
  root.style.setProperty("--accent-border", t.accentBorder);
  root.style.setProperty("--today-bg", t.todayBg);
  root.style.setProperty("--today-text", t.todayText);
  root.style.setProperty("--heatmap-0", t.heatmap0);
  root.style.setProperty("--heatmap-1", t.heatmap1);
  root.style.setProperty("--heatmap-2", t.heatmap2);
  root.style.setProperty("--heatmap-3", t.heatmap3);
  try {
    localStorage.setItem(COLOR_KEY, themeKey);
  } catch {
    /* ignore */
  }
}

export function getStoredFontSize(): "small" | "medium" | "large" {
  const v = localStorage.getItem(FONT_KEY);
  if (v === "small" || v === "medium" || v === "large") return v;
  return "medium";
}

export function applyFontSize(size: "small" | "medium" | "large") {
  document.documentElement.setAttribute("data-font-size", size);
  try {
    localStorage.setItem(FONT_KEY, size);
  } catch {
    /* ignore */
  }
}

export function initTheme() {
  applyFontSize(getStoredFontSize());
  applyColorTheme(getStoredColorTheme());
}
