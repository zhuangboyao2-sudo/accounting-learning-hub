import Link from "next/link";

export const metadata = { title: "速查工具 | 會計學習網站" };

const PAGES = [
  { href: "/reference/accounts", title: "常用會計科目表", description: "科目性質與借貸方向速查" },
  { href: "/reference/glossary", title: "稅務／會計名詞辭典", description: "全部名詞條目一覽" },
  { href: "/reference/deadlines", title: "申報期限總表", description: "各稅目申報期限與週期" },
];

export default function ReferenceIndexPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">速查工具</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {PAGES.map((page) => (
          <Link
            key={page.href}
            href={page.href}
            className="rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <h2 className="font-medium">{page.title}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{page.description}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
