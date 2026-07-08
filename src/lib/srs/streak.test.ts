import { describe, expect, it } from "vitest";
import { computeNextStreak } from "./streak";

describe("computeNextStreak", () => {
  it("沒有現有紀錄：從 1 開始", () => {
    expect(computeNextStreak(undefined, "2026-07-08")).toEqual({
      count: 1,
      lastActiveDate: "2026-07-08",
    });
  });

  it("今天已經計過：維持不變", () => {
    const current = { count: 5, lastActiveDate: "2026-07-08" };
    expect(computeNextStreak(current, "2026-07-08")).toEqual(current);
  });

  it("上次活躍是昨天：連續天數 +1", () => {
    const current = { count: 5, lastActiveDate: "2026-07-07" };
    expect(computeNextStreak(current, "2026-07-08")).toEqual({
      count: 6,
      lastActiveDate: "2026-07-08",
    });
  });

  it("中斷超過一天：歸 1 重新開始", () => {
    const current = { count: 5, lastActiveDate: "2026-07-01" };
    expect(computeNextStreak(current, "2026-07-08")).toEqual({
      count: 1,
      lastActiveDate: "2026-07-08",
    });
  });

  it("跨月份仍正確判斷連續隔天", () => {
    const current = { count: 3, lastActiveDate: "2026-06-30" };
    expect(computeNextStreak(current, "2026-07-01")).toEqual({
      count: 4,
      lastActiveDate: "2026-07-01",
    });
  });
});
