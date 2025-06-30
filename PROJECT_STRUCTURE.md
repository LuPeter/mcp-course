# MCP 課程專案結構

## 📁 目錄結構

```
mcp-course/
├── exercises/           # 🎯 練習骨架程式碼（使用者實作區）
│   ├── 01-hello-world/
│   │   ├── server.ts    # 骨架程式碼，包含TODO項目
│   │   ├── README.md    # 詳細實作指引
│   │   └── hints.md     # 實作提示
│   ├── 02-static-resources/
│   ├── 03-basic-tools/
│   ├── 04-dynamic-resources/
│   ├── 05-complex-tools/
│   ├── 06-prompt-templates/
│   ├── 07-feature-integration/
│   ├── 08-http-transport/
│   ├── 09-dynamic-features/
│   ├── 10-content-management/  # SQLite持久化內容管理器
│   │   ├── server.ts          # MCP服務器與資料庫整合
│   │   ├── database.ts        # 資料庫初始化與操作
│   │   ├── README.md          # 實作指引
│   │   └── hints.md           # 實作提示
│   ├── 11-service-communication/  # 服務間通信
│   │   ├── analysis-server.ts    # 代碼分析服務
│   │   ├── client.ts             # MCP客戶端
│   │   ├── README.md             # 實作指引
│   │   └── hints.md              # 實作提示
│   └── ...
├── solutions/           # ✅ 完整參考解答
│   ├── 01-hello-world/
│   │   ├── server.ts    # 完整實作
│   │   └── README.md    # 解答說明
│   ├── 02-static-resources/
│   ├── 03-basic-tools/
│   ├── 04-dynamic-resources/
│   ├── 05-complex-tools/
│   ├── 06-prompt-templates/
│   ├── 07-feature-integration/
│   ├── 08-http-transport/
│   ├── 09-dynamic-features/
│   ├── 10-content-management/  # 完整的CMS實作
│   │   ├── server.ts          # 完整MCP服務器
│   │   ├── database.ts        # 完整資料庫操作
│   │   ├── schema.sql         # 資料庫架構
│   │   └── README.md          # 解答說明
│   ├── 11-service-communication/  # 完整的服務間通信
│   │   ├── analysis-server.ts    # 完整代碼分析服務
│   │   ├── client.ts             # 完整MCP客戶端
│   │   └── README.md             # 解答說明
│   └── ...
├── tests/               # 🧪 測試套件
│   ├── 01-hello-world/
│   │   ├── smoke.test.ts      # 基本測試
│   │   ├── integration.test.ts # 整合測試
│   │   └── README.md          # 測試說明
│   ├── 02-static-resources/
│   ├── 03-basic-tools/
│   ├── 04-dynamic-resources/
│   ├── 05-complex-tools/
│   ├── 06-prompt-templates/
│   ├── 07-feature-integration/
│   ├── 08-http-transport/
│   ├── 09-dynamic-features/
│   ├── 10-content-management/  # 資料庫整合測試
│   │   ├── database.test.ts    # 資料庫操作測試
│   │   ├── integration.test.ts # MCP與資料庫整合測試
│   │   └── README.md          # 測試說明
│   ├── 11-service-communication/  # 服務間通信測試
│   │   ├── service-integration.test.ts  # 跨服務測試
│   │   ├── communication.test.ts        # 通信協議測試
│   │   └── README.md                   # 測試說明
│   └── ...
├── shared/              # 🔧 共用工具
│   └── test-utils/      # 測試輔助工具
└── docs/               # 📚 課程文檔
```

## 🎓 學習流程

### 1. 閱讀練習說明
```bash
cat exercises/01-hello-world/README.md
```

### 2. 檢視骨架程式碼
```bash
code exercises/01-hello-world/server.ts
```

### 3. 嘗試編譯（會有錯誤，這是正常的）
```bash
npm run build
```

### 4. 逐步實作
- 根據TODO註解完成程式碼
- 參考hints.md獲得提示
- 使用編譯錯誤作為指引

### 5. 測試實作
```bash
npm run build
npm run test:01
```

### 6. 比較參考解答（可選）
```bash
diff exercises/01-hello-world/server.ts solutions/01-hello-world/server.ts
```

## 🏗️ 設計原則

### 練習程式碼 (exercises/)
- **目的**：提供學習骨架，讓使用者練習
- **內容**：
  - 基本結構和import語句
  - TODO註解標示實作點
  - 關鍵提示和範例
  - 編譯錯誤會指導正確方向

### 參考解答 (solutions/)
- **目的**：提供完整正確的實作
- **內容**：
  - 完整可運行的程式碼
  - 最佳實作示範
  - 詳細註解說明
  - 通過所有測試

### 測試套件 (tests/)
- **目的**：驗證實作正確性
- **內容**：
  - 基於完整實作設計
  - 涵蓋功能和錯誤情況
  - 提供品質檢查標準

## 📋 使用建議

### 對於學習者
1. **先嘗試自己實作** - 不要立即查看解答
2. **利用編譯錯誤** - TypeScript錯誤是很好的指引
3. **參考提示文件** - hints.md提供實作方向
4. **使用測試驗證** - 確保實作正確
5. **最後比較解答** - 學習最佳實作

### 對於教學者
1. **骨架程式碼平衡** - 提供足夠結構但保留學習空間
2. **測試即規格** - 測試定義了期望行為
3. **漸進式提示** - 從TODO到hints到完整解答
4. **實用導向** - 每個練習都有實際應用價值

## 🗃️ 特殊練習架構

### 練習10: 內容管理器 (資料庫整合)
```
10-content-management/
├── server.ts          # MCP服務器主檔
├── database.ts        # SQLite操作封裝
├── schema.sql         # 資料庫結構定義
├── data/              # 範例資料
│   └── sample.db      # 預設資料庫
├── README.md          # 詳細實作指引
└── hints.md           # 資料庫整合提示
```

### 練習11: 服務間通信 (分布式架構)
```
11-service-communication/
├── analysis-server.ts    # 代碼分析MCP服務
├── client.ts             # MCP客戶端實作
├── test-files/           # 測試用代碼檔案
│   ├── sample.js
│   └── sample.ts
├── README.md             # 跨服務通信指引
└── hints.md              # 服務間協作提示
```

## 🔄 開發工作流

### 新增練習
1. 建立 `exercises/XX-name/` 目錄
2. 寫完整實作到 `solutions/XX-name/`
3. 建立骨架版本到 `exercises/XX-name/`
4. 撰寫測試到 `tests/XX-name/`
5. 準備README和hints

### 維護現有練習
1. 先更新 `solutions/` 中的實作
2. 同步更新 `exercises/` 中的骨架
3. 調整測試確保涵蓋新功能
4. 更新文檔和提示

### 資料庫相關練習 (練習10)
1. 設計資料庫結構 (`schema.sql`)
2. 實作資料庫操作層 (`database.ts`)
3. 整合MCP服務器 (`server.ts`)
4. 準備測試資料 (`data/`)
5. 撰寫資料庫測試 (`tests/`)

### 服務間通信練習 (練習11)
1. 設計服務架構 (多個MCP服務)
2. 實作服務間客戶端連接
3. 定義服務協作流程
4. 準備跨服務測試
5. 驗證端到端工作流