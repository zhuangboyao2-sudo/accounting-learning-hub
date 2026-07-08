export interface BusinessTaxInput {
  salesAmount: number;
  purchasesAmount: number;
}

export interface BusinessTaxResult {
  outputTax: number;
  inputTax: number;
  /** 銷項稅額減進項稅額。正數為應納稅額，負數為溢付稅額。 */
  netTax: number;
  isRefundable: boolean;
}

/** 依現行營業稅稅率試算應納（溢付）營業稅額，稅率一律由呼叫端傳入 tax-parameters 的值，不得硬編碼。 */
export function calculateBusinessTax(input: BusinessTaxInput, rate: number): BusinessTaxResult {
  const outputTax = Math.round(input.salesAmount * rate);
  const inputTax = Math.round(input.purchasesAmount * rate);
  const netTax = outputTax - inputTax;
  return { outputTax, inputTax, netTax, isRefundable: netTax < 0 };
}
