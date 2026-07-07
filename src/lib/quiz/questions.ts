import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { questionSchema } from "@/lib/content/schemas";
import type { Question, Subject } from "@/types/content";

export { shuffle, pickRandom } from "./shuffle";

const QUESTIONS_ROOT = join(process.cwd(), "content", "questions");
const QUESTION_DIRS = ["generated", "past-exams"];

const SUBJECT_PREFIX: Record<Subject, string> = {
  accounting: "acc",
  "bookkeeping-law": "law",
  "tax-law": "tl",
  "tax-practice": "tp",
  "practice-zone": "pz",
};

function readQuestionFile(file: string): Question[] {
  const raw = readFileSync(file, "utf-8");
  const json = JSON.parse(raw);
  const items = Array.isArray(json) ? json : [json];
  return items.map((item) => questionSchema.parse(item));
}

/** 讀取指定科目全部題目（含 generated 與 past-exams 兩個來源目錄） */
export function getQuestionsBySubject(subject: Subject): Question[] {
  const prefix = SUBJECT_PREFIX[subject];
  const questions: Question[] = [];
  for (const dirName of QUESTION_DIRS) {
    const dir = join(QUESTIONS_ROOT, dirName);
    let files: string[];
    try {
      files = readdirSync(dir).filter((f) => f.startsWith(`${prefix}-`) && f.endsWith(".json"));
    } catch {
      continue;
    }
    for (const file of files) {
      questions.push(...readQuestionFile(join(dir, file)));
    }
  }
  return questions;
}

/** 讀取全部科目的全部題目 */
export function getAllQuestions(): Question[] {
  const subjects = Object.keys(SUBJECT_PREFIX) as Subject[];
  return subjects.flatMap((subject) => getQuestionsBySubject(subject));
}

/** 依教材節 id（material_ref）反查對應題目，供「回教材」與節末快測複用 */
export function getQuestionsByMaterialRef(materialRef: string): Question[] {
  return getAllQuestions().filter((q) => q.material_ref === materialRef);
}

/** 依標籤篩選題目（跨科目），供混合練習使用 */
export function getQuestionsByTags(tags: string[]): Question[] {
  const tagSet = new Set(tags);
  return getAllQuestions().filter((q) => q.tags?.some((tag) => tagSet.has(tag)));
}
