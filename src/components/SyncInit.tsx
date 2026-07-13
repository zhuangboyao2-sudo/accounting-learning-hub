"use client";

import { useEffect } from "react";
import { getSyncEngine } from "@/lib/sync/engine";

/** 掛在全站 layout：登入狀態下任何頁面的學習紀錄都會背景同步 */
export function SyncInit() {
  useEffect(() => {
    void getSyncEngine()?.init();
  }, []);
  return null;
}
