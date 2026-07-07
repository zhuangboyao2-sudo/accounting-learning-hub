import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
import { journalEntryScenarioSchema } from "@/lib/content/schemas";
import type { JournalEntryScenario } from "@/types/content";

const JOURNAL_ENTRIES_DIR = join(process.cwd(), "content", "journal-entries");

function readScenarioFile(file: string): JournalEntryScenario[] {
  const raw = readFileSync(file, "utf-8");
  const json = JSON.parse(raw);
  const items = Array.isArray(json) ? json : [json];
  return items.map((item) => journalEntryScenarioSchema.parse(item));
}

/** 讀取全部分錄練習情境（供分錄練習器使用） */
export function getAllJournalEntryScenarios(): JournalEntryScenario[] {
  let files: string[];
  try {
    files = readdirSync(JOURNAL_ENTRIES_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  return files.flatMap((file) => readScenarioFile(join(JOURNAL_ENTRIES_DIR, file)));
}
