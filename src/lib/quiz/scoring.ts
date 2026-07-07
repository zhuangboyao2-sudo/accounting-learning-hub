import type { Question } from "@/types/content";

/** 判斷作答是否正確：不計順序比對選項 index 集合是否相等，single-choice 與 multi-choice 共用同一邏輯 */
export function isCorrect(question: Question, chosen: number[]): boolean {
  const answer = question.answer ?? [];
  if (chosen.length !== answer.length) return false;
  const answerSet = new Set(answer);
  return chosen.every((choice) => answerSet.has(choice));
}
