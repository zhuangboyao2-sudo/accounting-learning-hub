import { getAllMaterials } from "./materials";
import { getGlossary } from "./glossary";

export interface SearchItem {
  title: string;
  href: string;
  type: "教材" | "辭典";
}

/** build-time／request-time 建立的簡易全站搜尋索引（教材標題＋辭典條目），純前端過濾，不引入外部服務 */
export function getSearchIndex(): SearchItem[] {
  const materials = getAllMaterials().flatMap(({ subject, items }) =>
    items.map((item) => ({
      title: item.title,
      href: `/materials/${subject}/${item.id}`,
      type: "教材" as const,
    })),
  );
  const glossary = getGlossary().map((entry) => ({
    title: entry.term,
    href: `/reference/glossary#${entry.id}`,
    type: "辭典" as const,
  }));
  return [...materials, ...glossary];
}
