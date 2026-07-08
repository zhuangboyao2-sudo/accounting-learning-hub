"use client";

import { useEffect, useRef, useState } from "react";
import { storage } from "@/lib/storage";
import { createNewCardState } from "@/lib/srs/scheduler";
import { userCardId } from "@/lib/srs/queue";

export function NoteEditor({ materialId }: { materialId: string }) {
  const [content, setContent] = useState("");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardFront, setCardFront] = useState("");
  const [cardBack, setCardBack] = useState("");
  const [cardCreated, setCardCreated] = useState(false);

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

  function openCardForm() {
    setCardFront("");
    setCardBack(content);
    setCardCreated(false);
    setShowCardForm(true);
  }

  async function submitCard() {
    if (!cardFront.trim() || !cardBack.trim()) return;
    const now = new Date();
    const id = await storage.addUserCard({
      front: cardFront,
      back: cardBack,
      materialId,
      createdAt: now.toISOString(),
    });
    await storage.setSrsCard(createNewCardState(userCardId(id), now));
    setCardCreated(true);
    setShowCardForm(false);
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
      <div className="mt-2 flex items-center gap-3">
        {savedAt && <p className="text-xs text-zinc-400">已自動儲存</p>}
        {!showCardForm ? (
          <button type="button" onClick={openCardForm} className="ml-auto text-xs text-zinc-500 hover:underline">
            轉成複習卡
          </button>
        ) : null}
        {cardCreated ? <p className="ml-auto text-xs text-emerald-600">已加入複習卡佇列</p> : null}
      </div>

      {showCardForm ? (
        <div className="mt-3 rounded-md border border-zinc-200 p-3 dark:border-zinc-800">
          <label className="block text-xs text-zinc-500 dark:text-zinc-400">
            正面（問題）
            <input
              type="text"
              value={cardFront}
              onChange={(e) => setCardFront(e.target.value)}
              placeholder="例如：企業個體假設是什麼？"
              className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <label className="mt-2 block text-xs text-zinc-500 dark:text-zinc-400">
            反面（答案，預填筆記內容供編輯）
            <textarea
              value={cardBack}
              onChange={(e) => setCardBack(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border border-zinc-300 p-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </label>
          <div className="mt-2 flex gap-3">
            <button
              type="button"
              onClick={submitCard}
              disabled={!cardFront.trim() || !cardBack.trim()}
              className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:opacity-40 dark:bg-zinc-100 dark:text-zinc-900"
            >
              新增卡片
            </button>
            <button
              type="button"
              onClick={() => setShowCardForm(false)}
              className="text-xs text-zinc-500 hover:underline"
            >
              取消
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
