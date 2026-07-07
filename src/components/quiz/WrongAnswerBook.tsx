"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";
import { getLatestWrongQuestionIds } from "@/lib/quiz/scoring";
import { PracticeSessionClientOnly } from "@/components/quiz/PracticeSessionClientOnly";
import type { Question } from "@/types/content";

export function WrongAnswerBook({ questions }: { questions: Question[] }) {
  const [wrongQuestions, setWrongQuestions] = useState<Question[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    storage.listAttempts().then((attempts) => {
      if (cancelled) return;
      const wrongIds = getLatestWrongQuestionIds(attempts);
      setWrongQuestions(questions.filter((q) => wrongIds.has(q.id)));
    });
    return () => {
      cancelled = true;
    };
  }, [questions]);

  if (wrongQuestions === null) {
    return <p className="text-zinc-500 dark:text-zinc-400">載入中…</p>;
  }

  if (wrongQuestions.length === 0) {
    return <p className="text-zinc-500 dark:text-zinc-400">目前沒有錯題，繼續保持。</p>;
  }

  return <PracticeSessionClientOnly questions={wrongQuestions} />;
}
