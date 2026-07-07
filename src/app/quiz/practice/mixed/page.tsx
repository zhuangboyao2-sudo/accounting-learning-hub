import Link from "next/link";
import { getAllQuestions } from "@/lib/quiz/questions";
import { pickRandom } from "@/lib/quiz/shuffle";
import { PracticeSessionClientOnly } from "@/components/quiz/PracticeSessionClientOnly";

export const metadata = { title: "混合練習 | 會計學習網站" };

// 每次造訪都要抽到不同題組，避免 Next.js 靜態化成固定的一組題目
export const dynamic = "force-dynamic";

const MIXED_PRACTICE_COUNT = 20;

export default function MixedPracticePage() {
  const questions = pickRandom(getAllQuestions(), MIXED_PRACTICE_COUNT);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/quiz/practice">練習模式</Link>
      </p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">混合練習（跨科目）</h1>

      {questions.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">目前尚無題目。</p>
      ) : (
        <PracticeSessionClientOnly questions={questions} />
      )}
    </main>
  );
}
