import { describe, expect, it } from "vitest";
import { buildLevelSequence } from "./levels";
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
