import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { flashcardSchema } from "@/lib/content/schemas";
import type { Flashcard, Subject } from "@/types/content";

const FLASHCARDS_DIR = join(process.cwd(), "content", "flashcards");

function readFlashcardFile(file: string): Flashcard[] {
  const raw = readFileSync(file, "utf-8");
  const json = JSON.parse(raw);
  const items = Array.isArray(json) ? json : [json];
  return items.map((item) => flashcardSchema.parse(item));
}

/** 讀取全部複習卡 */
export function getAllFlashcards(): Flashcard[] {
  let files: string[];
  try {
    files = readdirSync(FLASHCARDS_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  return files.flatMap((file) => readFlashcardFile(join(FLASHCARDS_DIR, file)));
}

/** 讀取指定科目的全部複習卡 */
export function getFlashcardsBySubject(subject: Subject): Flashcard[] {
  return getAllFlashcards().filter((card) => card.subject === subject);
}

/** 依教材節 id（material_ref）反查對應複習卡，供節末快測答錯串聯 SRS 使用 */
export function getFlashcardsByMaterialRef(materialRef: string): Flashcard[] {
  return getAllFlashcards().filter((card) => card.material_ref === materialRef);
}
