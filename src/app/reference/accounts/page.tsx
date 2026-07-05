import { getChartOfAccounts } from "@/lib/content/chart-of-accounts";

export const metadata = { title: "常用會計科目表 | 會計學習網站" };

const CATEGORIES = ["資產", "負債", "權益", "收入", "費用"] as const;

export default function ChartOfAccountsPage() {
  const accounts = getChartOfAccounts();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">常用會計科目表</h1>
      <div className="space-y-8">
        {CATEGORIES.map((category) => {
          const items = accounts.filter((a) => a.category === category);
          if (items.length === 0) return null;
          return (
            <section key={category}>
              <h2 className="mb-2 text-lg font-medium">{category}</h2>
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
                    <th className="py-2 pr-4">科目</th>
                    <th className="py-2 pr-4">正常餘額方向</th>
                    <th className="py-2">說明</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.name} className="border-b border-zinc-100 dark:border-zinc-800">
                      <td className="py-2 pr-4 font-medium">{item.name}</td>
                      <td className="py-2 pr-4">{item.normalBalance === "debit" ? "借方" : "貸方"}</td>
                      <td className="py-2 text-zinc-600 dark:text-zinc-400">{item.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
          );
        })}
      </div>
    </main>
  );
}
