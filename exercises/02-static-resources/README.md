# 練習 02: Static Resources

## 🎯 學習目標

這個練習將教你如何在 MCP 服務器中註冊和提供靜態資源。靜態資源類似於 REST API 中的 GET 端點，用於向 LLM 提供數據而不執行複雜的計算或副作用。

## 📋 任務清單

### 步驟 1: 服務器設置
- [ ] 設定服務器名稱為 `'static-resources-server'`
- [ ] 設定版本為 `'1.0.0'`

### 步驟 2: 註冊配置資源
- [ ] 名稱: `'config'`
- [ ] URI: `'config://app'`
- [ ] 標題: `'Application Configuration'`
- [ ] 描述: `'Application configuration data'`
- [ ] MIME 類型: `'application/json'`
- [ ] 返回包含應用設定的 JSON 數據

### 步驟 3: 註冊說明資源
- [ ] 名稱: `'help'`
- [ ] URI: `'help://guide'`
- [ ] 標題: `'User Guide'`
- [ ] 描述: `'Application user guide and documentation'`
- [ ] MIME 類型: `'text/markdown'`
- [ ] 返回 Markdown 格式的說明文檔

### 步驟 4: 註冊狀態資源
- [ ] 名稱: `'status'`
- [ ] URI: `'status://health'`
- [ ] 標題: `'System Status'`
- [ ] 描述: `'Current system health and status information'`
- [ ] MIME 類型: `'text/plain'`
- [ ] 返回系統運行狀態信息

### 步驟 5: 完成服務器設置
- [ ] 創建 StdioServerTransport
- [ ] 連接服務器到傳輸
- [ ] 添加錯誤處理
- [ ] 添加啟動成功訊息

## 🔧 Resource 註冊語法

```typescript
server.registerResource(
  'resource-name',        // 資源名稱
  'protocol://path',      // 資源 URI
  {
    title: 'Resource Title',
    description: 'Resource description',
    mimeType: 'text/plain'
  },
  async (uri: URL) => ({
    contents: [{
      uri: uri.href,
      text: 'Resource content here',
      mimeType: 'text/plain'
    }]
  })
);
```

## 🧪 測試你的實作

```bash
# 編譯程式碼
npm run build

# 運行測試（應該會失敗直到你完成實作）
npm run test:02

# 手動測試你的服務器
npm run dev:02
```

## 💡 提示

1. **JSON 資源**: 使用 `JSON.stringify()` 格式化 JSON 數據
2. **系統信息**: 可以使用 `process.uptime()`, `process.memoryUsage()`, `process.version` 等
3. **URI 處理**: 處理函數接收 `uri: URL` 參數，使用 `uri.href` 獲取完整 URI
4. **內容格式**: 每個資源都要返回 `contents` 陣列，包含 `uri`, `text`, `mimeType` 屬性

## 📚 參考資料

查看 `solutions/02-static-resources/` 中的完整實作範例，或參考 `mcp-typescript-sdk.md` 中的 Resources 章節。