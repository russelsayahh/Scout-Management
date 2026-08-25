"use client";

import { useEffect, type RefObject } from "react";

/**
 * Calls `handler` when a pointer press lands outside `ref`, or when Escape is
 * pressed. Used by every popover-style menu in the shell.
 */
export function useOutsideClick<T extends HTMLElement>(
  ref: RefObject<T | null>,
  handler: () => void,
  enabled = true,
) {
  useEffect(() => {
    if (!enabled) return;

    const onPointerDown = (event: PointerEvent) => {
      const node = ref.current;
      if (node && !node.contains(event.target as Node)) handler();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") handler();
    };

    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [ref, handler, enabled]);
}
