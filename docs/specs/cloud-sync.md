# 雲端同步（Supabase）規格

> §10.3 中期 P0。2026-07-13 與使用者確認：email magic link 登入、自動背景同步、Dexie 維持本地層。
> 實作前置條件：使用者建立 Supabase 專案並提供金鑰（見文末操作指引）。

## 目標與範圍

- 單人多裝置（手機＋電腦）進度同步；不做多使用者、不做即時協作
- 離線優先：IndexedDB（Dexie）仍是本地資料層，PWA 離線能力不退化；雲端是備援與同步通道
- 未登入時網站功能完全照常（純本地模式），登入是可選的

## 架構

採「**Dexie 為主＋同步引擎旁路**」設計，而非直接替換 StorageProvider：

```
UI 元件 → StorageProvider（介面不變）→ DexieProvider（不動）
                                          ↕
                                     SyncEngine（新增，src/lib/storage/sync/）
                                          ↕
                                     Supabase（Postgres + Auth）
```

> 註：DEVELOPMENT_PLAN §4.3 原構想是「替換 provider」，但那會犧牲離線優先。此偏離已記入計畫 §10.3。UI 層仍只碰 StorageProvider 介面，約束不變。

## 資料模型（2026-07-13 實作定案）

- 雲端採**單一通用表** `user_data(user_id, table_name, key, data jsonb, updated_at, device_id)`，主鍵 `(user_id, table_name, key)`：Dexie 九張表的資料列以 jsonb 原樣存放，本地 schema 演進時雲端不需跟著遷移（較原規劃「九張對應表」簡化，理由記於此）
- RLS：`auth.uid() = user_id`，單一 policy
- schema 見 [supabase/schema.sql](../../supabase/schema.sql)，於 Dashboard SQL Editor 執行一次

## 同步引擎（src/lib/sync/）

- **變更追蹤**：DexieProvider 每次寫入後通知 `setStorageWriteListener`，引擎將 `(table, key)` 記入 `syncOutbox` 表（Dexie v4），主鍵 `table|key` 使重複寫入自然合併；上傳成功且期間無新寫入才移除
- **Push**：debounce 3 秒批次 upsert（每批 500 筆），`updated_at`、`device_id` 由客戶端寫入；離線時累積，`online` 事件恢復後補送
- **Pull**：啟動、恢復連線、回到前景、每 5 分鐘拉取 `updated_at > lastPulledAt` 且 `device_id` 非本機的記錄寫回 Dexie；`lastPulledAt` 取批次最大伺服器時間戳（避免本地時鐘偏差），存 localStorage（裝置本地狀態，不入同步範圍）
- **衝突**：本地有未上傳變更的資料列以本地為準略過雲端版本，其餘雲端覆蓋本地；配合推送端無條件 upsert，整體為 last-write-wins
- **首次啟用**：登入後全量入列上傳＋自 epoch 全量拉取
- **匯入備份**：屬整批覆蓋，觸發「刪除雲端全部資料→全量重傳」，避免舊資料列復活
- **已知限制**：`attempts`／`examSessions`／`feedback`／`userCards` 以本地自動遞增 id 為同步鍵，兩台裝置「同時離線」各自新增時可能撞號（LWW 保留一筆）；單人依序使用裝置＋自動同步下機率極低，接受此限制

## UI（僅設定頁）

- 登入／登出（email magic link）
- 同步狀態列：最後同步時間、待上傳筆數、錯誤時顯示手動「立即同步」鈕
- 既有 JSON 備份匯出／匯入功能**保留不動**（免費額度政策變動時的逃生通道）

## 測試（Vitest，核心邏輯）

- outbox 累積與清除、LWW 合併、pull 寫回的純函式部分
- 不測 Supabase 網路層本身

## 風險與對策

| 風險 | 對策 |
|------|------|
| Supabase 免費專案閒置會被暫停（實作時查證現行政策與天數） | 網站每次開啟即有讀寫即可維持活躍；若政策嚴苛，評估 GitHub Actions 定期 ping |
| 免費額度政策改變 | JSON 備份為逃生通道；資料量（單人學習紀錄）遠低於免費上限 |
| magic link 信件延遲 | session 長效（預設 refresh token 不過期登出），登入頻率極低 |

## 使用者操作指引（實作前你要做的事）

1. 到 supabase.com 註冊並建立免費專案（region 選 Northeast Asia／Tokyo 較近）
2. 專案 Dashboard → Settings → API，取得 **Project URL** 與 **anon public key**
3. 在專案根目錄建立 `.env.local`：
   ```
   NEXT_PUBLIC_SUPABASE_URL=<Project URL>
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
   ```
4. Vercel 專案設定加入同樣兩個環境變數
5. Supabase Dashboard → Authentication → URL Configuration：Site URL 填正式站網址
6. 告知 Claude Code「Supabase 專案已建好」，即可開工（SQL migration 由實作時產出，貼到 Dashboard 的 SQL Editor 執行）
