"use client";

import dynamic from "next/dynamic";
import type { ReviewCard } from "@/lib/srs/queue";

// 卡片順序在元件掛載時隨機洗牌，比照 PracticeSessionClientOnly 的作法，
// 強制只在瀏覽器端渲染以避免 SSR／client 洗牌結果不同造成 hydration mismatch。
const FlashcardReview = dynamic(
  () => import("./FlashcardReview").then((m) => m.FlashcardReview),
  {
    ssr: false,
    loading: () => <p className="text-zinc-500 dark:text-zinc-400">載入卡片中…</p>,
  },
);

export function FlashcardReviewClientOnly(props: { cards: ReviewCard[]; onComplete?: () => void }) {
  return <FlashcardReview {...props} />;
}
