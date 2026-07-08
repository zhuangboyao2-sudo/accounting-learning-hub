import Link from "next/link";
import { notFound } from "next/navigation";
import { getSimScenario } from "@/lib/content/sim-scenarios";
import { getChartOfAccounts } from "@/lib/content/chart-of-accounts";
import { getLatestTaxParameters } from "@/lib/content/tax-parameters";
import { buildLevelSequence } from "@/lib/sim/levels";
import { SimPlayer } from "@/components/sim/SimPlayer";
import type { BusinessIncomeTaxParams } from "@/lib/calculators/business-income-tax";

export default async function SimulationScenarioPage({
  params,
}: {
  params: Promise<{ scenarioId: string }>;
}) {
  const { scenarioId } = await params;
  const scenario = getSimScenario(scenarioId);
  if (!scenario) notFound();

  const accounts = getChartOfAccounts();
  const levels = buildLevelSequence(scenario);
  const taxParams = getLatestTaxParameters() as { businessIncomeTax: BusinessIncomeTaxParams };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/simulation">全年帳務模擬</Link>
      </p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">{scenario.companyName}</h1>
      <SimPlayer
        scenario={scenario}
        levels={levels}
        accounts={accounts}
        incomeTaxParams={taxParams.businessIncomeTax}
      />
    </main>
  );
}
