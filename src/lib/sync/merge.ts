// 同步引擎的純函式部分，獨立成檔供 Vitest 測試（見 docs/specs/cloud-sync.md）

/** 雲端 user_data 表的一列 */
export interface RemoteRow {
  table_name: string;
  key: string;
  data: unknown;
  updated_at: string;
  device_id: string;
}

/** outbox 主鍵：同一筆資料重複寫入時自然合併為一列 */
export function outboxId(table: string, key: string): string {
  return `${table}|${key}`;
}

export function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

/**
 * 拉取套用規則：本地有未上傳變更（在 outbox 中）的資料列，以本地為準略過雲端版本；
 * 其餘一律以雲端覆蓋本地（配合推送端無條件 upsert，整體為 last-write-wins）。
 */
export function shouldApplyRemote(pendingIds: ReadonlySet<string>, row: RemoteRow): boolean {
  return !pendingIds.has(outboxId(row.table_name, row.key));
}

/** 取本批雲端列的最大 updated_at 作為下次拉取起點（以伺服器時間戳為準，避免本地時鐘偏差） */
export function nextLastPulledAt(rows: RemoteRow[], current: string): string {
  let max = current;
  for (const row of rows) {
    if (row.updated_at > max) max = row.updated_at;
  }
  return max;
}
