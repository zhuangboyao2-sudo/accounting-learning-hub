import { describe, expect, it } from "vitest";
import { chunk, nextLastPulledAt, outboxId, shouldApplyRemote, type RemoteRow } from "./merge";

function row(overrides: Partial<RemoteRow>): RemoteRow {
  return {
    table_name: "progress",
    key: "acc-01-01",
    data: {},
    updated_at: "2026-07-13T00:00:00.000Z",
    device_id: "other-device",
    ...overrides,
  };
}

describe("outboxId", () => {
  it("以 table|key 組成，鍵含冒號等字元不會混淆", () => {
    expect(outboxId("simProgress", "metal-factory-2026:3")).toBe("simProgress|metal-factory-2026:3");
    expect(outboxId("progress", "acc-01-01")).not.toBe(outboxId("notes", "acc-01-01"));
  });
});

describe("chunk", () => {
  it("依大小切批，餘數成最後一批", () => {
    expect(chunk([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
  it("空陣列回傳空批次", () => {
    expect(chunk([], 500)).toEqual([]);
  });
});

describe("shouldApplyRemote", () => {
  it("本地有未上傳變更時略過雲端版本（本地為準）", () => {
    const pending = new Set([outboxId("progress", "acc-01-01")]);
    expect(shouldApplyRemote(pending, row({}))).toBe(false);
  });
  it("無未上傳變更時套用雲端版本", () => {
    const pending = new Set([outboxId("progress", "acc-02-01")]);
    expect(shouldApplyRemote(pending, row({}))).toBe(true);
  });
  it("不同表的同名 key 不互相影響", () => {
    const pending = new Set([outboxId("notes", "acc-01-01")]);
    expect(shouldApplyRemote(pending, row({ table_name: "progress" }))).toBe(true);
  });
});

describe("nextLastPulledAt", () => {
  it("取本批最大 updated_at", () => {
    const rows = [
      row({ updated_at: "2026-07-13T01:00:00.000Z" }),
      row({ updated_at: "2026-07-13T03:00:00.000Z" }),
      row({ updated_at: "2026-07-13T02:00:00.000Z" }),
    ];
    expect(nextLastPulledAt(rows, "")).toBe("2026-07-13T03:00:00.000Z");
  });
  it("批次皆早於目前起點時維持不變", () => {
    const rows = [row({ updated_at: "2026-07-13T01:00:00.000Z" })];
    expect(nextLastPulledAt(rows, "2026-07-14T00:00:00.000Z")).toBe("2026-07-14T00:00:00.000Z");
  });
});
