import { describe, expect, it } from "vitest";
import { buildLevelSequence, findResumeIndex } from "./levels";
import type { SimScenario } from "@/types/content";

function makeScenario(monthCount = 12): SimScenario {
  return {
    id: "s1",
    companyName: "測試公司",
    industry: "測試業",
    verified_at: "2026-01-01",
    openingEntry: {
      id: "opening",
      scenario: "期初",
      lines: [
        { account: "銀行存款", side: "debit", amount: 1 },
        { account: "股本", side: "credit", amount: 1 },
      ],
      explanation: "e",
      verified_at: "2026-01-01",
    },
    months: Array.from({ length: monthCount }, (_, i) => ({
      month: i + 1,
      narrative: `第 ${i + 1} 月`,
      transactions: [],
    })),
  };
}

describe("buildLevelSequence", () => {
  it("12 個月的劇本：開頭 opening，結尾依序 withholding/closing/income-tax", () => {
    const levels = buildLevelSequence(makeScenario());
    expect(levels[0]).toEqual({ type: "opening" });
    expect(levels.slice(-3)).toEqual([
      { type: "withholding" },
      { type: "closing" },
      { type: "income-tax" },
    ]);
  });

  it("總關卡數 = 1(opening) + 12(月) + 6(雙月營業稅) + 3(扣繳/結帳/營所稅) = 22", () => {
    expect(buildLevelSequence(makeScenario())).toHaveLength(22);
  });

  it("每個偶數月結束後緊接著插入對應期間的營業稅申報關卡", () => {
    const levels = buildLevelSequence(makeScenario());
    const monthIndex = levels.findIndex((l) => l.type === "month" && l.month === 2);
    expect(levels[monthIndex + 1]).toEqual({ type: "vat", fromMonth: 1, toMonth: 2 });

    const month12Index = levels.findIndex((l) => l.type === "month" && l.month === 12);
    expect(levels[month12Index + 1]).toEqual({ type: "vat", fromMonth: 11, toMonth: 12 });
  });

  it("奇數月結束後不立刻插入營業稅關卡", () => {
    const levels = buildLevelSequence(makeScenario());
    const monthIndex = levels.findIndex((l) => l.type === "month" && l.month === 1);
    expect(levels[monthIndex + 1]).toEqual({ type: "month", month: 2 });
  });

  it("月份順序依 month 排序，不依劇本檔案內順序", () => {
    const scenario = makeScenario(2);
    scenario.months.reverse();
    const levels = buildLevelSequence(scenario);
    const monthLevels = levels.filter((l) => l.type === "month");
    expect(monthLevels).toEqual([
      { type: "month", month: 1 },
      { type: "month", month: 2 },
    ]);
  });
});

describe("findResumeIndex", () => {
  it("沒有任何完成紀錄：從第 0 關開始", () => {
    expect(findResumeIndex(5, new Set())).toBe(0);
  });

  it("前幾關已完成：從第一個未完成的關卡開始", () => {
    expect(findResumeIndex(5, new Set([0, 1, 2]))).toBe(3);
  });

  it("中間有關卡未完成：仍回傳最早的未完成關卡（不可跳關）", () => {
    expect(findResumeIndex(5, new Set([0, 2, 3]))).toBe(1);
  });

  it("全部完成：回傳 levelCount", () => {
    expect(findResumeIndex(3, new Set([0, 1, 2]))).toBe(3);
  });
});
