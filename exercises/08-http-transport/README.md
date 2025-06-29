# 練習 8: HTTP 傳輸服務器

## 概述

本練習將在 MCP 服務器中添加 HTTP 傳輸支援，使其能夠同時支援 stdio 和 HTTP 傳輸模式。您將學習如何使用 Express.js 和 StreamableHTTPServerTransport 實作遠端 MCP 服務，包括會話管理和併發處理。

## 學習目標

- 🌐 **HTTP 傳輸**: 實作 StreamableHTTPServerTransport 支援
- 🛠️ **Express.js 整合**: 創建 HTTP 服務器和中間件
- 🔐 **會話管理**: 實作會話生命週期管理
- 🔄 **雙模式支援**: 同時支援 stdio 和 HTTP transport
- 🚀 **生產部署**: 遠端 MCP 服務部署模式

## 技術要點

### HTTP 傳輸架構
```
┌─────────────────────────────────────────────────┐
│                HTTP Transport Server               │
├─────────────────────────────────────────────────┤
│  Express.js App │ StreamableHTTP │ Session Manager │
│  ───────────── │ Transport     │ ────────────── │
│  • /health       │               │ • Session CRUD  │
│  • /mcp          │ MCP Core      │ • Lifecycle     │
│  • CORS          │ Server        │ • Cleanup       │
│  • Middleware    │               │ • Monitoring    │
├─────────────────────────────────────────────────┤
│            All Previous Exercise Features           │
│    Tools + Resources + Prompts + Content Mgmt      │
└─────────────────────────────────────────────────┘
```

### 會話管理系統
- **會話創建**: 自動為 HTTP 連接創建會話
- **活動追蹤**: 記錄會話最後活動時間
- **自動清理**: 30分鐘未活動後自動清理會話
- **會話監控**: 提供會話狀態和管理工具

### 傳輸模式
- **stdio**: 預設模式，用於命令行整合
- **HTTP**: 遠端服務模式，支援網路訪問

## 實作要求

### 1. 服務器初始化
```typescript
const server = new McpServer({
  name: 'http-transport-server',
  version: '1.0.0'
});
```

### 2. 會話管理接口
```typescript
interface Session {
  id: string;
  startTime: Date;
  lastActivity: Date;
  clientInfo?: {
    name: string;
    version: string;
  };
}

const sessions: Map<string, Session> = new Map();
```

### 3. 會話管理函數
```typescript
function createSession(clientInfo?: { name: string; version: string }): string {
  const sessionId = randomUUID();
  const session: Session = {
    id: sessionId,
    startTime: new Date(),
    lastActivity: new Date(),
    clientInfo
  };
  sessions.set(sessionId, session);
  return sessionId;
}

function updateSessionActivity(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
}

function cleanupInactiveSessions(): void {
  const now = new Date();
  const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now.getTime() - session.lastActivity.getTime() > maxInactiveTime) {
      sessions.delete(sessionId);
    }
  }
}
```

### 4. 會話管理工具
```typescript
server.registerTool(
  'session-info',
  {
    title: 'Session Information Tool',
    description: 'Get information about current session and active sessions',
    inputSchema: {
      action: z.enum(['current', 'list', 'cleanup']).describe('Action to perform')
    }
  },
  async ({ action }) => {
    // 實作會話信息管理邏輯
  }
);
```

### 5. Express.js 應用程序
```typescript
function createExpressApp(): express.Application {
  const app = express();
  
  // 中間件
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // CORS 支援
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
    } else {
      next();
    }
  });
  
  // 健康檢查端點
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      activeSessions: sessions.size,
      version: '1.0.0'
    });
  });
  
  return app;
}
```

### 6. HTTP 傳輸設置
```typescript
if (useHttp) {
  // HTTP 傳輸模式
  const app = createExpressApp();
  const httpServer = http.createServer(app);
  
  // 創建 StreamableHTTPServerTransport
  const transport = new StreamableHTTPServerTransport({
    server: httpServer,
    path: '/mcp'
  });
  
  // 連接服務器到 HTTP 傳輸
  await server.connect(transport);
  
  // 啟動 HTTP 服務器
  httpServer.listen(port, () => {
    console.error(`HTTP server listening on port ${port}`);
    console.error(`MCP endpoint: http://localhost:${port}/mcp`);
  });
} else {
  // stdio 傳輸模式
  const transport = new StdioServerTransport();
  await server.connect(transport);
}
```

## 實作步驟

### 第一步: 導入與設置
1. 導入所有必要的模組
2. 定義服務器和會話管理接口
3. 初始化必要的存儲和數據

### 第二步: 整合所有前面功能
1. 複製所有練習 1-7 的工具實作
2. 複製所有資源和提示實作
3. 確保所有功能正常工作

### 第三步: 實作會話管理
1. 實作會話創建和管理函數
2. 添加會話活動追蹤
3. 實作自動清理機制
4. 添加會話管理工具

### 第四步: Express 應用程序
1. 創建 Express 應用程序
2. 添加必要的中間件
3. 實作 CORS 支援
4. 添加健康檢查端點
5. 添加錯誤處理

### 第五步: HTTP 傳輸實作
1. 實作 StreamableHTTPServerTransport
2. 添加傳輸模式選擇邏輯
3. 實作 HTTP 服務器啟動
4. 添加優雅關閉處理

### 第六步: 測試和驗證
1. 測試 stdio 模式功能
2. 測試 HTTP 模式功能
3. 測試會話管理
4. 測試併發處理
5. 測試錯誤處理

## 測試策略

### stdio 模式測試
```bash
# 運行基本測試
npm test:08

# 手動測試 stdio 模式
npm run dev:08
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/exercises/08-http-transport/server.js
```

### HTTP 模式測試
```bash
# 啟動 HTTP 服務器
node dist/exercises/08-http-transport/server.js --http

# 測試健康檢查
curl http://localhost:3000/health

# 測試 MCP 初始化
curl -X POST http://localhost:3000/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
```

### 整合測試場景
1. **雙模式運行**: 同時運行 stdio 和 HTTP 服務器
2. **會話管理**: 創建、監控、清理會話
3. **併發處理**: 多個 HTTP 請求同時處理
4. **錯誤處理**: 網路錯誤、無效請求、會話錯誤

## 常見問題

### Q: 為什麼要同時支援 stdio 和 HTTP 傳輸？
A: stdio 適合本地開發和整合，而 HTTP 適合遠端服務和網路部署。

### Q: 會話管理的作用是什麼？
A: 追蹤客戶端連接狀態，管理資源，自動清理無效連接。

### Q: 如何處理 HTTP 傳輸中的錯誤？
A: 使用 Express 錯誤中間件，適當的 HTTP 狀態碼，和結構化錯誤回應。

### Q: 如何測試併發 HTTP 請求？
A: 使用 Promise.all() 發送多個同時請求，驗證所有請求都正常返回。

## 進階挑戰

1. **身份驗證**: 添加 API 金鑰或 JWT token 驗證
2. **負載均衡**: 實作多個服務器實例的負載均衡
3. **WebSocket 支援**: 添加即時通訊功能
4. **監控和記錄**: 添加詳細的指標收集和日誌記錄
5. **網關整合**: 實作 API 網關功能和率限制

## 相關資源

- [MCP 規範文檔](https://spec.modelcontextprotocol.io)
- [Express.js 文檔](https://expressjs.com/)
- [Node.js HTTP 模組](https://nodejs.org/api/http.html)
- [TypeScript SDK 文檔](../../../mcp-typescript-sdk.md)
- [練習 1-7](../) - 前置功能實作
- [測試框架](../../tests/08-http-transport/) - 測試用例參考
