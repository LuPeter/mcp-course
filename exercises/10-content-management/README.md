# 練習 10: 持久化MCP應用 - 簡易內容管理器

## 概述
本練習將前9個練習的所有知識整合，並新增SQLite資料庫整合功能，實現一個完整的內容管理系統MVP。這是一個重要的里程碑練習，展示了如何將MCP協議與持久化數據存儲深度整合。

## 先決條件
- 完成前9個練習
- 理解關聯式資料庫基礎概念
- 熟悉SQL基本語法
- 安裝SQLite3依賴

## 學習目標
- [ ] 掌握MCP與SQLite資料庫的整合模式
- [ ] 理解MCP Resources和Tools如何映射到資料庫操作
- [ ] 學會設計持久化的MCP應用架構
- [ ] 實現完整的CRUD操作流程
- [ ] 掌握數據持久化與狀態管理

## 技術要點
- **資料庫整合**: SQLite + MCP SDK
- **資料模型**: 文章、標籤、關聯關係
- **MCP映射**: Resources對應查詢，Tools對應CRUD
- **數據持久化**: 跨服務器重啟的狀態保持
- **錯誤處理**: 完整的資料庫錯誤處理機制

## 資料庫設計

### 主要表結構
```sql
-- articles 表 - 文章主體
CREATE TABLE articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  author TEXT NOT NULL,
  status TEXT DEFAULT 'draft',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- tags 表 - 標籤管理
CREATE TABLE tags (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL
);

-- article_tags 表 - 文章標籤關聯
CREATE TABLE article_tags (
  article_id INTEGER,
  tag_id INTEGER,
  FOREIGN KEY (article_id) REFERENCES articles (id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags (id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);
```

## 實作要求

### MCP資源映射 (Resources)
- `content://articles` - 列出所有文章
- `content://articles/{id}` - 讀取特定文章  
- `content://tags` - 列出所有標籤
- `content://articles/by-tag/{tagName}` - 依標籤過濾文章

### MCP工具映射 (Tools)
- `article-create` - INSERT新文章到資料庫
- `article-update` - UPDATE現有文章
- `article-delete` - DELETE文章
- `article-list` - SELECT文章列表(支援過濾)
- `tag-manage` - 標籤CRUD操作
- `tag-assign` - 為文章分配標籤
- `tag-remove` - 移除文章標籤

### MCP提示整合 (Prompts)
繼承前面練習的提示功能，並新增：
- `article-template` - 使用提示生成文章內容，然後保存到資料庫
- `content-optimization` - 內容優化提示

### 整合要求
- MCP提示生成的內容要能保存到資料庫
- 所有資料庫操作要有適當的錯誤處理
- 服務器重啟後數據要持久保存
- 支援事務處理確保數據一致性
- 實現連接池管理優化性能

## 開始實作

### 步驟1: 環境設置
```bash
cd exercises/10-content-management

# 安裝SQLite依賴
npm install sqlite3 @types/sqlite3

# 安裝其他必要依賴
npm install zod express @types/express
```

### 步驟2: 檢視TODO項目
查看 `server.ts` 和 `database.ts` 檔案中的TODO註解，按照指示完成實作：

1. **database.ts**: 實現資料庫連接和基本操作
2. **server.ts**: 整合MCP功能與資料庫操作
3. **schema.sql**: 檢查並理解資料庫結構

### 步驟3: 資料庫初始化
```bash
# 初始化資料庫（運行server時自動執行）
npm run dev:10
```

### 步驟4: 測試驗證
```bash
# 編譯項目
npm run build

# 運行測試
npm run test:10

# 手動測試（使用MCP Inspector）
npx @modelcontextprotocol/inspector node dist/exercises/10-content-management/server.js
```

## 實作指導

### TODO 1: 資料庫連接管理
在 `database.ts` 中實現：
- 資料庫連接工廠函數
- 連接池管理
- 錯誤處理機制

### TODO 2: CRUD操作
實現完整的CRUD操作：
- 文章增刪改查
- 標籤管理
- 關聯關係處理

### TODO 3: MCP整合
在 `server.ts` 中：
- 註冊Resources映射到資料庫查詢
- 註冊Tools映射到CRUD操作
- 整合提示功能與資料庫

### TODO 4: 錯誤處理
實現完整的錯誤處理：
- 資料庫連接錯誤
- SQL語法錯誤
- 數據驗證錯誤
- 外鍵約束錯誤

## 驗收標準
- [ ] SQLite資料庫正確初始化
- [ ] MCP資源正確讀取資料庫數據
- [ ] MCP工具正確執行CRUD操作
- [ ] 文章創建-讀取-更新-刪除流程完整
- [ ] 標籤系統與文章關聯正確
- [ ] 提示生成的內容可以保存到資料庫
- [ ] 資料持久化在服務器重啟後保持
- [ ] 所有資料庫操作有適當的錯誤處理
- [ ] 所有測試通過

## 常見問題

### Q: SQLite文件在哪裡？
A: 預設在 `data/content.db`，可以在database.ts中配置路徑。

### Q: 如何重置資料庫？
A: 刪除 `data/content.db` 文件，重新啟動服務器會自動重建。

### Q: 測試失敗怎麼辦？
A: 檢查資料庫是否正確初始化，查看錯誤日誌，確保所有TODO項目已完成。

### Q: 如何除錯SQL語句？
A: 在database.ts中啟用SQL日誌，或使用SQLite GUI工具檢查資料庫狀態。

## 延伸學習
完成本練習後，你可以：
- 嘗試使用其他資料庫（PostgreSQL、MySQL）
- 實現更複雜的查詢功能
- 添加全文搜索功能
- 實現數據備份和恢復
- 添加用戶認證和權限控制

## 下一步
完成練習10後，建議：
1. 複習資料庫整合模式
2. 理解MCP與持久化存儲的關係
3. 準備練習11：服務間通信

## 參考資料
- [MCP官方規範](https://spec.modelcontextprotocol.io)
- [SQLite文檔](https://www.sqlite.org/docs.html)
- [Node.js SQLite3文檔](https://github.com/TryGhost/node-sqlite3)
- 本課程的`mcp-typescript-sdk.md`文件中的SQLite Explorer範例