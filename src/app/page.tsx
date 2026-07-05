import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
      <h1 className="text-3xl font-semibold">會計學習網站</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        台灣會計／稅務自學平台：教材、題庫、複習卡與實務工具。
      </p>
      <div className="flex gap-3">
        <Link
          href="/materials"
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          開始學習
        </Link>
        <Link
          href="/reference"
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          速查工具
        </Link>
      </div>
    </main>
  );
}
