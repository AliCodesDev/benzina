"use client";

import { useEffect } from "react";
import { usePreferencesStore } from "@/stores/use-preferences-store";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = usePreferencesStore((s) => s.theme);

  useEffect(() => {
    const root = document.documentElement;

    function apply(dark: boolean) {
      root.classList.toggle("dark", dark);
    }

    if (theme === "dark") {
      apply(true);
      return;
    }

    if (theme === "light") {
      apply(false);
      return;
    }

    // system
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    apply(mq.matches);

    function onChange(e: MediaQueryListEvent) {
      apply(e.matches);
    }
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme]);

  return <>{children}</>;
}
