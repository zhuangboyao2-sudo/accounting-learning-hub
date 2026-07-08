export type TodayStage = "cards" | "wrong" | "next";

/** 依到期複習卡與待重練錯題數，決定每日學習佇列從哪一段開始（空段落直接跳過）。 */
export function pickInitialStage(dueCount: number, wrongCount: number): TodayStage {
  if (dueCount > 0) return "cards";
  if (wrongCount > 0) return "wrong";
  return "next";
}

/** 到期複習卡段完成後，依是否還有錯題決定下一段。 */
export function pickStageAfterCards(wrongCount: number): TodayStage {
  return wrongCount > 0 ? "wrong" : "next";
}
