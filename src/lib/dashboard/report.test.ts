import { describe, expect, it } from "vitest";
import {
  findHighLapseCards,
  findRepeatedWrongQuestions,
  findStaleChapters,
  findUnclearExplanations,
  rankChapterErrorRates,
  summarizeCauseTags,
} from "./report";
import type { Attempt, Feedback, MaterialProgress, SrsCardState } from "@/lib/storage/types";
import type { MaterialFrontmatter, Question } from "@/types/content";

function makeAttempt(overrides: Partial<Attempt>): Attempt {
  return {
    questionId: "q1",
    subject: "accounting",
    materialRef: "acc-01-01",
    chosenAnswer: [0],
    correct: false,
    chosenAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

function makeMaterial(id: string, title = id): MaterialFrontmatter {
  return { id, title, subject: "accounting", chapter: 1, order: 1, verified_at: "2026-01-01" };
}

describe("rankChapterErrorRates", () => {
  it("依錯誤率排序，只列有作答紀錄的章節", () => {
    const attempts = [
      makeAttempt({ materialRef: "acc-01-01", correct: false }),
      makeAttempt({ materialRef: "acc-01-01", correct: true }),
      makeAttempt({ materialRef: "acc-01-02", correct: false }),
      makeAttempt({ materialRef: "acc-01-02", correct: false }),
    ];
    const materials = [makeMaterial("acc-01-01", "第一節"), makeMaterial("acc-01-02", "第二節")];
    const result = rankChapterErrorRates(attempts, materials);
    expect(result[0]).toEqual({
      materialId: "acc-01-02",
      title: "第二節",
      wrongCount: 2,
      total: 2,
      wrongRate: 100,
    });
    expect(result[1].wrongRate).toBe(50);
  });

  it("沒有 material_ref 的作答不列入", () => {
    const attempts = [makeAttempt({ materialRef: undefined })];
    expect(rankChapterErrorRates(attempts, [])).toEqual([]);
  });
});

describe("findRepeatedWrongQuestions", () => {
  it("累計答錯次數達門檻才列入，依次數排序", () => {
    const attempts = [
      makeAttempt({ questionId: "q1", correct: false, chosenAt: "2026-01-01T00:00:00.000Z" }),
      makeAttempt({ questionId: "q1", correct: false, chosenAt: "2026-01-02T00:00:00.000Z" }),
      makeAttempt({ questionId: "q1", correct: true, chosenAt: "2026-01-03T00:00:00.000Z" }),
      makeAttempt({ questionId: "q1", correct: false, chosenAt: "2026-01-04T00:00:00.000Z" }),
      makeAttempt({ questionId: "q2", correct: false, chosenAt: "2026-01-01T00:00:00.000Z" }),
    ];
    const questions: Question[] = [
      {
        id: "q1",
        subject: "accounting",
        source: { type: "generated" },
        type: "single-choice",
        stem: "題目一",
        explanation: "e",
        verified_at: "2026-01-01",
      },
    ];
    const result = findRepeatedWrongQuestions(attempts, questions, 3);
    expect(result).toEqual([{ questionId: "q1", stem: "題目一", wrongCount: 3 }]);
  });
});

describe("findHighLapseCards", () => {
  function makeCard(cardId: string, lapses: number): SrsCardState {
    return {
      cardId,
      due: "2026-07-08T00:00:00.000Z",
      stability: 1,
      difficulty: 1,
      reps: 5,
      lapses,
      state: 2,
      scheduledDays: 1,
      learningSteps: 0,
      paused: false,
    };
  }

  it("只列出 lapses 達門檻的卡片，依 lapses 由高到低排序", () => {
    const cards = [makeCard("a", 5), makeCard("b", 1), makeCard("c", 3)];
    expect(findHighLapseCards(cards, 10, 3)).toEqual([
      { cardId: "a", lapses: 5 },
      { cardId: "c", lapses: 3 },
    ]);
  });
});

describe("findStaleChapters", () => {
  const now = new Date("2026-07-08T00:00:00.000Z");

  it("從未有進度紀錄的章節視為未讀，列入", () => {
    const materials = [makeMaterial("acc-01-01")];
    expect(findStaleChapters(materials, [], now)).toEqual([
      { materialId: "acc-01-01", title: "acc-01-01", lastActivity: null },
    ]);
  });

  it("已完成（done）的章節不列入", () => {
    const materials = [makeMaterial("acc-01-01")];
    const progress: MaterialProgress[] = [
      { materialId: "acc-01-01", status: "done", updatedAt: "2026-01-01T00:00:00.000Z" },
    ];
    expect(findStaleChapters(materials, progress, now)).toEqual([]);
  });

  it("最後活動在 60 天內的未完成章節不列入", () => {
    const materials = [makeMaterial("acc-01-01")];
    const progress: MaterialProgress[] = [
      { materialId: "acc-01-01", status: "in-progress", updatedAt: "2026-07-01T00:00:00.000Z" },
    ];
    expect(findStaleChapters(materials, progress, now)).toEqual([]);
  });

  it("最後活動超過 60 天的未完成章節列入", () => {
    const materials = [makeMaterial("acc-01-01")];
    const progress: MaterialProgress[] = [
      { materialId: "acc-01-01", status: "in-progress", updatedAt: "2026-01-01T00:00:00.000Z" },
    ];
    expect(findStaleChapters(materials, progress, now)).toEqual([
      { materialId: "acc-01-01", title: "acc-01-01", lastActivity: "2026-01-01T00:00:00.000Z" },
    ]);
  });
});

describe("findUnclearExplanations", () => {
  it("只取 unclear-explanation 類型並去重", () => {
    const feedback: Feedback[] = [
      { questionId: "q1", type: "unclear-explanation", createdAt: "2026-01-01T00:00:00.000Z" },
      { questionId: "q1", type: "unclear-explanation", createdAt: "2026-01-02T00:00:00.000Z" },
      { questionId: "q2", type: "other", createdAt: "2026-01-01T00:00:00.000Z" },
    ];
    const questions: Question[] = [
      {
        id: "q1",
        subject: "accounting",
        source: { type: "generated" },
        type: "single-choice",
        stem: "題目一",
        explanation: "e",
        verified_at: "2026-01-01",
      },
    ];
    expect(findUnclearExplanations(feedback, questions)).toEqual([
      { questionId: "q1", stem: "題目一" },
    ]);
  });
});

describe("summarizeCauseTags", () => {
  it("依 causeTag 分組計數，依次數由高到低排序", () => {
    const attempts = [
      makeAttempt({ causeTag: "carelessness" }),
      makeAttempt({ causeTag: "carelessness" }),
      makeAttempt({ causeTag: "concept" }),
    ];
    expect(summarizeCauseTags(attempts)).toEqual([
      { tag: "carelessness", label: "粗心", count: 2 },
      { tag: "concept", label: "概念不懂", count: 1 },
    ]);
  });

  it("答對的紀錄與未標記的答錯紀錄都不計入", () => {
    const attempts = [
      makeAttempt({ correct: true, causeTag: "concept" }),
      makeAttempt({ correct: false }),
    ];
    expect(summarizeCauseTags(attempts)).toEqual([]);
  });
});
