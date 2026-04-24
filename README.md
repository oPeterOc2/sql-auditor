# 🛠️ Smart SQL Auditor (Senior PSR Edition)

這是一個專為生產支持 (Production Support) 與資料庫管理設計的 SQL 審計工具。它結合了資深開發者的實戰經驗規則與現代大語言模型 (LLM) 的分析能力。

### 🌟 核心亮點
- **雙層審計機制**：
    - **Expert Rules (Local)**：基於 8 年 PSR 經驗，即時偵測全表更新、索引失效、笛卡爾積等高危行為。
    - **AI Diagnostics (Remote)**：整合 Hugging Face Qwen-2.5 模型，提供專家級的 SQL 優化建議與重寫。
- **DevSecOps 導向**：採用 API Token 動態輸入機制，確保生產密鑰不洩漏。
- **React 技術棧**：使用 React 現代組件化架構開發。

### 🚀 快速開始
1. 訪問 [你的 GitHub Pages 網址]
2. 貼入測試 SQL（或使用內建測試案例）
3. 輸入 Hugging Face Token 即可獲得深度 AI 建議

### 🛠️ 技術棧
- Frontend: React.js
- AI SDK: @huggingface/inference
- Model: Qwen/Qwen2.5-7B-Instruct
- Deployment: GitHub Pages

## 🧠 技術實作心得 (Senior Insights)

在開發「智能 SQL 數據審計工具」過程中，針對生產環境支持 (PSR) 的嚴苛要求，本專案克服了以下技術挑戰：

* **SDK-Driven Stability**：初步嘗試使用 REST API 進行模型調用時，發現前端環境處理跨域 (CORS) 與流式傳輸較為繁瑣且不穩定。隨即決定**重構通訊層**，遷移至官方 `@huggingface/inference` SDK，利用其內部封裝的 `chatCompletion` 機制，顯著提升了生產環境下的通訊成功率。
* **Security & Push Protection**：在執行自動化部署 (GitHub Pages) 時，觸發了 GitHub 的 **Push Protection** 機制。這引發了對前端環境變量注入風險的深度思考：識別出 `REACT_APP_` 變量在 Build Time 會被硬編碼至混淆後的代碼中。隨即調整架構，改為「動態輸入密鑰」模式，從源頭解決了 API 配額洩漏的風險。
* **Pattern Recognition Optimization**：針對 Oracle 舊式語法（如逗號分隔多表關聯）與新式 `JOIN` 語法進行邏輯整合，確保審計引擎能覆蓋不同年代的遺留代碼 (Legacy Code)，精準攔截潛在的笛卡爾積 (Cartesian Product) 異常。

## 🛠️ 開發方法論 (Development Methodology)

本專案採用 **AI-Augmented Engineering (AI 增強工程)** 模式實作，這是我作為資深開發者對「AI 協作時代」生產力的實踐：

* **架構師思維 (Architectural Focus)**：將開發精力從瑣碎的 UI CSS 調整轉移至**「PSR 邏輯定義」**與**「AI Prompt Engineering」**。透過定義精確的系統角色 (System Role)，讓 Qwen-2.5 模型能穩定產出具備 Oracle DBA 水準的優化建議。
* **快速原型迭代 (Rapid Prototyping)**：利用 LLM 協作進行代碼建構，將研發重點由傳統的「手工編碼」轉移至**「系統架構設計」**與**「跨環境整合驗證」**。
* **持續優化思維**：面對 SDK 版本更新（如 `HfInference` 標示為已淘汰）時，利用 AI 協助快速定位新版 `InferenceClient` 規範，並在 15 分鐘內完成核心邏輯的平滑遷移，體現了在複雜雲端生態下快速定位問題並交付解決方案的能力。

---

## 👨‍💻 作者與背景 (Author & Background)

**Developed by [Chan Ka Ho] | 2026 Senior Developer AI Transformation Project**

* **核心背景**：擁有約 8 年後端開發與 PSR (Production Support Request) 生產支持經驗，專長於 Java、Oracle SQL 與 Unix 自動化。
* **技術轉型**：目前專注於 React 前端開發與 AI 工作流自動化 (AI Automation)，致力於將傳統企業級運維經驗與大語言模型 (LLM) 結合。
* **專案動機**：本專案旨在探索 AI 如何賦能資深開發者的運維直覺，將多年積累的 SQL 調優與風險排查經驗轉化為可擴展的自動化工具。

## 🚀 項目簡介 (Project Overview)

這是一個結合了 **資深 PSR 經驗規則** 與 **Qwen-2.5 大語言模型** 的智能 SQL 審計工具。它能即時識別 SQL 中的致命生產風險（如全表更新、笛卡爾積），並提供專家級的優化建議。

### 核心功能：
- **即時風險攔截**：基於預設的正則表達式與邏輯引擎，秒級識別高危 SQL。
- **AI 深度診斷**：利用 Hugging Face SDK 接入高性能模型進行效能評估。
- **開發者友善 UI**：內建測試案例，支援動態 Token 配置。
