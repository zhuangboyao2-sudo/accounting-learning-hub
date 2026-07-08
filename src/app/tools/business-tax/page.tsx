import Link from "next/link";
import { getLatestTaxParameters } from "@/lib/content/tax-parameters";
import { BusinessTaxCalculator } from "@/components/tools/BusinessTaxCalculator";

export const metadata = { title: "營業稅試算器 | 會計學習網站" };

export default function BusinessTaxPage() {
  const params = getLatestTaxParameters() as { businessTax: { generalRate: number } };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/tools">實務工具</Link>
      </p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">營業稅試算器</h1>
      <BusinessTaxCalculator rate={params.businessTax.generalRate} />
    </main>
  );
}
