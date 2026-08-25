"use client";

import { Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/theme/theme-provider";
import { Button } from "@/components/ui/button";

/**
 * Light/dark switch. Renders a stable placeholder until mounted, because the
 * resolved theme is only known on the client.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme, mounted } = useTheme();

  if (!mounted) {
    return <div className="size-9 shrink-0" aria-hidden />;
  }

  const nextTheme = resolvedTheme === "dark" ? "light" : "dark";
  const Icon = resolvedTheme === "dark" ? Sun : Moon;

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextTheme} theme`}
      title={`Switch to ${nextTheme} theme`}
    >
      <Icon className="size-4.5" strokeWidth={1.75} aria-hidden />
    </Button>
  );
}
