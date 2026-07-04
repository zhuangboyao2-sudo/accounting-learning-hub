// 內容驗證腳本：檢查 content/ 下所有教材／題庫／複習卡／參數檔是否符合 schema，
// 並列出 verified_at 超過 12 個月的待複驗內容（§6.2、§8.2）。
// 用法：npm run validate-content

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import matter from "gray-matter";
import type { z } from "zod";
import {
  materialFrontmatterSchema,
  questionSchema,
  flashcardSchema,
  glossaryEntrySchema,
  taxParametersSchema,
} from "../src/lib/content/schemas";

const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content");
const STALE_MONTHS = 12;

let hasErrors = false;
const staleFiles: { file: string; verifiedAt: string }[] = [];

function walk(dir: string, extensions: string[]): string[] {
  if (!existsDir(dir)) return [];
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...walk(full, extensions));
    } else if (extensions.some((ext) => entry.endsWith(ext))) {
      results.push(full);
    }
  }
  return results;
}

function existsDir(dir: string): boolean {
  try {
    return statSync(dir).isDirectory();
  } catch {
    return false;
  }
}

function reportError(file: string, error: unknown) {
  hasErrors = true;
  const rel = relative(ROOT, file);
  console.error(`✗ ${rel}`);
  if (error && typeof error === "object" && "issues" in error) {
    for (const issue of (error as z.ZodError).issues) {
      console.error(`  - ${issue.path.join(".")}: ${issue.message}`);
    }
  } else {
    console.error(`  - ${String(error)}`);
  }
}

function trackVerifiedAt(file: string, verifiedAt: string) {
  const verifiedDate = new Date(verifiedAt);
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - STALE_MONTHS);
  if (verifiedDate < cutoff) {
    staleFiles.push({ file: relative(ROOT, file), verifiedAt });
  }
}

function validateMaterials() {
  const files = walk(join(CONTENT_DIR, "materials"), [".mdx"]);
  for (const file of files) {
    const raw = readFileSync(file, "utf-8");
    const { data } = matter(raw);
    const result = materialFrontmatterSchema.safeParse(data);
    if (!result.success) {
      reportError(file, result.error);
    } else {
      trackVerifiedAt(file, result.data.verified_at);
    }
  }
}

function validateJsonArray<T extends { verified_at?: string }>(
  dir: string,
  schema: z.ZodType<T>,
) {
  const files = walk(dir, [".json"]);
  for (const file of files) {
    const raw = readFileSync(file, "utf-8");
    let json: unknown;
    try {
      json = JSON.parse(raw);
    } catch (error) {
      reportError(file, error);
      continue;
    }
    const items = Array.isArray(json) ? json : [json];
    for (const item of items) {
      const result = schema.safeParse(item);
      if (!result.success) {
        reportError(file, result.error);
      } else if (result.data.verified_at) {
        trackVerifiedAt(file, result.data.verified_at);
      }
    }
  }
}

function validateGlossary() {
  const file = join(CONTENT_DIR, "glossary.json");
  if (!existsFile(file)) return;
  const raw = readFileSync(file, "utf-8");
  const json = JSON.parse(raw);
  const items = Array.isArray(json) ? json : [json];
  for (const item of items) {
    const result = glossaryEntrySchema.safeParse(item);
    if (!result.success) reportError(file, result.error);
  }
}

function existsFile(file: string): boolean {
  try {
    return statSync(file).isFile();
  } catch {
    return false;
  }
}

function validateTaxParameters() {
  const files = walk(join(CONTENT_DIR, "tax-parameters"), [".json"]);
  for (const file of files) {
    const raw = readFileSync(file, "utf-8");
    const json = JSON.parse(raw);
    const result = taxParametersSchema.safeParse(json);
    if (!result.success) {
      reportError(file, result.error);
    } else {
      trackVerifiedAt(file, result.data.verified_at);
    }
  }
}

validateMaterials();
validateJsonArray(join(CONTENT_DIR, "questions"), questionSchema);
validateJsonArray(join(CONTENT_DIR, "flashcards"), flashcardSchema);
validateGlossary();
validateTaxParameters();

if (staleFiles.length > 0) {
  console.warn(`\n⚠ 待複驗清單（verified_at 超過 ${STALE_MONTHS} 個月，見計畫 §8.2）：`);
  for (const { file, verifiedAt } of staleFiles) {
    console.warn(`  - ${file}（${verifiedAt}）`);
  }
}

if (hasErrors) {
  console.error("\n內容驗證失敗。");
  process.exit(1);
} else {
  console.log("✓ 內容驗證通過。");
}
