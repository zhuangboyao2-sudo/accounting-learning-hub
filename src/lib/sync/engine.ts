// 雲端同步引擎（見 docs/specs/cloud-sync.md）：Dexie 為本地資料層，
// 本引擎旁路監聽寫入事件累積 outbox，debounce 批次上傳；啟動／恢復連線／回到前景時拉取。
// 只在瀏覽器環境執行。

import type { Session, SupabaseClient } from "@supabase/supabase-js";
import { getDb, type AppDatabase } from "@/lib/storage/dexie-db";
import { setStorageWriteListener } from "@/lib/storage/dexie-provider";
import { getSupabase } from "./supabase-client";
import { chunk, nextLastPulledAt, outboxId, shouldApplyRemote, type RemoteRow } from "./merge";

const PUSH_DEBOUNCE_MS = 3000;
const PULL_INTERVAL_MS = 5 * 60 * 1000;
const BATCH_SIZE = 500;

const LS_DEVICE_ID = "sync.deviceId";
const LS_LAST_PULLED_AT = "sync.lastPulledAt";
const LS_BOOTSTRAPPED_FOR = "sync.bootstrappedFor";

export interface SyncStatus {
  configured: boolean;
  userEmail: string | null;
  state: "idle" | "syncing" | "error";
  error: string | null;
  pendingCount: number;
  lastSyncAt: string | null;
}

/** 各資料表的鍵值轉換與存取；key 一律以字串存於 outbox 與雲端 */
const TABLES: Record<
  string,
  {
    load: (db: AppDatabase, key: string) => Promise<unknown>;
    save: (db: AppDatabase, data: unknown) => Promise<unknown>;
    listKeys: (db: AppDatabase) => Promise<string[]>;
  }
> = {
  progress: {
    load: (db, k) => db.progress.get(k),
    save: (db, d) => db.progress.put(d as never),
    listKeys: (db) => db.progress.toCollection().primaryKeys().then((ks) => ks.map(String)),
  },
  notes: {
    load: (db, k) => db.notes.get(k),
    save: (db, d) => db.notes.put(d as never),
    listKeys: (db) => db.notes.toCollection().primaryKeys().then((ks) => ks.map(String)),
  },
  attempts: {
    load: (db, k) => db.attempts.get(Number(k)),
    save: (db, d) => db.attempts.put(d as never),
    listKeys: (db) => db.attempts.toCollection().primaryKeys().then((ks) => ks.map(String)),
  },
  srsCards: {
    load: (db, k) => db.srsCards.get(k),
    save: (db, d) => db.srsCards.put(d as never),
    listKeys: (db) => db.srsCards.toCollection().primaryKeys().then((ks) => ks.map(String)),
  },
  examSessions: {
    load: (db, k) => db.examSessions.get(Number(k)),
    save: (db, d) => db.examSessions.put(d as never),
    listKeys: (db) => db.examSessions.toCollection().primaryKeys().then((ks) => ks.map(String)),
  },
  feedback: {
    load: (db, k) => db.feedback.get(Number(k)),
    save: (db, d) => db.feedback.put(d as never),
    listKeys: (db) => db.feedback.toCollection().primaryKeys().then((ks) => ks.map(String)),
  },
  settings: {
    load: (db, k) => db.settings.get(k),
    save: (db, d) => db.settings.put(d as never),
    listKeys: (db) => db.settings.toCollection().primaryKeys().then((ks) => ks.map(String)),
  },
  userCards: {
    load: (db, k) => db.userCards.get(Number(k)),
    save: (db, d) => db.userCards.put(d as never),
    listKeys: (db) => db.userCards.toCollection().primaryKeys().then((ks) => ks.map(String)),
  },
  simProgress: {
    load: (db, k) => db.simProgress.get(k),
    save: (db, d) => db.simProgress.put(d as never),
    listKeys: (db) => db.simProgress.toCollection().primaryKeys().then((ks) => ks.map(String)),
  },
};

class SyncEngine {
  private supabase: SupabaseClient;
  private session: Session | null = null;
  private status: SyncStatus;
  private listeners = new Set<(s: SyncStatus) => void>();
  private pushTimer: ReturnType<typeof setTimeout> | null = null;
  private pullTimer: ReturnType<typeof setInterval> | null = null;
  private busy = false;
  private initialized = false;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
    this.status = {
      configured: true,
      userEmail: null,
      state: "idle",
      error: null,
      pendingCount: 0,
      lastSyncAt: null,
    };
  }

  private get db() {
    return getDb();
  }

  private deviceId(): string {
    let id = localStorage.getItem(LS_DEVICE_ID);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(LS_DEVICE_ID, id);
    }
    return id;
  }

  subscribe(listener: (s: SyncStatus) => void): () => void {
    this.listeners.add(listener);
    listener(this.status);
    return () => this.listeners.delete(listener);
  }

  getStatus(): SyncStatus {
    return this.status;
  }

  private setStatus(patch: Partial<SyncStatus>) {
    this.status = { ...this.status, ...patch };
    for (const l of this.listeners) l(this.status);
  }

  private async refreshPendingCount() {
    const count = await this.db.syncOutbox.count();
    this.setStatus({ pendingCount: count });
  }

  async init() {
    if (this.initialized) return;
    this.initialized = true;
    const { data } = await this.supabase.auth.getSession();
    this.onSession(data.session);
    this.supabase.auth.onAuthStateChange((_event, session) => this.onSession(session));
  }

  private onSession(session: Session | null) {
    const wasActive = this.session !== null;
    this.session = session;
    this.setStatus({ userEmail: session?.user.email ?? null });
    if (session && !wasActive) this.activate();
    if (!session && wasActive) this.deactivate();
  }

  private activate() {
    setStorageWriteListener((table, key) => {
      if (table === "__importAll__") {
        void this.resetCloudAndReupload();
      } else {
        void this.enqueue(table, key);
      }
    });
    window.addEventListener("online", this.onWake);
    document.addEventListener("visibilitychange", this.onVisible);
    this.pullTimer = setInterval(() => void this.syncNow(), PULL_INTERVAL_MS);
    void this.startupSync();
  }

  private deactivate() {
    setStorageWriteListener(null);
    window.removeEventListener("online", this.onWake);
    document.removeEventListener("visibilitychange", this.onVisible);
    if (this.pullTimer) clearInterval(this.pullTimer);
    this.pullTimer = null;
  }

  private onWake = () => void this.syncNow();
  private onVisible = () => {
    if (document.visibilityState === "visible") void this.syncNow();
  };

  private async startupSync() {
    const userId = this.session?.user.id;
    if (!userId) return;
    if (localStorage.getItem(LS_BOOTSTRAPPED_FOR) !== userId) {
      // 首次在此裝置啟用：全量入列上傳，並自 epoch 起全量拉取（本地未上傳者以本地為準）
      await this.enqueueAll();
      localStorage.setItem(LS_LAST_PULLED_AT, "");
      localStorage.setItem(LS_BOOTSTRAPPED_FOR, userId);
    }
    await this.syncNow();
  }

  private async enqueue(table: string, key: string) {
    await this.db.syncOutbox.put({
      id: outboxId(table, key),
      table,
      key,
      changedAt: new Date().toISOString(),
    });
    await this.refreshPendingCount();
    if (this.pushTimer) clearTimeout(this.pushTimer);
    this.pushTimer = setTimeout(() => void this.syncNow(), PUSH_DEBOUNCE_MS);
  }

  private async enqueueAll() {
    const changedAt = new Date().toISOString();
    for (const [table, ops] of Object.entries(TABLES)) {
      const keys = await ops.listKeys(this.db);
      await this.db.syncOutbox.bulkPut(
        keys.map((key) => ({ id: outboxId(table, key), table, key, changedAt })),
      );
    }
    await this.refreshPendingCount();
  }

  /** 匯入備份會整批覆蓋本地：刪除雲端全部資料後全量重傳，避免舊資料列復活 */
  private async resetCloudAndReupload() {
    const userId = this.session?.user.id;
    if (!userId) return;
    try {
      await this.supabase.from("user_data").delete().eq("user_id", userId);
      localStorage.setItem(LS_LAST_PULLED_AT, new Date().toISOString());
      await this.enqueueAll();
      await this.syncNow();
    } catch (e) {
      this.setStatus({ state: "error", error: toMessage(e) });
    }
  }

  /** 立即執行一次「推送＋拉取」；並行呼叫時直接略過（下一次觸發再補） */
  async syncNow() {
    if (this.busy || !this.session || typeof navigator !== "undefined" && !navigator.onLine) return;
    this.busy = true;
    this.setStatus({ state: "syncing", error: null });
    try {
      await this.push();
      await this.pull();
      this.setStatus({ state: "idle", lastSyncAt: new Date().toISOString() });
    } catch (e) {
      this.setStatus({ state: "error", error: toMessage(e) });
    } finally {
      this.busy = false;
      await this.refreshPendingCount();
    }
  }

  private async push() {
    const userId = this.session?.user.id;
    if (!userId) return;
    const entries = await this.db.syncOutbox.toArray();
    if (entries.length === 0) return;
    const deviceId = this.deviceId();
    const updatedAt = new Date().toISOString();

    for (const batch of chunk(entries, BATCH_SIZE)) {
      const rows = [];
      for (const entry of batch) {
        const ops = TABLES[entry.table];
        if (!ops) continue;
        const data = await ops.load(this.db, entry.key);
        if (data === undefined) continue; // 已不存在（無刪除語意，直接略過）
        rows.push({
          user_id: userId,
          table_name: entry.table,
          key: entry.key,
          data,
          updated_at: updatedAt,
          device_id: deviceId,
        });
      }
      if (rows.length > 0) {
        const { error } = await this.supabase
          .from("user_data")
          .upsert(rows, { onConflict: "user_id,table_name,key" });
        if (error) throw new Error(error.message);
      }
      // 上傳期間若同筆資料又被寫入（changedAt 已變），保留該列待下次上傳
      for (const entry of batch) {
        await this.db.syncOutbox
          .where("id")
          .equals(entry.id)
          .and((row) => row.changedAt === entry.changedAt)
          .delete();
      }
    }
  }

  private async pull() {
    if (!this.session) return;
    const deviceId = this.deviceId();
    let last = localStorage.getItem(LS_LAST_PULLED_AT) ?? "";
    for (;;) {
      let query = this.supabase
        .from("user_data")
        .select("table_name,key,data,updated_at,device_id")
        .neq("device_id", deviceId)
        .order("updated_at", { ascending: true })
        .limit(BATCH_SIZE);
      if (last) query = query.gt("updated_at", last);
      const { data, error } = await query;
      if (error) throw new Error(error.message);
      const rows = (data ?? []) as RemoteRow[];
      if (rows.length === 0) break;

      const pendingIds = new Set((await this.db.syncOutbox.toCollection().primaryKeys()).map(String));
      for (const row of rows) {
        const ops = TABLES[row.table_name];
        if (!ops || !shouldApplyRemote(pendingIds, row)) continue;
        await ops.save(this.db, row.data);
      }
      last = nextLastPulledAt(rows, last);
      localStorage.setItem(LS_LAST_PULLED_AT, last);
      if (rows.length < BATCH_SIZE) break;
    }
  }

  async signInWithEmail(email: string): Promise<{ error: string | null }> {
    const { error } = await this.supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/settings` },
    });
    return { error: error ? error.message : null };
  }

  async signOut() {
    await this.supabase.auth.signOut();
    localStorage.removeItem(LS_BOOTSTRAPPED_FOR);
    localStorage.removeItem(LS_LAST_PULLED_AT);
  }
}

function toMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e);
}

let engine: SyncEngine | null | undefined;

/** 取得同步引擎單例；未設定 Supabase 環境變數時回傳 null */
export function getSyncEngine(): SyncEngine | null {
  if (engine !== undefined) return engine;
  const supabase = getSupabase();
  engine = supabase ? new SyncEngine(supabase) : null;
  return engine;
}

export type { SyncEngine };
