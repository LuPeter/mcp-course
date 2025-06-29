# 練習 7: 整合功能服務器

## 概述

本練習將前六個練習的所有功能整合到一個統一的 MCP 服務器中，並新增內容管理系統功能。您將學習如何實作跨功能協同操作，讓資源、工具和提示之間形成完整的工作流。

## 學習目標

- 🎯 **功能整合**: 將多個 MCP 功能模組整合到統一系統
- 🔄 **數據流協同**: 實作功能間的數據共享和協作
- 📝 **內容管理**: 建立完整的 CRUD 內容管理系統
- 🔗 **工作流設計**: 設計端到端的內容處理工作流
- 🏗️ **架構設計**: 理解複雜 MCP 應用的架構模式

## 技術要點

### 系統架構
```
┌─────────────────────────────────────────────────┐
│                MCP Server Core                  │
├─────────────────────────────────────────────────┤
│  Tools Layer     │  Resources Layer  │  Prompts │
│  ─────────────   │  ──────────────   │  ─────── │
│  • echo          │  • server-config  │  • code  │
│  • calculate     │  • help-info      │  • docs  │
│  • text-trans    │  • content://     │  • bug   │
│  • timestamp     │                   │  • meet  │
│  • file-read     │  Dynamic Content  │  • gen   │
│  • file-write    │  Resources with   │  • opt   │
│  • http-fetch    │  URI Templates    │         │
│  • data-process  │                   │         │
│  • content-crud  │                   │         │
├─────────────────────────────────────────────────┤
│            Content Management Store             │
│         (In-Memory Map<string, ContentItem>)    │
└─────────────────────────────────────────────────┘
```

### 內容管理系統
- **內容類型**: article, blog, documentation, note
- **狀態管理**: draft, published, archived
- **元數據**: 作者、標籤、時間戳
- **CRUD 操作**: 創建、讀取、更新、刪除

### 整合工作流
1. **內容生成**: 使用提示模板生成內容規劃
2. **內容創建**: 使用工具將想法轉化為實際內容
3. **內容存取**: 通過動態資源訪問和瀏覽內容
4. **內容優化**: 使用優化提示改進現有內容

## 實作要求

### 1. 服務器初始化
```typescript
const server = new McpServer({
  name: 'feature-integration-server',
  version: '1.0.0'
});
```

### 2. 內容管理工具

#### 創建內容工具
```typescript
server.registerTool(
  'content-create',
  {
    title: 'Content Creation Tool',
    description: 'Create new content items in the content management system',
    inputSchema: {
      type: z.enum(['article', 'blog', 'documentation', 'note']),
      title: z.string(),
      content: z.string(),
      author: z.string(),
      tags: z.array(z.string()).optional().default([]),
      status: z.enum(['draft', 'published', 'archived']).optional().default('draft')
    }
  },
  async ({ type, title, content, author, tags, status }) => {
    // 實作內容創建邏輯
  }
);
```

#### 更新內容工具
```typescript
server.registerTool(
  'content-update',
  {
    title: 'Content Update Tool',
    description: 'Update existing content items',
    inputSchema: {
      id: z.string(),
      title: z.string().optional(),
      content: z.string().optional(),
      author: z.string().optional(),
      tags: z.array(z.string()).optional(),
      status: z.enum(['draft', 'published', 'archived']).optional()
    }
  },
  async ({ id, ...updates }) => {
    // 實作內容更新邏輯
  }
);
```

#### 刪除內容工具
```typescript
server.registerTool(
  'content-delete',
  {
    title: 'Content Delete Tool',
    description: 'Delete content items',
    inputSchema: {
      id: z.string(),
      force: z.boolean().optional().default(false)
    }
  },
  async ({ id, force }) => {
    // 實作內容刪除邏輯
  }
);
```

### 3. 動態內容資源

#### 內容資源註冊
```typescript
server.registerResource(
  'content',
  'content://{type}/{id}',
  {
    title: 'Content Resource',
    description: 'Access content items by type and ID',
    mimeType: 'application/json'
  },
  async (uri) => {
    // 解析 URI 並返回相應內容
    // 支援格式:
    // - content:// (列出所有內容)
    // - content://article (列出所有文章)
    // - content://article/123 (獲取特定文章)
  }
);
```

### 4. 內容相關提示

#### 內容生成提示
```typescript
server.registerPrompt(
  'content-generation',
  {
    title: 'Content Generation Template',
    description: 'Generate content based on specifications',
    argsSchema: {
      contentType: z.string(),
      topic: z.string(),
      targetAudience: z.string().optional(),
      length: z.string().optional(),
      tone: z.string().optional(),
      keywords: z.string().optional()
    }
  },
  ({ contentType, topic, targetAudience, length, tone, keywords }) => {
    // 生成內容創建提示
  }
);
```

#### 內容優化提示
```typescript
server.registerPrompt(
  'content-optimization',
  {
    title: 'Content Optimization Template',
    description: 'Optimize existing content for better performance',
    argsSchema: {
      contentText: z.string(),
      optimizationGoals: z.string().optional(),
      targetMetrics: z.string().optional(),
      currentIssues: z.string().optional()
    }
  },
  ({ contentText, optimizationGoals, targetMetrics, currentIssues }) => {
    // 生成內容優化提示
  }
);
```

### 5. 數據模型

#### 內容項目接口
```typescript
interface ContentItem {
  id: string;
  type: 'article' | 'blog' | 'documentation' | 'note';
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}
```

## 實作步驟

### 第一步: 基礎設置
1. 創建服務器實例並設置名稱和版本
2. 定義內容數據模型和存儲
3. 實作 ID 生成函數
4. 初始化示例內容

### 第二步: 整合現有功能
1. 複製所有練習 1-6 的工具實作
2. 複製所有練習 2 的資源實作
3. 複製所有練習 6 的提示實作
4. 確保所有功能正常工作

### 第三步: 實作內容管理工具
1. 實作 `content-create` 工具
2. 實作 `content-update` 工具
3. 實作 `content-delete` 工具
4. 添加適當的錯誤處理

### 第四步: 實作動態內容資源
1. 註冊動態內容資源
2. 實作 URI 解析邏輯
3. 支援不同的訪問模式（列表、類型、特定項目）
4. 返回適當的 JSON 格式

### 第五步: 實作內容提示
1. 實作 `content-generation` 提示
2. 實作 `content-optimization` 提示
3. 設計靈活的參數系統
4. 生成有用的提示內容

### 第六步: 測試整合
1. 測試各個功能的獨立操作
2. 測試功能間的協同工作
3. 測試端到端工作流
4. 處理錯誤情況

## 測試策略

### 功能測試
```bash
# 運行完整測試套件
npm test:07

# 測試特定功能
npm run dev:07
echo '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"content-create","arguments":{"type":"article","title":"Test","content":"Content","author":"Author"}}}' | node dist/exercises/07-feature-integration/server.js
```

### 整合測試場景
1. **內容創建流程**: 提示 → 工具 → 資源
2. **內容管理流程**: 創建 → 更新 → 查看 → 刪除
3. **內容優化流程**: 讀取 → 優化提示 → 更新
4. **錯誤處理**: 無效 ID、權限檢查、數據驗證

## 常見問題

### Q: 為什麼使用內存存儲而不是數據庫？
A: 為了簡化練習，專注於 MCP 協議實作。實際應用中應使用持久化存儲。

### Q: 如何處理並發操作？
A: 當前實作是單線程的。生產環境需要添加鎖機制或使用數據庫事務。

### Q: 內容資源的 URI 格式如何設計？
A: 使用階層式結構：`content://{type}/{id}`，支援部分匹配來實現不同層級的訪問。

### Q: 如何擴展內容類型？
A: 修改 ContentItem 接口的 type 字段，並更新相關的 Zod schema。

## 進階挑戰

1. **搜索功能**: 添加基於關鍵字和標籤的內容搜索工具
2. **版本控制**: 實作內容版本歷史管理
3. **權限系統**: 添加基於作者的內容訪問控制
4. **批量操作**: 實作批量內容處理工具
5. **導入導出**: 支援內容的 JSON/Markdown 格式轉換

## 相關資源

- [MCP 規範文檔](https://spec.modelcontextprotocol.io)
- [TypeScript SDK 文檔](../../../mcp-typescript-sdk.md)
- [練習 1-6](../) - 前置功能實作
- [測試框架](../../tests/07-feature-integration/) - 測試用例參考