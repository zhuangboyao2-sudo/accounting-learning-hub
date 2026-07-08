"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { shouldPullCardForward } from "@/lib/srs/scheduler";
import { PracticeSessionClientOnly } from "@/components/quiz/PracticeSessionClientOnly";
import type { Question, Flashcard } from "@/types/content";

const QUIZ_LIMIT = 5;

/** 未全對時，把本節複習卡的到期日提前到現在，讓卡片進入今日複習佇列（教材↔題庫↔複習卡串聯） */
async function scheduleFlashcardsForReview(flashcards: Flashcard[]) {
  const nowIso = new Date().toISOString();
  await Promise.all(
    flashcards.map(async (flashcard) => {
      const existing = await storage.getSrsCard(flashcard.id);
      if (!shouldPullCardForward(existing, nowIso)) return;
      await storage.setSrsCard({ ...existing!, due: nowIso });
    }),
  );
}

/**
 * 節末快測：取代 Phase 1 的手動標記完成（見 MarkCompleteButton.tsx 的說明）。
 * 全對才自動標記該節完成，落實 retrieval practice；未全對可重新測驗。
 */
export function SectionQuiz({
  materialId,
  questions,
  flashcards,
}: {
  materialId: string;
  questions: Question[];
  flashcards: Flashcard[];
}) {
  const [done, setDone] = useState<boolean | null>(null);
  const [result, setResult] = useState<{ correct: number; total: number } | null>(null);
  const [attemptRound, setAttemptRound] = useState(0);

  useEffect(() => {
    storage.getProgress(materialId).then((progress) => {
      setDone(progress?.status === "done");
    });
  }, [materialId]);

  function handleComplete(r: { correct: number; total: number }) {
    setResult(r);
    if (r.total > 0 && r.correct === r.total) {
      setDone(true);
      void storage.setProgress({
        materialId,
        status: "done",
        updatedAt: new Date().toISOString(),
      });
    } else if (r.total > 0) {
      void scheduleFlashcardsForReview(flashcards);
    }
  }

  function retry() {
    setResult(null);
    setDone(false);
    setAttemptRound((n) => n + 1);
  }

  if (done === null) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">載入中…</p>;
  }

  if (done) {
    return (
      <div className="flex flex-wrap items-center gap-3">
        <span className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">
          ✓ 已完成
        </span>
        <button type="button" onClick={retry} className="text-sm text-zinc-500 hover:underline">
          重新測驗
        </button>
      </div>
    );
  }

  if (result) {
    return (
      <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          本次 {result.correct} / {result.total}，全對才算完成。
        </p>
        <button
          type="button"
          onClick={retry}
          className="mt-3 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          重新測驗
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-3 text-lg font-medium">節末快測</h2>
      <PracticeSessionClientOnly
        key={attemptRound}
        questions={questions}
        limit={QUIZ_LIMIT}
        showMaterialLink={false}
        onComplete={handleComplete}
      />
    </div>
  );
}
