"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { storage } from "@/lib/storage";
import { shuffle } from "@/lib/quiz/shuffle";
import { createNewCardState, gradeCard, Rating } from "@/lib/srs/scheduler";
import type { Grade } from "@/lib/srs/scheduler";
import type { ReviewCard } from "@/lib/srs/queue";

const RATE_BUTTONS: { grade: Grade; label: string; key: string }[] = [
  { grade: Rating.Again, label: "忘記", key: "1" },
  { grade: Rating.Hard, label: "困難", key: "2" },
  { grade: Rating.Good, label: "良好", key: "3" },
  { grade: Rating.Easy, label: "簡單", key: "4" },
];

const KEY_TO_GRADE: Record<string, Grade> = {
  "1": Rating.Again,
  "2": Rating.Hard,
  "3": Rating.Good,
  "4": Rating.Easy,
};

export function FlashcardReview({
  cards,
  onComplete,
}: {
  cards: ReviewCard[];
  onComplete?: () => void;
}) {
  const order = useMemo(() => shuffle(cards), [cards]);
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const completeFiredRef = useRef(false);

  const card = order[index];

  function rate(grade: Grade) {
    if (!flipped || !card) return;
    const now = new Date();
    storage.getSrsCard(card.cardId).then((existing) => {
      const current = existing ?? createNewCardState(card.cardId, now);
      const next = gradeCard(current, grade, now);
      void storage.setSrsCard(next);
    });
    setFlipped(false);
    setIndex((i) => i + 1);
  }

  useEffect(() => {
    if (!card) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === " ") {
        e.preventDefault();
        setFlipped((f) => !f);
        return;
      }
      if (!flipped) return;
      const grade = KEY_TO_GRADE[e.key];
      if (grade !== undefined) rate(grade);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [card, flipped]);

  useEffect(() => {
    if (index >= order.length && !completeFiredRef.current) {
      completeFiredRef.current = true;
      onComplete?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, order.length]);

  if (!card) {
    return (
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-medium">今日複習完成</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">共複習 {order.length} 張卡片。</p>
      </div>
    );
  }

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
        第 {index + 1} / {order.length} 張
      </p>
      <button
        type="button"
        onClick={() => setFlipped((f) => !f)}
        className="w-full rounded-lg border border-zinc-200 p-8 text-left dark:border-zinc-800"
      >
        <p className="whitespace-pre-wrap text-lg">{flipped ? card.back : card.front}</p>
        <p className="mt-4 text-xs text-zinc-400">{flipped ? "反面" : "正面（點擊或按空白鍵翻面）"}</p>
      </button>

      {flipped ? (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {RATE_BUTTONS.map((btn) => (
            <button
              key={btn.grade}
              type="button"
              onClick={() => rate(btn.grade)}
              className="rounded-md bg-zinc-100 px-3 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              {btn.label}（{btn.key}）
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
