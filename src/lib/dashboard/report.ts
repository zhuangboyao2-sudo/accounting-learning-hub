import type { Attempt, Feedback, MaterialProgress, SrsCardState } from "@/lib/storage/types";
import type { MaterialFrontmatter, Question } from "@/types/content";

export interface ChapterErrorRate {
  materialId: string;
  title: string;
  wrongCount: number;
  total: number;
  wrongRate: number;
}

/** 依 material_ref 分組計算各章節錯誤率，取錯誤率最高的前 topN 章（至少作答過一次才列入）。 */
export function rankChapterErrorRates(
  attempts: Attempt[],
  materials: MaterialFrontmatter[],
  topN = 5,
): ChapterErrorRate[] {
  const byMaterial = new Map<string, { wrong: number; total: number }>();
  for (const attempt of attempts) {
    if (!attempt.materialRef) continue;
    const bucket = byMaterial.get(attempt.materialRef) ?? { wrong: 0, total: 0 };
    bucket.total += 1;
    if (!attempt.correct) bucket.wrong += 1;
    byMaterial.set(attempt.materialRef, bucket);
  }
  const rows: ChapterErrorRate[] = [...byMaterial.entries()].map(([materialId, { wrong, total }]) => ({
    materialId,
    title: materials.find((m) => m.id === materialId)?.title ?? materialId,
    wrongCount: wrong,
    total,
    wrongRate: Math.round((wrong / total) * 100),
  }));
  return rows.sort((a, b) => b.wrongRate - a.wrongRate).slice(0, topN);
}

export interface RepeatedWrongQuestion {
  questionId: string;
  stem: string;
  wrongCount: number;
}

/** 找出歷史累計答錯次數達 minWrongCount 以上的題目（不只看最新一次作答）。 */
export function findRepeatedWrongQuestions(
  attempts: Attempt[],
  questions: Question[],
  minWrongCount = 3,
): RepeatedWrongQuestion[] {
  const wrongCounts = new Map<string, number>();
  for (const attempt of attempts) {
    if (attempt.correct) continue;
    wrongCounts.set(attempt.questionId, (wrongCounts.get(attempt.questionId) ?? 0) + 1);
  }
  const rows: RepeatedWrongQuestion[] = [...wrongCounts.entries()]
    .filter(([, count]) => count >= minWrongCount)
    .map(([questionId, wrongCount]) => ({
      questionId,
      stem: questions.find((q) => q.id === questionId)?.stem ?? questionId,
      wrongCount,
    }));
  return rows.sort((a, b) => b.wrongCount - a.wrongCount);
}

export interface HighLapseCard {
  cardId: string;
  lapses: number;
}

/** 找出 lapses（反覆遺忘次數）達 minLapses 以上的複習卡，取前 topN。 */
export function findHighLapseCards(
  srsCards: SrsCardState[],
  topN = 10,
  minLapses = 3,
): HighLapseCard[] {
  return srsCards
    .filter((card) => card.lapses >= minLapses)
    .sort((a, b) => b.lapses - a.lapses)
    .slice(0, topN)
    .map((card) => ({ cardId: card.cardId, lapses: card.lapses }));
}

export interface StaleChapter {
  materialId: string;
  title: string;
  lastActivity: string | null;
}

/** 找出尚未完成、且最後活動時間（無紀錄視為從未讀過）超過 staleDays 天的章節。 */
export function findStaleChapters(
  materials: MaterialFrontmatter[],
  progress: MaterialProgress[],
  now: Date,
  staleDays = 60,
): StaleChapter[] {
  const progressById = new Map(progress.map((p) => [p.materialId, p]));
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - staleDays);

  return materials
    .filter((material) => {
      const entry = progressById.get(material.id);
      if (entry?.status === "done") return false;
      if (!entry) return true;
      return new Date(entry.updatedAt) < cutoff;
    })
    .map((material) => ({
      materialId: material.id,
      title: material.title,
      lastActivity: progressById.get(material.id)?.updatedAt ?? null,
    }));
}

export interface UnclearExplanation {
  questionId: string;
  stem: string;
}

/** 找出被標記「看不懂」的題目詳解（去重） */
export function findUnclearExplanations(
  feedback: Feedback[],
  questions: Question[],
): UnclearExplanation[] {
  const ids = new Set(
    feedback.filter((f) => f.type === "unclear-explanation").map((f) => f.questionId),
  );
  return [...ids].map((questionId) => ({
    questionId,
    stem: questions.find((q) => q.id === questionId)?.stem ?? questionId,
  }));
}

export interface AnalysisReportInput {
  attempts: Attempt[];
  srsCards: SrsCardState[];
  progress: MaterialProgress[];
  feedback: Feedback[];
  materials: MaterialFrontmatter[];
  questions: Question[];
  now: Date;
}

/** 組成學習分析報告 Markdown（計畫 §8.3），供儀表板一鍵匯出。 */
export function generateAnalysisReportMarkdown(input: AnalysisReportInput): string {
  const { attempts, srsCards, progress, feedback, materials, questions, now } = input;
  const chapterErrors = rankChapterErrorRates(attempts, materials);
  const repeatedWrong = findRepeatedWrongQuestions(attempts, questions);
  const highLapseCards = findHighLapseCards(srsCards);
  const staleChapters = findStaleChapters(materials, progress, now);
  const unclear = findUnclearExplanations(feedback, questions);

  const lines: string[] = [];
  lines.push(`# 學習分析報告`, ``, `匯出時間：${now.toISOString().slice(0, 10)}`, ``);

  lines.push(`## 章節錯誤率排行`, ``);
  if (chapterErrors.length === 0) {
    lines.push(`（尚無作答紀錄）`);
  } else {
    for (const row of chapterErrors) {
      lines.push(`- ${row.title}（${row.materialId}）：錯誤率 ${row.wrongRate}%（${row.wrongCount}/${row.total}）`);
    }
  }
  lines.push(``);

  lines.push(`## 重複答錯 ≥3 次的題目`, ``);
  if (repeatedWrong.length === 0) {
    lines.push(`（無）`);
  } else {
    for (const row of repeatedWrong) {
      lines.push(`- 【答錯 ${row.wrongCount} 次】${row.stem}`);
    }
  }
  lines.push(``);

  lines.push(`## SRS 中反覆遺忘（lapse 數高）的卡片`, ``);
  if (highLapseCards.length === 0) {
    lines.push(`（無）`);
  } else {
    for (const row of highLapseCards) {
      lines.push(`- ${row.cardId}（遺忘 ${row.lapses} 次）`);
    }
  }
  lines.push(``);

  lines.push(`## 超過 60 天未讀的章節`, ``);
  if (staleChapters.length === 0) {
    lines.push(`（無）`);
  } else {
    for (const row of staleChapters) {
      lines.push(`- ${row.title}（${row.materialId}）：${row.lastActivity ? `最後活動 ${row.lastActivity.slice(0, 10)}` : "從未讀過"}`);
    }
  }
  lines.push(``);

  lines.push(`## 被標記「看不懂」的詳解`, ``);
  if (unclear.length === 0) {
    lines.push(`（無）`);
  } else {
    for (const row of unclear) {
      lines.push(`- ${row.stem}`);
    }
  }

  return lines.join("\n");
}
