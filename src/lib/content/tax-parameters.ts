import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const TAX_PARAMS_DIR = join(process.cwd(), "content", "tax-parameters");

/** 取得目前可用的最新年度稅務參數（見計畫 §6.3），教材與試算器一律透過此函式取值 */
export function getLatestTaxParameters(): Record<string, unknown> {
  const files = readdirSync(TAX_PARAMS_DIR).filter((f) => f.endsWith(".json"));
  const years = files
    .map((f) => Number.parseInt(f.replace(".json", ""), 10))
    .filter((n) => !Number.isNaN(n));
  const latestYear = Math.max(...years);
  const raw = readFileSync(join(TAX_PARAMS_DIR, `${latestYear}.json`), "utf-8");
  return JSON.parse(raw);
}

/** 依 dot path（如 "individualIncomeTax.personalExemption"）取值 */
export function getTaxParamValue(path: string): unknown {
  const params = getLatestTaxParameters();
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in acc) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, params);
}
