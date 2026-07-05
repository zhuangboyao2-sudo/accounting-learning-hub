import { readFileSync } from "node:fs";
import { join } from "node:path";
import { glossaryEntrySchema } from "./schemas";
import type { GlossaryEntry } from "@/types/content";

const GLOSSARY_FILE = join(process.cwd(), "content", "glossary.json");

export function getGlossary(): GlossaryEntry[] {
  let raw: string;
  try {
    raw = readFileSync(GLOSSARY_FILE, "utf-8");
  } catch {
    return [];
  }
  const json = JSON.parse(raw);
  const items = Array.isArray(json) ? json : [json];
  return items.map((item) => glossaryEntrySchema.parse(item));
}

export function getGlossaryEntry(id: string): GlossaryEntry | undefined {
  return getGlossary().find((entry) => entry.id === id);
}
