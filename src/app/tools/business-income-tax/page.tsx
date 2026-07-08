import Link from "next/link";
import { getLatestTaxParameters } from "@/lib/content/tax-parameters";
import { BusinessIncomeTaxCalculator } from "@/components/tools/BusinessIncomeTaxCalculator";
import type { BusinessIncomeTaxParams } from "@/lib/calculators/business-income-tax";

export const metadata = { title: "營所稅試算器 | 會計學習網站" };

export default function BusinessIncomeTaxPage() {
  const taxParams = getLatestTaxParameters() as { businessIncomeTax: BusinessIncomeTaxParams };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/tools">實務工具</Link>
      </p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">營所稅試算器</h1>
      <BusinessIncomeTaxCalculator params={taxParams.businessIncomeTax} />
    </main>
  );
}
