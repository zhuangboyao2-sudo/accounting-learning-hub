"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { shuffle } from "@/lib/quiz/shuffle";
import { isEntryCorrect } from "@/lib/journal-entries/grading";
import type { ChartOfAccountsEntry } from "@/lib/content/chart-of-accounts";
import type { JournalEntryLine, JournalEntryScenario } from "@/types/content";

interface DraftLine {
  account: string;
  side: "debit" | "credit";
  amount: string;
}

function emptyLine(side: DraftLine["side"]): DraftLine {
  return { account: "", side, amount: "" };
}

function toSubmittedLines(draft: DraftLine[]): JournalEntryLine[] {
  return draft
    .filter((line) => line.account && line.amount)
    .map((line) => ({ account: line.account, side: line.side, amount: Number(line.amount) }));
}

function sumSide(draft: DraftLine[], side: DraftLine["side"]): number {
  return draft
    .filter((line) => line.side === side)
    .reduce((sum, line) => sum + (Number(line.amount) || 0), 0);
}

export function JournalEntryPractice({
  scenarios,
  accounts,
}: {
  scenarios: JournalEntryScenario[];
  accounts: ChartOfAccountsEntry[];
}) {
  const order = useMemo(() => shuffle(scenarios), [scenarios]);
  const [index, setIndex] = useState(0);
  const [draft, setDraft] = useState<DraftLine[]>([emptyLine("debit"), emptyLine("credit")]);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const scenario = order[index];
  const isLast = index === order.length - 1;

  const accountsByCategory = useMemo(() => {
    const groups = new Map<string, ChartOfAccountsEntry[]>();
    for (const account of accounts) {
      const list = groups.get(account.category) ?? [];
      list.push(account);
      groups.set(account.category, list);
    }
    return groups;
  }, [accounts]);

  const debitTotal = sumSide(draft, "debit");
  const creditTotal = sumSide(draft, "credit");
  const canSubmit = draft.filter((l) => l.account && l.amount).length >= 2;

  function updateLine(i: number, patch: Partial<DraftLine>) {
    setDraft((prev) => prev.map((line, li) => (li === i ? { ...line, ...patch } : line)));
  }

  function addLine(side: DraftLine["side"]) {
    setDraft((prev) => [...prev, emptyLine(side)]);
  }

  function removeLine(i: number) {
    setDraft((prev) => prev.filter((_, li) => li !== i));
  }

  function submit() {
    if (submitted || !canSubmit) return;
    setSubmitted(true);
    const correct = isEntryCorrect(scenario, toSubmittedLines(draft));
    setScore((s) => ({ correct: s.correct + (correct ? 1 : 0), total: s.total + 1 }));
  }

  function next() {
    setIndex((i) => i + 1);
    setDraft([emptyLine("debit"), emptyLine("credit")]);
    setSubmitted(false);
  }

  if (!scenario) {
    return (
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="text-lg font-medium">練習完成</h2>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          得分：{score.correct} / {score.total}
        </p>
      </div>
    );
  }

  const correct = submitted ? isEntryCorrect(scenario, toSubmittedLines(draft)) : null;

  return (
    <div>
      <p className="mb-2 text-sm text-zinc-500 dark:text-zinc-400">
        第 {index + 1} / {order.length} 題
      </p>
      <div className="rounded-lg border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="whitespace-pre-wrap">{scenario.scenario}</p>

        <div className="mt-4 space-y-2">
          {draft.map((line, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2">
              <select
                value={line.side}
                disabled={submitted}
                onChange={(e) => updateLine(i, { side: e.target.value as DraftLine["side"] })}
                className="rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <option value="debit">借</option>
                <option value="credit">貸</option>
              </select>
              <select
                value={line.account}
                disabled={submitted}
                onChange={(e) => updateLine(i, { account: e.target.value })}
                className="flex-1 rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              >
                <option value="">選擇科目…</option>
                {[...accountsByCategory.entries()].map(([category, list]) => (
                  <optgroup key={category} label={category}>
                    {list.map((account) => (
                      <option key={account.name} value={account.name}>
                        {account.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              <input
                type="number"
                min={0}
                value={line.amount}
                disabled={submitted}
                onChange={(e) => updateLine(i, { amount: e.target.value })}
                placeholder="金額"
                className="w-28 rounded-md border border-zinc-200 px-2 py-1.5 text-sm dark:border-zinc-800 dark:bg-zinc-900"
              />
              {!submitted && draft.length > 2 ? (
                <button
                  type="button"
                  onClick={() => removeLine(i)}
                  className="text-sm text-zinc-500 hover:underline"
                >
                  移除
                </button>
              ) : null}
            </div>
          ))}
        </div>

        {!submitted ? (
          <div className="mt-3 flex gap-3 text-sm">
            <button type="button" onClick={() => addLine("debit")} className="text-zinc-500 hover:underline">
              ＋新增借方
            </button>
            <button type="button" onClick={() => addLine("credit")} className="text-zinc-500 hover:underline">
              ＋新增貸方
            </button>
          </div>
        ) : null}

        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          借方合計 {debitTotal.toLocaleString("zh-Hant-TW")} ／ 貸方合計 {creditTotal.toLocaleString("zh-Hant-TW")}
        </p>

        {!submitted ? (
          <button
            type="button"
            onClick={submit}
            disabled={!canSubmit}
            className="mt-4 rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
          >
            提交作答
          </button>
        ) : null}

        {submitted ? (
          <div className="mt-4 border-t border-zinc-200 pt-4 dark:border-zinc-800">
            <p className={correct ? "font-medium text-emerald-600" : "font-medium text-red-600"}>
              {correct ? "答對了" : "答錯了"}
            </p>
            <div className="mt-2 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
              <p className="mb-1 font-medium">正確分錄</p>
              {scenario.lines.map((line, i) => (
                <p key={i}>
                  {line.side === "debit" ? "借" : "貸"}：{line.account} {line.amount.toLocaleString("zh-Hant-TW")}
                </p>
              ))}
            </div>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{scenario.explanation}</p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
              {scenario.material_ref ? (
                <Link href={`/materials/accounting/${scenario.material_ref}`} className="hover:underline">
                  回教材
                </Link>
              ) : null}
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
