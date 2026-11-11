export type ThemePreference = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "qc-theme";
export const THEME_EVENT = "qc-theme-change";

/**
 * Runs before first paint (inlined in <head>) so there is no flash of the wrong theme.
 * Keep it dependency-free and wrapped in try/catch: storage can throw in private modes.
 */
export const themeInitScript = `(function(){try{var p=localStorage.getItem("${THEME_STORAGE_KEY}");var dark=p==="dark"||(p!=="light"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",dark);}catch(e){}})();`;

export function readThemePreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function applyTheme(preference: ThemePreference) {
  const dark =
    preference === "dark" ||
    (preference === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", dark);
}

export function saveThemePreference(preference: ThemePreference) {
  try {
    if (preference === "system") window.localStorage.removeItem(THEME_STORAGE_KEY);
    else window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    /* storage unavailable: the choice just won't persist */
  }
  applyTheme(preference);
  window.dispatchEvent(new Event(THEME_EVENT));
}

export const NEXT_THEME: Record<ThemePreference, ThemePreference> = {
  system: "light",
  light: "dark",
  dark: "system",
};
