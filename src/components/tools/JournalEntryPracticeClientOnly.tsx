"use client";

import dynamic from "next/dynamic";
import type { ChartOfAccountsEntry } from "@/lib/content/chart-of-accounts";
import type { JournalEntryScenario } from "@/types/content";

// 練習題順序在元件掛載時隨機洗牌，比照 PracticeSessionClientOnly 的作法，
// 強制只在瀏覽器端渲染以避免 SSR／client 洗牌結果不同造成 hydration mismatch。
const JournalEntryPractice = dynamic(
  () => import("./JournalEntryPractice").then((m) => m.JournalEntryPractice),
  {
    ssr: false,
    loading: () => <p className="text-zinc-500 dark:text-zinc-400">載入題目中…</p>,
  },
);

export function JournalEntryPracticeClientOnly(props: {
  scenarios: JournalEntryScenario[];
  accounts: ChartOfAccountsEntry[];
}) {
  return <JournalEntryPractice {...props} />;
}
