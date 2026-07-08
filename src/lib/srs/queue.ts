import type { Flashcard, Subject } from "@/types/content";
import type { SrsCardState, UserCard } from "@/lib/storage/types";

export const USER_CARD_PREFIX = "user-";

export function userCardId(id: number): string {
  return `${USER_CARD_PREFIX}${id}`;
}

export interface ReviewCard {
  cardId: string;
  front: string;
  back: string;
  subject?: Subject;
  materialId?: string;
}

/**
 * 合併內容複習卡與使用者自建卡片，比對現有 SrsCardState 算出「今日到期」清單。
 * 從未排程過的卡片視為新卡、即時到期；已排程且 due<=now 的卡片到期；paused 的卡片不列入。
 */
export function buildDueQueue(
  flashcards: Flashcard[],
  userCards: (UserCard & { id: number })[],
  srsCards: SrsCardState[],
  now: string,
): ReviewCard[] {
  const stateByCardId = new Map(srsCards.map((state) => [state.cardId, state]));
  const items: ReviewCard[] = [];

  function isDue(cardId: string): boolean {
    const state = stateByCardId.get(cardId);
    if (state?.paused) return false;
    return !state || state.due <= now;
  }

  for (const card of flashcards) {
    if (isDue(card.id)) {
      items.push({
        cardId: card.id,
        front: card.front,
        back: card.back,
        subject: card.subject,
        materialId: card.material_ref,
      });
    }
  }

  for (const userCard of userCards) {
    const cardId = userCardId(userCard.id);
    if (isDue(cardId)) {
      items.push({
        cardId,
        front: userCard.front,
        back: userCard.back,
        materialId: userCard.materialId,
      });
    }
  }

  return items;
}
