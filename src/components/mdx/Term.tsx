import Link from "next/link";
import { getGlossaryEntry } from "@/lib/content/glossary";

/** 教材內名詞懸停顯示定義、點擊跳辭典條目（計畫 §Phase1 名詞懸停辭典） */
export function Term({ id, children }: { id: string; children: React.ReactNode }) {
  const entry = getGlossaryEntry(id);
  if (!entry) return <>{children}</>;
  return (
    <span
      tabIndex={0}
      className="group relative inline-block cursor-help border-b border-dotted border-zinc-400 outline-none"
    >
      {children}
      <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-1 w-64 -translate-x-1/2 rounded-md border border-zinc-200 bg-white p-2 text-sm font-normal text-zinc-700 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300">
        {entry.definition}
        <Link
          href={`/reference/glossary#${entry.id}`}
          className="pointer-events-auto mt-1 block text-xs font-medium text-blue-600 dark:text-blue-400"
        >
          查看完整條目 →
        </Link>
      </span>
    </span>
  );
}
