import { readFileSync } from "node:fs";
import { join } from "node:path";

export interface ChartOfAccountsEntry {
  category: "資產" | "負債" | "權益" | "收入" | "費用";
  name: string;
  normalBalance: "debit" | "credit";
  description: string;
}

const FILE = join(process.cwd(), "content", "chart-of-accounts.json");

export function getChartOfAccounts(): ChartOfAccountsEntry[] {
  return JSON.parse(readFileSync(FILE, "utf-8"));
}
