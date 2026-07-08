import { describe, expect, it } from "vitest";
import { computeRecentAccuracy, computeSubjectCompletion, toExamScoreSeries } from "./stats";
import type { Attempt, ExamSession, MaterialProgress } from "@/lib/storage/types";
import type { MaterialFrontmatter } from "@/types/content";

function makeMaterial(id: string): MaterialFrontmatter {
  return {
    id,
    title: id,
    subject: "accounting",
    chapter: 1,
    order: 1,
    verified_at: "2026-01-01",
  };
}

describe("computeSubjectCompletion", () => {
  it("依已完成教材數計算百分比（四捨五入）", () => {
    const groups = [
      {
        subject: "accounting" as const,
        label: "會計學",
        items: [makeMaterial("a"), makeMaterial("b"), makeMaterial("c")],
      },
    ];
    const progress: MaterialProgress[] = [
      { materialId: "a", status: "done", updatedAt: "2026-01-01" },
      { materialId: "b", status: "in-progress", updatedAt: "2026-01-01" },
    ];
    expect(computeSubjectCompletion(groups, progress)).toEqual([
      { subject: "accounting", label: "會計學", total: 3, done: 1, percent: 33 },
    ]);
  });

  it("沒有教材的科目：百分比為 0 不除以 0", () => {
    const groups = [{ subject: "accounting" as const, label: "會計學", items: [] }];
    expect(computeSubjectCompletion(groups, [])).toEqual([
      { subject: "accounting", label: "會計學", total: 0, done: 0, percent: 0 },
    ]);
  });
});

function makeAttempt(overrides: Partial<Attempt>): Attempt {
  return {
    questionId: "q1",
    subject: "accounting",
    chosenAnswer: [0],
    correct: true,
    chosenAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("computeRecentAccuracy", () => {
  const now = new Date("2026-07-08T00:00:00.000Z");

  it("沒有任何作答：percent 為 null", () => {
    expect(computeRecentAccuracy([], now)).toEqual({ correct: 0, total: 0, percent: null });
  });

  it("只計入近 30 天內的作答", () => {
    const attempts = [
      makeAttempt({ correct: true, chosenAt: "2026-07-05T00:00:00.000Z" }),
      makeAttempt({ correct: false, chosenAt: "2026-07-06T00:00:00.000Z" }),
      makeAttempt({ correct: true, chosenAt: "2026-01-01T00:00:00.000Z" }), // 超過 30 天，不計入
    ];
    expect(computeRecentAccuracy(attempts, now)).toEqual({ correct: 1, total: 2, percent: 50 });
  });
});

function makeExamSession(overrides: Partial<ExamSession>): ExamSession {
  return {
    subject: "accounting",
    questionIds: ["q1", "q2"],
    score: 1,
    durationSeconds: 600,
    completedAt: "2026-07-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("toExamScoreSeries", () => {
  it("依完成時間排序並附上次數標籤", () => {
    const sessions = [
      makeExamSession({ score: 2, completedAt: "2026-07-03T00:00:00.000Z" }),
      makeExamSession({ score: 1, completedAt: "2026-07-01T00:00:00.000Z" }),
    ];
    expect(toExamScoreSeries(sessions)).toEqual([
      { label: "第 1 次", score: 1, total: 2 },
      { label: "第 2 次", score: 2, total: 2 },
    ]);
  });
});
