# MCP TypeScript 課程：從入門到精通

![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18%2B-green.svg)
![License](https://img.shields.io/badge/License-MIT-yellow.svg)
![Protocol](https://img.shields.io/badge/MCP-2024--11--05-orange.svg)

這是一個循序漸進的課程，旨在引導開發者學習如何使用 [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk) 來建構功能強大的應用程式。課程從一個簡單的 "Hello, World!" 伺服器開始，逐步深入到一個生產級別的複雜應用。

## 🎓 核心教學理念：透過實作學習

**請注意：** 這個專案的設計與傳統專案不同。

`exercises/` 目錄中的程式碼是**故意不完整且包含編譯錯誤的**。這是本課程的核心教學設計，目的是引導學習者透過解決 `TODO` 和修復錯誤來主動學習。

-   ✅ **預期行為**：當你初次執行測試時，大部分測試都**應該會失敗**。
-   ✅ **學習路徑**：你的任務就是依照指示，在 `exercises/` 中完成程式碼，直到所有相關測試都通過為止。
-   ✅ **最終目標**：`solutions/` 目錄中包含了每個練習的完整、正確的參考解答。

## 🏗️ 專案結構

本專案採用三層式的教學架構，以確保最佳的學習體驗：

```
mcp-course/
├── exercises/           # 🎯 練習骨架程式碼 (你的實作區)
│   ├── 01-hello-world/  # 每個練習都有一個目錄
│   └── ...
├── solutions/           # ✅ 完整參考解答
│   ├── 01-hello-world/
│   └── ...
├── tests/               # 🧪 自動化測試套件
│   ├── 01-hello-world/
│   └── ...
├── shared/              # 🔧 共用工具與類型定義
└── package.json         # 專案依賴與腳本
```

-   **`exercises/`**：這是你的起點。每個目錄都包含一個有待完成的骨架程式碼、`README.md` 指引和 `hints.md` 提示文件。
-   **`solutions/`**：這是你的參考。當你卡關或完成練習後，可以來這裡對照最佳實踐。
-   **`tests/`**：這是你的驗證工具。測試是根據 `solutions/` 中的完整功能來設計的，用來檢驗你在 `exercises/` 中的實作是否正確。

## 🚀 快速開始

### 環境準備

1.  **Node.js**: v18 或更高版本。
2.  **TypeScript**: 建議 v5.x。
3.  **基礎知識**: 具備 TypeScript 和 Node.js 的基礎開發經驗。

### 安裝與設定

1.  **Clone 專案**
    ```bash
    git clone https://github.com/your-username/mcp-course.git
    cd mcp-course
    ```

2.  **安裝依賴**
    ```bash
    npm install
    ```

## 🛠️ 主要開發指令

我們在 `package.json` 中定義了所有你需要的指令。

-   **編譯所有程式碼**
    ```bash
    npm run build
    ```

-   **執行所有測試** (預期會看到大量失敗)
    ```bash
    npm test
    ```

-   **執行特定練習的測試** (例如：練習 1)
    ```bash
    npm run test:01
    ```

-   **執行程式碼風格檢查**
    ```bash
    npm run lint
    ```

-   **啟動特定練習的開發伺服器** (例如：練習 1)
    ```bash
    npm run dev:01
    ```

## 🗺️ 課程大綱

本課程包含 10 個核心練習，難度循序漸進：

1.  **Hello World MCP** - 學習 MCP 基礎和 `stdio` 傳輸。
2.  **靜態資源伺服器** - 學習 `Resources` 概念。
3.  **基礎工具伺服器** - 學習 `Tools` 和參數驗證。
4.  **動態資源系統** - 學習 `ResourceTemplate` 和參數化 URI。
5.  **進階工具與錯誤處理** - 掌握異步操作和錯誤處理。
6.  **提示模板系統** - 學習 `Prompts` 功能。
7.  **整合功能伺服器** - 整合 Resources, Tools, 和 Prompts。
8.  **HTTP 傳輸服務器** - 學習 `Streamable HTTP` 和會話管理。
9.  **動態服務器功能** - 學習動態註冊功能和通知機制。
10. **完整應用實作** - 打造一個生產級別的 MCP 應用。

## 👣 如何進行一個練習

建議你遵循以下步驟來完成每個練習（以 `01-hello-world` 為例）：

1.  **閱讀說明**：打開 `exercises/01-hello-world/README.md`，了解該練習的學習目標和要求。
2.  **檢視骨架程式碼**：打開 `exercises/01-hello-world/server.ts`，查看 `TODO` 註解，了解需要你實作的部分。
3.  **執行測試**：執行 `npm run test:01`，觀察測試失敗的錯誤訊息，這會提示你該從何處著手。
4.  **動手實作**：根據 `TODO` 和測試錯誤訊息，開始撰寫你的程式碼。
5.  **尋求提示**：如果卡關了，可以查看 `exercises/01-hello-world/hints.md` 來獲得靈感。
6.  **重複測試**：在實作過程中反覆執行 `npm run test:01`，直到所有測試都通過。
7.  **參考解答**：完成後，可以到 `solutions/01-hello-world/server.ts` 比較你的實作和參考解答有何不同，學習最佳實踐。

## 🤝 貢獻

歡迎提交 Issues 和 Pull Requests！如果你發現任何問題或有改進建議，請不要猶豫，讓我們知道。

## 📄 授權條款

本專案採用 [MIT](LICENSE) 授權。
