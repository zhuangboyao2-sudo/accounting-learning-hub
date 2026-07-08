import { describe, expect, it } from "vitest";
import { isBackupStale } from "./backup";

const NOW = new Date("2026-07-08T00:00:00.000Z");

describe("isBackupStale", () => {
  it("從未備份過：視為過期", () => {
    expect(isBackupStale(undefined, NOW)).toBe(true);
  });

  it("30 天內備份過：不過期", () => {
    expect(isBackupStale("2026-07-01T00:00:00.000Z", NOW)).toBe(false);
  });

  it("超過 30 天沒備份：過期", () => {
    expect(isBackupStale("2026-06-01T00:00:00.000Z", NOW)).toBe(true);
  });
});
