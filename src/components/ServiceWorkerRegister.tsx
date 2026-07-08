"use client";

import { useEffect } from "react";

/** 掛載 service worker 以支援離線使用，見 public/sw.js。 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
  }, []);
  return null;
}
