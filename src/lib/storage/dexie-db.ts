import Dexie, { type EntityTable } from "dexie";
import type {
  Attempt,
  ExamSession,
  Feedback,
  MaterialProgress,
  Note,
  Setting,
  SimProgress,
  SrsCardState,
  UserCard,
} from "./types";

/** sim_progress 的實際儲存列，複合鍵 scenarioId+month 轉成單一字串主鍵以簡化型別 */
export type SimProgressRecord = SimProgress & { id: string };

export function simProgressId(scenarioId: string, month: number): string {
  return `${scenarioId}:${month}`;
}

export class AppDatabase extends Dexie {
  progress!: EntityTable<MaterialProgress, "materialId">;
  notes!: EntityTable<Note, "materialId">;
  attempts!: EntityTable<Attempt, "id">;
  srsCards!: EntityTable<SrsCardState, "cardId">;
  examSessions!: EntityTable<ExamSession, "id">;
  feedback!: EntityTable<Feedback, "id">;
  settings!: EntityTable<Setting, "key">;
  userCards!: EntityTable<UserCard, "id">;
  simProgress!: EntityTable<SimProgressRecord, "id">;

  constructor() {
    super("accounting-learning-hub");
    this.version(1).stores({
      progress: "materialId, status, updatedAt",
      notes: "materialId, updatedAt",
      attempts: "++id, questionId, chosenAt",
      srsCards: "cardId, due",
      examSessions: "++id, subject, completedAt",
      feedback: "++id, questionId, createdAt",
      settings: "key",
      userCards: "++id, materialId, createdAt",
      simProgress: "id, scenarioId",
    });

    // v2：attempts 補上 subject/materialRef/chosenAnswer 欄位，供 Phase 2 練習模式與後續錯題本使用
    this.version(2)
      .stores({
        attempts: "++id, questionId, chosenAt, subject, materialRef",
      })
      .upgrade((tx) =>
        tx
          .table("attempts")
          .toCollection()
          .modify((attempt) => {
            if (attempt.subject === undefined) attempt.subject = "accounting";
            if (attempt.materialRef === undefined) attempt.materialRef = undefined;
            if (attempt.chosenAnswer === undefined) attempt.chosenAnswer = [];
          }),
      );
  }
}

let dbInstance: AppDatabase | null = null;

/** 取得單例 Dexie 實例；只在瀏覽器環境使用（IndexedDB 不存在於 Node/SSR） */
export function getDb(): AppDatabase {
  if (!dbInstance) {
    dbInstance = new AppDatabase();
  }
  return dbInstance;
}
