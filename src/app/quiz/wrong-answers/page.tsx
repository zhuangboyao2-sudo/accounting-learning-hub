import Link from "next/link";
import { getAllQuestions } from "@/lib/quiz/questions";
import { WrongAnswerBook } from "@/components/quiz/WrongAnswerBook";

export const metadata = { title: "錯題本 | 會計學習網站" };

export default function WrongAnswersPage() {
  const questions = getAllQuestions();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/quiz/practice">練習模式</Link>
      </p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">錯題本</h1>
      <WrongAnswerBook questions={questions} />
    </main>
  );
}
