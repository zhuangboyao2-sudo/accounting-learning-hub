"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";

export interface CalculationField {
  key: string;
  label: string;
  expected: number;
}

/**
 * 通用計算題關卡：營業稅申報／扣繳申報／年底結帳／營所稅結算共用同一個元件，
 * 差別只在傳入的欄位與正確數字（皆由 src/lib/sim/ledger.ts 從劇本交易資料算出，
 * 不手寫在內容檔）。
 */
export function SimCalculationCheckpoint({
  scenarioId,
  levelIndex,
  title,
  prompt,
  fields,
  explanation,
  onComplete,
}: {
  scenarioId: string;
  levelIndex: number;
  title: string;
  prompt: string;
  fields: CalculationField[];
  explanation: string;
  onComplete: () => void;
}) {
  const [done, setDone] = useState<boolean | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  useEffect(() => {
    storage.getSimProgress(scenarioId, levelIndex).then((progress) => {
      setDone(progress?.status === "done");
    });
  }, [scenarioId, levelIndex]);

  async function submit() {
    if (submitted) return;
    const allCorrect = fields.every((f) => Number(values[f.key]) === f.expected);
    setSubmitted(true);
    setCorrect(allCorrect);
    if (allCorrect) {
      await storage.setSimProgress({
        scenarioId,
        month: levelIndex,
        status: "done",
        answers: values,
        updatedAt: new Date().toISOString(),
      });
      setDone(true);
      onComplete();
    }
  }

  function retry() {
    setSubmitted(false);
    setValues({});
  }

  if (done === null) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">載入中…</p>;
  }

  if (done) {
    return (
      <span className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white">
        ✓ 本關已完成
      </span>
    );
  }

  const canSubmit = fields.every((f) => values[f.key]);

  return (
    <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="mb-2 text-lg font-medium">{title}</h2>
      <p className="mb-4 whitespace-pre-wrap text-sm text-zinc-600 dark:text-zinc-400">{prompt}</p>

      <div className="space-y-3">
        {fields.map((field) => (
          <label key={field.key} className="block text-sm">
            {field.label}
            <input
              type="number"
              value={values[field.key] ?? ""}
              disabled={submitted}
              onChange={(e) => setValues((v) => ({ ...v, [field.key]: e.target.value }))}
              className="mt-1 w-full rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
            />
          </label>
        ))}
      </div>

      {!submitted ? (
        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-4 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
        >
          提交答案
        </button>
      ) : (
        <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
          <p className={correct ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
            {correct ? "答對了" : "答錯了"}
          </p>
          {!correct ? (
            <div className="mt-2 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <p className="mb-1 font-medium">正確答案</p>
              {fields.map((f) => (
                <p key={f.key}>
                  {f.label}：{f.expected.toLocaleString("zh-Hant-TW")}
                </p>
              ))}
            </div>
          ) : null}
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{explanation}</p>
          {!correct ? (
            <button
              type="button"
              onClick={retry}
              className="mt-4 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              重新作答
            </button>
          ) : null}
        </div>
      )}
    </div>
  );
}
