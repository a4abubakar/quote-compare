"use client";

import { useEffect, useSyncExternalStore } from "react";
import {
  applyTheme,
  NEXT_THEME,
  readThemePreference,
  saveThemePreference,
  THEME_EVENT,
  type ThemePreference,
} from "@/lib/theme";

function subscribe(onChange: () => void) {
  window.addEventListener(THEME_EVENT, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(THEME_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}

const LABELS: Record<ThemePreference, string> = {
  system: "System",
  light: "Light",
  dark: "Dark",
};

function Icon({ preference }: { preference: ThemePreference }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    "aria-hidden": true,
  };
  if (preference === "light")
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
      </svg>
    );
  if (preference === "dark")
    return (
      <svg {...common}>
        <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
      </svg>
    );
  return (
    <svg {...common}>
      <rect x="3" y="4" width="18" height="12" rx="2" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

/** Cycles system -> light -> dark. "System" follows the OS and re-applies when it changes. */
export function ThemeToggle() {
  const preference = useSyncExternalStore(subscribe, readThemePreference, () => "system" as const);

  useEffect(() => {
    if (preference !== "system") return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => applyTheme("system");
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, [preference]);

  const next = NEXT_THEME[preference];
  return (
    <button
      type="button"
      onClick={() => saveThemePreference(next)}
      className="inline-flex h-10 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium text-fg hover:bg-surface-2"
      aria-label={`Theme: ${LABELS[preference]}. Switch to ${LABELS[next].toLowerCase()}.`}
      data-testid="theme-toggle"
      data-theme-preference={preference}
    >
      <Icon preference={preference} />
      <span className="hidden sm:inline" aria-hidden="true">
        {LABELS[preference]}
      </span>
    </button>
  );
}
