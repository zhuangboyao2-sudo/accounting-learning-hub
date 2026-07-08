import { SUBJECTS } from "@/types/content";
import { getAllMaterials } from "@/lib/content/materials";
import { getAllFlashcards } from "@/lib/content/flashcards";
import { Dashboard } from "@/components/dashboard/Dashboard";

export default function Home() {
  const materialsBySubject = getAllMaterials();
  const materialGroups = materialsBySubject.map(({ subject, items }) => ({
    subject,
    label: SUBJECTS.find((s) => s.id === subject)?.label ?? subject,
    items,
  }));
  const flashcards = getAllFlashcards();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">會計學習網站</h1>
      <Dashboard materialGroups={materialGroups} flashcards={flashcards} />
    </main>
  );
}
