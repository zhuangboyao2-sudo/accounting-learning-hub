import { describe, expect, it } from "vitest";
import { isCorrect } from "./scoring";
import type { Question } from "@/types/content";

function makeQuestion(answer: number[]): Question {
  return {
    id: "q1",
    subject: "accounting",
    source: { type: "generated" },
    type: answer.length > 1 ? "multi-choice" : "single-choice",
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
