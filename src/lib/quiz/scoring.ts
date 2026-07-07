import type { Question } from "@/types/content";
import type { Attempt } from "@/lib/storage/types";

/** 判斷作答是否正確：不計順序比對選項 index 集合是否相等，single-choice 與 multi-choice 共用同一邏輯 */
export function isCorrect(question: Question, chosen: number[]): boolean {
  const answer = question.answer ?? [];
  if (chosen.length !== answer.length) return false;
  const answerSet = new Set(answer);
  return chosen.every((choice) => answerSet.has(choice));
}

/**
 * 錯題本邏輯：依 questionId 取「最新一筆」作答紀錄，若最新一筆答錯才算錯題。
 * 重練並答對後，新寫入的 attempt 會成為最新一筆，該題自然從錯題本消失。
 */
export function getLatestWrongQuestionIds(attempts: Attempt[]): Set<string> {
  const latestByQuestion = new Map<string, Attempt>();
  for (const attempt of attempts) {
    const existing = latestByQuestion.get(attempt.questionId);
    if (!existing || attempt.chosenAt > existing.chosenAt) {
      latestByQuestion.set(attempt.questionId, attempt);
    }
  }
  const wrongIds = new Set<string>();
  for (const attempt of latestByQuestion.values()) {
    if (!attempt.correct) wrongIds.add(attempt.questionId);
  }
  return wrongIds;
}
