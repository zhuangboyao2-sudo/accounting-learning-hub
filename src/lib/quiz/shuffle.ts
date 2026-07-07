// 純陣列工具，不依賴 node:fs，供 client 元件與 server 端讀檔邏輯共用

/** Fisher-Yates shuffle，不修改原陣列 */
export function shuffle<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/** 從陣列中隨機抽取最多 count 筆，count 大於陣列長度時回傳全部（已洗牌） */
export function pickRandom<T>(items: T[], count: number): T[] {
  return shuffle(items).slice(0, count);
}
