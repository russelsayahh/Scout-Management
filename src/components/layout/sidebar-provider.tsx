"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { useStoredValue } from "@/hooks/use-stored-value";

const COLLAPSE_STORAGE_KEY = "trailhead-sidebar-collapsed";

interface SidebarContextValue {
  /** Desktop rail collapsed to icons only. */
  collapsed: boolean;
  toggleCollapsed: () => void;
  /** Mobile/tablet drawer visibility. */
  mobileOpen: boolean;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextValue | null>(null);

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [stored, setStored] = useStoredValue<"true" | "false">(COLLAPSE_STORAGE_KEY, "false");
  const collapsed = stored === "true";

  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const [lastPathname, setLastPathname] = useState(pathname);

  // Reset during render rather than in an effect: a navigation always dismisses
  // the drawer, including ones that do not go through a nav item.
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    if (mobileOpen) setMobileOpen(false);
  }

  // Lock body scroll behind the drawer.
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [mobileOpen]);

  const toggleCollapsed = useCallback(() => {
    setStored(collapsed ? "false" : "true");
  }, [collapsed, setStored]);

  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  const value = useMemo(
    () => ({ collapsed, toggleCollapsed, mobileOpen, openMobile, closeMobile }),
    [collapsed, toggleCollapsed, mobileOpen, openMobile, closeMobile],
  );

  return <SidebarContext.Provider value={value}>{children}</SidebarContext.Provider>;
}

export function useSidebar(): SidebarContextValue {
  const context = useContext(SidebarContext);
  if (!context) throw new Error("useSidebar must be used inside <SidebarProvider>");
  return context;
}
