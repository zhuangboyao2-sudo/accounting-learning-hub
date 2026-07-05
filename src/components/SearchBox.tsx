"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { SearchItem } from "@/lib/content/search-index";

export function SearchBox({ index }: { index: SearchItem[] }) {
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.trim().toLowerCase();
    return index.filter((item) => item.title.toLowerCase().includes(q)).slice(0, 8);
  }, [query, index]);

  return (
    <div className="relative w-full max-w-xs">
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
        placeholder="搜尋教材、名詞……"
        className="w-full rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
      />
      {focused && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-full z-20 mt-1 max-h-80 overflow-y-auto rounded-md border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {results.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="flex items-center justify-between px-3 py-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800"
              >
                <span>{item.title}</span>
                <span className="text-xs text-zinc-400">{item.type}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
