import { THEME_STORAGE_KEY } from "@/components/theme/theme-provider";

/**
 * Applies the stored theme before first paint so the page never flashes the
 * wrong palette. Runs synchronously in <head>, ahead of hydration.
 */
export function ThemeScript() {
  const script = `(function(){try{var s=localStorage.getItem(${JSON.stringify(
    THEME_STORAGE_KEY,
  )});var d=s==="dark"||((!s||s==="system")&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",d);}catch(e){}})();`;

  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
