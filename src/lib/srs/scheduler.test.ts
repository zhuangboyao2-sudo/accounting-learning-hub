import { describe, expect, it } from "vitest";
import { State } from "ts-fsrs";
import { createNewCardState, gradeCard, Rating } from "./scheduler";

const NOW = new Date("2026-07-08T00:00:00.000Z");

describe("createNewCardState", () => {
  it("新卡片 due 即為 now，狀態為 New", () => {
    const card = createNewCardState("fc-1", NOW);
    expect(card.due).toBe(NOW.toISOString());
    expect(card.state).toBe(State.New);
    expect(card.paused).toBe(false);
  });
});

describe("gradeCard", () => {
  it("評「良好」後 due 應晚於評分當下，reps 增加", () => {
    const card = createNewCardState("fc-1", NOW);
    const graded = gradeCard(card, Rating.Good, NOW);
    expect(new Date(graded.due).getTime()).toBeGreaterThan(NOW.getTime());
    expect(graded.reps).toBe(1);
  });

  it("評「簡單」的下次 due 應晚於或等於評「良好」", () => {
    const card = createNewCardState("fc-1", NOW);
    const goodResult = gradeCard(card, Rating.Good, NOW);
    const easyResult = gradeCard(card, Rating.Easy, NOW);
    expect(new Date(easyResult.due).getTime()).toBeGreaterThanOrEqual(
      new Date(goodResult.due).getTime(),
    );
  });

  it("保留 paused 狀態不受評分影響", () => {
    const card = { ...createNewCardState("fc-1", NOW), paused: true };
    const graded = gradeCard(card, Rating.Good, NOW);
    expect(graded.paused).toBe(true);
  });

  it("Review 狀態的卡片評「忘記」：lapses 增加，狀態轉為 Relearning", () => {
    let card = createNewCardState("fc-1", NOW);
    let now = NOW;
    // 反覆評「良好」直到卡片進入 Review 狀態
    for (let i = 0; i < 10 && card.state !== State.Review; i++) {
      card = gradeCard(card, Rating.Good, now);
      now = new Date(card.due);
    }
    expect(card.state).toBe(State.Review);
    const lapsesBefore = card.lapses;

    const afterAgain = gradeCard(card, Rating.Again, now);
    expect(afterAgain.lapses).toBe(lapsesBefore + 1);
    expect(afterAgain.state).toBe(State.Relearning);
  });
});
