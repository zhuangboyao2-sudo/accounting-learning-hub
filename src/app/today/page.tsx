import { getAllFlashcards } from "@/lib/content/flashcards";
import { getAllQuestions } from "@/lib/quiz/questions";
import { getAllMaterials } from "@/lib/content/materials";
import { TodaySession } from "@/components/srs/TodaySession";

export const metadata = { title: "開始今日學習 | 會計學習網站" };

export default function TodayPage() {
  const flashcards = getAllFlashcards();
  const allQuestions = getAllQuestions();
  const materials = getAllMaterials().flatMap(({ subject, items }) =>
    items.map((item) => ({ subject, id: item.id, title: item.title })),
  );

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">開始今日學習</h1>
      <TodaySession flashcards={flashcards} allQuestions={allQuestions} materials={materials} />
    </main>
  );
}
