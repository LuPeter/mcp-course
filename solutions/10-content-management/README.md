# 練習 10 完整解決方案: 持久化MCP應用 - 簡易內容管理器

## 解決方案概述

這個解決方案展示了如何將MCP協議與SQLite資料庫深度整合，實現一個完整的內容管理系統。

## 🎯 實作重點

### 1. 資料庫整合架構
- **連接管理**: 使用工廠函數模式管理資料庫連接
- **錯誤處理**: 完整的SQLite錯誤分類和處理
- **類型安全**: 完整的TypeScript類型定義
- **資源管理**: 確保連接正確關閉

### 2. MCP映射模式
- **Resources → 查詢**: 將MCP資源映射到SELECT操作
- **Tools → CRUD**: 將MCP工具映射到INSERT/UPDATE/DELETE操作
- **Prompts → 內容生成**: 整合AI內容生成與資料庫存儲

### 3. 數據持久化特性
- **自動初始化**: 首次運行自動創建資料庫結構
- **數據驗證**: 完整的輸入驗證和約束檢查
- **關聯管理**: 多對多關係的標籤系統
- **狀態持久化**: 服務器重啟後數據保持

## 📁 檔案結構說明

```
solutions/10-content-management/
├── server.ts          # MCP服務器主檔案
├── database.ts        # 資料庫操作層
├── schema.sql         # 資料庫結構定義
├── package.json       # 項目配置
├── tsconfig.json      # TypeScript配置
└── README.md          # 說明文檔
```

## 🗃️ 資料庫設計

### 核心表結構
- `articles`: 文章主體數據
- `tags`: 標籤管理
- `article_tags`: 文章標籤多對多關聯

### 優化特性
- 自動索引優化查詢性能
- 觸發器自動更新時間戳
- 視圖簡化複雜查詢
- 外鍵約束保證數據一致性

## 🔧 核心功能實作

### Resources實作
```typescript
// 靜態資源
server.registerResource('articles-list', 'content://articles', ...);

// 動態資源  
server.registerResource('article-detail', 
  new ResourceTemplate('content://articles/{id}', ...);
```

### Tools實作
```typescript
// CRUD操作
server.registerTool('article-create', {
  inputSchema: {
    title: z.string().min(1),
    content: z.string().min(1),
    // ...
  }
}, async ({ title, content, ... }) => {
  const articleId = await createArticle({ title, content, ... });
  // 處理標籤關聯
  // 返回結果
});
```

### Prompts實作
```typescript
// 內容生成整合
server.registerPrompt('article-template', {
  argsSchema: {
    topic: z.string(),
    length: z.enum(['short', 'medium', 'long']),
    style: z.enum(['technical', 'casual', 'formal'])
  }
}, async ({ topic, length, style }) => {
  // 生成文章模板
  // 提供保存指導
});
```

## 🎮 使用範例

### 1. 創建文章
```bash
# 使用MCP Inspector測試
{
  "tool": "article-create",
  "arguments": {
    "title": "MCP實戰指南",
    "content": "這是一篇關於MCP實戰的詳細指南...",
    "author": "技術專家",
    "status": "published",
    "tags": ["MCP", "教程", "技術"]
  }
}
```

### 2. 查詢文章
```bash
# 讀取資源
GET content://articles
GET content://articles/1
GET content://articles/by-tag/MCP
```

### 3. 管理標籤
```bash
# 標籤操作
{
  "tool": "tag-manage",
  "arguments": {
    "action": "assign",
    "tagName": "進階",
    "articleId": 1
  }
}
```

## 🚀 運行方式

### 開發模式
```bash
npm install
npm run dev
```

### 生產模式
```bash
npm run build
npm start
```

### 測試模式
```bash
# 使用MCP Inspector
npx @modelcontextprotocol/inspector node dist/server.js

# 或直接測試
echo '{"jsonrpc":"2.0","method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}},"id":1}' | node dist/server.js
```

## 🔍 關鍵實作細節

### 1. 錯誤處理模式
```typescript
export function handleDatabaseError(error: unknown): DatabaseError {
  if (error instanceof Error) {
    if (error.message.includes('UNIQUE constraint')) {
      return new DatabaseError('數據已存在', 'DUPLICATE_ERROR', error);
    }
    // 其他錯誤類型處理...
  }
}
```

### 2. 連接管理模式
```typescript
export function createDatabaseConnection() {
  const db = new sqlite3.Database(DB_PATH);
  return {
    all: promisify<string, any[], any[]>(db.all.bind(db)),
    get: promisify<string, any[], any>(db.get.bind(db)),
    run: promisify<string, any[], sqlite3.RunResult>(db.run.bind(db)),
    close: promisify<void>(db.close.bind(db))
  };
}
```

### 3. 事務處理範例
```typescript
// 在實際應用中，創建文章和分配標籤應該在事務中進行
const db = createDatabaseConnection();
try {
  await db.run('BEGIN TRANSACTION');
  const articleId = await createArticle(articleData);
  for (const tagName of tags) {
    const tagId = await getOrCreateTag(tagName);
    await assignTagToArticle(articleId, tagId);
  }
  await db.run('COMMIT');
} catch (error) {
  await db.run('ROLLBACK');
  throw error;
} finally {
  await db.close();
}
```

## 📊 性能優化

### 索引策略
- 狀態、時間欄位索引
- 外鍵關聯索引
- 複合索引優化

### 查詢優化
- 使用視圖簡化複雜查詢
- 參數化查詢防止SQL注入
- 適當的分頁處理

### 記憶體管理
- 每次操作後關閉連接
- 避免長時間持有連接
- 適當的錯誤清理

## 🛡️ 安全考量

### 輸入驗證
- Zod schema嚴格驗證
- SQL參數化查詢
- 文件路徑安全檢查

### 錯誤處理
- 不洩露敏感資料庫信息
- 適當的錯誤分類
- 詳細的日誌記錄

## 🎓 學習要點

### 1. MCP與資料庫整合
- 理解Resources、Tools、Prompts的不同用途
- 掌握動態資源的參數處理
- 學會錯誤處理的最佳實踐

### 2. 資料庫設計
- 關聯式資料庫設計原則
- 索引優化策略
- 約束和觸發器使用

### 3. TypeScript應用
- 完整的類型定義
- 錯誤處理類型安全
- 異步操作管理

## 🔄 擴展方向

### 功能擴展
- 全文搜索功能
- 用戶認證系統
- 文章版本控制
- 評論系統

### 技術擴展
- 連接池實作
- 快取層添加
- 備份恢復機制
- 性能監控

### 整合擴展
- REST API暴露
- WebSocket實時更新
- 文件上傳處理
- 郵件通知系統

這個解決方案為學習者提供了完整的MCP與資料庫整合範例，展示了從基礎概念到生產級應用的完整實作路徑。