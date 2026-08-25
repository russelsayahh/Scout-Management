"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * Tracks a media query as an external store. Returns `false` during SSR and the
 * hydration render, then the real value.
 */
export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );

  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** True when the viewer has asked the OS for a dark interface. */
export function usePrefersDark(): boolean {
  return useMediaQuery("(prefers-color-scheme: dark)");
}
