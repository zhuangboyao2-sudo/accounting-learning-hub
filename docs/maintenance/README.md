# 維運文件索引

本目錄是 [DEVELOPMENT_PLAN.md](../../DEVELOPMENT_PLAN.md) §8「長期維運與自我優化」的操作手冊。任何一代 AI 模型接手時，只需讀本目錄對應的 checklist 逐步照做，不依賴任何對話記憶。

GitHub Actions（`.github/workflows/maintenance-reminders.yml`）會在對應月份自動開 Issue 並附上該份 checklist 的連結，執行者收到提醒後打開對應文件逐項打勾即可。

| 時間 | 文件 | 對應計畫章節 |
|------|------|------|
| 每年 1 月 | [annual-01-tax-parameters.md](annual-01-tax-parameters.md) | §8.1 |
| 每年 4–6 月 | [annual-04-06-exam-syllabus.md](annual-04-06-exam-syllabus.md) | §8.1 |
| 每年 12 月 | [annual-12-past-exams-review.md](annual-12-past-exams-review.md) | §8.1、§6.4、§8.4 |
| 每年 4／7／10 月 | [quarterly-optimization.md](quarterly-optimization.md) | §8.3 |
| 常備參考 | [past-exam-sources.md](past-exam-sources.md) | §6.4 |

## 連結檢查的已知限制

`npm run check-source-links` 對部分政府網站（如 law.moea.gov.tw、nhi.gov.tw）常誤報為失效，原因是這些網站的防護機制會擋掉一般伺服器端請求，而非連結真的失效。收到每月 Issue 中的失效清單時，**務必先用瀏覽器手動開啟確認**，不要直接假設連結已失效並貿然修改內容。

## 執行原則

- 每份 checklist 打完勾後，將本次執行結果（做了什麼、跳過了什麼、原因）以一段話記錄在對應 GitHub Issue 留言中再關閉 Issue，作為下一年度接手者的參考。
- 若某年度任務執行時發現流程本身需要調整（例如官方入口網址改版、法規查詢方式變更），先更新對應 checklist 文件，再更新 [DEVELOPMENT_PLAN.md](../../DEVELOPMENT_PLAN.md) 文末變更紀錄。
