import { describe, expect, it } from "vitest";
import {
  computeNetIncome,
  computeVatForPeriod,
  computeWithholdingTotal,
  sumLedgerByAccount,
} from "./ledger";
import type { ChartOfAccountsEntry } from "@/lib/content/chart-of-accounts";
import type { JournalEntryScenario } from "@/types/content";

function makeTx(id: string, lines: JournalEntryScenario["lines"]): JournalEntryScenario {
  return { id, scenario: "s", lines, explanation: "e", verified_at: "2026-01-01" };
}

describe("sumLedgerByAccount", () => {
  it("依科目加總跨多筆交易的借貸金額", () => {
    const transactions = [
      makeTx("t1", [
        { account: "現金", side: "debit", amount: 100 },
        { account: "銷貨收入", side: "credit", amount: 100 },
      ]),
      makeTx("t2", [
        { account: "現金", side: "debit", amount: 50 },
        { account: "銷貨收入", side: "credit", amount: 50 },
      ]),
    ];
    const ledger = sumLedgerByAccount(transactions);
    expect(ledger.get("現金")).toEqual({ debit: 150, credit: 0 });
    expect(ledger.get("銷貨收入")).toEqual({ debit: 0, credit: 150 });
  });
});

describe("computeNetIncome", () => {
  const accounts: ChartOfAccountsEntry[] = [
    { category: "收入", name: "銷貨收入", normalBalance: "credit", description: "" },
    { category: "收入", name: "銷貨退回及折讓", normalBalance: "debit", description: "" },
    { category: "費用", name: "薪資費用", normalBalance: "debit", description: "" },
    { category: "資產", name: "現金", normalBalance: "debit", description: "" },
  ];

  it("收入類（貸-借）減費用類（借-貸），資產類不列入", () => {
    const transactions = [
      makeTx("t1", [
        { account: "現金", side: "debit", amount: 1000 },
        { account: "銷貨收入", side: "credit", amount: 1000 },
      ]),
      makeTx("t2", [
        { account: "銷貨退回及折讓", side: "debit", amount: 100 },
        { account: "現金", side: "credit", amount: 100 },
      ]),
      makeTx("t3", [
        { account: "薪資費用", side: "debit", amount: 300 },
        { account: "現金", side: "credit", amount: 300 },
      ]),
    ];
    const ledger = sumLedgerByAccount(transactions);
    // 收入淨額 900（1000-100），費用 300，淨利 600
    expect(computeNetIncome(ledger, accounts)).toBe(600);
  });
});

describe("computeVatForPeriod", () => {
  it("加總銷項稅額（貸-借）與進項稅額（借-貸），算出應納稅額", () => {
    const transactions = [
      makeTx("t1", [
        { account: "應收帳款", side: "debit", amount: 105000 },
        { account: "銷貨收入", side: "credit", amount: 100000 },
        { account: "銷項稅額", side: "credit", amount: 5000 },
      ]),
      makeTx("t2", [
        { account: "存貨", side: "debit", amount: 40000 },
        { account: "進項稅額", side: "debit", amount: 2000 },
        { account: "應付帳款", side: "credit", amount: 42000 },
      ]),
    ];
    expect(computeVatForPeriod(transactions)).toEqual({
      outputTax: 5000,
      inputTax: 2000,
      netTax: 3000,
    });
  });

  it("銷貨退回沖減銷項稅額（借記）：應納稅額隨之減少", () => {
    const transactions = [
      makeTx("t1", [
        { account: "應收帳款", side: "debit", amount: 105000 },
        { account: "銷貨收入", side: "credit", amount: 100000 },
        { account: "銷項稅額", side: "credit", amount: 5000 },
      ]),
      makeTx("t2", [
        { account: "銷貨退回及折讓", side: "debit", amount: 8000 },
        { account: "銷項稅額", side: "debit", amount: 400 },
        { account: "應收帳款", side: "credit", amount: 8400 },
      ]),
    ];
    expect(computeVatForPeriod(transactions).outputTax).toBe(4600);
  });

  it("進項大於銷項：netTax 為負（溢付）", () => {
    const transactions = [
      makeTx("t1", [
        { account: "存貨", side: "debit", amount: 40000 },
        { account: "進項稅額", side: "debit", amount: 2000 },
        { account: "應付帳款", side: "credit", amount: 42000 },
      ]),
    ];
    expect(computeVatForPeriod(transactions).netTax).toBe(-2000);
  });
});

describe("computeWithholdingTotal", () => {
  it("只加總代扣稅款貸方發生額，代繳沖銷（借方）不影響全年申報總額", () => {
    const transactions = [
      makeTx("t1", [
        { account: "薪資費用", side: "debit", amount: 200000 },
        { account: "代扣稅款", side: "credit", amount: 10000 },
        { account: "銀行存款", side: "credit", amount: 190000 },
      ]),
      makeTx("t2", [
        { account: "代扣稅款", side: "debit", amount: 10000 },
        { account: "銀行存款", side: "credit", amount: 10000 },
      ]),
    ];
    // 代扣 10000（貸方發生額），即使當年度已代繳沖銷，申報總額仍是 10000
    expect(computeWithholdingTotal(transactions)).toBe(10000);
  });

  it("沒有代扣稅款科目時回傳 0", () => {
    expect(computeWithholdingTotal([])).toBe(0);
  });
});
