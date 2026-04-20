"use client";

import { useEffect } from "react";
import { useWorkflowStore } from "@/store/useWorkflowStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme, setTheme } = useWorkflowStore();

  useEffect(() => {
    const saved = localStorage.getItem("theme") as "light" | "dark" | null;
    if (saved && saved !== theme) {
      setTheme(saved);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const html = document.documentElement;
    if (theme === "dark") {
      html.classList.add("dark");
    } else {
      html.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  return <>{children}</>;
}
