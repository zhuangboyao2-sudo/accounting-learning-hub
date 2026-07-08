import Link from "next/link";
import { getAllFlashcards } from "@/lib/content/flashcards";
import { ReviewQueue } from "@/components/srs/ReviewQueue";

export const metadata = { title: "複習卡 | 會計學習網站" };

export default function ReviewPage() {
  const flashcards = getAllFlashcards();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">複習卡</h1>
        <Link href="/review/browse" className="text-sm hover:underline">
          卡片瀏覽器
        </Link>
      </div>
      <ReviewQueue flashcards={flashcards} />
    </main>
  );
}
