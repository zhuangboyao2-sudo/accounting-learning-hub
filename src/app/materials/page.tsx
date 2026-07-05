import Link from "next/link";
import { SUBJECTS } from "@/types/content";
import { getAllMaterials } from "@/lib/content/materials";

export const metadata = { title: "教材 | 會計學習網站" };

export default function MaterialsIndexPage() {
  const grouped = getAllMaterials();

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">教材</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        {SUBJECTS.map(({ id, label }) => {
          const items = grouped.find((g) => g.subject === id)?.items ?? [];
          return (
            <Link
              key={id}
              href={`/materials/${id}`}
              className="rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <h2 className="font-medium">{label}</h2>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                {items.length > 0 ? `${items.length} 個章節` : "尚無內容"}
              </p>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
