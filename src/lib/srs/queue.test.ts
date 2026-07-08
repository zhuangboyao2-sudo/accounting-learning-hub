import { describe, expect, it } from "vitest";
import { buildDueQueue, userCardId } from "./queue";
import type { Flashcard } from "@/types/content";
import type { SrsCardState, UserCard } from "@/lib/storage/types";

const NOW = "2026-07-08T00:00:00.000Z";

function makeFlashcard(overrides: Partial<Flashcard> = {}): Flashcard {
  return {
    id: "fc-1",
    subject: "accounting",
    front: "front",
    back: "back",
    material_ref: "acc-01-01",
    verified_at: "2026-01-01",
    ...overrides,
  };
}

function makeSrsState(overrides: Partial<SrsCardState> = {}): SrsCardState {
  return {
    cardId: "fc-1",
    due: NOW,
    stability: 1,
    difficulty: 1,
    reps: 1,
    lapses: 0,
    state: 2,
    scheduledDays: 1,
    learningSteps: 0,
    paused: false,
    ...overrides,
  };
}

describe("buildDueQueue", () => {
  it("從未排程過的卡片視為新卡、即時到期", () => {
    const queue = buildDueQueue([makeFlashcard()], [], [], NOW);
    expect(queue.map((c) => c.cardId)).toEqual(["fc-1"]);
  });

  it("已排程且 due<=now 的卡片列入到期清單", () => {
    const queue = buildDueQueue(
      [makeFlashcard()],
      [],
      [makeSrsState({ due: "2026-07-01T00:00:00.000Z" })],
      NOW,
    );
    expect(queue.map((c) => c.cardId)).toEqual(["fc-1"]);
  });

  it("已排程但 due>now 的卡片不列入", () => {
    const queue = buildDueQueue(
      [makeFlashcard()],
      [],
      [makeSrsState({ due: "2026-08-01T00:00:00.000Z" })],
      NOW,
    );
    expect(queue).toEqual([]);
  });

  it("paused 的卡片即使到期也不列入", () => {
    const queue = buildDueQueue(
      [makeFlashcard()],
      [],
      [makeSrsState({ due: "2026-07-01T00:00:00.000Z", paused: true })],
      NOW,
    );
    expect(queue).toEqual([]);
  });

  it("使用者自建卡片沿用同一套到期邏輯，cardId 帶 user- 前綴", () => {
    const userCard: UserCard & { id: number } = {
      id: 42,
      front: "自訂正面",
      back: "自訂反面",
      createdAt: NOW,
    };
    const queue = buildDueQueue([], [userCard], [], NOW);
    expect(queue).toEqual([
      { cardId: userCardId(42), front: "自訂正面", back: "自訂反面", materialId: undefined },
    ]);
  });
});
