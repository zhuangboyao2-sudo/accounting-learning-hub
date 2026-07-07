"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { storage } from "@/lib/storage";
import { isCorrect, scoreExam } from "@/lib/quiz/scoring";
import { SUBJECTS } from "@/types/content";
import type { Question, Subject } from "@/types/content";

const EXAM_DURATION_MINUTES = 30;
const EXAM_DURATION_SECONDS = EXAM_DURATION_MINUTES * 60;

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

function formatTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function ExamSession({ subject, questions }: { subject: Subject; questions: Question[] }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, number[]>>({});
  const [remainingSeconds, setRemainingSeconds] = useState(EXAM_DURATION_SECONDS);
  const [submitted, setSubmitted] = useState(false);
  const submitFired = useRef(false);

  const question = questions[currentIndex];
  const isLast = currentIndex === questions.length - 1;

  const handleSubmit = useMemo(
    () => () => {
      if (submitFired.current) return;
      submitFired.current = true;
      setSubmitted(true);

      for (const q of questions) {
        if (q.type === "essay") continue;
        const chosenAnswer = answers[q.id] ?? [];
        void storage.addAttempt({
          questionId: q.id,
          subject: q.subject,
          materialRef: q.material_ref,
          chosenAnswer,
          correct: isCorrect(q, chosenAnswer),
          chosenAt: new Date().toISOString(),
        });
      }
      const { correct } = scoreExam(questions, answers);
      void storage.addExamSession({
        subject,
        questionIds: questions.map((q) => q.id),
        score: correct,
        durationSeconds: EXAM_DURATION_SECONDS - remainingSeconds,
        completedAt: new Date().toISOString(),
      });
    },
    [questions, answers, subject, remainingSeconds],
  );

  // setInterval 的 callback closure 只在 mount 時建立一次，若直接呼叫 handleSubmit
  // 會用到當時（answers 還是空的）的舊版本，因此改用 ref 讓計時器永遠呼叫最新版本。
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
  }, [handleSubmit]);

  useEffect(() => {
    if (submitted) return;
    const interval = setInterval(() => {
      setRemainingSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval);
          handleSubmitRef.current();
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [submitted]);

  useEffect(() => {
    if (submitted) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (question.type !== "single-choice") return;
      const optionIndex = KEY_TO_INDEX[e.key.toLowerCase()];
      if (optionIndex === undefined || !question.options || optionIndex >= question.options.length) return;
      setAnswers((prev) => ({ ...prev, [question.id]: [optionIndex] }));
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [question, submitted]);

  function selectOption(optionIndex: number) {
    if (question.type === "multi-choice") {
      setAnswers((prev) => {
        const current = prev[question.id] ?? [];
        const next = current.includes(optionIndex)
          ? current.filter((i) => i !== optionIndex)
          : [...current, optionIndex];
        return { ...prev, [question.id]: next };
      });
    } else {
      setAnswers((prev) => ({ ...prev, [question.id]: [optionIndex] }));
    }
  }

  if (submitted) {
    const { correct, total } = scoreExam(questions, answers);
    return (
      <div>
        <div className="mb-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <h2 className="text-lg font-medium">模擬考結果</h2>
          <p className="mt-1 text-zinc-600 dark:text-zinc-400">
            得分：{correct} / {total}
          </p>
        </div>
        <div className="space-y-6">
          {questions.map((q, i) => {
            const chosen = answers[q.id] ?? [];
            return (
              <div key={q.id} className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
                <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
                  第 {i + 1} 題．{SUBJECTS.find((s) => s.id === q.subject)?.label}
                </p>
                <p className="whitespace-pre-wrap">{q.stem}</p>
                <ul className="mt-4 space-y-2">
                  {q.options?.map((option, oi) => {
                    const isAnswer = q.answer?.includes(oi);
                    const isChosenWrong = chosen.includes(oi) && !q.answer?.includes(oi);
                    return (
                      <li
                        key={oi}
                        className={`rounded-md border px-3 py-2 text-sm ${
                          isAnswer
                            ? "border-emerald-600 bg-emerald-50 dark:bg-emerald-950"
                            : isChosenWrong
                              ? "border-red-500 bg-red-50 dark:bg-red-950"
                              : "border-zinc-200 dark:border-zinc-800"
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}. {option}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 border-t border-zinc-200 pt-4 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
                  {q.explanation}
                </p>
                {q.material_ref ? (
                  <Link
                    href={`/materials/${q.subject}/${q.material_ref}`}
                    className="mt-2 inline-block text-sm hover:underline"
                  >
                    回教材
                  </Link>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          第 {currentIndex + 1} / {questions.length} 題
        </p>
        <p
          className={`text-sm font-medium ${
            remainingSeconds < 300 ? "text-red-600" : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          剩餘時間 {formatTime(remainingSeconds)}
        </p>
        <button
          type="button"
          onClick={handleSubmit}
          className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
        >
          交卷
        </button>
      </div>

      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="mb-2 text-xs font-medium text-zinc-500 dark:text-zinc-400">
          {SUBJECTS.find((s) => s.id === question.subject)?.label}
        </p>
        <p className="whitespace-pre-wrap">{question.stem}</p>
        <ul className="mt-4 space-y-2">
          {question.options?.map((option, i) => {
            const isChosen = (answers[question.id] ?? []).includes(i);
            return (
              <li key={i}>
                <button
                  type="button"
                  onClick={() => selectOption(i)}
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                    isChosen
                      ? "border-zinc-900 bg-zinc-100 dark:border-zinc-100 dark:bg-zinc-800"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  {String.fromCharCode(65 + i)}. {option}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => i - 1)}
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-300"
          >
            上一題
          </button>
          <button
            type="button"
            disabled={isLast}
            onClick={() => setCurrentIndex((i) => i + 1)}
            className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 disabled:opacity-40 dark:bg-zinc-800 dark:text-zinc-300"
          >
            下一題
          </button>
        </div>
      </div>
    </div>
  );
}
