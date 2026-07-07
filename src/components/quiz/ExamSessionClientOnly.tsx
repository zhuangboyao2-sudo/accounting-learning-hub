"use client";

import dynamic from "next/dynamic";
import type { Question, Subject } from "@/types/content";

// 模擬考交卷後的逐題檢討與作答狀態皆為 client 端行為，且抽題已在伺服器端完成，
// 但仍統一走 ssr:false（比照 PracticeSessionClientOnly）避免計時器等瀏覽器專屬邏輯在 SSR 階段執行。
const ExamSession = dynamic(() => import("./ExamSession").then((m) => m.ExamSession), {
  ssr: false,
  loading: () => <p className="text-zinc-500 dark:text-zinc-400">載入題目中…</p>,
});

export function ExamSessionClientOnly(props: { subject: Subject; questions: Question[] }) {
  return <ExamSession {...props} />;
}
