# 練習 10: 實作提示和指導

## 開發提示

### 🎯 開始之前
1. **理解需求**: 仔細閱讀 README.md 和 schema.sql
2. **檢查依賴**: 確保已安裝 sqlite3 和相關類型定義
3. **設置環境**: 建立 data 目錄用於存放資料庫文件

### 🔧 實作提示

#### 資料庫層實作 (database.ts)

##### 基本連接模式
```typescript
import sqlite3 from 'sqlite3';
import { promisify } from 'util';

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

##### 資料庫初始化模式
```typescript
export async function initializeDatabase(): Promise<void> {
  // 1. 確保目錄存在
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  
  // 2. 讀取 schema.sql
  const schema = await fs.readFile(SCHEMA_PATH, 'utf8');
  
  // 3. 執行 SQL 語句
  const db = createDatabaseConnection();
  try {
    await db.run(schema);
  } finally {
    await db.close();
  }
}
```

##### CRUD操作模式
```typescript
// CREATE 操作
export async function createArticle(article: Omit<Article, 'id' | 'created_at' | 'updated_at'>): Promise<number> {
  const db = createDatabaseConnection();
  try {
    const result = await db.run(
      'INSERT INTO articles (title, content, author, status) VALUES (?, ?, ?, ?)',
      [article.title, article.content, article.author, article.status]
    );
    return result.lastID!;
  } finally {
    await db.close();
  }
}

// READ 操作
export async function getArticleById(id: number): Promise<ArticleWithTags | null> {
  const db = createDatabaseConnection();
  try {
    const article = await db.get(
      'SELECT * FROM articles_with_tags WHERE id = ?',
      [id]
    );
    return article || null;
  } finally {
    await db.close();
  }
}
```

#### MCP Server 實作 (server.ts)

##### Resource 註冊模式
```typescript
// 靜態資源
server.registerResource(
  'articles-list',
  'content://articles',
  {
    title: '文章列表',
    description: '獲取所有文章的列表',
    mimeType: 'application/json'
  },
  async (uri) => {
    const articles = await getArticles();
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(articles, null, 2)
      }]
    };
  }
);

// 動態資源
server.registerResource(
  'article-detail',
  new ResourceTemplate('content://articles/{id}', { list: undefined }),
  {
    title: '文章詳情',
    description: '獲取特定文章的詳細信息'
  },
  async (uri, params) => {
    const id = parseInt(params.id as string);
    const article = await getArticleById(id);
    
    if (!article) {
      return {
        contents: [{
          uri: uri.href,
          text: '文章不存在'
        }]
      };
    }
    
    return {
      contents: [{
        uri: uri.href,
        text: JSON.stringify(article, null, 2)
      }]
    };
  }
);
```

##### Tool 註冊模式
```typescript
server.registerTool(
  'article-create',
  {
    title: '創建文章',
    description: '創建一篇新文章並保存到資料庫',
    inputSchema: {
      title: z.string().min(1, '標題不能為空'),
      content: z.string().min(1, '內容不能為空'),
      author: z.string().min(1, '作者不能為空'),
      status: z.enum(['draft', 'published', 'archived']).default('draft'),
      tags: z.array(z.string()).optional()
    }
  },
  async ({ title, content, author, status, tags }) => {
    try {
      // 1. 創建文章
      const articleId = await createArticle({ title, content, author, status });
      
      // 2. 處理標籤
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          const tagId = await getOrCreateTag(tagName);
          await assignTagToArticle(articleId, tagId);
        }
      }
      
      return {
        content: [{
          type: 'text',
          text: `文章創建成功！ID: ${articleId}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `創建失敗: ${error.message}`
        }],
        isError: true
      };
    }
  }
);
```

##### Prompt 註冊模式
```typescript
server.registerPrompt(
  'article-template',
  {
    title: '文章內容模板',
    description: '生成文章內容模板',
    argsSchema: {
      topic: z.string().describe('文章主題'),
      length: z.enum(['short', 'medium', 'long']).default('medium'),
      style: z.enum(['technical', 'casual', 'formal']).default('casual')
    }
  },
  async ({ topic, length, style }) => {
    const template = generateArticleTemplate(topic, length, style);
    
    return {
      messages: [{
        role: 'assistant',
        content: {
          type: 'text',
          text: template
        }
      }]
    };
  }
);
```

### 🐛 常見問題和解決方案

#### 問題1: SQLite依賴安裝失敗
**症狀**: `npm install sqlite3` 失敗
**解決方案**:
```bash
# 方法1: 使用預編譯版本
npm install sqlite3 --build-from-source=false

# 方法2: 確保有編譯工具
# macOS: xcode-select --install
# Ubuntu: sudo apt-get install build-essential
# Windows: npm install --global windows-build-tools
```

#### 問題2: 資料庫檔案權限錯誤
**症狀**: `SQLITE_CANTOPEN` 錯誤
**解決方案**:
```bash
# 確保 data 目錄存在且有寫入權限
mkdir -p data
chmod 755 data
```

#### 問題3: 外鍵約束錯誤
**症狀**: `FOREIGN KEY constraint failed`
**解決方案**:
```typescript
// 確保在操作前檢查父記錄存在
const article = await getArticleById(articleId);
if (!article) {
  throw new Error('文章不存在');
}
```

#### 問題4: 類型錯誤
**症狀**: TypeScript 編譯錯誤
**解決方案**:
```bash
# 安裝類型定義
npm install --save-dev @types/sqlite3

# 確保 tsconfig.json 配置正確
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "Node"
  }
}
```

### 💡 實作技巧

#### 技巧1: 錯誤處理模式
```typescript
export function handleDatabaseError(error: unknown): DatabaseError {
  if (error instanceof Error) {
    // SQLite 特定錯誤
    if (error.message.includes('UNIQUE constraint')) {
      return new DatabaseError('數據已存在', 'DUPLICATE', error);
    }
    if (error.message.includes('FOREIGN KEY constraint')) {
      return new DatabaseError('關聯數據不存在', 'FK_CONSTRAINT', error);
    }
    if (error.message.includes('NOT NULL constraint')) {
      return new DatabaseError('必填欄位不能為空', 'NOT_NULL', error);
    }
  }
  
  return new DatabaseError('資料庫操作失敗', 'UNKNOWN', error as Error);
}
```

#### 技巧2: 連接池模式
```typescript
class DatabasePool {
  private connections: sqlite3.Database[] = [];
  private maxConnections = 5;
  
  async getConnection(): Promise<sqlite3.Database> {
    if (this.connections.length > 0) {
      return this.connections.pop()!;
    }
    
    if (this.activeConnections < this.maxConnections) {
      return new sqlite3.Database(DB_PATH);
    }
    
    // 等待連接可用
    return new Promise((resolve) => {
      // 實作等待邏輯
    });
  }
  
  async releaseConnection(db: sqlite3.Database): Promise<void> {
    this.connections.push(db);
  }
}
```

#### 技巧3: 事務處理
```typescript
export async function createArticleWithTags(
  articleData: Omit<Article, 'id' | 'created_at' | 'updated_at'>,
  tags: string[]
): Promise<number> {
  const db = createDatabaseConnection();
  try {
    // 開始事務
    await db.run('BEGIN TRANSACTION');
    
    // 創建文章
    const result = await db.run(
      'INSERT INTO articles (title, content, author, status) VALUES (?, ?, ?, ?)',
      [articleData.title, articleData.content, articleData.author, articleData.status]
    );
    const articleId = result.lastID!;
    
    // 處理標籤
    for (const tagName of tags) {
      let tagId: number;
      const existingTag = await db.get('SELECT id FROM tags WHERE name = ?', [tagName]);
      
      if (existingTag) {
        tagId = existingTag.id;
      } else {
        const tagResult = await db.run('INSERT INTO tags (name) VALUES (?)', [tagName]);
        tagId = tagResult.lastID!;
      }
      
      await db.run('INSERT INTO article_tags (article_id, tag_id) VALUES (?, ?)', [articleId, tagId]);
    }
    
    // 提交事務
    await db.run('COMMIT');
    return articleId;
    
  } catch (error) {
    // 回滾事務
    await db.run('ROLLBACK');
    throw error;
  } finally {
    await db.close();
  }
}
```

### 🔍 除錯指導

#### 啟用 SQLite 除錯
```typescript
// 在開發時啟用 SQL 日誌
const db = new sqlite3.Database(DB_PATH, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE, (err) => {
  if (err) {
    console.error('資料庫連接失敗:', err);
  } else {
    console.log('✅ 資料庫連接成功');
  }
});

// 監聽 SQL 語句
db.on('trace', (sql) => {
  console.log('🔍 SQL:', sql);
});
```

#### 使用 SQLite CLI 工具
```bash
# 開啟資料庫
sqlite3 data/content.db

# 查看表結構
.schema

# 查看數據
SELECT * FROM articles;
SELECT * FROM tags;
SELECT * FROM article_tags;

# 查看執行計劃
EXPLAIN QUERY PLAN SELECT * FROM articles_with_tags;
```

#### MCP Inspector 除錯
```bash
# 啟動 MCP Inspector
npx @modelcontextprotocol/inspector node dist/exercises/10-content-management/server.js

# 測試 Resources
# 1. 點選 Resources 分頁
# 2. 選擇 content://articles
# 3. 查看返回的 JSON 數據

# 測試 Tools
# 1. 點選 Tools 分頁  
# 2. 選擇 article-create
# 3. 填入測試數據並執行
```

### 📝 測試策略

#### 單步測試順序
1. **資料庫初始化測試**
   ```bash
   npm run dev:10
   # 檢查 data/content.db 是否創建
   # 檢查控制台是否顯示初始化成功
   ```

2. **資源測試**
   ```bash
   # 使用 MCP Inspector 測試各個資源
   # content://articles
   # content://tags  
   # content://articles/1
   ```

3. **工具測試**
   ```bash
   # 測試創建文章
   # 測試更新文章
   # 測試刪除文章
   # 測試標籤管理
   ```

4. **整合測試**
   ```bash
   npm run test:10
   ```

#### 常用測試數據
```json
// 創建文章測試數據
{
  "title": "測試文章",
  "content": "這是一篇測試文章的內容...",
  "author": "測試作者",
  "status": "draft",
  "tags": ["測試", "範例"]
}

// 更新文章測試數據
{
  "id": 1,
  "title": "更新後的標題",
  "status": "published"
}
```

### 📚 進階優化

#### 性能優化
1. **索引優化**: 參考 schema.sql 中的索引定義
2. **查詢優化**: 使用 EXPLAIN QUERY PLAN 分析查詢
3. **連接池**: 實作連接池減少連接開銷
4. **快取機制**: 對常用查詢結果進行快取

#### 安全考量
1. **SQL注入防護**: 始終使用參數化查詢
2. **輸入驗證**: 使用 Zod 嚴格驗證所有輸入
3. **錯誤處理**: 不洩露敏感的資料庫錯誤信息
4. **檔案權限**: 確保資料庫檔案有適當的權限設置

## 參考實作

### 最小可行實作
參考 solutions/10-content-management/ 目錄中的完整實作，但建議先嘗試自己實作。

### 完整功能實作
完成所有 TODO 項目後，你的實作應該包含：
- 完整的資料庫 CRUD 操作
- 所有 MCP Resources、Tools、Prompts
- 適當的錯誤處理
- 資料持久化功能

## 下一步
完成本練習後，建議：
1. 複習資料庫整合模式
2. 了解 MCP 與持久化存儲的關係
3. 準備練習 11：服務間通信
4. 嘗試擴展功能（全文搜索、用戶認證等）