# 會計學習網站 — 專案守則

台灣會計／稅務自學網站（教材、題庫、複習卡、實務工具），單人使用、免費部署。

## 必讀

- 開發前先讀 [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)，它是唯一需求來源；依 Phase 順序執行（Phase 0–6），目前進度見 git log；Phase 5 完成後即依計畫 §8 啟動年度維運循環（維運步驟見 `docs/maintenance/`）
- 計畫 §9「給執行模型的守則」為硬性規定，重點：
  - 含稅務數字的內容必須先經官方來源（law.moj.gov.tw、etax.nat.gov.tw）WebSearch 查證，並填 `verified_at` 與 `sources`
  - 程式碼不得硬編碼稅務數字，一律讀 `content/tax-parameters/`
  - 使用者資料讀寫只能經過 `src/lib/storage/` 的 StorageProvider 介面
  - 每科教材動筆前，先給使用者確認章節大綱

## 技術棧

Next.js (App Router) + TypeScript + Tailwind CSS；內容為 MDX/JSON 檔；本地資料用 Dexie (IndexedDB)；SRS 用 ts-fsrs；部署 Vercel 免費方案；CI 與維運排程提醒用 GitHub Actions。

效能原則：不用中文 webfont（一律系統字體）、教材頁靜態生成。
