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
│   └── ...
├── solutions/           # ✅ 完整參考解答
│   ├── 01-hello-world/
│   │   ├── server.ts    # 完整實作
│   │   └── README.md    # 解答說明
│   └── ...
├── tests/               # 🧪 測試套件
│   ├── 01-hello-world/
│   │   ├── smoke.test.ts      # 基本測試
│   │   ├── integration.test.ts # 整合測試
│   │   └── README.md          # 測試說明
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