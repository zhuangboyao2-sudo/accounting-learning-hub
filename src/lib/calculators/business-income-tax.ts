export interface BusinessIncomeTaxInput {
  revenue: number;
  costsAndExpenses: number;
}

export interface BusinessIncomeTaxParams {
  rate: number;
  smallProfitExemptionThreshold: number;
  halfTaxBufferThreshold: number;
  halfTaxMultiplier: number;
}

export type BusinessIncomeTaxBracket = "exempt" | "half-tax-buffer" | "full-rate";

export interface BusinessIncomeTaxResult {
  taxableIncome: number;
  tax: number;
  bracket: BusinessIncomeTaxBracket;
}

/** 依現行營所稅三級距公式試算應納稅額，級距門檻與稅率一律由呼叫端傳入 tax-parameters 的值，不得硬編碼。 */
export function calculateBusinessIncomeTax(
  input: BusinessIncomeTaxInput,
  params: BusinessIncomeTaxParams,
): BusinessIncomeTaxResult {
  const taxableIncome = Math.max(0, input.revenue - input.costsAndExpenses);

  if (taxableIncome <= params.smallProfitExemptionThreshold) {
    return { taxableIncome, tax: 0, bracket: "exempt" };
  }

  if (taxableIncome <= params.halfTaxBufferThreshold) {
    const fullRateTax = taxableIncome * params.rate;
    const halfTaxCap = (taxableIncome - params.smallProfitExemptionThreshold) * params.halfTaxMultiplier;
    return { taxableIncome, tax: Math.round(Math.min(fullRateTax, halfTaxCap)), bracket: "half-tax-buffer" };
  }

  return { taxableIncome, tax: Math.round(taxableIncome * params.rate), bracket: "full-rate" };
}
