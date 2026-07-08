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
import { generateAnalysisReportMarkdown } from "@/lib/dashboard/report";
import type { Attempt, Feedback, MaterialProgress, SrsCardState } from "@/lib/storage/types";
import type { Flashcard, MaterialFrontmatter, Question, Subject } from "@/types/content";

interface MaterialGroup {
  subject: Subject;
  label: string;
  items: MaterialFrontmatter[];
}

export function Dashboard({
  materialGroups,
  flashcards,
  allQuestions,
}: {
  materialGroups: MaterialGroup[];
  flashcards: Flashcard[];
  allQuestions: Question[];
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
  const [reportData, setReportData] = useState<{
    attempts: Attempt[];
    srsCards: SrsCardState[];
    progress: MaterialProgress[];
    feedback: Feedback[];
  } | null>(null);

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
      storage.listFeedback(),
    ]).then(([progress, attempts, examSessions, userCards, srsCards, feedback]) => {
      if (cancelled) return;
      setCompletion(computeSubjectCompletion(materialGroups, progress));
      setAccuracy(computeRecentAccuracy(attempts, now));
      setExamScores(toExamScoreSeries(examSessions));
      const cardsWithId = userCards.filter(
        (c): c is typeof c & { id: number } => c.id !== undefined,
      );
      setDueCardCount(buildDueQueue(flashcards, cardsWithId, srsCards, nowIso).length);
      setReportData({ attempts, srsCards, progress, feedback });
      setLoaded(true);
    });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function exportReport() {
    if (!reportData) return;
    const markdown = generateAnalysisReportMarkdown({
      ...reportData,
      materials: materialGroups.flatMap((g) => g.items),
      questions: allQuestions,
      now: new Date(),
    });
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `learning-analysis-${new Date().toISOString().slice(0, 10)}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!loaded) {
    return <p className="text-zinc-500 dark:text-zinc-400">載入中…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/today"
          className="inline-block rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          開始今日學習
        </Link>
        <button
          type="button"
          onClick={exportReport}
          className="rounded-md bg-zinc-100 px-4 py-2 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          匯出學習分析報告
        </button>
      </div>

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
