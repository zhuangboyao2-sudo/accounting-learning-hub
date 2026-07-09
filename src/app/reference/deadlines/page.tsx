import { getLatestTaxParameters } from "@/lib/content/tax-parameters";
import { DeadlinesCalendarExport } from "@/components/reference/DeadlinesCalendarExport";

export const metadata = { title: "申報期限總表 | 會計學習網站" };

export default function DeadlinesPage() {
  const params = getLatestTaxParameters() as {
    year: number;
    verified_at: string;
    filingDeadlines: Record<string, string>;
    businessTax: { generalRate: number; filingDeadlineRule: string };
  };

  const rows = [
    { label: "綜合所得稅結算申報", value: params.filingDeadlines.individualIncomeTaxSettlement },
    { label: "營利事業所得稅結算申報", value: params.filingDeadlines.businessIncomeTaxSettlement },
    { label: "營業稅（401 申報書）", value: params.filingDeadlines.businessTax401 },
    { label: "各類所得扣繳憑單", value: params.filingDeadlines.withholdingStatement },
  ];

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">申報期限總表</h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            適用年度：民國 {params.year} 年度（查證日期 {params.verified_at}）
          </p>
        </div>
        <DeadlinesCalendarExport />
      </div>
      <table className="mt-6 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-zinc-300 text-left dark:border-zinc-700">
            <th className="py-2 pr-4">稅目</th>
            <th className="py-2">申報期限</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label} className="border-b border-zinc-100 dark:border-zinc-800">
              <td className="py-2 pr-4 font-medium">{row.label}</td>
              <td className="py-2 text-zinc-600 dark:text-zinc-400">{row.value}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-4 text-xs text-zinc-400">
        每年 1 月依計畫 §8.1 複驗一次；實際期限請以財政部或國稅局當年度公告為準。
        「加入行事曆」下載的 .ics 檔含當年度稅務申報期限與每日複習提醒（每天 20:00），可匯入手機或電腦行事曆 App。
      </p>
    </main>
  );
}
