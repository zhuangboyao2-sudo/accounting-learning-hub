import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";
import { materialFrontmatterSchema } from "./schemas";
import type { MaterialFrontmatter, Subject } from "@/types/content";
import { SUBJECTS } from "@/types/content";

const MATERIALS_ROOT = join(process.cwd(), "content", "materials");

function readMaterialFile(subject: Subject, id: string): { frontmatter: MaterialFrontmatter; body: string } | null {
  const file = join(MATERIALS_ROOT, subject, `${id}.mdx`);
  let raw: string;
  try {
    raw = readFileSync(file, "utf-8");
  } catch {
    return null;
  }
  const { data, content } = matter(raw);
  const frontmatter = materialFrontmatterSchema.parse(data);
  return { frontmatter, body: content };
}

/** 列出某科目下所有教材節的 frontmatter，依章節、順序排序 */
export function getMaterialsBySubject(subject: Subject): MaterialFrontmatter[] {
  const dir = join(MATERIALS_ROOT, subject);
  let files: string[];
  try {
    files = readdirSync(dir).filter((f) => f.endsWith(".mdx"));
  } catch {
    return [];
  }
  const items = files
    .map((f) => f.replace(/\.mdx$/, ""))
    .map((id) => readMaterialFile(subject, id))
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .map((item) => item.frontmatter);
  return items.sort((a, b) => a.chapter - b.chapter || a.order - b.order);
}

/** 列出全部科目的教材 frontmatter，依 §5 科目順序分組 */
export function getAllMaterials(): { subject: Subject; items: MaterialFrontmatter[] }[] {
  return SUBJECTS.map(({ id }) => ({ subject: id, items: getMaterialsBySubject(id) }));
}

/** 讀取單一教材節的 frontmatter 與未編譯的 MDX 內文 */
export function getMaterialContent(subject: Subject, id: string) {
  return readMaterialFile(subject, id);
}

/** 取得指定節的前一節／後一節（同科目內），供頁尾導覽使用 */
export function getAdjacentMaterials(subject: Subject, id: string) {
  const items = getMaterialsBySubject(subject);
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return { prev: null, next: null };
  return {
    prev: index > 0 ? items[index - 1] : null,
    next: index < items.length - 1 ? items[index + 1] : null,
  };
}
