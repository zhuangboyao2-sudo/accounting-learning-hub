"use client";

import dynamic from "next/dynamic";
import type { Question, Subject } from "@/types/content";

// 練習題順序在元件掛載時隨機洗牌（Math.random），若走一般 SSR 會導致伺服器端與
// client hydration 兩次洗牌結果不同而出現 hydration mismatch，因此強制只在瀏覽器端渲染。
const PracticeSession = dynamic(
  () => import("./PracticeSession").then((m) => m.PracticeSession),
  {
    ssr: false,
    loading: () => <p className="text-zinc-500 dark:text-zinc-400">載入題目中…</p>,
  },
);

export function PracticeSessionClientOnly(props: { subject: Subject; questions: Question[] }) {
  return <PracticeSession {...props} />;
}
