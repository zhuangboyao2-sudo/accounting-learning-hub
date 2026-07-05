import { getTaxParamValue } from "@/lib/content/tax-parameters";

function formatValue(value: unknown, format?: "percent" | "number" | "text"): string {
  if (typeof value === "number") {
    if (format === "percent") {
      return `${(value * 100).toFixed(2).replace(/\.?0+$/, "")}%`;
    }
    return `新臺幣 ${value.toLocaleString("zh-Hant-TW")} 元`;
  }
  return String(value ?? "（查無此參數，請確認 path 是否正確）");
}

/** 於教材 MDX 中引用年度稅務參數，數字一律來自 content/tax-parameters/，不得手寫（計畫 §6.3） */
export function TaxParam({
  path,
  format,
}: {
  path: string;
  format?: "percent" | "number" | "text";
}) {
  const value = getTaxParamValue(path);
  return <strong className="font-semibold">{formatValue(value, format)}</strong>;
}
