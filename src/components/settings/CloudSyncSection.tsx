"use client";

import { useEffect, useState } from "react";
import { getSyncEngine, type SyncStatus } from "@/lib/sync/engine";

export function CloudSyncSection() {
  const engine = getSyncEngine();
  const [status, setStatus] = useState<SyncStatus | null>(null);
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!engine) return;
    void engine.init();
    return engine.subscribe(setStatus);
  }, [engine]);

  if (!engine) {
    return (
      <section>
        <h2 className="mb-2 text-lg font-medium">雲端同步</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          尚未設定 Supabase 環境變數（NEXT_PUBLIC_SUPABASE_URL／NEXT_PUBLIC_SUPABASE_ANON_KEY），同步功能停用。
        </p>
      </section>
    );
  }

  async function sendLink() {
    if (!email.includes("@")) {
      setMessage("請輸入有效的 email。");
      return;
    }
    setSending(true);
    setMessage(null);
    const { error } = await engine!.signInWithEmail(email);
    setSending(false);
    setMessage(error ? `寄送失敗：${error}` : "登入連結已寄出，請到信箱點擊連結（需在本裝置的瀏覽器開啟）。");
  }

  return (
    <section>
      <h2 className="mb-2 text-lg font-medium">雲端同步</h2>
      {status?.userEmail ? (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            已登入：{status.userEmail}。學習紀錄會自動在背景同步，換裝置後以同一 email 登入即可接續。
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {status.state === "syncing"
              ? "同步中…"
              : status.state === "error"
                ? `同步發生錯誤：${status.error}（免費專案閒置會暫停，可到 Supabase Dashboard 喚醒後按「立即同步」）`
                : `上次同步：${status.lastSyncAt ? status.lastSyncAt.replace("T", " ").slice(0, 19) : "尚未同步"}`}
            {status.pendingCount > 0 ? `｜待上傳 ${status.pendingCount} 筆` : ""}
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void engine.syncNow()}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
            >
              立即同步
            </button>
            <button
              type="button"
              onClick={() => void engine.signOut()}
              className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
            >
              登出
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            以 email 登入後，學習紀錄會自動備份到雲端並跨裝置同步（免記密碼，寄送一次性登入連結）。
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <button
              type="button"
              onClick={() => void sendLink()}
              disabled={sending}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {sending ? "寄送中…" : "寄送登入連結"}
            </button>
          </div>
        </div>
      )}
      {message ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{message}</p> : null}
    </section>
  );
}
