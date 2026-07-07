import { describe, expect, it } from "vitest";
import { getLatestWrongQuestionIds, isCorrect, scoreExam } from "./scoring";
import type { Question } from "@/types/content";
import type { Attempt } from "@/lib/storage/types";

function makeQuestion(answer: number[], id = "q1", type?: Question["type"]): Question {
  return {
    id,
    subject: "accounting",
    source: { type: "generated" },
    type: type ?? (answer.length > 1 ? "multi-choice" : "single-choice"),
    stem: "stem",
    options: ["a", "b", "c", "d"],
    answer,
    explanation: "explanation",
    verified_at: "2026-01-01",
  };
}

describe("isCorrect", () => {
  it("single-choice：選中唯一正確答案為對", () => {
    expect(isCorrect(makeQuestion([1]), [1])).toBe(true);
  });

  it("single-choice：選錯選項為錯", () => {
    expect(isCorrect(makeQuestion([1]), [0])).toBe(false);
  });

  it("multi-choice：需完全選中所有正確選項才算對", () => {
    expect(isCorrect(makeQuestion([0, 2]), [0, 2])).toBe(true);
    expect(isCorrect(makeQuestion([0, 2]), [2, 0])).toBe(true);
  });

  it("multi-choice：少選或多選都算錯", () => {
    expect(isCorrect(makeQuestion([0, 2]), [0])).toBe(false);
    expect(isCorrect(makeQuestion([0, 2]), [0, 1, 2])).toBe(false);
  });

  it("未作答（空陣列）視為錯", () => {
    expect(isCorrect(makeQuestion([1]), [])).toBe(false);
  });
});

function makeAttempt(overrides: Partial<Attempt>): Attempt {
  return {
    questionId: "q1",
    subject: "accounting",
    chosenAnswer: [0],
    correct: false,
    chosenAt: "2026-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("getLatestWrongQuestionIds", () => {
  it("最新一筆答錯：列入錯題本", () => {
    const attempts = [
      makeAttempt({ questionId: "q1", correct: false, chosenAt: "2026-01-01T00:00:00.000Z" }),
    ];
    expect(getLatestWrongQuestionIds(attempts)).toEqual(new Set(["q1"]));
  });

  it("最新一筆答對：不列入錯題本，即使先前答錯過", () => {
    const attempts = [
      makeAttempt({ questionId: "q1", correct: false, chosenAt: "2026-01-01T00:00:00.000Z" }),
      makeAttempt({ questionId: "q1", correct: true, chosenAt: "2026-01-02T00:00:00.000Z" }),
    ];
    expect(getLatestWrongQuestionIds(attempts)).toEqual(new Set());
  });

  it("先答對後答錯：仍列入錯題本（以時間最新為準，不看陣列順序）", () => {
    const attempts = [
      makeAttempt({ questionId: "q1", correct: true, chosenAt: "2026-01-02T00:00:00.000Z" }),
      makeAttempt({ questionId: "q1", correct: false, chosenAt: "2026-01-03T00:00:00.000Z" }),
    ];
    expect(getLatestWrongQuestionIds(attempts)).toEqual(new Set(["q1"]));
  });

  it("多題各自獨立判斷", () => {
    const attempts = [
      makeAttempt({ questionId: "q1", correct: false, chosenAt: "2026-01-01T00:00:00.000Z" }),
      makeAttempt({ questionId: "q2", correct: true, chosenAt: "2026-01-01T00:00:00.000Z" }),
      makeAttempt({ questionId: "q3", correct: false, chosenAt: "2026-01-01T00:00:00.000Z" }),
    ];
    expect(getLatestWrongQuestionIds(attempts)).toEqual(new Set(["q1", "q3"]));
  });

  it("沒有任何作答紀錄：回傳空集合", () => {
    expect(getLatestWrongQuestionIds([])).toEqual(new Set());
  });
});

describe("scoreExam", () => {
  it("全對", () => {
    const questions = [makeQuestion([1], "q1"), makeQuestion([0], "q2")];
    const answers = { q1: [1], q2: [0] };
    expect(scoreExam(questions, answers)).toEqual({ correct: 2, total: 2 });
  });

  it("全錯", () => {
    const questions = [makeQuestion([1], "q1"), makeQuestion([0], "q2")];
    const answers = { q1: [0], q2: [1] };
    expect(scoreExam(questions, answers)).toEqual({ correct: 0, total: 2 });
  });

  it("部分未作答視為錯，仍計入 total", () => {
    const questions = [makeQuestion([1], "q1"), makeQuestion([0], "q2")];
    const answers = { q1: [1] };
    expect(scoreExam(questions, answers)).toEqual({ correct: 1, total: 2 });
  });

  it("essay 題型不計分、不計入 total", () => {
    const questions = [makeQuestion([1], "q1"), makeQuestion([0], "q2", "essay")];
    const answers = { q1: [1], q2: [0] };
    expect(scoreExam(questions, answers)).toEqual({ correct: 1, total: 1 });
  });
});
