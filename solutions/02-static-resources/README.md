# Exercise 02: Static Resources

## 學習目標

這個練習教你如何在 MCP 服務器中註冊和提供靜態資源。靜態資源類似於 REST API 中的 GET 端點，用於向 LLM 提供數據而不執行複雜的計算或副作用。

## 功能要求

實作一個 MCP 服務器，提供以下靜態資源：

1. **應用配置資源** (`config://app`)
   - 包含應用程式設定的 JSON 資料
   - MIME 類型：`application/json`

2. **說明文件資源** (`help://guide`) 
   - 包含用戶指南的 Markdown 文件
   - MIME 類型：`text/markdown`

3. **系統狀態資源** (`status://health`)
   - 包含當前系統健康狀態的純文本
   - MIME 類型：`text/plain`
   - 顯示運行時間、記憶體使用量等資訊

## 關鍵概念

### Resource 註冊
```typescript
server.registerResource(
  'resource-name',
  'protocol://path', 
  {
    title: 'Resource Title',
    description: 'Resource description',
    mimeType: 'text/plain'
  },
  async (uri) => ({
    contents: [{
      uri: uri.href,
      text: 'Resource content',
      mimeType: 'text/plain'
    }]
  })
);
```

### MIME 類型
- `application/json` - JSON 數據
- `text/markdown` - Markdown 文檔  
- `text/plain` - 純文本
- `text/html` - HTML 內容

## 測試方式

```bash
# 編譯並測試
npm run build
npm run test:02

# 手動測試
npm run dev:02

# 使用 MCP Inspector
npx @modelcontextprotocol/inspector node dist/solutions/02-static-resources/server.js
```

## 預期行為

1. 服務器成功啟動並回應初始化請求
2. `resources/list` 請求返回三個資源
3. `resources/read` 請求能正確讀取每個資源的內容
4. 每個資源返回正確的 MIME 類型和格式化內容