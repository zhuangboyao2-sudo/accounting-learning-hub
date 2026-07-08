// 手寫的最小 service worker（未用 next-pwa/serwist，避免與 Turbopack 相容性風險，
// 見計畫 Phase 4 規劃筆記）。策略：
// - install 時盡量預快取 /precache-manifest.json 列出的頁面（教材/練習/複習卡等，
//   清單由伺服器依目前內容動態產生，不需手動維護）
// - _next/static 靜態資源（檔名帶 hash，內容不變）採 cache-first
// - 一般頁面導覽採 network-first，離線或逾時時退回快取
// 未在安裝清單中的教材頁，只要瀏覽過一次也會因 network-first 的快取寫入而離線可用。

const CACHE_NAME = "accounting-hub-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      let urls = ["/"];
      try {
        const res = await fetch("/precache-manifest.json");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.urls)) urls = data.urls;
        }
      } catch {
        // 離線安裝或清單暫時取不到時，至少保底快取首頁
      }
      await Promise.all(
        urls.map((url) => cache.add(url).catch(() => {})),
      );
      self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n)));
      self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isStaticAsset = url.pathname.startsWith("/_next/static/");

  if (isStaticAsset) {
    event.respondWith(
      (async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
      })(),
    );
    return;
  }

  event.respondWith(
    (async () => {
      try {
        const response = await fetch(request);
        const cache = await caches.open(CACHE_NAME);
        cache.put(request, response.clone());
        return response;
      } catch {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error("離線且無快取可用");
      }
    })(),
  );
});
