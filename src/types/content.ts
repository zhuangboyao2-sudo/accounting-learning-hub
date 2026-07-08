// 內容 schema 型別定義，對應 DEVELOPMENT_PLAN.md §4.2

export type Subject =
  | "accounting"
  | "tax-practice"
  | "tax-law"
  | "bookkeeping-law"
  | "practice-zone";

export const SUBJECTS: { id: Subject; label: string }[] = [
  { id: "accounting", label: "會計學" },
  { id: "tax-practice", label: "租稅申報實務" },
  { id: "tax-law", label: "稅務相關法規" },
  { id: "bookkeeping-law", label: "記帳相關法規" },
  { id: "practice-zone", label: "實務專區" },
];

export interface MaterialFrontmatter {
  id: string;
  title: string;
  subject: Subject;
  chapter: number;
  order: number;
  law_basis?: string[];
  verified_at: string;
  sources?: string[];
}

export type QuestionType = "single-choice" | "multi-choice" | "essay";

export interface QuestionSource {
  type: "past-exam" | "generated";
  year?: number;
  number?: number;
}

export interface Question {
  id: string;
  subject: Subject;
  source: QuestionSource;
  type: QuestionType;
  stem: string;
  options?: string[];
  answer?: number[];
  explanation: string;
  material_ref?: string;
  tags?: string[];
  verified_at: string;
  sources?: string[];
}

export interface Flashcard {
  id: string;
  subject: Subject;
  front: string;
  back: string;
  material_ref?: string;
  verified_at: string;
}

export interface GlossaryEntry {
  id: string;
  term: string;
  definition: string;
  material_ref?: string;
}

export interface TaxParameters {
  year: number;
  verified_at: string;
  sources: string[];
  [key: string]: unknown;
}

export interface JournalEntryLine {
  account: string;
  side: "debit" | "credit";
  amount: number;
}

export interface JournalEntryScenario {
  id: string;
  scenario: string;
  lines: JournalEntryLine[];
  explanation: string;
  material_ref?: string;
  tags?: string[];
  verified_at: string;
  sources?: string[];
}

export interface SimScenarioMonth {
  month: number;
  narrative: string;
  transactions: JournalEntryScenario[];
}

export interface SimScenario {
  id: string;
  companyName: string;
  industry: string;
  verified_at: string;
  sources?: string[];
  openingEntry: JournalEntryScenario;
  months: SimScenarioMonth[];
}
