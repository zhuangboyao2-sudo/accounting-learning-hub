import Link from "next/link";
import { notFound } from "next/navigation";
import { SUBJECTS } from "@/types/content";
import { getQuestionsBySubject } from "@/lib/quiz/questions";
import { pickRandom } from "@/lib/quiz/shuffle";
import { ExamSessionClientOnly } from "@/components/quiz/ExamSessionClientOnly";

export const metadata = { title: "模擬考 | 會計學習網站" };

// 每次造訪都要重新抽題組，避免 Next.js 靜態化成固定的一組題目
export const dynamic = "force-dynamic";

const EXAM_QUESTION_COUNT = 20;

export default async function ExamSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const subjectInfo = SUBJECTS.find((s) => s.id === subject);
  if (!subjectInfo) notFound();

  const pool = getQuestionsBySubject(subjectInfo.id).filter((q) => q.type !== "essay");
  const questions = pickRandom(pool, EXAM_QUESTION_COUNT);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/quiz/exam">模擬考</Link>
      </p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">{subjectInfo.label}模擬考</h1>

      {questions.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">此科目尚無題目。</p>
      ) : (
        <ExamSessionClientOnly subject={subjectInfo.id} questions={questions} />
      )}
    </main>
  );
}
