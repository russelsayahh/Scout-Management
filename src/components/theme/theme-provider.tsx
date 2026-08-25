"use client";

import { createContext, useContext, useEffect, useMemo } from "react";

import { useHydrated } from "@/hooks/use-hydrated";
import { usePrefersDark } from "@/hooks/use-media-query";
import { useStoredValue } from "@/hooks/use-stored-value";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "trailhead-theme";

interface ThemeContextValue {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  setTheme: (theme: Theme) => void;
  /** False until hydration completes, when the real preference is knowable. */
  mounted: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

/**
 * Theme preference, read straight from `localStorage` and the OS setting rather
 * than mirrored into state. The only effect here writes the resolved theme back
 * out to the document, which is what effects are for.
 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useStoredValue<Theme>(THEME_STORAGE_KEY, "system");
  const prefersDark = usePrefersDark();
  const mounted = useHydrated();

  const resolvedTheme: ResolvedTheme =
    theme === "system" ? (prefersDark ? "dark" : "light") : theme;

  // Keep the document class in step. The inline head script has already set it
  // for the first paint, so this only matters once the preference changes.
  useEffect(() => {
    document.documentElement.classList.toggle("dark", resolvedTheme === "dark");
  }, [resolvedTheme]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme, mounted }),
    [theme, resolvedTheme, setTheme, mounted],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside <ThemeProvider>");
  return context;
}
