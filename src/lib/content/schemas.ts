import { z } from "zod";

// zod schema 對應 src/types/content.ts，供 scripts/validate-content.ts 在建置期做執行期驗證

const subjectSchema = z.enum([
  "accounting",
  "tax-practice",
  "tax-law",
  "bookkeeping-law",
  "practice-zone",
]);

// gray-matter 解析 MDX frontmatter 的 YAML 時，會把 2026-07-05 這類寫法自動轉成 Date 物件；
// JSON 內容檔則維持字串，這裡統一正規化成 YYYY-MM-DD 字串再驗證格式。
const dateStringSchema = z.preprocess((value) => {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  return value;
}, z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "verified_at 必須是 YYYY-MM-DD 格式"));

export const materialFrontmatterSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  subject: subjectSchema,
  chapter: z.number().int().positive(),
  order: z.number().int().positive(),
  law_basis: z.array(z.string()).optional(),
  verified_at: dateStringSchema,
  sources: z.array(z.string().url()).optional(),
});

export const questionSchema = z.object({
  id: z.string().min(1),
  subject: subjectSchema,
  source: z.object({
    type: z.enum(["past-exam", "generated"]),
    year: z.number().int().optional(),
    number: z.number().int().optional(),
  }),
  type: z.enum(["single-choice", "multi-choice", "essay"]),
  stem: z.string().min(1),
  options: z.array(z.string()).optional(),
  answer: z.array(z.number().int()).optional(),
  explanation: z.string().min(1),
  material_ref: z.string().optional(),
  tags: z.array(z.string()).optional(),
  verified_at: dateStringSchema,
});

export const flashcardSchema = z.object({
  id: z.string().min(1),
  subject: subjectSchema,
  front: z.string().min(1),
  back: z.string().min(1),
  material_ref: z.string().optional(),
  verified_at: dateStringSchema,
});

export const glossaryEntrySchema = z.object({
  id: z.string().min(1),
  term: z.string().min(1),
  definition: z.string().min(1),
  material_ref: z.string().optional(),
});

export const taxParametersSchema = z
  .object({
    year: z.number().int(),
    verified_at: dateStringSchema,
    sources: z.array(z.string().url()),
  })
  .passthrough();
