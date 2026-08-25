"use client";

import { Menu } from "lucide-react";

import { NotificationsMenu } from "@/components/layout/notifications-menu";
import { useSidebar } from "@/components/layout/sidebar-provider";
import { TopbarSearch } from "@/components/layout/topbar-search";
import { UserMenu } from "@/components/layout/user-menu";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Button } from "@/components/ui/button";

export function Topbar() {
  const { openMobile } = useSidebar();

  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center gap-2 border-b border-line bg-surface/85 px-4 backdrop-blur-md sm:gap-3 sm:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden"
        onClick={openMobile}
        aria-label="Open navigation"
      >
        <Menu className="size-4.5" strokeWidth={1.75} aria-hidden />
      </Button>

      <div className="flex min-w-0 flex-1 items-center">
        <TopbarSearch />
      </div>

      <div className="flex shrink-0 items-center gap-0.5 sm:gap-1">
        <ThemeToggle />
        <NotificationsMenu />
        <span className="mx-1 hidden h-6 w-px bg-line sm:block" aria-hidden />
        <UserMenu />
      </div>
    </header>
  );
}
