"use client";

import { useEffect, useRef, useState } from "react";
import { storage } from "@/lib/storage";

export function NoteEditor({ materialId }: { materialId: string }) {
  const [content, setContent] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    storage.getNote(materialId).then((note) => {
      if (note) setContent(note.content);
    });
  }, [materialId]);

  function handleChange(value: string) {
    setContent(value);
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      const updatedAt = new Date().toISOString();
      void storage.setNote({ materialId, content: value, updatedAt }).then(() => {
        setSavedAt(updatedAt);
      });
    }, 500);
  }

  return (
    <div className="mt-8 border-t border-zinc-200 pt-4 dark:border-zinc-800">
      <h2 className="mb-2 text-sm font-semibold text-zinc-600 dark:text-zinc-400">我的筆記</h2>
      <textarea
        value={content}
        onChange={(e) => handleChange(e.target.value)}
        placeholder="在這裡寫下你的理解、疑問或補充……"
        rows={5}
        className="w-full rounded-md border border-zinc-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:border-zinc-700 dark:bg-zinc-900"
      />
      {savedAt && (
        <p className="mt-1 text-xs text-zinc-400">已自動儲存</p>
      )}
    </div>
  );
}
