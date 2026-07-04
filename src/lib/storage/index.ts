import { DexieStorageProvider } from "./dexie-provider";
import type { StorageProvider } from "./types";

export * from "./types";

/**
 * 全站唯一的 StorageProvider 實例。元件一律從這裡取用，
 * 不得直接 import Dexie 或其他儲存實作（計畫 §4.3）。
 */
export const storage: StorageProvider = new DexieStorageProvider();
