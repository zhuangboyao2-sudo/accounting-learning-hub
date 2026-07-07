import Link from "next/link";
import { notFound } from "next/navigation";
import { SUBJECTS } from "@/types/content";
import { getQuestionsBySubject } from "@/lib/quiz/questions";
import { PracticeSessionClientOnly } from "@/components/quiz/PracticeSessionClientOnly";

export function generateStaticParams() {
  return SUBJECTS.map(({ id }) => ({ subject: id }));
}

export default async function PracticeSubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const subjectInfo = SUBJECTS.find((s) => s.id === subject);
  if (!subjectInfo) notFound();

  const questions = getQuestionsBySubject(subjectInfo.id);

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/quiz/practice">練習模式</Link>
      </p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">{subjectInfo.label}練習</h1>

      {questions.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">此科目尚無題目。</p>
      ) : (
        <PracticeSessionClientOnly subject={subjectInfo.id} questions={questions} />
      )}
    </main>
  );
}
