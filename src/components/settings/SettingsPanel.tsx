"use client";

import { useEffect, useRef, useState } from "react";
import { storage } from "@/lib/storage";
import { isBackupStale } from "@/lib/settings/backup";

const SCHEMA_VERSION = 1;

export function SettingsPanel() {
  const [lastBackupAt, setLastBackupAt] = useState<string | null | undefined>(undefined);
  const [persisted, setPersisted] = useState<boolean | null>(null);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    storage.getSetting<string>("lastBackupAt").then((value) => setLastBackupAt(value ?? null));
    if (typeof navigator !== "undefined" && navigator.storage?.persisted) {
      navigator.storage.persisted().then(setPersisted);
    }
  }, []);

  async function exportBackup() {
    const data = await storage.exportAll();
    const now = new Date().toISOString();
    const payload = { schemaVersion: SCHEMA_VERSION, exportedAt: now, data };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `accounting-learning-hub-backup-${now.slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    await storage.setSetting("lastBackupAt", now);
    setLastBackupAt(now);
  }

  async function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportMessage(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      const data = parsed && typeof parsed === "object" && "data" in parsed ? parsed.data : parsed;
      await storage.importAll(data);
      setImportMessage("匯入成功，資料已覆蓋對應資料表。");
    } catch {
      setImportMessage("匯入失敗，請確認檔案是本網站匯出的備份 JSON。");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  async function requestPersist() {
    if (typeof navigator === "undefined" || !navigator.storage?.persist) return;
    const granted = await navigator.storage.persist();
    setPersisted(granted);
  }

  const stale = lastBackupAt !== undefined && isBackupStale(lastBackupAt ?? undefined, new Date());

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-2 text-lg font-medium">資料備份</h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          所有學習資料只存在此瀏覽器的 IndexedDB，建議定期匯出備份，避免清除瀏覽器資料時遺失。
        </p>
        {stale ? (
          <p className="mb-3 rounded-md bg-amber-50 p-3 text-sm text-amber-700 dark:bg-amber-950 dark:text-amber-400">
            {lastBackupAt ? `距上次備份（${lastBackupAt.slice(0, 10)}）已超過 30 天，建議重新匯出。` : "尚未備份過，建議立即匯出。"}
          </p>
        ) : null}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={exportBackup}
            className="rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            匯出備份
          </button>
          <label className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            匯入備份
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>
        {importMessage ? <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{importMessage}</p> : null}
        {lastBackupAt ? (
          <p className="mt-2 text-xs text-zinc-400">上次備份：{lastBackupAt.slice(0, 10)}</p>
        ) : null}
      </section>

      <section>
        <h2 className="mb-2 text-lg font-medium">保留儲存空間</h2>
        <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
          啟用後可降低瀏覽器在空間不足時自動清除本站資料的機率。
        </p>
        <button
          type="button"
          onClick={requestPersist}
          className="rounded-md bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
        >
          {persisted ? "已啟用持久化儲存" : "啟用持久化儲存"}
        </button>
      </section>
    </div>
  );
}
