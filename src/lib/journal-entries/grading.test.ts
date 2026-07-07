import { describe, expect, it } from "vitest";
import { isEntryCorrect } from "./grading";
import type { JournalEntryLine, JournalEntryScenario } from "@/types/content";

function makeScenario(lines: JournalEntryLine[]): JournalEntryScenario {
  return {
    id: "je-test",
    scenario: "情境",
    lines,
    explanation: "詳解",
    verified_at: "2026-01-01",
  };
}

const correctLines: JournalEntryLine[] = [
  { account: "辦公用品", side: "debit", amount: 3000 },
  { account: "進項稅額", side: "debit", amount: 150 },
  { account: "現金", side: "credit", amount: 3150 },
];

describe("isEntryCorrect", () => {
  it("完全正確：科目、借貸方向、金額皆一致", () => {
    const scenario = makeScenario(correctLines);
    expect(isEntryCorrect(scenario, correctLines)).toBe(true);
  });

  it("科目錯：其中一行科目不同", () => {
    const scenario = makeScenario(correctLines);
    const submitted: JournalEntryLine[] = [
      { account: "辦公用品", side: "debit", amount: 3000 },
      { account: "銷項稅額", side: "debit", amount: 150 },
      { account: "現金", side: "credit", amount: 3150 },
    ];
    expect(isEntryCorrect(scenario, submitted)).toBe(false);
  });

  it("借貸方向錯：科目對但方向錯", () => {
    const scenario = makeScenario(correctLines);
    const submitted: JournalEntryLine[] = [
      { account: "辦公用品", side: "credit", amount: 3000 },
      { account: "進項稅額", side: "debit", amount: 150 },
      { account: "現金", side: "credit", amount: 3150 },
    ];
    expect(isEntryCorrect(scenario, submitted)).toBe(false);
  });

  it("金額錯：其中一行金額不同", () => {
    const scenario = makeScenario(correctLines);
    const submitted: JournalEntryLine[] = [
      { account: "辦公用品", side: "debit", amount: 3000 },
      { account: "進項稅額", side: "debit", amount: 100 },
      { account: "現金", side: "credit", amount: 3150 },
    ];
    expect(isEntryCorrect(scenario, submitted)).toBe(false);
  });

  it("拆行但同科目同方向加總正確：仍視為對", () => {
    const scenario = makeScenario(correctLines);
    const submitted: JournalEntryLine[] = [
      { account: "辦公用品", side: "debit", amount: 1000 },
      { account: "辦公用品", side: "debit", amount: 2000 },
      { account: "進項稅額", side: "debit", amount: 150 },
      { account: "現金", side: "credit", amount: 3150 },
    ];
    expect(isEntryCorrect(scenario, submitted)).toBe(true);
  });

  it("多出一行不相關科目：視為錯", () => {
    const scenario = makeScenario(correctLines);
    const submitted: JournalEntryLine[] = [
      ...correctLines,
      { account: "銀行存款", side: "debit", amount: 1 },
    ];
    expect(isEntryCorrect(scenario, submitted)).toBe(false);
  });

  it("少一行：視為錯", () => {
    const scenario = makeScenario(correctLines);
    const submitted = correctLines.slice(0, 2);
    expect(isEntryCorrect(scenario, submitted)).toBe(false);
  });
});
