# 練習 8: HTTP 傳輸服務器 - 提示和指導

## 開發提示

### 🎁 開始之前
1. **完成前置練習**: 確保熟悉練習 1-7 的所有功能
2. **理解 HTTP 傳輸**: 學習 MCP 协議在 HTTP 上的運作方式
3. **Express.js 基礎**: 營悉 Express.js 的中間件和路由概念

### 🔧 實作提示

#### 服務器初始化
```typescript
const server = new McpServer({
  name: 'http-transport-server', // 替換 FILL_IN_SERVER_NAME
  version: '1.0.0' // 替換 FILL_IN_VERSION
});
```

#### 會話管理接口定義
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

#### 模擬數據和存儲設置
```typescript
// 模擬的HTTP響應數據 (來自練習5)
const mockHttpResponses: { [key: string]: any } = {
  'https://api.example.com/users': {
    status: 200,
    data: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  },
  'https://api.example.com/posts': {
    status: 200,
    data: [
      { id: 1, title: 'Hello World', content: 'This is a test post' },
      { id: 2, title: 'MCP Tutorial', content: 'Learning MCP is fun!' }
    ]
  },
  'https://api.example.com/error': {
    status: 500,
    error: 'Internal Server Error'
  }
};

// 內容管理系統存儲 (來自練習7)
interface ContentItem {
  id: string;
  type: 'article' | 'blog' | 'documentation' | 'note';
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

const contentStore: Map<string, ContentItem> = new Map();

// 初始化示例內容
contentStore.set('article-1', {
  id: 'article-1',
  type: 'article',
  title: 'MCP Protocol Overview',
  content: 'The Model Context Protocol (MCP) is a standardized way for applications to provide context to LLMs.',
  author: 'System',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  tags: ['mcp', 'protocol', 'overview'],
  status: 'published'
});
```

### 🛠️ 會話管理實作指導

#### 1. 工具函數實作
```typescript
// 生成唯一 ID
function generateId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}`;
}

// 會話創建
function createSession(clientInfo?: { name: string; version: string }): string {
  const sessionId = randomUUID();
  const session: Session = {
    id: sessionId,
    startTime: new Date(),
    lastActivity: new Date(),
    clientInfo
  };
  sessions.set(sessionId, session);
  console.error(`Session created: ${sessionId}`);
  return sessionId;
}

// 會話活動更新
function updateSessionActivity(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
}

// 清理無效會話
function cleanupInactiveSessions(): void {
  const now = new Date();
  const maxInactiveTime = 30 * 60 * 1000; // 30 minutes
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now.getTime() - session.lastActivity.getTime() > maxInactiveTime) {
      sessions.delete(sessionId);
      console.error(`Session expired: ${sessionId}`);
    }
  }
}

// 定期清理設置
setInterval(cleanupInactiveSessions, 5 * 60 * 1000); // 每5分鐘清理一次
```

#### 2. 會話管理工具
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
    try {
      switch (action) {
        case 'current':
          return {
            content: [{
              type: 'text',
              text: `Active sessions: ${sessions.size}\nSession cleanup runs every 5 minutes\nMax inactive time: 30 minutes`
            }]
          };
        case 'list':
          const sessionList = Array.from(sessions.values()).map(session => 
            `ID: ${session.id.substring(0, 8)}...\nStarted: ${session.startTime.toISOString()}\nLast Activity: ${session.lastActivity.toISOString()}\nClient: ${session.clientInfo?.name || 'Unknown'} ${session.clientInfo?.version || ''}`
          ).join('\n\n');
          
          return {
            content: [{
              type: 'text',
              text: `Active Sessions (${sessions.size}):\n\n${sessionList || 'No active sessions'}`
            }]
          };
        case 'cleanup':
          const beforeCount = sessions.size;
          cleanupInactiveSessions();
          const afterCount = sessions.size;
          
          return {
            content: [{
              type: 'text',
              text: `Session cleanup completed\nSessions before: ${beforeCount}\nSessions after: ${afterCount}\nCleaned up: ${beforeCount - afterCount} inactive sessions`
            }]
          };
        default:
          throw new Error(`Unknown action: ${action}`);
      }
    } catch (error) {
      throw new Error(`Session info error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
```

### 🌐 Express.js 應用程序實作指導

#### Express 應用程序創建
```typescript
function createExpressApp(): express.Application {
  const app = express();
  
  // 基本中間件
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
  
  // 錯誤處理中間件
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });
  
  return app;
}
```

### 🚀 HTTP 傳輸實作指導

#### 主函數實作
```typescript
async function main() {
  try {
    await ensureDataDir();
    
    // 檢查命令行參數決定傳輸方式
    const useHttp = process.argv.includes('--http');
    const port = parseInt(process.env.PORT || '3000');
    
    if (useHttp) {
      // HTTP 傳輸模式
      console.error('Starting HTTP transport server...');
      
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
        console.error(`HTTP Transport Server started successfully`);
        console.error(`HTTP server listening on port ${port}`);
        console.error(`MCP endpoint: http://localhost:${port}/mcp`);
        console.error(`Health check: http://localhost:${port}/health`);
        console.error(`Active sessions: ${sessions.size}`);
        console.error('Use Ctrl+C to stop the server');
      });
      
      // 優雅關閉
      process.on('SIGINT', () => {
        console.error('\nShutting down HTTP server...');
        httpServer.close(() => {
          console.error('HTTP server closed.');
          process.exit(0);
        });
      });
      
    } else {
      // stdio 傳輸模式 (默認)
      console.error('Starting stdio transport server...');
      
      const transport = new StdioServerTransport();
      await server.connect(transport);
      
      console.error('Stdio Transport Server started successfully');
      console.error('Server is ready to receive JSON-RPC messages via stdio');
    }
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
```

### 📝 整合所有功能指導

#### 工具複製模式
```typescript
// 練習 1: Echo 工具
server.registerTool(
  'echo',
  {
    title: 'Echo Tool',
    description: 'Echo back the input message',
    inputSchema: {
      message: z.string().describe('Message to echo back')
    }
  },
  async ({ message }) => ({
    content: [{ type: 'text', text: `Echo: ${message}` }]
  })
);

// 練習 3: 計算工具
server.registerTool(
  'calculate',
  {
    title: 'Calculate Tool',
    description: 'Perform basic arithmetic calculations',
    inputSchema: {
      expression: z.string().describe('Mathematical expression to evaluate (e.g., "2 + 3 * 4")')
    }
  },
  async ({ expression }) => {
    try {
      // 簡單的數學表達式計算 (安全版本)
      const result = Function('"use strict"; return (' + expression.replace(/[^0-9+\-*/().\s]/g, '') + ')')();
      
      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Invalid calculation result');
      }
      
      return {
        content: [{
          type: 'text',
          text: `${expression} = ${result}`
        }]
      };
    } catch (error) {
      throw new Error(`Calculation error: ${error instanceof Error ? error.message : 'Invalid expression'}`);
    }
  }
);

// 繼續複製所有其他工具...
```

#### 資源複製模式
```typescript
// 練習 2: 服務器配置資源
server.registerResource(
  'server-config',
  'config://server',
  {
    title: 'Server Configuration',
    description: 'Current server configuration and status',
    mimeType: 'application/json'
  },
  async () => {
    const config = {
      serverName: 'http-transport-server',
      version: '1.0.0',
      protocol: 'MCP',
      protocolVersion: '2024-11-05',
      capabilities: {
        resources: { subscribe: false, listChanged: false },
        tools: { listChanged: false },
        prompts: { listChanged: false }
      },
      features: {
        echo: true,
        calculations: true,
        textTransform: true,
        timestamps: true,
        fileOperations: true,
        httpRequests: true,
        dataProcessing: true,
        contentManagement: true,
        sessionManagement: true,
        httpTransport: true
      },
      transports: ['stdio', 'http'],
      activeSessions: sessions.size,
      uptime: process.uptime(),
      status: 'running'
    };
    
    return {
      contents: [{
        uri: 'config://server',
        text: JSON.stringify(config, null, 2),
        mimeType: 'application/json'
      }]
    };
  }
);

// 繼續複製所有其他資源...
```

### 🐛 常見問題和解決方案

#### 問題1: HTTP 服務器無法啟動
**症狀**: EADDRINUSE 錯誤
**解決方案**:
```typescript
// 使用環境變數或隨機端口
const port = parseInt(process.env.PORT || '3000');

// 或者在測試中使用不同端口
const testPort = Math.floor(Math.random() * 10000) + 3000;
```

#### 問題2: CORS 錯誤
**症狀**: 網頁無法訪問 MCP 端點
**解決方案**:
```typescript
// 確保 CORS 中間件正確設置
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
```

#### 問題3: 會話沒有正確清理
**症狀**: 內存洩漏，會話數量不斷增加
**解決方案**:
```typescript
// 確保清理在定期間隔進行
setInterval(cleanupInactiveSessions, 5 * 60 * 1000);

// 添加進程關閉清理
process.on('SIGINT', () => {
  sessions.clear();
  process.exit(0);
});
```

#### 問題4: StreamableHTTPServerTransport 錯誤
**症狀**: 傳輸創建或連接失敗
**解決方案**:
```typescript
// 確保先創建 HTTP 服務器
const httpServer = http.createServer(app);

// 然後創建傳輸
const transport = new StreamableHTTPServerTransport({
  server: httpServer,
  path: '/mcp'
});

// 最後連接
await server.connect(transport);
```

### 📊 性能優化指導

#### 請求響應時間優化
```typescript
// 設置請求超時
app.use((req, res, next) => {
  req.setTimeout(30000); // 30秒超時
  next();
});

// 異步處理優化
server.registerTool(
  'async-operation',
  config,
  async (params) => {
    // 使用 Promise.race 防止長時間等待
    const result = await Promise.race([
      longRunningOperation(params),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Operation timeout')), 10000)
      )
    ]);
    return result;
  }
);
```

#### 內存使用優化
```typescript
// 限制會話數量
const MAX_SESSIONS = 100;

function createSession(clientInfo?: { name: string; version: string }): string {
  if (sessions.size >= MAX_SESSIONS) {
    // 移除最舊的會話
    const oldestSession = Array.from(sessions.entries())
      .sort(([,a], [,b]) => a.lastActivity.getTime() - b.lastActivity.getTime())[0];
    if (oldestSession) {
      sessions.delete(oldestSession[0]);
    }
  }
  
  // 創建新會話...
}
```

### 🔍 除錯指導

#### 服務器啟動除錯
```typescript
// 添加詳細的日誌記錄
console.error('=== Server Starting ===');
console.error(`Node version: ${process.version}`);
console.error(`Platform: ${process.platform}`);
console.error(`Args: ${process.argv.join(' ')}`);
console.error(`Working directory: ${process.cwd()}`);

// 測試模組導入
try {
  const { StreamableHTTPServerTransport } = require('@modelcontextprotocol/sdk/server/http.js');
  console.error('✓ HTTP transport module loaded');
} catch (error) {
  console.error('✗ HTTP transport module failed to load:', error);
}
```

#### HTTP 請求除錯
```typescript
// 添加請求日誌中間件
app.use((req, res, next) => {
  console.error(`${new Date().toISOString()} ${req.method} ${req.path}`);
  console.error('Headers:', req.headers);
  if (req.body) {
    console.error('Body:', JSON.stringify(req.body, null, 2));
  }
  next();
});
```

#### 會話除錯
```typescript
// 添加會話狀態追蹤
function debugSessions() {
  console.error('=== Session Debug ===');
  console.error(`Total sessions: ${sessions.size}`);
  for (const [id, session] of sessions.entries()) {
    console.error(`Session ${id.substring(0, 8)}: ${session.clientInfo?.name || 'Unknown'} (${new Date().getTime() - session.lastActivity.getTime()}ms ago)`);
  }
  console.error('==================');
}

// 在測試中調用
setInterval(debugSessions, 60000); // 每分鐘輸出一次
```

### 📝 測試策略

#### 單元測試模式
1. 測試每個工具的独立功能
2. 測試 stdio 和 HTTP 傳輸模式
3. 測試會話管理功能
4. 測試錯誤情況

#### 整合測試流程
```bash
# 1. 測試 stdio 模式
npm run build
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/exercises/08-http-transport/server.js

# 2. 測試 HTTP 模式
node dist/exercises/08-http-transport/server.js --http &
sleep 2
curl http://localhost:3000/health
curl -X POST http://localhost:3000/mcp -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}'
kill %1

# 3. 運行完整測試套件
npm test:08
```

### 🚀 進階技巧

#### 自定義中間件
```typescript
// 身份驗證中間件
app.use('/mcp', (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (process.env.REQUIRE_API_KEY && !apiKey) {
    return res.status(401).json({ error: 'API key required' });
  }
  next();
});

// 請求限制中間件
const requestCounts = new Map<string, number>();
app.use((req, res, next) => {
  const clientIp = req.ip;
  const count = requestCounts.get(clientIp) || 0;
  if (count > 100) { // 每小時100個請求
    return res.status(429).json({ error: 'Rate limit exceeded' });
  }
  requestCounts.set(clientIp, count + 1);
  next();
});
```

#### 監控和記錄
```typescript
// 指標收集
interface Metrics {
  totalRequests: number;
  errorCount: number;
  activeConnections: number;
  averageResponseTime: number;
}

const metrics: Metrics = {
  totalRequests: 0,
  errorCount: 0,
  activeConnections: 0,
  averageResponseTime: 0
};

// 指標端點
app.get('/metrics', (req, res) => {
  res.json({
    ...metrics,
    activeSessions: sessions.size,
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage()
  });
});
```

#### 集群支援
```typescript
// 使用 cluster 模組實現多進程
import cluster from 'cluster';
import { cpus } from 'os';

if (cluster.isPrimary && process.env.NODE_ENV === 'production') {
  const numWorkers = cpus().length;
  
  for (let i = 0; i < numWorkers; i++) {
    cluster.fork();
  }
  
  cluster.on('exit', (worker) => {
    console.error(`Worker ${worker.process.pid} died`);
    cluster.fork();
  });
} else {
  // 在 worker 進程中啟動服務器
  main();
}
```

## 下一步
完成本練習後，您將掌握如何構建生產級的 MCP 服務，可以進入練習 9：動態服務器功能的學習。
