"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { buildDueQueue, type ReviewCard } from "@/lib/srs/queue";
import { getLatestWrongQuestionIds } from "@/lib/quiz/scoring";
import { shuffle } from "@/lib/quiz/shuffle";
import { recordTodayActivity } from "@/lib/srs/streak";
import { pickInitialStage, pickStageAfterCards, type TodayStage } from "@/lib/srs/today-stage";
import { FlashcardReviewClientOnly } from "@/components/srs/FlashcardReviewClientOnly";
import { PracticeSessionClientOnly } from "@/components/quiz/PracticeSessionClientOnly";
import type { Flashcard, Question, Subject } from "@/types/content";

const WRONG_RETRY_LIMIT = 3;

interface MaterialRef {
  subject: Subject;
  id: string;
  title: string;
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="mb-3 text-lg font-medium">{title}</h2>
      {children}
    </div>
  );
}

export function TodaySession({
  flashcards,
  allQuestions,
  materials,
}: {
  flashcards: Flashcard[];
  allQuestions: Question[];
  materials: MaterialRef[];
}) {
  const [loaded, setLoaded] = useState(false);
  const [dueQueue, setDueQueue] = useState<ReviewCard[]>([]);
  const [wrongQuestions, setWrongQuestions] = useState<Question[]>([]);
  const [nextMaterial, setNextMaterial] = useState<MaterialRef | null>(null);
  const [stage, setStage] = useState<TodayStage>("cards");
  const [streakCount, setStreakCount] = useState<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    const nowIso = new Date().toISOString();
    Promise.all([
      storage.listUserCards(),
      storage.listAllSrsCards(),
      storage.listAttempts(),
      storage.listProgress(),
    ]).then(([userCards, srsCards, attempts, progress]) => {
      if (cancelled) return;
      const cardsWithId = userCards.filter(
        (c): c is typeof c & { id: number } => c.id !== undefined,
      );
      const cards = buildDueQueue(flashcards, cardsWithId, srsCards, nowIso);
      setDueQueue(cards);

      const wrongIds = getLatestWrongQuestionIds(attempts);
      const wrong = shuffle(allQuestions.filter((q) => wrongIds.has(q.id)));
      setWrongQuestions(wrong);

      const doneIds = new Set(
        progress.filter((p) => p.status === "done").map((p) => p.materialId),
      );
      setNextMaterial(materials.find((m) => !doneIds.has(m.id)) ?? null);

      setStage(pickInitialStage(cards.length, wrong.length));
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function advanceFromCards() {
    setStage(pickStageAfterCards(wrongQuestions.length));
  }

  useEffect(() => {
    if (stage === "next") {
      void recordTodayActivity().then(setStreakCount);
    }
  }, [stage]);

  if (!loaded) {
    return <p className="text-zinc-500 dark:text-zinc-400">載入中…</p>;
  }

  if (stage === "cards") {
    return (
      <Section title="第一段：到期複習卡">
        <FlashcardReviewClientOnly cards={dueQueue} onComplete={advanceFromCards} />
      </Section>
    );
  }

  if (stage === "wrong") {
    return (
      <Section title="第二段：錯題重練">
        <PracticeSessionClientOnly
          questions={wrongQuestions}
          limit={WRONG_RETRY_LIMIT}
          onComplete={() => setStage("next")}
        />
      </Section>
    );
  }

  return (
    <Section title="第三段：下一個未完成章節">
      {streakCount !== null ? (
        <p className="mb-4 text-sm text-emerald-600">連續學習 {streakCount} 天，繼續保持！</p>
      ) : null}
      {nextMaterial ? (
        <Link
          href={`/materials/${nextMaterial.subject}/${nextMaterial.id}`}
          className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          前往「{nextMaterial.title}」
        </Link>
      ) : (
        <p className="text-zinc-600 dark:text-zinc-400">所有章節都已完成，繼續保持複習！</p>
      )}
    </Section>
  );
}
