"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { buildDueQueue, type ReviewCard } from "@/lib/srs/queue";
import { FlashcardReviewClientOnly } from "@/components/srs/FlashcardReviewClientOnly";
import type { Flashcard } from "@/types/content";

export function ReviewQueue({ flashcards }: { flashcards: Flashcard[] }) {
  const [queue, setQueue] = useState<ReviewCard[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const now = new Date().toISOString();
    Promise.all([storage.listUserCards(), storage.listAllSrsCards()]).then(
      ([userCards, srsCards]) => {
        if (cancelled) return;
        const cardsWithId = userCards.filter(
          (card): card is typeof card & { id: number } => card.id !== undefined,
        );
        setQueue(buildDueQueue(flashcards, cardsWithId, srsCards, now));
      },
    );
    return () => {
      cancelled = true;
    };
  }, [flashcards]);

  if (queue === null) {
    return <p className="text-zinc-500 dark:text-zinc-400">載入中…</p>;
  }

  if (queue.length === 0) {
    return <p className="text-zinc-500 dark:text-zinc-400">今日沒有到期的複習卡，繼續保持。</p>;
  }

  return <FlashcardReviewClientOnly cards={queue} />;
}
