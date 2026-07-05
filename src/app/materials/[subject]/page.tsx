import Link from "next/link";
import { notFound } from "next/navigation";
import { SUBJECTS } from "@/types/content";
import { getMaterialsBySubject } from "@/lib/content/materials";

export function generateStaticParams() {
  return SUBJECTS.map(({ id }) => ({ subject: id }));
}

export default async function SubjectPage({
  params,
}: {
  params: Promise<{ subject: string }>;
}) {
  const { subject } = await params;
  const subjectInfo = SUBJECTS.find((s) => s.id === subject);
  if (!subjectInfo) notFound();

  const items = getMaterialsBySubject(subjectInfo.id);
  const chapters = new Map<number, typeof items>();
  for (const item of items) {
    chapters.set(item.chapter, [...(chapters.get(item.chapter) ?? []), item]);
  }

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/materials">教材</Link> / {subjectInfo.label}
      </p>
      <h1 className="mb-6 mt-1 text-2xl font-semibold">{subjectInfo.label}</h1>

      {items.length === 0 ? (
        <p className="text-zinc-500 dark:text-zinc-400">此科目尚無內容。</p>
      ) : (
        <div className="space-y-6">
          {[...chapters.entries()].map(([chapter, sections]) => (
            <div key={chapter}>
              <h2 className="mb-2 text-sm font-semibold text-zinc-500 dark:text-zinc-400">
                第 {chapter} 章
              </h2>
              <ul className="space-y-1">
                {sections.map((section) => (
                  <li key={section.id}>
                    <Link
                      href={`/materials/${subjectInfo.id}/${section.id}`}
                      className="block rounded-md px-3 py-2 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                    >
                      {section.title}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
