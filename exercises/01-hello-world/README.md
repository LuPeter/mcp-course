# 練習 1: Hello World MCP Server

## 🎯 學習目標
- 理解MCP服務器的基本結構
- 掌握stdio傳輸協議
- 學會註冊和實作工具
- 練習基本錯誤處理

## 📝 實作任務

### 第一步：完成服務器初始化
在 `server.ts` 中完成以下TODO項目：
1. 設定服務器名稱為 `'hello-world-server'`
2. 設定版本為 `'1.0.0'`

### 第二步：註冊echo工具
實作一個echo工具，需要：
- 工具名稱：`'echo'`
- 接收參數：`message` (字串)
- 功能：將訊息原樣返回，格式為 `"Echo: [訊息]"`
- 錯誤處理：當缺少message參數時拋出錯誤

### 第三步：實作main函數
1. 創建 `StdioServerTransport` 實例
2. 使用 `server.connect()` 連接傳輸
3. 輸出啟動成功訊息
4. 適當的錯誤處理

### 第四步：啟動邏輯
檢查是否為主模組，然後啟動服務器

## 🔧 開發流程

### 1. 編譯程式碼
```bash
npm run build
```

### 2. 運行服務器
```bash
npm run dev:01
```

### 3. 運行測試
```bash
npm run test:01
```

## 🧪 測試標準

你的實作應該通過以下測試：
- ✅ 服務器能夠啟動
- ✅ 回應初始化請求
- ✅ 列出echo工具
- ✅ 正確處理echo工具調用
- ✅ 處理缺少參數的錯誤情況

## 💡 獲得幫助

如果遇到困難：
1. 查看 `hints.md` 獲得實作提示
2. 參考 `../../solutions/01-hello-world/` 中的完整解答
3. 使用MCP Inspector進行調試：
   ```bash
   npx @modelcontextprotocol/inspector node dist/exercises/01-hello-world/server.js
   ```

## 📚 相關概念

### MCP核心概念
- **Server**: MCP服務器實例，管理工具和資源
- **Tool**: 有副作用的操作，類似REST API的POST
- **Transport**: 傳輸層，stdio用於命令列整合

### JSON-RPC協議
MCP使用JSON-RPC 2.0進行通信：
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": {"message": "Hello"}
  }
}
```

## ✅ 完成檢查

完成實作後，確認：
- [ ] 程式碼編譯無錯誤
- [ ] 所有測試通過
- [ ] 能夠手動測試echo功能
- [ ] 錯誤處理正常工作

完成後繼續到 [練習 2: 靜態資源服務器](../02-static-resources/README.md)。