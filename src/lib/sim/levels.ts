import type { SimScenario } from "@/types/content";

export type SimLevel =
  | { type: "opening" }
  | { type: "month"; month: number }
  | { type: "vat"; fromMonth: number; toMonth: number }
  | { type: "withholding" }
  | { type: "closing" }
  | { type: "income-tax" };

/**
 * 依劇本產生固定關卡序列：期初 → 每月交易（雙月結束後插入營業稅申報）
 * → 扣繳申報 → 年底結帳 → 營所稅結算。程式只認月份序號，劇本可任意抽換。
 */
export function buildLevelSequence(scenario: SimScenario): SimLevel[] {
  const levels: SimLevel[] = [{ type: "opening" }];
  const months = [...scenario.months].sort((a, b) => a.month - b.month);
  for (const { month } of months) {
    levels.push({ type: "month", month });
    if (month % 2 === 0) {
      levels.push({ type: "vat", fromMonth: month - 1, toMonth: month });
    }
  }
  levels.push({ type: "withholding" }, { type: "closing" }, { type: "income-tax" });
  return levels;
}

/** 依已完成的關卡索引集合，找出下一個尚未完成的關卡索引（全部完成時回傳 levelCount）。 */
export function findResumeIndex(levelCount: number, doneIndices: Set<number>): number {
  for (let i = 0; i < levelCount; i++) {
    if (!doneIndices.has(i)) return i;
  }
  return levelCount;
}
