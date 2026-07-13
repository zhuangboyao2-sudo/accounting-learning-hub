import type { EntityTable } from "dexie";
import { getDb, simProgressId } from "./dexie-db";
import type {
  Attempt,
  CauseTag,
  ExamSession,
  Feedback,
  MaterialProgress,
  Note,
  SimProgress,
  SrsCardState,
  StorageProvider,
  UserCard,
} from "./types";

/**
 * 儲存層寫入事件監聽（雲端同步引擎用）。同步未啟用時為 null，寫入零額外開銷。
 * `table` 為 "__importAll__" 時表示整批覆蓋，監聽方應重建整個上傳佇列。
 */
type StorageWriteListener = (table: string, key: string) => void;

let writeListener: StorageWriteListener | null = null;

export function setStorageWriteListener(listener: StorageWriteListener | null) {
  writeListener = listener;
}

function notify(table: string, key: string | number) {
  writeListener?.(table, String(key));
}

/** StorageProvider 的 IndexedDB（Dexie）實作，本期唯一實作（見計畫 §4.3） */
export class DexieStorageProvider implements StorageProvider {
  private get db() {
    return getDb();
  }

  getProgress(materialId: string) {
    return this.db.progress.get(materialId);
  }
  setProgress(progress: MaterialProgress) {
    return this.db.progress.put(progress).then(() => notify("progress", progress.materialId));
  }
  listProgress() {
    return this.db.progress.toArray();
  }

  getNote(materialId: string) {
    return this.db.notes.get(materialId);
  }
  setNote(note: Note) {
    return this.db.notes.put(note).then(() => notify("notes", note.materialId));
  }

  addAttempt(attempt: Omit<Attempt, "id">) {
    return this.db.attempts.add(attempt as Attempt).then((id) => {
      notify("attempts", id as number);
      return id as number;
    });
  }
  listAttempts(questionId?: string) {
    if (questionId) {
      return this.db.attempts.where("questionId").equals(questionId).toArray();
    }
    return this.db.attempts.toArray();
  }
  setAttemptCause(attemptId: number, causeTag: CauseTag) {
    return this.db.attempts.update(attemptId, { causeTag }).then(() => notify("attempts", attemptId));
  }

  getSrsCard(cardId: string) {
    return this.db.srsCards.get(cardId);
  }
  setSrsCard(card: SrsCardState) {
    return this.db.srsCards.put(card).then(() => notify("srsCards", card.cardId));
  }
  listDueSrsCards(now: string) {
    return this.db.srsCards
      .where("due")
      .belowOrEqual(now)
      .and((card) => !card.paused)
      .toArray();
  }
  listAllSrsCards() {
    return this.db.srsCards.toArray();
  }

  addExamSession(session: Omit<ExamSession, "id">) {
    return this.db.examSessions.add(session as ExamSession).then((id) => notify("examSessions", id as number));
  }
  listExamSessions() {
    return this.db.examSessions.toArray();
  }

  addFeedback(feedback: Omit<Feedback, "id">) {
    return this.db.feedback.add(feedback as Feedback).then((id) => notify("feedback", id as number));
  }
  listFeedback() {
    return this.db.feedback.toArray();
  }

  async getSetting<T>(key: string): Promise<T | undefined> {
    const row = await this.db.settings.get(key);
    return row?.value as T | undefined;
  }
  setSetting(key: string, value: unknown) {
    return this.db.settings.put({ key, value }).then(() => notify("settings", key));
  }

  addUserCard(card: Omit<UserCard, "id">) {
    return this.db.userCards.add(card as UserCard).then((id) => {
      notify("userCards", id as number);
      return id as number;
    });
  }
  listUserCards() {
    return this.db.userCards.toArray();
  }

  getSimProgress(scenarioId: string, month: number) {
    return this.db.simProgress.get(simProgressId(scenarioId, month));
  }
  setSimProgress(progress: SimProgress) {
    const id = simProgressId(progress.scenarioId, progress.month);
    return this.db.simProgress.put({ ...progress, id }).then(() => notify("simProgress", id));
  }
  listSimProgress(scenarioId: string) {
    return this.db.simProgress.where("scenarioId").equals(scenarioId).toArray();
  }

  async exportAll(): Promise<Record<string, unknown[]>> {
    const [
      progress,
      notes,
      attempts,
      srsCards,
      examSessions,
      feedback,
      settings,
      userCards,
      simProgress,
    ] = await Promise.all([
      this.db.progress.toArray(),
      this.db.notes.toArray(),
      this.db.attempts.toArray(),
      this.db.srsCards.toArray(),
      this.db.examSessions.toArray(),
      this.db.feedback.toArray(),
      this.db.settings.toArray(),
      this.db.userCards.toArray(),
      this.db.simProgress.toArray(),
    ]);
    return {
      progress,
      notes,
      attempts,
      srsCards,
      examSessions,
      feedback,
      settings,
      userCards,
      simProgress,
    };
  }

  async importAll(data: Record<string, unknown[]>): Promise<void> {
    await this.db.transaction(
      "rw",
      [
        this.db.progress,
        this.db.notes,
        this.db.attempts,
        this.db.srsCards,
        this.db.examSessions,
        this.db.feedback,
        this.db.settings,
        this.db.userCards,
        this.db.simProgress,
      ],
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tables: Record<string, EntityTable<any, any>> = {
          progress: this.db.progress,
          notes: this.db.notes,
          attempts: this.db.attempts,
          srsCards: this.db.srsCards,
          examSessions: this.db.examSessions,
          feedback: this.db.feedback,
          settings: this.db.settings,
          userCards: this.db.userCards,
          simProgress: this.db.simProgress,
        };
        for (const [key, rows] of Object.entries(data)) {
          const table = tables[key];
          if (!table || !Array.isArray(rows)) continue;
          await table.clear();
          await table.bulkPut(rows as never[]);
        }
      },
    );
    notify("__importAll__", "");
  }
}
