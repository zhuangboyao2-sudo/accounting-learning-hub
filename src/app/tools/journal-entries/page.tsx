import Link from "next/link";
import { getAllJournalEntryScenarios } from "@/lib/content/journal-entries";
import { getChartOfAccounts } from "@/lib/content/chart-of-accounts";
import { JournalEntryPracticeClientOnly } from "@/components/tools/JournalEntryPracticeClientOnly";

export const metadata = { title: "分錄練習器 | 會計學習網站" };

export default function JournalEntriesPage() {
  const scenarios = getAllJournalEntryScenarios();
  const accounts = getChartOfAccounts();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/tools">實務工具</Link>
      </p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">分錄練習器</h1>

      {scenarios.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">尚無練習情境。</p>
      ) : (
        <JournalEntryPracticeClientOnly scenarios={scenarios} accounts={accounts} />
      )}
    </main>
  );
}
