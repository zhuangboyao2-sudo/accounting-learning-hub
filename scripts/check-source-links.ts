// 每月維運排程用：檢查 content/ 下所有內容檔 sources 連結是否仍可連上，輸出失效清單。
// 用法：npm run check-source-links
// 僅供資訊輸出，不影響 CI 是否通過（連結失效不代表內容錯誤，只是需要人工複查來源）。

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import matter from "gray-matter";

const ROOT = join(__dirname, "..");
const CONTENT_DIR = join(ROOT, "content");
const TIMEOUT_MS = 10_000;

function walk(dir: string, extensions: string[]): string[] {
  let entries: string[];
  try {
    entries = readdirSync(dir);
  } catch {
    return [];
  }
  const results: string[] = [];
  for (const entry of entries) {
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

function collectSources(): Map<string, Set<string>> {
  const urlToFiles = new Map<string, Set<string>>();

  const addSource = (file: string, url: string) => {
    if (!urlToFiles.has(url)) urlToFiles.set(url, new Set());
    urlToFiles.get(url)!.add(relative(ROOT, file));
  };

  for (const file of walk(join(CONTENT_DIR, "materials"), [".mdx"])) {
    const { data } = matter(readFileSync(file, "utf-8"));
    for (const url of data.sources ?? []) addSource(file, url);
  }

  for (const dir of ["questions", "flashcards"]) {
    for (const file of walk(join(CONTENT_DIR, dir), [".json"])) {
      const items = JSON.parse(readFileSync(file, "utf-8"));
      for (const item of Array.isArray(items) ? items : [items]) {
        for (const url of item.sources ?? []) addSource(file, url);
      }
    }
  }

  return urlToFiles;
}

async function checkUrl(url: string): Promise<boolean> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    // 部分政府網站會擋預設 User-Agent（回 403），補上瀏覽器 UA 降低誤判
    const res = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; ContentLinkCheck/1.0)" },
    });
    return res.ok;
  } catch {
    return false;
  } finally {
    clearTimeout(timeout);
  }
}

async function main() {
  const urlToFiles = collectSources();
  const urls = [...urlToFiles.keys()];
  console.log(`檢查 ${urls.length} 個來源連結…`);

  const broken: { url: string; files: string[] }[] = [];
  for (const url of urls) {
    const ok = await checkUrl(url);
    if (!ok) broken.push({ url, files: [...urlToFiles.get(url)!] });
  }

  if (broken.length === 0) {
    console.log("✓ 所有來源連結皆可正常連上。");
    return;
  }

  console.warn(`\n⚠ 發現 ${broken.length} 個可能失效的來源連結：`);
  for (const { url, files } of broken) {
    console.warn(`  - ${url}`);
    for (const f of files) console.warn(`      引用於 ${f}`);
  }
  console.warn("\n請人工確認上述連結（可能是暫時性錯誤或官網改版），並更新對應內容的 sources 與查證日期。");
}

main();
