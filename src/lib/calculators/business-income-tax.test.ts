import { describe, expect, it } from "vitest";
import { calculateBusinessIncomeTax } from "./business-income-tax";
import { getLatestTaxParameters } from "@/lib/content/tax-parameters";

const params = (
  getLatestTaxParameters() as {
    businessIncomeTax: {
      rate: number;
      smallProfitExemptionThreshold: number;
      halfTaxBufferThreshold: number;
      halfTaxMultiplier: number;
    };
  }
).businessIncomeTax;

describe("calculateBusinessIncomeTax", () => {
  it("課稅所得額未達免稅門檻：免稅", () => {
    const result = calculateBusinessIncomeTax({ revenue: 500000, costsAndExpenses: 400000 }, params);
    expect(result.taxableIncome).toBe(100000);
    expect(result.tax).toBe(0);
    expect(result.bracket).toBe("exempt");
  });

  it("課稅所得額在半數限制級距內：稅額取全額課稅與半數限制較小者", () => {
    const taxableIncome = 150000;
    const result = calculateBusinessIncomeTax(
      { revenue: taxableIncome + 300000, costsAndExpenses: 300000 },
      params,
    );
    const fullRateTax = taxableIncome * params.rate;
    const halfTaxCap = (taxableIncome - params.smallProfitExemptionThreshold) * params.halfTaxMultiplier;
    expect(result.taxableIncome).toBe(taxableIncome);
    expect(result.tax).toBe(Math.round(Math.min(fullRateTax, halfTaxCap)));
    expect(result.bracket).toBe("half-tax-buffer");
  });

  it("課稅所得額超過半數限制門檻：全額按稅率課徵", () => {
    const taxableIncome = 500000;
    const result = calculateBusinessIncomeTax(
      { revenue: taxableIncome + 300000, costsAndExpenses: 300000 },
      params,
    );
    expect(result.taxableIncome).toBe(taxableIncome);
    expect(result.tax).toBe(Math.round(taxableIncome * params.rate));
    expect(result.bracket).toBe("full-rate");
  });

  it("成本費用超過收入：課稅所得額不為負，視為 0 且免稅", () => {
    const result = calculateBusinessIncomeTax({ revenue: 100000, costsAndExpenses: 200000 }, params);
    expect(result.taxableIncome).toBe(0);
    expect(result.tax).toBe(0);
    expect(result.bracket).toBe("exempt");
  });
});
