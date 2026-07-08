import { describe, expect, it } from "vitest";
import { calculateBusinessTax } from "./business-tax";
import { getLatestTaxParameters } from "@/lib/content/tax-parameters";

const rate = (
  getLatestTaxParameters() as { businessTax: { generalRate: number } }
).businessTax.generalRate;

describe("calculateBusinessTax", () => {
  it("銷項大於進項：應納稅額為正，非溢付", () => {
    const result = calculateBusinessTax({ salesAmount: 100000, purchasesAmount: 40000 }, rate);
    expect(result.outputTax).toBe(Math.round(100000 * rate));
    expect(result.inputTax).toBe(Math.round(40000 * rate));
    expect(result.netTax).toBe(Math.round(100000 * rate) - Math.round(40000 * rate));
    expect(result.isRefundable).toBe(false);
  });

  it("進項大於銷項：溢付稅額為負，isRefundable 為 true", () => {
    const result = calculateBusinessTax({ salesAmount: 40000, purchasesAmount: 100000 }, rate);
    expect(result.netTax).toBeLessThan(0);
    expect(result.isRefundable).toBe(true);
  });

  it("銷項等於進項：應納稅額為 0，非溢付", () => {
    const result = calculateBusinessTax({ salesAmount: 50000, purchasesAmount: 50000 }, rate);
    expect(result.netTax).toBe(0);
    expect(result.isRefundable).toBe(false);
  });

  it("零銷售零進貨：全部為 0", () => {
    const result = calculateBusinessTax({ salesAmount: 0, purchasesAmount: 0 }, rate);
    expect(result).toEqual({ outputTax: 0, inputTax: 0, netTax: 0, isRefundable: false });
  });
});
