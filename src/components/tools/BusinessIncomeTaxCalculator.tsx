"use client";

import { useState } from "react";
import {
  calculateBusinessIncomeTax,
  type BusinessIncomeTaxParams,
} from "@/lib/calculators/business-income-tax";

const BRACKET_LABEL: Record<string, string> = {
  exempt: "免稅（課稅所得額未達門檻）",
  "half-tax-buffer": "半數限制級距（應納稅額不得超過超過免稅門檻部分之半數）",
  "full-rate": "全額按稅率課徵",
};

export function BusinessIncomeTaxCalculator({ params }: { params: BusinessIncomeTaxParams }) {
  const [revenue, setRevenue] = useState("");
  const [costsAndExpenses, setCostsAndExpenses] = useState("");

  const result = calculateBusinessIncomeTax(
    { revenue: Number(revenue) || 0, costsAndExpenses: Number(costsAndExpenses) || 0 },
    params,
  );

  return (
    <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          全年營業收入
          <input
            type="number"
            min={0}
            value={revenue}
            onChange={(e) => setRevenue(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </label>
        <label className="text-sm">
          全年成本費用
          <input
            type="number"
            min={0}
            value={costsAndExpenses}
            onChange={(e) => setCostsAndExpenses(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </label>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <tbody>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">課稅所得額</td>
            <td className="py-2 text-right">{result.taxableIncome.toLocaleString("zh-Hant-TW")}</td>
          </tr>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">適用級距</td>
            <td className="py-2 text-right">{BRACKET_LABEL[result.bracket]}</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 font-medium">應納稅額</td>
            <td className="py-2 text-right font-medium">{result.tax.toLocaleString("zh-Hant-TW")}</td>
          </tr>
        </tbody>
      </table>

      <p className="mt-4 text-xs text-zinc-400">
        本試算僅供概估，實際結算申報應依全年損益表與稅務調整項目計算；「擴大書審」為國稅局提供的簡化申報方式，
        適用對象與淨利率標準每年由財政部公告，實際是否適用與門檻請以當年度公告為準。
      </p>
    </div>
  );
}
