"use client";

import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";

/**
 * Phase 1 暫代方案：手動標記完成。Phase 2 會加入節末快測，
 * 全對才自動標記完成，屆時這顆按鈕會被取代（見計畫 Phase 1／Phase 2）。
 */
export function MarkCompleteButton({ materialId }: { materialId: string }) {
  const [status, setStatus] = useState<"unread" | "in-progress" | "done">("unread");

  useEffect(() => {
    storage.getProgress(materialId).then((progress) => {
      if (progress) setStatus(progress.status);
    });
  }, [materialId]);

  function toggle() {
    const next = status === "done" ? "in-progress" : "done";
    setStatus(next);
    void storage.setProgress({
      materialId,
      status: next,
      updatedAt: new Date().toISOString(),
    });
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={`rounded-md px-3 py-1.5 text-sm font-medium ${
        status === "done"
          ? "bg-emerald-600 text-white"
          : "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
      }`}
    >
      {status === "done" ? "✓ 已完成" : "標記完成"}
    </button>
  );
}
