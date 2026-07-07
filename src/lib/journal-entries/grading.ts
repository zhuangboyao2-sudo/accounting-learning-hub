import type { JournalEntryLine, JournalEntryScenario } from "@/types/content";

function toTotalsMap(lines: JournalEntryLine[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const line of lines) {
    const key = `${line.account}|${line.side}`;
    totals.set(key, (totals.get(key) ?? 0) + line.amount);
  }
  return totals;
}

/**
 * 比對使用者提交的分錄與正確答案。允許把同一科目同一借貸方向拆成多行，
 * 只要各科目＋借貸方向的加總金額與正確答案一致即視為正確。
 */
export function isEntryCorrect(scenario: JournalEntryScenario, submitted: JournalEntryLine[]): boolean {
  const expected = toTotalsMap(scenario.lines);
  const actual = toTotalsMap(submitted);
  if (expected.size !== actual.size) return false;
  for (const [key, amount] of expected) {
    if (actual.get(key) !== amount) return false;
  }
  return true;
}
