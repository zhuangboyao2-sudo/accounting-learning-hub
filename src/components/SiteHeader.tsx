import Link from "next/link";
import { getSearchIndex } from "@/lib/content/search-index";
import { SearchBox } from "@/components/SearchBox";
import { ThemeToggle } from "@/components/ThemeProvider";

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
          <Link href="/review" className="hover:underline">
            複習卡
          </Link>
          <Link href="/quiz/wrong-answers" className="hover:underline">
            錯題本
          </Link>
          <Link href="/quiz/exam" className="hover:underline">
            模擬考
          </Link>
          <Link href="/reference" className="hover:underline">
            速查工具
          </Link>
          <Link href="/tools" className="hover:underline">
            實務工具
          </Link>
          <Link href="/settings" className="hover:underline">
            設定
          </Link>
        </nav>
        <div className="ml-auto flex items-center gap-3">
          <SearchBox index={index} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
