import { storage } from "@/lib/storage";

export interface StreakState {
  count: number;
  /** YYYY-MM-DD */
  lastActiveDate: string;
}

function toDateOnly(iso: string): string {
  return iso.slice(0, 10);
}

function addDays(dateOnly: string, days: number): string {
  const date = new Date(`${dateOnly}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * 依上次活躍日期與今天日期算出下一個 streak 狀態：
 * 同一天已計過不重複累計、連續隔天 +1、中斷（含跳過日子）則歸 1。
 */
export function computeNextStreak(current: StreakState | undefined, today: string): StreakState {
  if (!current) return { count: 1, lastActiveDate: today };
  if (current.lastActiveDate === today) return current;
  const yesterday = addDays(today, -1);
  const count = current.lastActiveDate === yesterday ? current.count + 1 : 1;
  return { count, lastActiveDate: today };
}

/** 記錄今日已完成每日學習佇列，回傳最新連續天數 */
export async function recordTodayActivity(now = new Date()): Promise<number> {
  const today = toDateOnly(now.toISOString());
  const current = await storage.getSetting<StreakState>("streak");
  const next = computeNextStreak(current, today);
  await storage.setSetting("streak", next);
  return next.count;
}
