"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { storage } from "@/lib/storage";

type FontSize = "sm" | "base" | "lg";

const SIZE_CLASS: Record<FontSize, string> = {
  sm: "prose-sm",
  base: "prose-base",
  lg: "prose-lg",
};

const FontSizeContext = createContext<{
  size: FontSize;
  setSize: (size: FontSize) => void;
}>({ size: "base", setSize: () => {} });

/** 提供字級 context；本身不渲染排版樣式，包住整個閱讀區塊（含控制列與內文） */
export function FontSizeProvider({ children }: { children: React.ReactNode }) {
  const [size, setSizeState] = useState<FontSize>("base");

  useEffect(() => {
    storage.getSetting<FontSize>("fontSize").then((saved) => {
      if (saved) setSizeState(saved);
    });
  }, []);

  function setSize(next: FontSize) {
    setSizeState(next);
    void storage.setSetting("fontSize", next);
  }

  return (
    <FontSizeContext.Provider value={{ size, setSize }}>{children}</FontSizeContext.Provider>
  );
}

/** 依目前字級套用 Tailwind Typography 樣式，只包住教材內文本身 */
export function ArticleBody({ children }: { children: React.ReactNode }) {
  const { size } = useContext(FontSizeContext);
  return (
    <div className={`prose dark:prose-invert max-w-none ${SIZE_CLASS[size]}`}>{children}</div>
  );
}

const LABELS: Record<FontSize, string> = { sm: "小", base: "中", lg: "大" };

export function FontSizeControl() {
  const { size, setSize } = useContext(FontSizeContext);
  return (
    <div className="flex items-center gap-1 text-sm">
      <span className="text-zinc-500 dark:text-zinc-400">字級</span>
      {(Object.keys(LABELS) as FontSize[]).map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => setSize(opt)}
          aria-pressed={size === opt}
          className={`rounded px-2 py-1 ${
            size === opt
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
