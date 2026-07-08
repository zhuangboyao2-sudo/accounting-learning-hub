"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { buildDueQueue } from "@/lib/srs/queue";
import {
  computeRecentAccuracy,
  computeSubjectCompletion,
  toExamScoreSeries,
  type ExamScorePoint,
  type SubjectCompletion,
} from "@/lib/dashboard/stats";
import { SubjectProgressChart } from "@/components/dashboard/SubjectProgressChart";
import { ExamScoreChart } from "@/components/dashboard/ExamScoreChart";
import type { Flashcard, MaterialFrontmatter, Subject } from "@/types/content";

interface MaterialGroup {
  subject: Subject;
  label: string;
  items: MaterialFrontmatter[];
}

export function Dashboard({
  materialGroups,
  flashcards,
}: {
  materialGroups: MaterialGroup[];
  flashcards: Flashcard[];
}) {
  const [loaded, setLoaded] = useState(false);
  const [completion, setCompletion] = useState<SubjectCompletion[]>([]);
  const [accuracy, setAccuracy] = useState<{ correct: number; total: number; percent: number | null }>({
    correct: 0,
    total: 0,
    percent: null,
  });
  const [dueCardCount, setDueCardCount] = useState(0);
  const [examScores, setExamScores] = useState<ExamScorePoint[]>([]);

  useEffect(() => {
    let cancelled = false;
    const now = new Date();
    const nowIso = now.toISOString();
    Promise.all([
      storage.listProgress(),
      storage.listAttempts(),
      storage.listExamSessions(),
      storage.listUserCards(),
      storage.listAllSrsCards(),
    ]).then(([progress, attempts, examSessions, userCards, srsCards]) => {
      if (cancelled) return;
      setCompletion(computeSubjectCompletion(materialGroups, progress));
      setAccuracy(computeRecentAccuracy(attempts, now));
      setExamScores(toExamScoreSeries(examSessions));
      const cardsWithId = userCards.filter(
        (c): c is typeof c & { id: number } => c.id !== undefined,
      );
      setDueCardCount(buildDueQueue(flashcards, cardsWithId, srsCards, nowIso).length);
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!loaded) {
    return <p className="text-zinc-500 dark:text-zinc-400">載入中…</p>;
  }

  return (
    <div className="space-y-8">
      <Link
        href="/today"
        className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        開始今日學習
      </Link>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">近 30 天答題正確率</p>
          <p className="mt-1 text-2xl font-semibold">
            {accuracy.percent === null ? "－" : `${accuracy.percent}%`}
          </p>
          {accuracy.total > 0 ? (
            <p className="mt-1 text-xs text-zinc-400">
              {accuracy.correct} / {accuracy.total} 題
            </p>
          ) : null}
        </div>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">今日到期複習卡</p>
          <p className="mt-1 text-2xl font-semibold">{dueCardCount}</p>
          <Link href="/review" className="mt-1 inline-block text-xs hover:underline">
            前往複習
          </Link>
        </div>
      </div>

      <div>
        <h2 className="mb-3 text-lg font-medium">各科教材完成度</h2>
        <SubjectProgressChart data={completion} />
      </div>

      {examScores.length > 0 ? (
        <div>
          <h2 className="mb-3 text-lg font-medium">模擬考歷次分數</h2>
          <ExamScoreChart data={examScores} />
        </div>
      ) : null}
    </div>
  );
}
