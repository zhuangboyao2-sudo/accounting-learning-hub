import { fsrs, createEmptyCard, Rating, type Card, type Grade } from "ts-fsrs";
import type { SrsCardState } from "@/lib/storage/types";

export { Rating };
export type { Grade };

const scheduler = fsrs();

function toFsrsCard(state: SrsCardState): Card {
  return {
    due: new Date(state.due),
    stability: state.stability,
    difficulty: state.difficulty,
    elapsed_days: 0,
    scheduled_days: state.scheduledDays,
    learning_steps: state.learningSteps,
    reps: state.reps,
    lapses: state.lapses,
    state: state.state,
    last_review: state.lastReviewedAt ? new Date(state.lastReviewedAt) : undefined,
  };
}

function toSrsCardState(cardId: string, card: Card, paused: boolean): SrsCardState {
  return {
    cardId,
    due: card.due.toISOString(),
    stability: card.stability,
    difficulty: card.difficulty,
    reps: card.reps,
    lapses: card.lapses,
    state: card.state,
    scheduledDays: card.scheduled_days,
    learningSteps: card.learning_steps,
    paused,
    lastReviewedAt: card.last_review ? card.last_review.toISOString() : undefined,
  };
}

/** 建立一張全新複習卡的初始排程狀態，due 即為 now（新卡即時到期）。 */
export function createNewCardState(cardId: string, now: Date): SrsCardState {
  return toSrsCardState(cardId, createEmptyCard(now), false);
}

/** 依評分（忘記/困難/良好/簡單）計算下一次排程狀態，paused 狀態不受評分影響。 */
export function gradeCard(current: SrsCardState, grade: Grade, now: Date): SrsCardState {
  const { card: nextCard } = scheduler.next(toFsrsCard(current), now, grade);
  return toSrsCardState(current.cardId, nextCard, current.paused);
}
