import { getGlossary } from "@/lib/content/glossary";

export const metadata = { title: "稅務／會計名詞辭典 | 會計學習網站" };

export default function GlossaryPage() {
  const entries = [...getGlossary()].sort((a, b) => a.term.localeCompare(b.term, "zh-Hant"));

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <h1 className="mb-6 text-2xl font-semibold">稅務／會計名詞辭典</h1>
      <dl className="space-y-4">
        {entries.map((entry) => (
          <div key={entry.id} id={entry.id} className="scroll-mt-20 border-b border-zinc-100 pb-4 dark:border-zinc-800">
            <dt className="font-medium">{entry.term}</dt>
            <dd className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{entry.definition}</dd>
          </div>
        ))}
      </dl>
    </main>
  );
}
