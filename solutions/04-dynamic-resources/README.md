# 解決方案 03: Dynamic Resources

這個解決方案展示了如何創建動態資源，為不同的數據實體生成多個相關的資源。雖然不使用高級的 ResourceTemplate 功能，但展現了動態資源的核心概念。

## 🎯 主要概念

### 動態資源的實作方式
```typescript
// 循環註冊多個相似資源
for (const id of Object.keys(data)) {
  server.registerResource(
    `resource-${id}`,
    `protocol://${id}`,
    metadata,
    async () => ({ /* 返回該ID的數據 */ })
  );
}
```

### 資源命名策略
- 使用描述性前綴和參數組合
- 例如: `user-profile-1`, `file-docs-guide.md`, `time-Asia-Taipei`

## 📋 實作的資源

### 1. 用戶個人檔案資源
- **URI 格式**: `users://{userId}/profile`
- **功能**: 為每個用戶ID生成個人檔案資源
- **MIME 類型**: `application/json`
- **範例**: `users://1/profile` 返回用戶Alice的資料

### 2. 文件內容資源
- **URI 格式**: `files://{category}/{filename}`
- **功能**: 為每個文件生成內容資源
- **MIME 類型**: 動態決定 (JSON/Markdown/純文本)
- **範例**: `files://docs/guide.md` 返回說明文件

### 3. 時區資訊資源
- **URI 格式**: `time://{timezone}`
- **功能**: 為每個時區生成時間資訊資源
- **MIME 類型**: `text/plain`
- **範例**: `time://Asia/Taipei` 返回台北時間

## 🔧 技術特點

1. **循環註冊**: 使用循環為多個數據實體註冊相似資源
2. **動態 MIME 類型**: 根據文件擴展名確定內容類型
3. **實時數據**: 時區資源返回當前時間
4. **資源統計**: 顯示註冊的資源數量統計

## 🧪 測試方法

```bash
# 編譯和運行
npm run build
npm run dev:03

# 使用 MCP Inspector 測試
npx @modelcontextprotocol/inspector node dist/solutions/03-dynamic-resources/server.js
```

### 實際註冊的資源
完成實作後，服務器會註冊：
- 3個用戶個人檔案資源 (`user-profile-1`, `user-profile-2`, `user-profile-3`)
- 4個文件內容資源 (`file-docs-guide.md`, `file-docs-api.md`, `file-config-settings.json`, `file-config-database.json`)
- 7個時區資訊資源 (`time-Asia-Taipei`, `time-Asia-Tokyo`, 等等)

### 測試用例
1. 讀取 `users://1/profile` - 應該返回 Alice 的資料
2. 讀取 `files://docs/guide.md` - 應該返回 Markdown 文件
3. 讀取 `time://Asia/Tokyo` - 應該返回東京時間
4. 讀取不存在的資源 - 應該返回錯誤