# 練習 4: 動態資源系統

## 概述
學習如何建立動態資源系統，根據不同的參數生成不同的資源內容。這個練習展示了MCP資源系統的靈活性和動態特性。

## 先決條件
- 完成練習 1-3
- 理解資源註冊和內容生成
- 熟悉JavaScript物件操作和迴圈

## 學習目標
- [ ] 理解動態資源的概念和應用
- [ ] 學習如何根據參數生成不同內容
- [ ] 掌握資源URI設計模式
- [ ] 實作多種資源類型（JSON、Markdown、純文本）

## 技術要點
- **動態資源註冊**: 根據數據動態註冊多個資源
- **參數化URI**: 使用有意義的URI模式
- **內容類型管理**: 根據資源類型設定正確的MIME類型
- **錯誤處理**: 處理無效參數和資源不存在的情況

## 實作要求

### 動態用戶資源
建立用戶個人檔案資源系統：
- URI模式: `users://{userId}/profile`
- 資源名稱: `user-profile-{userId}`
- 內容格式: JSON
- 包含: id, name, email, role, lastLogin, profileComplete

### 動態文件資源
建立文件內容資源系統：
- URI模式: `files://{category}/{filename}`
- 資源名稱: `file-{category}-{filename}`
- 支援分類: docs, config
- 自動偵測MIME類型: .json, .md, 純文本

### 動態時區資源
建立時區資訊資源系統：
- URI模式: `time://{timezone}`
- 資源名稱: `time-{timezone}` (替換斜線為破折號)
- 內容格式: 純文本
- 包含: 當前時間、UTC時間、時區偏移

## 開始實作

### 步驟 1: 環境設置
```bash
cd exercises/04-dynamic-resources
npm install  # 如果需要
```

### 步驟 2: 定義資料結構
首先定義用戶資料、文件資料和時區列表：
```typescript
const users = {
  '1': { name: 'Alice', email: 'alice@example.com', role: 'admin' },
  // ... 更多用戶
};

const files = {
  'docs': {
    'guide.md': '...',
    // ... 更多文件
  },
  // ... 更多分類
};

const availableTimezones = ['Asia/Taipei', 'UTC', ...];
```

### 步驟 3: 動態註冊資源
使用迴圈為每種資源類型註冊：
```typescript
// 用戶資源
for (const userId of Object.keys(users)) {
  server.registerResource(...);
}

// 文件資源
for (const [category, files] of Object.entries(files)) {
  for (const [filename, content] of Object.entries(files)) {
    // 註冊每個文件資源
  }
}

// 時區資源
for (const timezone of availableTimezones) {
  server.registerResource(...);
}
```

### 步驟 4: 實作資源處理器
每個資源需要實作相應的處理邏輯：
- 用戶資源: 返回JSON格式的用戶資料
- 文件資源: 返回相應的文件內容
- 時區資源: 計算並格式化時間資訊

### 步驟 5: 測試驗證
```bash
npm run build
npm run test:04
```

## 驗收標準
- [ ] 服務器成功啟動並初始化
- [ ] 正確註冊所有動態資源
- [ ] 用戶資源返回正確的JSON格式
- [ ] 文件資源返回正確的內容和MIME類型
- [ ] 時區資源返回正確的時間資訊
- [ ] 錯誤處理適當（如不存在的用戶ID）

## 常見問題

### Q: 如何決定資源的URI模式？
A: 使用清晰、有意義的階層結構，如 `scheme://path/resource`。確保URI能明確表達資源的性質。

### Q: 如何處理特殊字符（如斜線）在資源名稱中？
A: 使用 `.replace(/[\/]/g, '-')` 將特殊字符替換為安全字符。

### Q: 如何根據文件副檔名自動判斷MIME類型？
A: 使用條件判斷：
```typescript
const mimeType = filename.endsWith('.json') ? 'application/json' : 
                 filename.endsWith('.md') ? 'text/markdown' : 'text/plain';
```

## 延伸學習
- 探索 ResourceTemplate 的進階用法
- 學習資源快取策略
- 研究資源依賴關係管理
- 考慮安全性和權限控制

## 參考資料
- [MCP 資源規範](../../../mcp-typescript-sdk.md#resources)
- [URI 設計最佳實踐](../../../docs/best-practices/uri-design.md)
- [動態內容生成模式](../../../docs/patterns/dynamic-content.md)