"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { findResumeIndex, type SimLevel } from "@/lib/sim/levels";
import {
  computeIncomeStatementTotals,
  computeNetIncome,
  computeVatForPeriod,
  computeWithholdingTotal,
  sumLedgerByAccount,
} from "@/lib/sim/ledger";
import { calculateBusinessIncomeTax } from "@/lib/calculators/business-income-tax";
import { SimTransactionLevel } from "@/components/sim/SimTransactionLevel";
import { SimCalculationCheckpoint } from "@/components/sim/SimCalculationCheckpoint";
import type { ChartOfAccountsEntry } from "@/lib/content/chart-of-accounts";
import type { SimScenario } from "@/types/content";

export function SimPlayer({
  scenario,
  levels,
  accounts,
  incomeTaxParams,
}: {
  scenario: SimScenario;
  levels: SimLevel[];
  accounts: ChartOfAccountsEntry[];
  incomeTaxParams: {
    rate: number;
    smallProfitExemptionThreshold: number;
    halfTaxBufferThreshold: number;
    halfTaxMultiplier: number;
  };
}) {
  const [currentIndex, setCurrentIndex] = useState<number | null>(null);

  useEffect(() => {
    storage.listSimProgress(scenario.id).then((records) => {
      const doneIndices = new Set(
        records.filter((r) => r.status === "done").map((r) => r.month),
      );
      setCurrentIndex(findResumeIndex(levels.length, doneIndices));
    });
  }, [scenario.id, levels.length]);

  if (currentIndex === null) {
    return <p className="text-zinc-500 dark:text-zinc-400">載入中…</p>;
  }

  if (currentIndex >= levels.length) {
    return (
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-medium">🎉 全年帳務模擬完成！</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          你已完整走過 {scenario.companyName} 一整年的帳務循環：每月分錄、雙月營業稅申報、
          扣繳申報、年底結帳到隔年營所稅結算，恭喜完成整合關卡。
        </p>
      </div>
    );
  }

  const level = levels[currentIndex];
  const onComplete = () => setCurrentIndex((i) => (i ?? 0) + 1);
  const progressLabel = `第 ${currentIndex + 1} / ${levels.length} 關`;

  if (level.type === "opening") {
    return (
      <div>
        <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">{progressLabel}</p>
        <SimTransactionLevel
          key={currentIndex}
          scenarioId={scenario.id}
          levelIndex={currentIndex}
          narrative="期初：公司設立分錄"
          transactions={[scenario.openingEntry]}
          accounts={accounts}
          onComplete={onComplete}
        />
      </div>
    );
  }

  if (level.type === "month") {
    const month = scenario.months.find((m) => m.month === level.month);
    if (!month) return <p className="text-red-600">找不到第 {level.month} 月的劇本資料。</p>;
    return (
      <div>
        <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">{progressLabel}</p>
        <SimTransactionLevel
          key={currentIndex}
          scenarioId={scenario.id}
          levelIndex={currentIndex}
          narrative={month.narrative}
          transactions={month.transactions}
          accounts={accounts}
          onComplete={onComplete}
        />
      </div>
    );
  }

  if (level.type === "vat") {
    const periodTx = scenario.months
      .filter((m) => m.month >= level.fromMonth && m.month <= level.toMonth)
      .flatMap((m) => m.transactions);
    const { netTax } = computeVatForPeriod(periodTx);
    return (
      <div>
        <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">{progressLabel}</p>
        <SimCalculationCheckpoint
          key={currentIndex}
          scenarioId={scenario.id}
          levelIndex={currentIndex}
          title={`營業稅申報（${level.fromMonth}-${level.toMonth} 月）`}
          prompt="依這兩個月的銷項稅額與進項稅額，計算本期應納營業稅額（若為溢付留抵，請填負數）。"
          fields={[{ key: "netTax", label: "應納（或溢付）營業稅額", expected: netTax }]}
          explanation="應納稅額 = 銷項稅額合計 − 進項稅額合計；若為負數表示本期溢付，可留抵下期或申請退還。"
          onComplete={onComplete}
        />
      </div>
    );
  }

  const allTransactions = [scenario.openingEntry, ...scenario.months.flatMap((m) => m.transactions)];

  if (level.type === "withholding") {
    const total = computeWithholdingTotal(allTransactions);
    return (
      <div>
        <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">{progressLabel}</p>
        <SimCalculationCheckpoint
          key={currentIndex}
          scenarioId={scenario.id}
          levelIndex={currentIndex}
          title="扣繳申報（次年 1 月）"
          prompt="彙總全年各類所得代扣稅款，計算次年 1 月應申報之扣繳總額。"
          fields={[{ key: "total", label: "全年代扣稅款總額", expected: total }]}
          explanation="扣繳義務人應於次年 1 月底前申報全年代扣稅款總額，2 月 10 日前填發扣繳憑單予納稅義務人。"
          onComplete={onComplete}
        />
      </div>
    );
  }

  const ledger = sumLedgerByAccount(allTransactions);
  const netIncome = computeNetIncome(ledger, accounts);

  if (level.type === "closing") {
    const openingRE = ledger.get("保留盈餘");
    const closingRE = (openingRE ? openingRE.credit - openingRE.debit : 0) + netIncome;
    return (
      <div>
        <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">{progressLabel}</p>
        <SimCalculationCheckpoint
          key={currentIndex}
          scenarioId={scenario.id}
          levelIndex={currentIndex}
          title="年底結帳"
          prompt="依全年收入與費用類科目，計算本期淨利，並算出期末保留盈餘。"
          fields={[
            { key: "netIncome", label: "本期淨利", expected: netIncome },
            { key: "closingRE", label: "期末保留盈餘", expected: closingRE },
          ]}
          explanation="本期淨利 = 收入類科目淨額（貸−借）− 費用類科目淨額（借−貸）；期末保留盈餘 = 期初保留盈餘 + 本期淨利（本劇本無股利分配）。"
          onComplete={onComplete}
        />
      </div>
    );
  }

  // income-tax
  const { revenue, expense } = computeIncomeStatementTotals(ledger, accounts);
  const tax = calculateBusinessIncomeTax({ revenue, costsAndExpenses: expense }, incomeTaxParams);
  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">{progressLabel}</p>
      <SimCalculationCheckpoint
        key={currentIndex}
        scenarioId={scenario.id}
        levelIndex={currentIndex}
        title="營所稅結算申報（次年 5 月）"
        prompt="依全年課稅所得額，依現行營所稅級距公式計算應納稅額。"
        fields={[
          { key: "taxableIncome", label: "課稅所得額", expected: tax.taxableIncome },
          { key: "tax", label: "應納稅額", expected: tax.tax },
        ]}
        explanation="本模擬以會計上之本期淨利視為課稅所得額（簡化，不含稅務調整項目）；級距門檻與稅率請見營所稅試算器說明。"
        onComplete={onComplete}
      />
    </div>
  );
}
