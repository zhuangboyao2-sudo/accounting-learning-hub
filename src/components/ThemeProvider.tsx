"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { storage } from "@/lib/storage";

type ThemePreference = "system" | "light" | "dark";

const ThemeContext = createContext<{
  theme: ThemePreference;
  setTheme: (theme: ThemePreference) => void;
}>({ theme: "system", setTheme: () => {} });

function applyTheme(pref: ThemePreference) {
  const isDark =
    pref === "dark" ||
    (pref === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", isDark);
}

/** 依使用者設定（或系統偏好）對 <html> 加上/移除 .dark class；比照 FontSizeProvider 的 storage 讀寫模式。 */
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemePreference>("system");
  const themeRef = useRef<ThemePreference>("system");

  useEffect(() => {
    storage.getSetting<ThemePreference>("theme").then((saved) => {
      const initial = saved ?? "system";
      themeRef.current = initial;
      setThemeState(initial);
      applyTheme(initial);
    });

    const mql = window.matchMedia("(prefers-color-scheme: dark)");
    function handleSystemChange() {
      if (themeRef.current === "system") applyTheme("system");
    }
    mql.addEventListener("change", handleSystemChange);
    return () => mql.removeEventListener("change", handleSystemChange);
  }, []);

  function setTheme(next: ThemePreference) {
    themeRef.current = next;
    setThemeState(next);
    applyTheme(next);
    void storage.setSetting("theme", next);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

const LABELS: Record<ThemePreference, string> = { system: "系統", light: "淺色", dark: "深色" };

export function ThemeToggle() {
  const { theme, setTheme } = useContext(ThemeContext);
  return (
    <div className="flex items-center gap-1 text-xs">
      {(Object.keys(LABELS) as ThemePreference[]).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setTheme(opt)}
          aria-pressed={theme === opt}
          className={`rounded px-2 py-1 ${
            theme === opt
              ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
              : "bg-zinc-100 dark:bg-zinc-800"
          }`}
        >
          {LABELS[opt]}
        </button>
      ))}
    </div>
  );
}
