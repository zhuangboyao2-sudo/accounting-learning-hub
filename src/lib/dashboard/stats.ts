import type { Attempt, ExamSession, MaterialProgress } from "@/lib/storage/types";
import type { MaterialFrontmatter, Subject } from "@/types/content";

export interface SubjectCompletion {
  subject: Subject;
  label: string;
  total: number;
  done: number;
  percent: number;
}

/** 依各科教材清單與使用者進度，算出各科完成度（百分比取整數）。 */
export function computeSubjectCompletion(
  materialsBySubject: { subject: Subject; label: string; items: MaterialFrontmatter[] }[],
  progress: MaterialProgress[],
): SubjectCompletion[] {
  const doneIds = new Set(
    progress.filter((p) => p.status === "done").map((p) => p.materialId),
  );
  return materialsBySubject.map(({ subject, label, items }) => {
    const total = items.length;
    const done = items.filter((item) => doneIds.has(item.id)).length;
    return {
      subject,
      label,
      total,
      done,
      percent: total === 0 ? 0 : Math.round((done / total) * 100),
    };
  });
}

/** 近 N 天（含今天）作答的正確率，百分比取整數；無作答紀錄回傳 null。 */
export function computeRecentAccuracy(
  attempts: Attempt[],
  now: Date,
  days = 30,
): { correct: number; total: number; percent: number | null } {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - days);
  const recent = attempts.filter((a) => new Date(a.chosenAt) >= cutoff);
  const correct = recent.filter((a) => a.correct).length;
  const total = recent.length;
  return { correct, total, percent: total === 0 ? null : Math.round((correct / total) * 100) };
}

export interface ExamScorePoint {
  label: string;
  score: number;
  total: number;
}

/** 模擬考歷次分數，依完成時間排序，供折線圖使用。 */
export function toExamScoreSeries(sessions: ExamSession[]): ExamScorePoint[] {
  return [...sessions]
    .sort((a, b) => a.completedAt.localeCompare(b.completedAt))
    .map((session, index) => ({
      label: `第 ${index + 1} 次`,
      score: session.score,
      total: session.questionIds.length,
    }));
}
