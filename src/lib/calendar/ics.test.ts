import { describe, expect, it } from "vitest";
import { buildDeadlinesIcs } from "./ics";

const NOW = new Date(2026, 6, 9); // 2026-07-09（本地時間，避免時區跨日問題）

describe("buildDeadlinesIcs", () => {
  const ics = buildDeadlinesIcs(NOW);

  it("外層 VCALENDAR 結構完整", () => {
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("VERSION:2.0");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("恰好產生 10 個事件（6 營業稅 + 1 五月報稅季 + 2 扣繳 + 1 每日提醒）", () => {
    const count = (ics.match(/BEGIN:VEVENT/g) ?? []).length;
    expect(count).toBe(10);
  });

  it("6 次雙月營業稅申報，日期為當年 1/3/5/7/9/11 月 15 日", () => {
    for (const month of [1, 3, 5, 7, 9, 11]) {
      const mm = month.toString().padStart(2, "0");
      expect(ics).toContain(`DTSTART;VALUE=DATE:2026${mm}15`);
    }
  });

  it("5 月報稅季為 5/1 至 6/1（區間結束日為隔天，符合全天事件慣例）", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20260501");
    expect(ics).toContain("DTEND;VALUE=DATE:20260601");
  });

  it("扣繳彙報 1/31、填發 2/10", () => {
    expect(ics).toContain("DTSTART;VALUE=DATE:20260131");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260210");
  });

  it("每日複習提醒從產生當下日期開始、每日重複、時間為 20:00", () => {
    expect(ics).toContain("DTSTART:20260709T200000");
    expect(ics).toContain("RRULE:FREQ=DAILY");
  });

  it("換年時日期正確使用新年度", () => {
    const nextYearIcs = buildDeadlinesIcs(new Date(2027, 0, 5));
    expect(nextYearIcs).toContain("DTSTART;VALUE=DATE:20270115");
    expect(nextYearIcs).toContain("DTSTART;VALUE=DATE:20270501");
  });
});
