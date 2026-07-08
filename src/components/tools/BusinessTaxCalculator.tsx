"use client";

import { useState } from "react";
import { calculateBusinessTax } from "@/lib/calculators/business-tax";

export function BusinessTaxCalculator({ rate }: { rate: number }) {
  const [salesAmount, setSalesAmount] = useState("");
  const [purchasesAmount, setPurchasesAmount] = useState("");

  const result = calculateBusinessTax(
    { salesAmount: Number(salesAmount) || 0, purchasesAmount: Number(purchasesAmount) || 0 },
    rate,
  );

  return (
    <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm">
          銷售額（未稅，對應 401 申報書「銷售額合計」）
          <input
            type="number"
            min={0}
            value={salesAmount}
            onChange={(e) => setSalesAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </label>
        <label className="text-sm">
          可扣抵進項金額（未稅，對應 401 申報書「進項金額合計」）
          <input
            type="number"
            min={0}
            value={purchasesAmount}
            onChange={(e) => setPurchasesAmount(e.target.value)}
            className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
          />
        </label>
      </div>

      <table className="mt-6 w-full border-collapse text-sm">
        <tbody>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">銷項稅額</td>
            <td className="py-2 text-right">{result.outputTax.toLocaleString("zh-Hant-TW")}</td>
          </tr>
          <tr className="border-b border-zinc-100 dark:border-zinc-800">
            <td className="py-2 pr-4 text-zinc-500 dark:text-zinc-400">進項稅額</td>
            <td className="py-2 text-right">{result.inputTax.toLocaleString("zh-Hant-TW")}</td>
          </tr>
          <tr>
            <td className="py-2 pr-4 font-medium">
              {result.isRefundable ? "本期溢付稅額" : "本期應納稅額"}
            </td>
            <td className="py-2 text-right font-medium">
              {Math.abs(result.netTax).toLocaleString("zh-Hant-TW")}
            </td>
          </tr>
        </tbody>
      </table>

      <p className="mt-4 text-xs text-zinc-400">
        銷項稅額對應 401 申報書「銷項稅額」欄、進項稅額對應「進項稅額」欄；應納或溢付稅額為兩者差額，實際申報請以國稅局收件為準。
      </p>
    </div>
  );
}
