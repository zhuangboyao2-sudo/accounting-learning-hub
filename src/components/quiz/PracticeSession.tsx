"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { shuffle } from "@/lib/quiz/shuffle";
import { isCorrect } from "@/lib/quiz/scoring";
import { SUBJECTS } from "@/types/content";
import type { Question } from "@/types/content";
import type { CauseTag } from "@/lib/storage/types";

const KEY_TO_INDEX: Record<string, number> = {
  "1": 0,
  "2": 1,
  "3": 2,
  "4": 3,
  a: 0,
  b: 1,
  c: 2,
  d: 3,
};

const CAUSE_LABELS: Record<CauseTag, string> = {
  concept: "概念不懂",
  calculation: "計算錯誤",
  carelessness: "粗心",
  misread: "題意誤解",
};

export function PracticeSession({
  questions,
  limit,
  showMaterialLink = true,
  onComplete,
}: {
  questions: Question[];
  limit?: number;
  showMaterialLink?: boolean;
  onComplete?: (result: { correct: number; total: number }) => void;
}) {
  const order = useMemo(() => {
    const shuffled = shuffle(questions);
    return limit ? shuffled.slice(0, limit) : shuffled;
  }, [questions, limit]);
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number[]>([]);
  const [submitted, setSubmitted] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [lastAttemptId, setLastAttemptId] = useState<number | null>(null);
  const [causeTag, setCauseTag] = useState<CauseTag | null>(null);
  const completeFired = useRef(false);

  const question = order[index];
  const isLast = index === order.length - 1;

  const submit = useMemo(
    () => (answer: number[]) => {
      if (submitted) return;
      setChosen(answer);
      setSubmitted(true);
      const correct = question.type === "essay" ? null : isCorrect(question, answer);
      if (correct !== null) {
        setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
        void storage
          .addAttempt({
            questionId: question.id,
            subject: question.subject,
            materialRef: question.material_ref,
            chosenAnswer: answer,
            correct,
            chosenAt: new Date().toISOString(),
          })
          .then(setLastAttemptId);
      }
    },
    [question, submitted],
  );

  function markCause(tag: CauseTag) {
    if (!lastAttemptId || causeTag) return;
    setCauseTag(tag);
    void storage.setAttemptCause(lastAttemptId, tag);
  }

  useEffect(() => {
    if (!question || question.type !== "single-choice" || submitted) return;
    function handleKeyDown(e: KeyboardEvent) {
      const optionIndex = KEY_TO_INDEX[e.key.toLowerCase()];
      if (optionIndex === undefined || !question.options || optionIndex >= question.options.length) return;
      submit([optionIndex]);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question, submitted, submit]);

  function toggleMultiChoice(optionIndex: number) {
    if (submitted) return;
    setChosen((prev) =>
      prev.includes(optionIndex) ? prev.filter((i) => i !== optionIndex) : [...prev, optionIndex],
    );
  }

  function next() {
    setIndex((i) => i + 1);
    setChosen([]);
    setSubmitted(false);
    setFeedbackSent(false);
    setLastAttemptId(null);
    setCauseTag(null);
  }

  function sendFeedback() {
    if (feedbackSent) return;
    setFeedbackSent(true);
    void storage.addFeedback({
      questionId: question.id,
      type: "unclear-explanation",
      createdAt: new Date().toISOString(),
    });
  }

  useEffect(() => {
    if (index >= order.length && !completeFired.current) {
      completeFired.current = true;
      onComplete?.(score);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, order.length]);

  if (index >= order.length) {
    return (
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-medium">練習完成</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          得分：{score.correct} / {score.total}
        </p>
      </div>
    );
  }

  const correct = submitted && question.type !== "essay" ? isCorrect(question, chosen) : null;

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
        第 {index + 1} / {order.length} 題
      </p>
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {SUBJECTS.find((s) => s.id === question.subject)?.label}
        </p>
        <p className="whitespace-pre-wrap">{question.stem}</p>

        {question.type === "essay" ? (
          <div className="mt-4">
            {!submitted ? (
              <button
                type="button"
                onClick={() => submit([])}
                className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              >
                顯示參考解答
              </button>
            ) : null}
          </div>
        ) : (
          <ul className="mt-4 space-y-2">
            {question.options?.map((option, i) => {
              const isChosen = chosen.includes(i);
              const isAnswer = submitted && question.answer?.includes(i);
              const isWrongChosen = submitted && isChosen && !question.answer?.includes(i);
              return (
                <li key={i}>
                  <button
                    type="button"
                    disabled={submitted}
                    onClick={() =>
                      question.type === "multi-choice" ? toggleMultiChoice(i) : submit([i])
                    }
                    className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                      isAnswer
                        ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950"
                        : isWrongChosen
                          ? "border-red-500 bg-red-50 dark:bg-red-950"
                          : isChosen
                            ? "border-zinc-400 dark:border-zinc-600"
                            : "border-zinc-200 dark:border-zinc-800"
                    }`}
                  >
                    {String.fromCharCode(65 + i)}. {option}
                  </button>
                </li>
              );
            })}
          </ul>
        )}

        {question.type === "multi-choice" && !submitted ? (
          <button
            type="button"
            onClick={() => submit(chosen)}
            className="mt-4 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            提交作答
          </button>
        ) : null}

        {submitted ? (
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            {correct !== null ? (
              <p className={correct ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
                {correct ? "答對了" : "答錯了"}
              </p>
            ) : null}
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{question.explanation}</p>
            {correct === false ? (
              <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                <span className="text-zinc-500 dark:text-zinc-400">答錯原因：</span>
                {(Object.keys(CAUSE_LABELS) as CauseTag[]).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => markCause(tag)}
                    disabled={causeTag !== null}
                    aria-pressed={causeTag === tag}
                    className={`rounded px-2 py-1 disabled:opacity-50 ${
                      causeTag === tag
                        ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                        : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    {CAUSE_LABELS[tag]}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {showMaterialLink && question.material_ref ? (
                <Link
                  href={`/materials/${question.subject}/${question.material_ref}`}
                  className="hover:underline"
                >
                  回教材
                </Link>
              ) : null}
              <button
                type="button"
                onClick={sendFeedback}
                disabled={feedbackSent}
                className="text-zinc-500 hover:underline disabled:no-underline disabled:text-zinc-400"
              >
                {feedbackSent ? "已回饋「看不懂」" : "看不懂"}
              </button>
              <button
                type="button"
                onClick={next}
                className="ml-auto rounded-md bg-zinc-900 px-3 py-1.5 font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
              >
                {isLast ? "完成練習" : "下一題"}
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
