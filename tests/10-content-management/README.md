# 練習 10 測試套件說明

## 測試概述

本測試套件全面驗證練習10（持久化MCP應用 - 簡易內容管理器）的實作正確性，包括資料庫層和MCP協議層的完整測試。

## 🧪 測試結構

### 1. 資料庫層測試 (`database.test.ts`)
專門測試資料庫操作邏輯，不依賴MCP協議：

#### 測試範圍
- **資料庫初始化**: 表創建、索引、視圖、觸發器
- **文章CRUD操作**: 創建、讀取、更新、刪除文章
- **標籤管理**: 標籤創建、關聯、查詢
- **數據驗證**: 輸入驗證、約束檢查
- **錯誤處理**: SQLite錯誤分類和處理
- **數據完整性**: 時間戳、Unicode、特殊字符

#### 關鍵測試案例
```typescript
// 文章創建驗證
test('應該成功創建文章', async () => {
  const article = {
    title: '測試文章',
    content: '這是測試內容',
    author: '測試作者',
    status: 'draft' as const
  };
  const id = await createArticle(article);
  expect(typeof id).toBe('number');
});

// 數據驗證
test('應該拒絕空標題', async () => {
  const article = { title: '', content: '內容', author: '作者', status: 'draft' as const };
  await expect(createArticle(article)).rejects.toThrow(DatabaseError);
});

// 關聯關係
test('應該能為文章分配標籤', async () => {
  const success = await assignTagToArticle(articleId, tagId);
  expect(success).toBe(true);
});
```

### 2. 整合測試 (`integration.test.ts`)
測試完整的MCP服務器，驗證端到端功能：

#### 測試範圍
- **MCP協議**: 初始化、capability協商
- **Resources**: 靜態和動態資源讀取
- **Tools**: 所有工具的調用和參數驗證
- **Prompts**: 提示生成和參數處理
- **工作流**: 端到端業務流程
- **錯誤處理**: 協議級錯誤處理
- **併發處理**: 多請求並發測試

#### 關鍵測試案例
```typescript
// MCP協議初始化
test('應該成功初始化MCP協議', async () => {
  await client.initialize();
  expect(true).toBe(true);
});

// 資源讀取
test('應該讀取文章列表資源', async () => {
  const response = await client.sendRequest('resources/read', {
    uri: 'content://articles'
  });
  expect(response.error).toBeUndefined();
  const articles = JSON.parse(response.result.contents[0].text);
  expect(Array.isArray(articles)).toBe(true);
});

// 工具調用
test('應該創建文章', async () => {
  const response = await client.sendRequest('tools/call', {
    name: 'article-create',
    arguments: { title: '新文章', content: '新文章的內容', author: '作者名', status: 'draft' }
  });
  expect(response.error).toBeUndefined();
  expect(response.result.content[0].text).toContain('文章創建成功');
});
```

## 🚀 運行測試

### 環境準備
```bash
# 確保已安裝依賴
npm install

# 編譯TypeScript（整合測試需要）
npm run build
```

### 運行單個測試套件
```bash
# 資料庫層測試
npm run test -- database.test.ts

# 整合測試  
npm run test -- integration.test.ts

# 運行所有練習10的測試
npm run test:10
```

### 運行特定測試
```bash
# 運行特定測試案例
npm run test -- --testNamePattern="應該成功創建文章"

# 運行特定測試組
npm run test -- --testNamePattern="文章CRUD操作"
```

### 除錯模式
```bash
# 啟用詳細輸出
npm run test -- --verbose

# 監視模式
npm run test -- --watch

# 覆蓋率報告
npm run test:coverage
```

## 🔧 測試配置

### Jest 配置重點
```json
{
  "testEnvironment": "node",
  "testTimeout": 30000,
  "setupFilesAfterEnv": ["<rootDir>/tests/setup.ts"],
  "testMatch": ["**/*.test.ts"],
  "transform": {
    "^.+\\.ts$": "ts-jest"
  }
}
```

### 測試資料庫
- 使用獨立的測試資料庫 `test_content.db`
- 每個測試前自動清理和重建
- 與開發資料庫完全隔離

### 超時設置
- 整合測試：30秒（包含服務器啟動時間）
- 資料庫測試：10秒
- 單個請求：5秒

## 📊 測試覆蓋率目標

### 最低要求
- **語句覆蓋率**: > 90%
- **分支覆蓋率**: > 85%
- **函數覆蓋率**: > 95%
- **行覆蓋率**: > 90%

### 重點覆蓋範圍
- 所有CRUD操作
- 錯誤處理路徑
- 邊界條件
- 併發場景
- MCP協議交互

## 🐛 常見測試問題

### 1. 服務器啟動超時
**症狀**: 整合測試中服務器啟動失敗
**解決方案**:
```bash
# 檢查編譯狀態
npm run build

# 檢查依賴
npm install sqlite3

# 手動測試服務器
node dist/solutions/10-content-management/server.js
```

### 2. 資料庫鎖定錯誤
**症狀**: `database is locked` 錯誤
**解決方案**:
```bash
# 清理測試資料庫
rm -f data/test_*.db

# 確保沒有殘留進程
pkill -f "content-management"
```

### 3. TypeScript 編譯錯誤
**症狀**: 測試中的import錯誤
**解決方案**:
```bash
# 檢查tsconfig.json
# 確保模組解析設置正確
# 重新編譯
npm run build
```

### 4. 併發測試失敗
**症狀**: 多個並發請求失敗
**解決方案**:
- 增加測試超時時間
- 檢查SQLite連接管理
- 驗證資源清理邏輯

## 📋 測試檢查清單

### 在提交前確保
- [ ] 所有測試通過
- [ ] 覆蓋率達到目標
- [ ] 沒有測試跳過
- [ ] 清理所有測試資料
- [ ] 檢查測試輸出無警告

### 測試品質檢查
- [ ] 測試名稱清晰描述預期行為
- [ ] 使用適當的assertion
- [ ] 測試數據具有代表性
- [ ] 邊界條件被覆蓋
- [ ] 錯誤情況被測試

## 🎯 測試策略

### 1. 分層測試
- **單元測試**: 資料庫函數獨立測試
- **整合測試**: MCP協議端到端測試
- **工作流測試**: 業務流程完整驗證

### 2. 數據驅動測試
```typescript
// 使用測試數據集
const testArticles = [
  { title: '短標題', content: '短內容', author: '作者1' },
  { title: '包含特殊字符的標題！@#$', content: '多行\n內容', author: '作者2' },
  { title: '超長標題'.repeat(10), content: '超長內容'.repeat(100), author: '作者3' }
];

testArticles.forEach((articleData, index) => {
  test(`應該處理測試數據 ${index + 1}`, async () => {
    // 測試邏輯
  });
});
```

### 3. 快照測試
```typescript
// 對於複雜的響應格式
expect(response.result).toMatchSnapshot();
```

## 🔍 除錯指南

### 啟用除錯日誌
```typescript
// 在測試中啟用除錯
process.env.DEBUG = 'mcp:*';
process.env.NODE_ENV = 'test';
```

### 檢查測試資料庫
```bash
# 保留測試資料庫進行檢查
sqlite3 data/test_content.db
.tables
.schema
SELECT * FROM articles;
```

### 分析失敗的測試
```bash
# 運行單個失敗的測試
npm run test -- --testNamePattern="失敗的測試名稱" --verbose

# 生成詳細報告
npm run test -- --reporters=default --reporters=jest-html-reporter
```

這個測試套件確保練習10的實作完全符合要求，為學習者提供可靠的驗證機制，同時展示了MCP應用的測試最佳實踐。