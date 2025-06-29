# 練習 5: 複雜工具與錯誤處理 - 解答

## 概述
本練習展示如何實作複雜的異步工具和完整的錯誤處理機制。包含文件操作、HTTP 請求模擬、數據處理等進階功能。

## 實作的功能

### 繼承的功能 (練習 1-4)
- **Echo 工具**: 基本的訊息回顯功能
- **靜態資源**: 服務器配置和幫助資訊
- **基本工具**: 計算機、文字轉換、時間戳
- **動態資源**: 用戶資料、文件系統、時區資訊

### 新增的複雜工具

#### 1. 文件讀取工具 (`file-read`)
```typescript
// 用法示例
{
  "tool": "file-read",
  "arguments": {
    "filename": "test.txt",
    "encoding": "utf8"
  }
}
```

**功能特點**:
- 異步文件讀取
- 支援多種編碼格式 (utf8, base64)
- 路徑安全檢查（防止路徑遍歷攻擊）
- 文件元數據顯示（大小、修改時間）

#### 2. 文件寫入工具 (`file-write`)
```typescript
// 用法示例
{
  "tool": "file-write",
  "arguments": {
    "filename": "output.txt",
    "content": "Hello, World!",
    "encoding": "utf8",
    "overwrite": false
  }
}
```

**功能特點**:
- 異步文件寫入
- 覆蓋保護機制
- 安全性檢查
- 寫入結果確認

#### 3. HTTP 請求模擬工具 (`http-fetch`)
```typescript
// 用法示例
{
  "tool": "http-fetch",
  "arguments": {
    "url": "https://api.example.com/users",
    "method": "GET",
    "timeout": 5000
  }
}
```

**功能特點**:
- 模擬 HTTP 請求
- 支援多種 HTTP 方法
- 超時處理
- 錯誤狀態碼處理

#### 4. 數據處理工具 (`data-process`)
```typescript
// 用法示例
{
  "tool": "data-process",
  "arguments": {
    "data": "[{\"name\":\"Alice\",\"age\":30},{\"name\":\"Bob\",\"age\":25}]",
    "operation": "filter",
    "parameters": {"key": "age", "value": 30}
  }
}
```

**功能特點**:
- JSON 數據解析和格式化
- 陣列過濾操作
- 數據映射和歸約
- 複雜的參數驗證

## 錯誤處理機制

### 錯誤分類
1. **輸入驗證錯誤**: 參數類型、格式錯誤
2. **文件系統錯誤**: 文件不存在、權限問題
3. **網路錯誤**: 超時、連接失敗
4. **數據處理錯誤**: JSON 解析失敗、操作錯誤
5. **安全性錯誤**: 路徑遍歷、權限檢查

### 錯誤處理策略
- **統一錯誤格式**: 所有錯誤都包含上下文信息
- **錯誤傳播**: 適當的錯誤向上傳播
- **用戶友好信息**: 清晰的錯誤描述
- **調試信息**: 開發階段的詳細錯誤

## 安全性考量

### 文件操作安全
- 路徑遍歷防護
- 限制在指定目錄內
- 文件覆蓋保護
- 輸入參數驗證

### 網路請求安全
- URL 格式驗證
- 超時限制
- 請求方法限制
- 模擬環境安全

## 性能特點

### 異步操作
- 所有工具都是異步實作
- 適當的超時處理
- 錯誤恢復機制

### 資源管理
- 文件描述符管理
- 記憶體使用優化
- 併發控制

## 測試數據

### 模擬 HTTP 響應
```javascript
const mockHttpResponses = {
  'https://api.example.com/users': {
    status: 200,
    data: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  },
  // 更多模擬響應...
};
```

### 數據目錄結構
```
solutions/05-complex-tools/
├── server.ts
├── README.md
└── data/          # 文件操作的工作目錄
    ├── test.txt   # 測試文件
    └── ...
```

## 使用指南

### 啟動服務器
```bash
npm run build
npm run dev:05
```

### 測試工具
```bash
# 使用 MCP Inspector
npx @modelcontextprotocol/inspector node dist/solutions/05-complex-tools/server.js

# 運行自動化測試
npm run test:05
```

### 文件操作示例
```bash
# 創建測試文件
echo "Hello, MCP!" > solutions/05-complex-tools/data/test.txt

# 然後使用 file-read 工具讀取
```

## 學習重點

1. **異步程式設計**: 理解 async/await 在 MCP 工具中的應用
2. **錯誤處理**: 學習完整的錯誤處理和分類策略
3. **安全性**: 瞭解常見的安全性問題和防護措施
4. **資源管理**: 掌握文件和網路資源的管理技巧
5. **用戶體驗**: 設計用戶友好的錯誤訊息和介面

## 下一步
完成本練習後，你將具備處理複雜異步操作和錯誤的能力，可以進入練習 6：提示模板系統的學習。