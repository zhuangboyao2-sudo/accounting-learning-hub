# 會計學習網站

台灣會計／稅務自學平台：教材、題庫、間隔複習卡與實務工具，單人使用、全程免費部署。

需求與開發階段詳見 [DEVELOPMENT_PLAN.md](DEVELOPMENT_PLAN.md)（唯一需求來源）；專案守則見 [CLAUDE.md](CLAUDE.md)。

## 本地啟動

```bash
npm install
npm run dev       # http://localhost:3000
npm run validate-content   # 驗證 content/ 下內容 schema 與查證時效
npm test                   # Vitest 單元測試
```
