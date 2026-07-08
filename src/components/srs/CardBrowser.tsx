"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { createNewCardState } from "@/lib/srs/scheduler";
import { userCardId } from "@/lib/srs/queue";
import type { Flashcard, Subject } from "@/types/content";
import type { UserCard } from "@/lib/storage/types";

interface Group {
  subject: Subject;
  label: string;
  items: Flashcard[];
}

export function CardBrowser({ groups }: { groups: Group[] }) {
  const [userCards, setUserCards] = useState<(UserCard & { id: number })[]>([]);
  const [pausedIds, setPausedIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([storage.listUserCards(), storage.listAllSrsCards()]).then(([cards, srsCards]) => {
      if (cancelled) return;
      setUserCards(cards.filter((c): c is UserCard & { id: number } => c.id !== undefined));
      setPausedIds(new Set(srsCards.filter((c) => c.paused).map((c) => c.cardId)));
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function togglePause(cardId: string) {
    if (!pausedIds) return;
    const isPaused = pausedIds.has(cardId);
    const now = new Date();
    const existing = await storage.getSrsCard(cardId);
    const base = existing ?? createNewCardState(cardId, now);
    await storage.setSrsCard({ ...base, paused: !isPaused });
    setPausedIds((prev) => {
      const next = new Set(prev);
      if (isPaused) next.delete(cardId);
      else next.add(cardId);
      return next;
    });
  }

  if (pausedIds === null) {
    return <p className="text-zinc-500 dark:text-zinc-400">載入中…</p>;
  }

  return (
    <div className="space-y-4">
      {groups.map((group) => (
        <details key={group.subject} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <summary className="cursor-pointer font-medium">
            {group.label}（{group.items.length}）
          </summary>
          <ul className="mt-3 space-y-2">
            {group.items.map((card) => {
              const isPaused = pausedIds.has(card.id);
              return (
                <li key={card.id} className="flex items-center justify-between gap-3 text-sm">
                  <span className={isPaused ? "text-zinc-400 line-through" : ""}>{card.front}</span>
                  <button
                    type="button"
                    onClick={() => togglePause(card.id)}
                    className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {isPaused ? "取消暫停" : "暫停"}
                  </button>
                </li>
              );
            })}
          </ul>
        </details>
      ))}

      <details className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <summary className="cursor-pointer font-medium">我的卡片（{userCards.length}）</summary>
        {userCards.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
            尚無自建卡片，可在教材筆記旁「轉成複習卡」建立。
          </p>
        ) : (
          <ul className="mt-3 space-y-2">
            {userCards.map((card) => {
              const cardId = userCardId(card.id);
              const isPaused = pausedIds.has(cardId);
              return (
                <li key={cardId} className="flex items-center justify-between gap-3 text-sm">
                  <span className={isPaused ? "text-zinc-400 line-through" : ""}>{card.front}</span>
                  <button
                    type="button"
                    onClick={() => togglePause(cardId)}
                    className="shrink-0 rounded-md bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {isPaused ? "取消暫停" : "暫停"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </details>
    </div>
  );
}
