import Link from "next/link";
import { SUBJECTS } from "@/types/content";
import { getFlashcardsBySubject } from "@/lib/content/flashcards";
import { CardBrowser } from "@/components/srs/CardBrowser";

export const metadata = { title: "卡片瀏覽器 | 會計學習網站" };

export default function CardBrowserPage() {
  const groups = SUBJECTS.map(({ id, label }) => ({
    subject: id,
    label,
    items: getFlashcardsBySubject(id),
  }));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/review">複習卡</Link>
      </p>
      <h1 className="mt-1 mb-6 text-2xl font-semibold">卡片瀏覽器</h1>
      <CardBrowser groups={groups} />
    </main>
  );
}
