# MCP 練習文件結構設計

## 整體目錄結構
```
mcp-course/
├── exercises/                    # 所有練習
│   ├── 01-hello-world/
│   ├── 02-static-resources/
│   ├── 03-basic-tools/
│   ├── 04-dynamic-resources/
│   ├── 05-complex-tools/
│   ├── 06-prompt-templates/
│   ├── 07-feature-integration/
│   ├── 08-http-transport/
│   ├── 09-dynamic-features/
│   ├── 10-content-management/     # 資料庫整合練習
│   └── 11-service-communication/  # 服務間通信練習
├── tests/                       # 測試文件
│   ├── utils/                   # 測試工具
│   ├── 01-hello-world/
│   └── ...
├── shared/                      # 共用代碼和工具
│   ├── types/                   # TypeScript 類型定義
│   ├── utils/                   # 工具函數
│   └── templates/               # 代碼模板
├── docs/                        # 補充文檔
│   ├── concepts/                # 概念說明
│   ├── troubleshooting/         # 故障排除
│   └── best-practices/          # 最佳實踐
└── package.json                 # 專案配置
```

## 單個練習目錄結構
```
exercises/01-hello-world/
├── README.md                    # 練習說明主文件
├── requirements.md              # 詳細要求和驗收標準
├── hints.md                     # 提示和指導
├── starter/                     # 起始代碼模板
│   ├── package.json
│   ├── tsconfig.json
│   ├── src/
│   │   ├── server.ts           # Server 模板
│   │   ├── client.ts           # Client 模板
│   │   └── types.ts            # 類型定義
│   └── .gitignore
├── solution/                    # 參考解答
│   ├── package.json
│   ├── src/
│   │   ├── server.ts           # 完整 Server 實作
│   │   ├── client.ts           # 完整 Client 實作
│   │   └── types.ts
│   └── README.md               # 解答說明
├── examples/                    # 範例和演示
│   ├── basic-usage.ts
│   ├── advanced-features.ts
│   └── debugging-tips.ts
└── assets/                      # 相關資源文件
    ├── diagrams/               # 架構圖
    ├── data/                   # 測試數據
    └── screenshots/            # 截圖說明
```

## 特殊練習結構

### 練習10: 資料庫整合練習
```
exercises/10-content-management/
├── README.md                    # 主要說明文件
├── requirements.md              # 詳細要求規範  
├── hints.md                     # 實作提示
├── server.ts                    # MCP服務器主檔案（待完成）
├── database.ts                  # 資料庫操作層（待完成）
├── schema.sql                   # SQLite資料庫結構定義
├── data/                        # 範例與測試資料
│   ├── sample.db               # 預設資料庫文件
│   └── test-data.sql           # 測試資料腳本
├── types/                       # TypeScript類型定義
│   ├── database.ts             # 資料庫相關類型
│   └── content.ts              # 內容管理類型
└── examples/                    # 使用範例
    ├── crud-operations.ts      # CRUD操作示例
    └── resource-mapping.ts     # 資源映射示例
```

### 練習11: 服務間通信練習
```
exercises/11-service-communication/
├── README.md                    # 主要說明文件
├── requirements.md              # 詳細要求規範
├── hints.md                     # 實作提示
├── analysis-server.ts           # 代碼分析MCP服務（待完成）
├── client.ts                    # MCP客戶端實作（待完成）
├── test-files/                  # 測試用代碼檔案
│   ├── sample.js               # JavaScript測試檔案
│   ├── sample.ts               # TypeScript測試檔案
│   └── sample.py               # Python測試檔案
├── types/                       # TypeScript類型定義
│   ├── analysis.ts             # 分析結果類型
│   └── communication.ts        # 服務間通信類型
├── configs/                     # 配置文件
│   ├── analysis-server.json    # 分析服務配置
│   └── client-config.json      # 客戶端配置
└── examples/                    # 使用範例
    ├── cross-service-call.ts   # 跨服務調用示例
    └── workflow-demo.ts        # 完整工作流示例
```

## 文檔模板設計

### README.md 模板
```markdown
# 練習 X: [練習名稱]

## 概述
[練習的簡要說明和學習目標]

## 先決條件
- 完成前 X-1 個練習
- 理解 [相關概念]
- 安裝必要依賴

## 學習目標
- [ ] 目標1
- [ ] 目標2
- [ ] 目標3

## 技術要點
- **主要概念**: [核心概念說明]
- **新增功能**: [本練習新增的功能]
- **API 使用**: [相關 API 說明]

## 實作要求

### Server 端要求
[具體的 server 實作要求]

### Client 端要求  
[具體的 client 實作要求]

## 開始實作

### 步驟 1: 環境設置
```bash
cd exercises/0X-exercise-name/starter
npm install
```

### 步驟 2: 實作 Server
[具體步驟指導]

### 步驟 3: 實作 Client
[具體步驟指導]

### 步驟 4: 測試驗證
```bash
npm test
```

## 驗收標準
- [ ] 所有測試通過
- [ ] 功能符合要求
- [ ] 代碼品質良好
- [ ] 錯誤處理適當

## 常見問題
[FAQ 和故障排除]

## 延伸學習
[相關概念和進階主題]

## 參考資料
- [MCP 規範相關章節]
- [相關 API 文檔]
- [範例代碼]
```

### requirements.md 模板
```markdown
# 練習 X: 詳細要求規範

## 功能要求

### 必須實作功能 (Must Have)
1. **功能A**
   - 具體描述
   - 輸入參數
   - 輸出格式
   - 錯誤處理

2. **功能B**
   - [詳細規範]

### 應該實作功能 (Should Have)  
1. **功能C**
   - [詳細規範]

### 可以實作功能 (Could Have)
1. **功能D**
   - [詳細規範]

## 技術要求

### 代碼品質
- [ ] TypeScript 嚴格模式
- [ ] 完整類型定義
- [ ] 適當的錯誤處理
- [ ] 清晰的代碼結構

### 性能要求
- [ ] 連接時間 < 3 秒
- [ ] 響應時間 < 1 秒
- [ ] 記憶體使用合理

### 相容性要求
- [ ] Node.js 18+
- [ ] 支援指定的 MCP 協議版本

## 測試要求

### 必須通過的測試
1. **基礎功能測試**
   - 連接建立
   - 功能調用
   - 錯誤處理

2. **整合測試**
   - Client-Server 通訊
   - 數據流驗證

### 選擇性測試
1. **性能測試**
2. **壓力測試**

## 驗收標準

### 自動化驗收
```bash
npm run test:acceptance
```

### 手動驗收
1. [ ] 功能演示
2. [ ] 代碼審查
3. [ ] 文檔完整性

## 評分標準
- 功能完整性 (40%)
- 代碼品質 (30%)
- 測試覆蓋率 (20%)
- 文檔品質 (10%)
```

### hints.md 模板
```markdown
# 練習 X: 提示和指導

## 開發提示

### 🎯 開始之前
1. **理解需求**: 仔細閱讀 requirements.md
2. **查看範例**: 參考 examples/ 目錄
3. **設置環境**: 確保依賴正確安裝

### 🔧 實作提示

#### Server 端實作
```typescript
// 提示: 使用這個基本結構
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const server = new McpServer({
  name: "exercise-server",
  version: "1.0.0"
});

// 你的實作代碼在這裡...
```

#### Client 端實作
```typescript
// 提示: Client 基本結構
import { Client } from "@modelcontextprotocol/sdk/client/index.js";

const client = new Client({
  name: "exercise-client", 
  version: "1.0.0"
});

// 你的實作代碼在這裡...
```

### 🐛 常見問題和解決方案

#### 問題1: 連接失敗
**症狀**: Client 無法連接到 Server
**可能原因**: 
- Transport 配置錯誤
- Server 未正確啟動
- 端口被占用

**解決方案**:
```typescript
// 檢查 transport 配置
const transport = new StdioServerTransport();
await server.connect(transport);
```

#### 問題2: 工具調用失敗
**症狀**: callTool 拋出異常
**解決方案**: [具體步驟]

### 💡 實作技巧

#### 技巧1: 錯誤處理模式
```typescript
// 建議的錯誤處理方式
try {
  const result = await someOperation();
  return { success: true, data: result };
} catch (error) {
  return { 
    success: false, 
    error: error.message,
    isError: true 
  };
}
```

#### 技巧2: 參數驗證
```typescript
// 使用 Zod 進行參數驗證
import { z } from "zod";

const paramSchema = z.object({
  param1: z.string(),
  param2: z.number().optional()
});
```

### 🔍 除錯指導

#### 啟用除錯日誌
```bash
DEBUG=mcp:* npm run dev
```

#### 使用 MCP Inspector
```bash
npx @modelcontextprotocol/inspector
```

### 📝 測試策略

#### 單步測試
1. 先測試 Server 啟動
2. 再測試 Client 連接  
3. 最後測試功能調用

#### 除錯技巧
```typescript
// 在關鍵位置添加日誌
console.log('Server starting...');
console.log('Client connected:', client.isConnected());
```

## 進階提示

### 性能優化
- 使用連接池
- 實作快取機制
- 批次處理請求

### 安全考量
- 輸入驗證
- 錯誤信息不泄露敏感信息
- 適當的權限控制

## 參考實作

### 最小可行實作
[提供最簡單的可運行代碼]

### 完整功能實作
[提供包含所有功能的代碼結構]

## 下一步
完成本練習後，建議:
1. 複習 [相關概念]
2. 嘗試 [進階功能]
3. 準備下一個練習
```

## 共用文件模板

### package.json 模板
```json
{
  "name": "mcp-exercise-XX",
  "version": "1.0.0",
  "description": "MCP Exercise XX - [練習名稱]",
  "main": "dist/server.js",
  "scripts": {
    "build": "tsc",
    "dev": "ts-node src/server.ts",
    "start": "node dist/server.js",
    "test": "jest",
    "test:watch": "jest --watch",
    "lint": "eslint src/**/*.ts",
    "format": "prettier --write src/**/*.ts"
  },
  "dependencies": {
    "@modelcontextprotocol/sdk": "latest",
    "zod": "^3.22.4"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "typescript": "^5.0.0",
    "ts-node": "^10.9.0",
    "jest": "^29.0.0",
    "@types/jest": "^29.0.0",
    "eslint": "^8.0.0",
    "prettier": "^3.0.0"
  },
  "keywords": ["mcp", "model-context-protocol", "exercise"],
  "author": "MCP Course",
  "license": "MIT"
}
```

### tsconfig.json 模板
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "Node",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "tests"]
}
```

## 特殊練習模板

### 練習10 資料庫整合 README.md 模板
```markdown
# 練習10: 持久化MCP應用 - 簡易內容管理器

## 概述
本練習將前9個練習的所有知識整合，並新增SQLite資料庫整合功能，實現一個完整的內容管理系統MVP。

## 先決條件
- 完成前9個練習
- 理解關聯式資料庫基礎概念
- 熟悉SQL基本語法

## 學習目標
- [ ] 掌握MCP與SQLite資料庫的整合模式
- [ ] 理解MCP Resources和Tools如何映射到資料庫操作
- [ ] 學會設計持久化的MCP應用架構
- [ ] 實現完整的CRUD操作流程

## 技術要點
- **資料庫整合**: SQLite + MCP SDK
- **資料模型**: 文章、標籤、關聯關係
- **MCP映射**: Resources對應查詢，Tools對應CRUD
- **數據持久化**: 跨服務器重啟的狀態保持

## 資料庫設計
```sql
-- 查看 schema.sql 了解完整結構
CREATE TABLE articles (
  id INTEGER PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT,
  author TEXT,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## 實作要求

### MCP資源映射
- `content://articles` - 列出所有文章
- `content://articles/{id}` - 讀取特定文章  
- `content://tags` - 列出所有標籤

### MCP工具映射
- `article-create` - INSERT新文章到資料庫
- `article-update` - UPDATE現有文章
- `article-delete` - DELETE文章
- `tag-manage` - 標籤CRUD操作

### 整合要求
- MCP提示生成的內容要能保存到資料庫
- 資料庫操作要有適當的錯誤處理
- 服務器重啟後數據要持久保存

## 開始實作

### 步驟1: 環境設置
```bash
cd exercises/10-content-management
npm install sqlite3 @types/sqlite3
```

### 步驟2: 資料庫初始化
參考 `database.ts` 檔案，實現資料庫連接和初始化。

### 步驟3: MCP服務器整合
在 `server.ts` 中整合資料庫操作與MCP功能。

### 步驟4: 測試驗證
```bash
npm run test:10
```

## 驗收標準
- [ ] SQLite資料庫正確初始化
- [ ] MCP資源正確讀取資料庫數據
- [ ] MCP工具正確執行CRUD操作
- [ ] 資料持久化在服務器重啟後保持
- [ ] 所有資料庫操作有適當的錯誤處理
```

### 練習11 服務間通信 README.md 模板
```markdown
# 練習11: 服務間通信 - 代碼分析工具整合

## 概述
學習如何讓兩個MCP服務互相通信和協作，基於練習10的內容管理器，創建一個獨立的代碼分析服務。

## 先決條件
- 完成練習10 (內容管理器)
- 理解MCP客戶端和服務器概念
- 熟悉進程間通信基礎

## 學習目標
- [ ] 掌握MCP服務發現和API調用模式
- [ ] 理解分布式MCP應用的基本架構
- [ ] 學會設計跨服務的數據流
- [ ] 實現MCP服務間協作工作流

## 技術要點
- **服務架構**: 代碼分析服務 + 內容管理服務
- **通信模式**: MCP Client在服務器端的使用
- **數據流**: 分析結果自動保存到CMS
- **服務發現**: 簡單的服務定位機制

## 服務設計

### 代碼分析服務
```typescript
// analysis-server.ts - 新的MCP服務器
- "analysis://file/{filename}" - 讀取要分析的代碼文件
- "results://analysis/{id}" - 讀取分析結果
- "analyze-file" - 分析單個代碼文件
- "generate-report" - 將分析結果轉換為報告格式
```

### 服務整合流程
1. 用戶調用代碼分析服務的 `analyze-file` 工具
2. 分析服務處理文件，生成報告
3. 分析服務作為客戶端，連接到CMS服務
4. 分析服務調用CMS的 `article-create`，保存報告
5. 用戶可通過CMS的 `content://articles` 資源讀取報告

## 實作要求

### 代碼分析服務實作
- 獨立的MCP服務器
- 文件讀取和基本分析功能（行數、函數計數等）
- 分析結果格式化為報告

### MCP客戶端實作  
- 在分析服務中整合MCP客戶端
- 連接到CMS服務
- 調用CMS的工具保存分析結果

### 錯誤處理
- 服務間通信錯誤處理
- 服務不可用時的降級處理
- 適當的超時和重試機制

## 開始實作

### 步驟1: 啟動CMS服務
```bash
# 終端機1: 啟動內容管理服務
cd exercises/10-content-management
npm run dev
```

### 步驟2: 實作分析服務
```bash
# 終端機2: 開發代碼分析服務
cd exercises/11-service-communication
# 實作 analysis-server.ts
```

### 步驟3: 實作客戶端通信
參考 `client.ts` 檔案，實現與CMS服務的通信。

### 步驟4: 端到端測試
```bash
npm run test:11
```

## 驗收標準
- [ ] 代碼分析服務獨立啟動成功
- [ ] 分析服務可以讀取和分析代碼文件
- [ ] 分析服務可以連接到CMS服務
- [ ] 跨服務MCP工具調用成功
- [ ] 分析報告正確保存到CMS資料庫
- [ ] 可以通過CMS資源讀取分析結果
- [ ] 兩個服務可以同時運行而不衝突
```