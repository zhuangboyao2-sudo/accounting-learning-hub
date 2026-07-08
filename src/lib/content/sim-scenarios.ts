import { readFileSync } from "node:fs";
import { join } from "node:path";
import { simScenarioSchema } from "@/lib/content/schemas";
import type { SimScenario } from "@/types/content";

const SIM_SCENARIOS_DIR = join(process.cwd(), "content", "sim-scenarios");

/** 讀取單一虛擬公司劇本（Phase 6 全年帳務模擬） */
export function getSimScenario(id: string): SimScenario | null {
  const file = join(SIM_SCENARIOS_DIR, `${id}.json`);
  let raw: string;
  try {
    raw = readFileSync(file, "utf-8");
  } catch {
    return null;
  }
  return simScenarioSchema.parse(JSON.parse(raw));
}
