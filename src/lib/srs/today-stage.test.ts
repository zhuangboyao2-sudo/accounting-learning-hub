import { describe, expect, it } from "vitest";
import { pickInitialStage, pickStageAfterCards } from "./today-stage";

describe("pickInitialStage", () => {
  it("有到期複習卡：從 cards 開始", () => {
    expect(pickInitialStage(5, 3)).toBe("cards");
    expect(pickInitialStage(5, 0)).toBe("cards");
  });

  it("沒有到期複習卡但有錯題：從 wrong 開始", () => {
    expect(pickInitialStage(0, 3)).toBe("wrong");
  });

  it("複習卡與錯題都沒有：直接進 next", () => {
    expect(pickInitialStage(0, 0)).toBe("next");
  });
});

describe("pickStageAfterCards", () => {
  it("還有錯題：進 wrong", () => {
    expect(pickStageAfterCards(3)).toBe("wrong");
  });

  it("沒有錯題：直接進 next", () => {
    expect(pickStageAfterCards(0)).toBe("next");
  });
});
