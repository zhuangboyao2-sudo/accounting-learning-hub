import Link from "next/link";

export const metadata = { title: "實務工具 | 會計學習網站" };

const PAGES = [
  { href: "/tools/journal-entries", title: "分錄練習器", description: "傳產常見交易情境，練習借貸分錄與批改" },
  { href: "/tools/business-tax", title: "營業稅試算器", description: "輸入銷項／進項，試算應納或溢付營業稅額" },
  { href: "/tools/business-income-tax", title: "營所稅試算器", description: "輸入全年收入／成本費用，試算營利事業所得稅" },
];

const TEMPLATES = [
  { href: "/templates/vat-filing-checklist.csv", title: "營業稅申報前檢核表" },
  { href: "/templates/withholding-calculation.csv", title: "各類所得扣繳計算表" },
  { href: "/templates/inventory-tracker.csv", title: "簡易進銷存表" },
  { href: "/templates/monthly-closing-checklist.csv", title: "月結對帳 checklist" },
];

export default function ToolsIndexPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">實務工具</h1>
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

      <h2 className="mt-10 mb-4 text-lg font-medium">實務範本下載</h2>
      <ul className="space-y-2 text-sm">
        {TEMPLATES.map((template) => (
          <li key={template.href}>
            <a href={template.href} download className="hover:underline">
              {template.title}（CSV）
            </a>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-xs text-zinc-400">
        範本為 CSV 格式，可直接以 Excel、Numbers 或 Google 試算表開啟編輯；含稅務數字之範本每年 1 月隨年度稅務參數複驗。
      </p>
    </main>
  );
}
