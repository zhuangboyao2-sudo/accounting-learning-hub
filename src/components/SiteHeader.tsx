import Link from "next/link";
import { getSearchIndex } from "@/lib/content/search-index";
import { SearchBox } from "@/components/SearchBox";

export function SiteHeader() {
  const index = getSearchIndex();
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center gap-4 px-6 py-3">
        <Link href="/" className="font-semibold">
          會計學習網站
        </Link>
        <nav className="flex gap-4 text-sm">
          <Link href="/materials" className="hover:underline">
            教材
          </Link>
          <Link href="/quiz/practice" className="hover:underline">
            練習
          </Link>
          <Link href="/reference" className="hover:underline">
            速查工具
          </Link>
        </nav>
        <div className="ml-auto">
          <SearchBox index={index} />
        </div>
      </div>
    </header>
  );
}
