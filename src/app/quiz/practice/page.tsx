import Link from "next/link";
import { SUBJECTS } from "@/types/content";
import { getQuestionsBySubject } from "@/lib/quiz/questions";

export const metadata = { title: "練習模式 | 會計學習網站" };

export default function PracticeIndexPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">練習模式</h1>
      <p className="mb-6 text-sm text-zinc-500 dark:text-zinc-400">
        選擇一個科目開始練習，作答後立即顯示詳解。
      </p>
      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/quiz/practice/mixed"
          className="rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
        >
          <h2 className="font-medium">混合練習（跨科目）</h2>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">交錯抽題，訓練跨科目判斷</p>
        </Link>
        {SUBJECTS.map(({ id, label }) => {
          const count = getQuestionsBySubject(id).length;
          return (
            <Link
              key={id}
              href={`/quiz/practice/${id}`}
              className="rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <h2 className="font-medium">{label}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {count > 0 ? `${count} 題` : "尚無題目"}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
