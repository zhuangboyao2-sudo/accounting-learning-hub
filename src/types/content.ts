// 內容 schema 型別定義，對應 DEVELOPMENT_PLAN.md §4.2

export type Subject =
  | "accounting"
  | "tax-practice"
  | "tax-law"
  | "bookkeeping-law";

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
