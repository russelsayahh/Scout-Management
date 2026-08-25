"use client";

import { useCallback, useSyncExternalStore } from "react";

/**
 * `localStorage` treated as an external store, so preferences can be read
 * during render instead of synced into state from an effect.
 *
 * Writers notify every subscriber in this tab; the `storage` event covers the
 * other tabs.
 */
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

export function useStoredValue<T extends string>(
  key: string,
  fallback: T,
): [T, (value: T) => void] {
  const value = useSyncExternalStore(
    subscribe,
    () => {
      try {
        return (localStorage.getItem(key) as T | null) ?? fallback;
      } catch {
        return fallback;
      }
    },
    // The server has no preference; the value settles on the client.
    () => fallback,
  );

  const setValue = useCallback(
    (next: T) => {
      try {
        localStorage.setItem(key, next);
      } catch {
        /* storage unavailable - the choice simply will not persist */
      }
      emit();
    },
    [key],
  );

  return [value, setValue];
}
