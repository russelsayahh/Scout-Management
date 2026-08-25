"use client";

import { cloneElement, useCallback, useRef, useState } from "react";

import { useOutsideClick } from "@/hooks/use-outside-click";
import { cn } from "@/lib/utils";

type TriggerProps = {
  onClick?: React.MouseEventHandler<HTMLElement>;
  "aria-expanded"?: boolean;
  "aria-haspopup"?: boolean | "menu" | "dialog" | "listbox";
};

export interface PopoverProps {
  /** The trigger element - it is cloned with the open/close wiring. */
  children: React.ReactElement<TriggerProps>;
  content: React.ReactNode | ((ctx: { close: () => void }) => React.ReactNode);
  align?: "start" | "end";
  panelClassName?: string;
  /** ARIA role for the panel. */
  role?: "menu" | "dialog";
}

/**
 * Small anchored popover: closes on outside press and on Escape. Deliberately
 * dependency-free - it covers the three menus in the shell without pulling in a
 * full primitives library.
 */
export function Popover({
  children,
  content,
  align = "end",
  panelClassName,
  role = "menu",
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(containerRef, close, open);

  const trigger = cloneElement(children, {
    onClick: (event: React.MouseEvent<HTMLElement>) => {
      children.props.onClick?.(event);
      setOpen((previous) => !previous);
    },
    "aria-expanded": open,
    "aria-haspopup": role === "menu" ? "menu" : "dialog",
  });

  return (
    <div className="relative" ref={containerRef}>
      {trigger}

      {open && (
        <div
          role={role}
          className={cn(
            "popover-panel absolute top-full z-50 mt-2 overflow-hidden rounded-xl border border-line bg-surface shadow-lg shadow-black/5 dark:shadow-black/40",
            align === "end" ? "right-0" : "left-0",
            panelClassName,
          )}
        >
          {typeof content === "function" ? content({ close }) : content}
        </div>
      )}
    </div>
  );
}
