// 使用者資料型別，對應 DEVELOPMENT_PLAN.md §4.2 IndexedDB 使用者資料表

import type { Subject } from "@/types/content";

export interface MaterialProgress {
  materialId: string;
  status: "unread" | "in-progress" | "done";
  updatedAt: string;
}

export interface Note {
  materialId: string;
  content: string;
  updatedAt: string;
}

export interface Attempt {
  id?: number;
  questionId: string;
  subject: Subject;
  materialRef?: string;
  chosenAnswer: number[];
  correct: boolean;
  chosenAt: string;
}

export interface SrsCardState {
  cardId: string;
  due: string;
  stability: number;
  difficulty: number;
  reps: number;
  lapses: number;
  /** FSRS State enum：0=New, 1=Learning, 2=Review, 3=Relearning */
  state: number;
  scheduledDays: number;
  learningSteps: number;
  paused: boolean;
  lastReviewedAt?: string;
}

export interface ExamSession {
  id?: number;
  subject: string;
  questionIds: string[];
  score: number;
  durationSeconds: number;
  completedAt: string;
}

export interface Feedback {
  id?: number;
  questionId: string;
  type: string;
  createdAt: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

export interface UserCard {
  id?: number;
  front: string;
  back: string;
  materialId?: string;
  createdAt: string;
}

export interface SimProgress {
  scenarioId: string;
  month: number;
  status: "locked" | "in-progress" | "done";
  answers: unknown;
  updatedAt: string;
}

/**
 * 所有使用者資料讀寫的唯一入口。元件不得直接 import Dexie（見計畫 §4.3），
 * 一律透過此介面，未來要換成 Supabase 等雲端實作時只需替換實作、不動呼叫端。
 */
export interface StorageProvider {
  getProgress(materialId: string): Promise<MaterialProgress | undefined>;
  setProgress(progress: MaterialProgress): Promise<void>;
  listProgress(): Promise<MaterialProgress[]>;

  getNote(materialId: string): Promise<Note | undefined>;
  setNote(note: Note): Promise<void>;

  addAttempt(attempt: Omit<Attempt, "id">): Promise<void>;
  listAttempts(questionId?: string): Promise<Attempt[]>;

  getSrsCard(cardId: string): Promise<SrsCardState | undefined>;
  setSrsCard(card: SrsCardState): Promise<void>;
  listDueSrsCards(now: string): Promise<SrsCardState[]>;
  /** 讀取全部複習卡排程狀態（含未到期／已暫停），供 buildDueQueue 判斷新卡與排除暫停卡 */
  listAllSrsCards(): Promise<SrsCardState[]>;

  addExamSession(session: Omit<ExamSession, "id">): Promise<void>;
  listExamSessions(): Promise<ExamSession[]>;

  addFeedback(feedback: Omit<Feedback, "id">): Promise<void>;
  listFeedback(): Promise<Feedback[]>;

  getSetting<T = unknown>(key: string): Promise<T | undefined>;
  setSetting(key: string, value: unknown): Promise<void>;

  /** 回傳新卡片的自動遞增 id，供呼叫端立即用 userCardId(id) 建立對應的 SrsCardState */
  addUserCard(card: Omit<UserCard, "id">): Promise<number>;
  listUserCards(): Promise<UserCard[]>;

  getSimProgress(scenarioId: string, month: number): Promise<SimProgress | undefined>;
  setSimProgress(progress: SimProgress): Promise<void>;
  listSimProgress(scenarioId: string): Promise<SimProgress[]>;

  /** 匯出全部使用者資料，供設定頁 JSON 備份使用（見計畫 §4.3、§8.5） */
  exportAll(): Promise<Record<string, unknown[]>>;
  /** 匯入備份 JSON，覆蓋對應資料表 */
  importAll(data: Record<string, unknown[]>): Promise<void>;
}
