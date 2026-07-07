import Link from "next/link";
import { notFound } from "next/navigation";
import { compileMDX } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import { SUBJECTS } from "@/types/content";
import {
  getAdjacentMaterials,
  getAllMaterials,
  getMaterialContent,
} from "@/lib/content/materials";
import { TaxParam } from "@/components/mdx/TaxParam";
import { Term } from "@/components/mdx/Term";
import {
  ArticleBody,
  FontSizeControl,
  FontSizeProvider,
} from "@/components/materials/FontSizeProvider";
import { NoteEditor } from "@/components/materials/NoteEditor";
import { MarkCompleteButton } from "@/components/materials/MarkCompleteButton";
import { SectionQuiz } from "@/components/materials/SectionQuiz";
import { getQuestionsByMaterialRef } from "@/lib/quiz/questions";

const SECTION_QUIZ_MIN_QUESTIONS = 3;

export function generateStaticParams() {
  return getAllMaterials().flatMap(({ subject, items }) =>
    items.map((item) => ({ subject, id: item.id })),
  );
}

export default async function MaterialSectionPage({
  params,
}: {
  params: Promise<{ subject: string; id: string }>;
}) {
  const { subject, id } = await params;
  const subjectInfo = SUBJECTS.find((s) => s.id === subject);
  if (!subjectInfo) notFound();

  const material = getMaterialContent(subjectInfo.id, id);
  if (!material) notFound();

  const { content } = await compileMDX({
    source: material.body,
    components: { TaxParam, Term },
    options: { mdxOptions: { remarkPlugins: [remarkGfm] } },
  });

  const { prev, next } = getAdjacentMaterials(subjectInfo.id, id);
  const sectionQuestions = getQuestionsByMaterialRef(id);
  const hasEnoughQuestionsForQuiz = sectionQuestions.length >= SECTION_QUIZ_MIN_QUESTIONS;

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        <Link href="/materials">教材</Link> /{" "}
        <Link href={`/materials/${subjectInfo.id}`}>{subjectInfo.label}</Link>
      </p>

      <FontSizeProvider>
        <div className="mt-1 flex flex-wrap items-center justify-between gap-2">
          <h1 className="text-2xl font-semibold">{material.frontmatter.title}</h1>
          <div className="flex items-center gap-3">
            <FontSizeControl />
            {!hasEnoughQuestionsForQuiz ? <MarkCompleteButton materialId={id} /> : null}
          </div>
        </div>

        <ArticleBody>{content}</ArticleBody>
      </FontSizeProvider>

      {hasEnoughQuestionsForQuiz ? (
        <div className="mt-8 border-t border-zinc-200 pt-6 dark:border-zinc-800">
          <SectionQuiz materialId={id} questions={sectionQuestions} />
        </div>
      ) : null}

      <NoteEditor materialId={id} />

      <nav className="mt-8 flex justify-between border-t border-zinc-200 pt-4 text-sm dark:border-zinc-800">
        {prev ? (
          <Link href={`/materials/${subjectInfo.id}/${prev.id}`} className="hover:underline">
            ← {prev.title}
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link href={`/materials/${subjectInfo.id}/${next.id}`} className="hover:underline">
            {next.title} →
          </Link>
        ) : (
          <span />
        )}
      </nav>
    </main>
  );
}
