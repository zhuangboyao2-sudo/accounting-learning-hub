import Link from "next/link";
import { getSimScenario } from "@/lib/content/sim-scenarios";

export const metadata = { title: "全年帳務模擬 | 會計學習網站" };

const SCENARIO_IDS = ["metal-factory-2026"];

export default function SimulationIndexPage() {
  const scenarios = SCENARIO_IDS.map((id) => getSimScenario(id)).filter((s) => s !== null);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">全年帳務模擬</h1>
      <p className="mb-6 text-sm text-zinc-600 dark:text-zinc-400">
        以會計人員身分逐月闖關，走完一家虛擬公司的全年帳務：日常分錄、雙月營業稅申報、扣繳申報、年底結帳到隔年營所稅結算。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        {scenarios.map((scenario) => (
          <Link
            key={scenario.id}
            href={`/simulation/${scenario.id}`}
            className="rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
          >
            <h2 className="font-medium">{scenario.companyName}</h2>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">{scenario.industry}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
