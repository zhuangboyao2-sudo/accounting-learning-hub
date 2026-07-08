import type { ChartOfAccountsEntry } from "@/lib/content/chart-of-accounts";
import type { JournalEntryScenario } from "@/types/content";

export interface AccountBalance {
  debit: number;
  credit: number;
}

/** 把一批交易的所有分錄行依科目加總借貸金額，作為期間內的簡易分類帳。 */
export function sumLedgerByAccount(transactions: JournalEntryScenario[]): Map<string, AccountBalance> {
  const ledger = new Map<string, AccountBalance>();
  for (const tx of transactions) {
    for (const line of tx.lines) {
      const bucket = ledger.get(line.account) ?? { debit: 0, credit: 0 };
      bucket[line.side] += line.amount;
      ledger.set(line.account, bucket);
    }
  }
  return ledger;
}

export interface IncomeStatementTotals {
  revenue: number;
  expense: number;
  netIncome: number;
}

/**
 * 依會計科目表的 category 分類，加總收入類（貸-借）與費用類（借-貸）。
 * revenue/expense 個別回傳，供營所稅試算器（calculateBusinessIncomeTax）使用；
 * netIncome 供年底結帳關卡使用。
 */
export function computeIncomeStatementTotals(
  ledger: Map<string, AccountBalance>,
  accounts: ChartOfAccountsEntry[],
): IncomeStatementTotals {
  const categoryByName = new Map(accounts.map((a) => [a.name, a.category]));
  let revenue = 0;
  let expense = 0;
  for (const [account, balance] of ledger) {
    const category = categoryByName.get(account);
    if (category === "收入") revenue += balance.credit - balance.debit;
    else if (category === "費用") expense += balance.debit - balance.credit;
  }
  return { revenue, expense, netIncome: revenue - expense };
}

/** 依會計科目表的 category 分類，加總收入類（貸-借）減費用類（借-貸），算出本期淨利。 */
export function computeNetIncome(
  ledger: Map<string, AccountBalance>,
  accounts: ChartOfAccountsEntry[],
): number {
  return computeIncomeStatementTotals(ledger, accounts).netIncome;
}

export interface PeriodVat {
  outputTax: number;
  inputTax: number;
  netTax: number;
}

/** 加總指定期間交易的銷項稅額與進項稅額，算出應納（正）或溢付（負）營業稅額。 */
export function computeVatForPeriod(transactions: JournalEntryScenario[]): PeriodVat {
  const ledger = sumLedgerByAccount(transactions);
  const output = ledger.get("銷項稅額");
  const input = ledger.get("進項稅額");
  const outputTax = (output?.credit ?? 0) - (output?.debit ?? 0);
  const inputTax = (input?.debit ?? 0) - (input?.credit ?? 0);
  return { outputTax, inputTax, netTax: outputTax - inputTax };
}

/**
 * 加總全年「代扣稅款」貸方發生額（每次代扣當下的金額），作為次年 1 月扣繳申報總額。
 * 只取貸方（代扣當下），不可用貸-借的期末餘額——期末餘額只反映尚未代繳的部分，
 * 扣繳申報要報的是全年實際扣了多少，即使當年度已代為繳納也要計入申報總額。
 */
export function computeWithholdingTotal(transactions: JournalEntryScenario[]): number {
  const bucket = sumLedgerByAccount(transactions).get("代扣稅款");
  return bucket?.credit ?? 0;
}
