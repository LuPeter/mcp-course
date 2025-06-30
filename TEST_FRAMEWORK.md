# MCP 練習測試框架設計

## 測試架構概述

### 測試分層
```
Integration Tests (端到端)
    ↓
Functional Tests (功能測試)  
    ↓
Unit Tests (單元測試)
    ↓
Smoke Tests (冒煙測試)
```

## 測試工具棧
- **測試框架**: Jest
- **斷言庫**: Jest 內建 + 自定義 MCP 斷言
- **Mock 工具**: Jest Mocks
- **進程管理**: child_process + 超時控制
- **HTTP 測試**: supertest
- **異步測試**: async/await + Promise handling

## 核心測試utilities

### MCP 連接測試工具
```typescript
// tests/utils/mcp-test-utils.ts
export class McpTestClient {
  private client: Client;
  private transport: StdioClientTransport | StreamableHTTPClientTransport;
  
  async connect(serverPath: string, options?: ConnectOptions): Promise<void>
  async disconnect(): Promise<void>
  async listResources(): Promise<Resource[]>
  async readResource(uri: string): Promise<ReadResourceResult>
  async listTools(): Promise<Tool[]>
  async callTool(name: string, args: any): Promise<CallToolResult>
  async listPrompts(): Promise<Prompt[]>
  async getPrompt(name: string, args: any): Promise<GetPromptResult>
  
  // 測試專用方法
  async waitForConnection(timeout: number = 5000): Promise<void>
  async expectError(operation: () => Promise<any>, errorType: string): Promise<void>
}

export class McpTestServer {
  private serverProcess: ChildProcess;
  private httpServer?: Server;
  
  async start(serverPath: string, transport: 'stdio' | 'http'): Promise<void>
  async stop(): Promise<void>
  async restart(): Promise<void>
  async isRunning(): Promise<boolean>
  async waitForReady(timeout: number = 10000): Promise<void>
}
```

## 各練習的測試設計

### 練習 1: Hello World MCP 測試
```typescript
// tests/01-hello-world/hello-world.test.ts
describe('Exercise 01: Hello World MCP', () => {
  let testClient: McpTestClient;
  let testServer: McpTestServer;
  
  beforeAll(async () => {
    testServer = new McpTestServer();
    await testServer.start('./exercises/01-hello-world/solution/server.js', 'stdio');
    
    testClient = new McpTestClient();
    await testClient.connect('./exercises/01-hello-world/solution/server.js');
  });
  
  afterAll(async () => {
    await testClient.disconnect();
    await testServer.stop();
  });
  
  describe('Connection', () => {
    test('should establish connection successfully', async () => {
      expect(testClient.isConnected()).toBe(true);
    });
    
    test('should handle connection timeout', async () => {
      const badClient = new McpTestClient();
      await expect(
        badClient.connect('./nonexistent-server.js', { timeout: 1000 })
      ).rejects.toThrow('Connection timeout');
    });
  });
  
  describe('Echo Tool', () => {
    test('should echo input text correctly', async () => {
      const result = await testClient.callTool('echo', { text: 'Hello World' });
      expect(result.content[0].text).toBe('Hello World');
    });
    
    test('should handle empty input', async () => {
      const result = await testClient.callTool('echo', { text: '' });
      expect(result.content[0].text).toBe('');
    });
    
    test('should handle special characters', async () => {
      const specialText = '!@#$%^&*()_+{}|:"<>?';
      const result = await testClient.callTool('echo', { text: specialText });
      expect(result.content[0].text).toBe(specialText);
    });
  });
  
  describe('Tool Discovery', () => {
    test('should list echo tool', async () => {
      const tools = await testClient.listTools();
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe('echo');
      expect(tools[0].description).toBeDefined();
    });
  });
});
```

### 練習 2: 靜態資源測試
```typescript
// tests/02-static-resources/static-resources.test.ts
describe('Exercise 02: Static Resources', () => {
  // ... 繼承練習1的所有測試 ...
  
  describe('Static Resources', () => {
    test('should list all static resources', async () => {
      const resources = await testClient.listResources();
      expect(resources).toHaveLength(3);
      
      const resourceUris = resources.map(r => r.uri);
      expect(resourceUris).toContain('config://app');
      expect(resourceUris).toContain('help://commands');
      expect(resourceUris).toContain('status://server');
    });
    
    test('should read config resource correctly', async () => {
      const result = await testClient.readResource('config://app');
      expect(result.contents).toHaveLength(1);
      expect(result.contents[0].uri).toBe('config://app');
      expect(result.contents[0].text).toContain('version');
      expect(result.contents[0].mimeType).toBe('application/json');
    });
    
    test('should read help resource correctly', async () => {
      const result = await testClient.readResource('help://commands');
      expect(result.contents[0].text).toContain('Available commands');
    });
    
    test('should read status resource correctly', async () => {
      const result = await testClient.readResource('status://server');
      expect(result.contents[0].text).toContain('status');
      expect(result.contents[0].text).toContain('uptime');
    });
    
    test('should handle non-existent resource', async () => {
      await expect(
        testClient.readResource('config://nonexistent')
      ).rejects.toThrow('Resource not found');
    });
  });
  
  describe('Cumulative Functionality', () => {
    test('should maintain echo tool from exercise 1', async () => {
      const result = await testClient.callTool('echo', { text: 'test' });
      expect(result.content[0].text).toBe('test');
    });
  });
});
```

### 練習 3: 基礎工具測試
```typescript
// tests/03-basic-tools/basic-tools.test.ts
describe('Exercise 03: Basic Tools', () => {
  // ... 繼承前面練習的所有測試 ...
  
  describe('Calculate Tool', () => {
    test('should perform addition correctly', async () => {
      const result = await testClient.callTool('calculate', { 
        operation: 'add', 
        a: 5, 
        b: 3 
      });
      expect(result.content[0].text).toBe('8');
    });
    
    test('should perform subtraction correctly', async () => {
      const result = await testClient.callTool('calculate', { 
        operation: 'subtract', 
        a: 10, 
        b: 4 
      });
      expect(result.content[0].text).toBe('6');
    });
    
    test('should handle division by zero', async () => {
      await expect(
        testClient.callTool('calculate', { 
          operation: 'divide', 
          a: 10, 
          b: 0 
        })
      ).rejects.toThrow('Division by zero');
    });
    
    test('should validate operation parameter', async () => {
      await expect(
        testClient.callTool('calculate', { 
          operation: 'invalid', 
          a: 1, 
          b: 2 
        })
      ).rejects.toThrow('Invalid operation');
    });
  });
  
  describe('Text Transform Tool', () => {
    test('should convert to uppercase', async () => {
      const result = await testClient.callTool('text-transform', {
        text: 'hello world',
        operation: 'uppercase'
      });
      expect(result.content[0].text).toBe('HELLO WORLD');
    });
    
    test('should reverse text', async () => {
      const result = await testClient.callTool('text-transform', {
        text: 'hello',
        operation: 'reverse'
      });
      expect(result.content[0].text).toBe('olleh');
    });
  });
  
  describe('Timestamp Tool', () => {
    test('should generate current timestamp', async () => {
      const result = await testClient.callTool('timestamp', {
        format: 'iso'
      });
      expect(result.content[0].text).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
    
    test('should format timestamp correctly', async () => {
      const result = await testClient.callTool('timestamp', {
        format: 'unix',
        timestamp: 1640995200000
      });
      expect(result.content[0].text).toBe('1640995200');
    });
  });
});
```

### 練習 4-9: 類似的測試模式，逐漸增加複雜度

### 練習 10: 資料庫整合測試
```typescript
// tests/10-content-management/database.test.ts
describe('Exercise 10: Content Management Database Integration', () => {
  let testClient: McpTestClient;
  let testServer: McpTestServer;
  let testDb: string;
  
  beforeAll(async () => {
    // 創建測試專用資料庫
    testDb = `./test-${Date.now()}.db`;
    process.env.TEST_DB_PATH = testDb;
    
    testServer = new McpTestServer();
    await testServer.start('./exercises/10-content-management/server.js', 'stdio');
    
    testClient = new McpTestClient();
    await testClient.connect('./exercises/10-content-management/server.js');
  });
  
  afterAll(async () => {
    await testClient.disconnect();
    await testServer.stop();
    
    // 清理測試資料庫
    if (fs.existsSync(testDb)) {
      fs.unlinkSync(testDb);
    }
  });
  
  describe('Database Initialization', () => {
    test('should initialize SQLite database correctly', async () => {
      expect(fs.existsSync(testDb)).toBe(true);
    });
    
    test('should create required tables', async () => {
      // 通過資源查詢驗證表格存在
      const result = await testClient.readResource('content://articles');
      expect(result.contents[0]).toBeDefined();
    });
  });
  
  describe('Article Management (MCP Tools)', () => {
    test('should create new article via MCP tool', async () => {
      const result = await testClient.callTool('article-create', {
        title: 'Test Article',
        content: 'This is a test article',
        author: 'Test Author'
      });
      
      expect(result.content[0].text).toContain('Article created successfully');
      expect(result.content[0].text).toContain('id');
    });
    
    test('should list articles via MCP resource', async () => {
      const result = await testClient.readResource('content://articles');
      const articles = JSON.parse(result.contents[0].text);
      
      expect(Array.isArray(articles)).toBe(true);
      expect(articles.length).toBeGreaterThan(0);
      expect(articles[0]).toHaveProperty('title');
      expect(articles[0]).toHaveProperty('author');
    });
    
    test('should read specific article via parameterized resource', async () => {
      // 先創建文章獲取ID
      const createResult = await testClient.callTool('article-create', {
        title: 'Specific Article',
        content: 'Content for specific test',
        author: 'Test Author'
      });
      
      const articleId = extractIdFromResult(createResult);
      
      // 讀取特定文章
      const result = await testClient.readResource(`content://articles/${articleId}`);
      const article = JSON.parse(result.contents[0].text);
      
      expect(article.title).toBe('Specific Article');
      expect(article.content).toBe('Content for specific test');
    });
    
    test('should update article via MCP tool', async () => {
      const createResult = await testClient.callTool('article-create', {
        title: 'Update Test',
        content: 'Original content',
        author: 'Test Author'
      });
      
      const articleId = extractIdFromResult(createResult);
      
      const updateResult = await testClient.callTool('article-update', {
        id: articleId,
        title: 'Updated Title',
        content: 'Updated content'
      });
      
      expect(updateResult.content[0].text).toContain('updated successfully');
    });
    
    test('should delete article via MCP tool', async () => {
      const createResult = await testClient.callTool('article-create', {
        title: 'Delete Test',
        content: 'To be deleted',
        author: 'Test Author'
      });
      
      const articleId = extractIdFromResult(createResult);
      
      const deleteResult = await testClient.callTool('article-delete', {
        id: articleId
      });
      
      expect(deleteResult.content[0].text).toContain('deleted successfully');
      
      // 驗證文章已被刪除
      await expect(
        testClient.readResource(`content://articles/${articleId}`)
      ).rejects.toThrow('not found');
    });
  });
  
  describe('Tag Management', () => {
    test('should manage tags via MCP tool', async () => {
      const result = await testClient.callTool('tag-manage', {
        operation: 'create',
        name: 'test-tag'
      });
      
      expect(result.content[0].text).toContain('Tag created');
    });
    
    test('should list tags via MCP resource', async () => {
      const result = await testClient.readResource('content://tags');
      const tags = JSON.parse(result.contents[0].text);
      
      expect(Array.isArray(tags)).toBe(true);
    });
  });
  
  describe('Data Persistence', () => {
    test('should persist data across server restarts', async () => {
      // 創建測試資料
      await testClient.callTool('article-create', {
        title: 'Persistence Test',
        content: 'This should persist',
        author: 'Test Author'
      });
      
      // 重啟服務器
      await testClient.disconnect();
      await testServer.restart();
      await testClient.connect('./exercises/10-content-management/server.js');
      
      // 驗證資料仍然存在
      const result = await testClient.readResource('content://articles');
      const articles = JSON.parse(result.contents[0].text);
      
      const persistedArticle = articles.find(a => a.title === 'Persistence Test');
      expect(persistedArticle).toBeDefined();
    });
  });
  
  describe('Error Handling', () => {
    test('should handle database errors gracefully', async () => {
      await expect(
        testClient.callTool('article-update', {
          id: 99999, // 不存在的ID
          title: 'Should fail'
        })
      ).rejects.toThrow('Article not found');
    });
    
    test('should validate required fields', async () => {
      await expect(
        testClient.callTool('article-create', {
          content: 'Missing title',
          author: 'Test Author'
        })
      ).rejects.toThrow('Title is required');
    });
  });
});

function extractIdFromResult(result: CallToolResult): number {
  const text = result.content[0].text;
  const match = text.match(/id[:\s]+(\d+)/i);
  return match ? parseInt(match[1]) : 0;
}
```

### 練習 11: 服務間通信測試
```typescript
// tests/11-service-communication/service-integration.test.ts
describe('Exercise 11: Service Communication Integration', () => {
  let cmsServer: McpTestServer;
  let analysisServer: McpTestServer;
  let analysisClient: McpTestClient;
  let cmsClient: McpTestClient;
  let testDb: string;
  
  beforeAll(async () => {
    // 設置測試資料庫
    testDb = `./test-cms-${Date.now()}.db`;
    process.env.TEST_DB_PATH = testDb;
    
    // 啟動CMS服務器（來自練習10）
    cmsServer = new McpTestServer();
    await cmsServer.start('./exercises/10-content-management/server.js', 'stdio');
    
    // 啟動代碼分析服務器
    analysisServer = new McpTestServer();
    await analysisServer.start('./exercises/11-service-communication/analysis-server.js', 'stdio');
    
    // 創建客戶端連接
    analysisClient = new McpTestClient();
    await analysisClient.connect('./exercises/11-service-communication/analysis-server.js');
    
    cmsClient = new McpTestClient();
    await cmsClient.connect('./exercises/10-content-management/server.js');
  });
  
  afterAll(async () => {
    await analysisClient.disconnect();
    await cmsClient.disconnect();
    await analysisServer.stop();
    await cmsServer.stop();
    
    if (fs.existsSync(testDb)) {
      fs.unlinkSync(testDb);
    }
  });
  
  describe('Analysis Service', () => {
    test('should analyze JavaScript file', async () => {
      const result = await analysisClient.callTool('analyze-file', {
        filename: 'sample.js'
      });
      
      expect(result.content[0].text).toContain('lines');
      expect(result.content[0].text).toContain('functions');
    });
    
    test('should analyze TypeScript file', async () => {
      const result = await analysisClient.callTool('analyze-file', {
        filename: 'sample.ts'
      });
      
      expect(result.content[0].text).toContain('Analysis completed');
    });
    
    test('should read analysis files via resources', async () => {
      const result = await analysisClient.readResource('analysis://file/sample.js');
      expect(result.contents[0].text).toContain('function');
    });
  });
  
  describe('Cross-Service Communication', () => {
    test('should save analysis report to CMS', async () => {
      // 執行代碼分析
      const analysisResult = await analysisClient.callTool('analyze-file', {
        filename: 'sample.js'
      });
      
      // 生成報告
      const reportResult = await analysisClient.callTool('generate-report', {
        analysisData: analysisResult.content[0].text
      });
      
      expect(reportResult.content[0].text).toContain('Report saved to CMS');
      expect(reportResult.content[0].text).toContain('article ID');
    });
    
    test('should read analysis report from CMS', async () => {
      // 等待一下讓跨服務操作完成
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 從CMS讀取文章列表
      const articlesResult = await cmsClient.readResource('content://articles');
      const articles = JSON.parse(articlesResult.contents[0].text);
      
      // 尋找分析報告
      const analysisReport = articles.find(article => 
        article.title.includes('Code Analysis Report')
      );
      
      expect(analysisReport).toBeDefined();
      expect(analysisReport.content).toContain('Analysis Results');
    });
    
    test('should handle cross-service errors gracefully', async () => {
      // 停止CMS服務器模擬服務不可用
      await cmsServer.stop();
      
      // 嘗試分析應該處理CMS不可用的情況
      const result = await analysisClient.callTool('analyze-file', {
        filename: 'sample.js'
      });
      
      // 分析應該成功，但報告保存應該有適當的錯誤處理
      expect(result.content[0].text).toContain('Analysis completed');
      
      // 重啟CMS服務器
      await cmsServer.start('./exercises/10-content-management/server.js', 'stdio');
    });
  });
  
  describe('End-to-End Workflow', () => {
    test('should complete full analysis-to-storage workflow', async () => {
      // 1. 分析文件
      const analysisResult = await analysisClient.callTool('analyze-file', {
        filename: 'sample.ts'
      });
      
      // 2. 生成並保存報告到CMS
      const reportResult = await analysisClient.callTool('generate-report', {
        analysisData: analysisResult.content[0].text
      });
      
      const articleId = extractIdFromResult(reportResult);
      
      // 3. 通過CMS讀取保存的報告
      const savedReport = await cmsClient.readResource(`content://articles/${articleId}`);
      const reportData = JSON.parse(savedReport.contents[0].text);
      
      expect(reportData.title).toContain('Code Analysis Report');
      expect(reportData.content).toContain('sample.ts');
      expect(reportData.author).toBe('Analysis Service');
    });
  });
  
  describe('Concurrent Operations', () => {
    test('should handle multiple analysis requests concurrently', async () => {
      const promises = [
        analysisClient.callTool('analyze-file', { filename: 'sample.js' }),
        analysisClient.callTool('analyze-file', { filename: 'sample.ts' }),
        analysisClient.callTool('analyze-file', { filename: 'sample.py' })
      ];
      
      const results = await Promise.all(promises);
      
      expect(results).toHaveLength(3);
      results.forEach(result => {
        expect(result.content[0].text).toContain('Analysis completed');
      });
    });
  });
});
```

## 專用測試斷言庫
```typescript
// tests/utils/mcp-assertions.ts
export const mcpExpect = {
  toBeValidMcpResponse: (response: any) => {
    expect(response).toHaveProperty('jsonrpc', '2.0');
    expect(response).toHaveProperty('id');
  },
  
  toBeValidResource: (resource: any) => {
    expect(resource).toHaveProperty('uri');
    expect(resource).toHaveProperty('name');
  },
  
  toBeValidTool: (tool: any) => {
    expect(tool).toHaveProperty('name');
    expect(tool).toHaveProperty('description');
    expect(tool).toHaveProperty('inputSchema');
  },
  
  toBeValidPrompt: (prompt: any) => {
    expect(prompt).toHaveProperty('name');
    expect(prompt).toHaveProperty('description');
  },
  
  toHaveExecutionTime: (operation: () => Promise<any>, maxTime: number) => {
    return async () => {
      const start = Date.now();
      await operation();
      const duration = Date.now() - start;
      expect(duration).toBeLessThan(maxTime);
    };
  }
};
```

## 性能測試框架
```typescript
// tests/performance/performance.test.ts
describe('Performance Tests', () => {
  test('should handle concurrent tool calls', async () => {
    const promises = Array(10).fill(0).map(() => 
      testClient.callTool('echo', { text: 'performance test' })
    );
    
    const start = Date.now();
    const results = await Promise.all(promises);
    const duration = Date.now() - start;
    
    expect(results).toHaveLength(10);
    expect(duration).toBeLessThan(5000); // 5秒內完成
  });
  
  test('should handle resource reading load', async () => {
    const promises = Array(50).fill(0).map(() => 
      testClient.readResource('config://app')
    );
    
    await expect(Promise.all(promises)).resolves.toHaveLength(50);
  });
});
```

## 測試配置文件
```json
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: [
    '**/tests/**/*.test.ts'
  ],
  setupFilesAfterEnv: [
    '<rootDir>/tests/setup.ts'
  ],
  testTimeout: 30000,
  collectCoverageFrom: [
    'exercises/**/solution/**/*.ts',
    '!exercises/**/solution/**/index.ts'
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 90,
      lines: 90,
      statements: 90
    }
  }
};
```

## 測試執行腳本
```json
// package.json scripts
{
  "scripts": {
    "test:01": "jest tests/01-hello-world",
    "test:02": "jest tests/02-static-resources",
    "test:03": "jest tests/03-basic-tools",
    "test:04": "jest tests/04-dynamic-resources",
    "test:05": "jest tests/05-complex-tools",
    "test:06": "jest tests/06-prompt-templates",
    "test:07": "jest tests/07-feature-integration",
    "test:08": "jest tests/08-http-transport",
    "test:09": "jest tests/09-dynamic-features",
    "test:10": "jest tests/10-content-management",
    "test:11": "jest tests/11-service-communication",
    "test:cumulative:05": "jest tests/0[1-5]-*",
    "test:cumulative:10": "jest tests/0[1-9]-* tests/10-*",
    "test:cumulative:11": "jest tests/0[1-9]-* tests/1[01]-*",
    "test:all": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:performance": "jest tests/performance",
    "test:integration": "jest tests/integration",
    "test:database": "jest tests/10-content-management/database.test.ts",
    "test:cross-service": "jest tests/11-service-communication/service-integration.test.ts"
  }
}
```

## 特殊測試需求

### 練習10 資料庫測試特殊要求

#### 測試環境隔離
```typescript
// 每個測試使用獨立的測試資料庫
beforeEach(async () => {
  testDb = `./test-${Date.now()}-${Math.random()}.db`;
  process.env.TEST_DB_PATH = testDb;
});

afterEach(async () => {
  if (fs.existsSync(testDb)) {
    fs.unlinkSync(testDb);
  }
});
```

#### 資料庫操作測試
- 驗證SQLite資料庫正確初始化
- 測試資料庫結構（表格、索引、約束）
- 驗證MCP資源與資料庫查詢的正確映射
- 測試MCP工具與資料庫CRUD操作的整合
- 驗證數據持久化（服務器重啟後數據保持）
- 測試資料庫錯誤處理（如外鍵約束、重複鍵等）

### 練習11 服務間通信測試特殊要求

#### 多服務器測試環境
```typescript
// 同時管理多個MCP服務器
describe('Multi-Server Setup', () => {
  let servers: { [key: string]: McpTestServer } = {};
  let clients: { [key: string]: McpTestClient } = {};
  
  beforeAll(async () => {
    // 啟動CMS服務器
    servers.cms = new McpTestServer();
    await servers.cms.start('./exercises/10-content-management/server.js', 'stdio');
    
    // 啟動分析服務器
    servers.analysis = new McpTestServer();
    await servers.analysis.start('./exercises/11-service-communication/analysis-server.js', 'stdio');
    
    // 建立客戶端連接
    clients.cms = new McpTestClient();
    await clients.cms.connect('./exercises/10-content-management/server.js');
    
    clients.analysis = new McpTestClient();
    await clients.analysis.connect('./exercises/11-service-communication/analysis-server.js');
  });
});
```

#### 跨服務測試重點
- 驗證服務間MCP客戶端連接
- 測試跨服務工具調用（分析服務調用CMS工具）
- 驗證數據在服務間的正確傳遞
- 測試服務間錯誤處理（如服務不可用）
- 驗證並發跨服務操作的穩定性
- 測試服務重啟對跨服務通信的影響

#### 端到端工作流測試
- 完整的分析→報告→存儲工作流
- 驗證通過CMS資源可以讀取分析服務生成的報告
- 測試多個分析任務並發執行
- 驗證分析結果的格式化和存儲正確性

## 測試數據管理

### 測試用代碼文件
```javascript
// tests/test-files/sample.js
function calculateSum(a, b) {
  return a + b;
}

function processArray(arr) {
  return arr.map(x => x * 2);
}

module.exports = { calculateSum, processArray };
```

```typescript
// tests/test-files/sample.ts  
interface User {
  id: number;
  name: string;
}

class UserService {
  private users: User[] = [];
  
  addUser(user: User): void {
    this.users.push(user);
  }
  
  getUser(id: number): User | undefined {
    return this.users.find(u => u.id === id);
  }
}

export { User, UserService };
```

## 測試覆蓋率要求

### 基本練習 (1-9)
- 單元測試覆蓋率 > 90%
- 整合測試覆蓋所有MCP功能
- 錯誤處理測試覆蓋主要錯誤情況

### 資料庫整合練習 (10)
- MCP與資料庫整合覆蓋率 > 95%
- 資料庫操作測試覆蓋所有CRUD操作
- 數據持久化測試覆蓋服務器重啟場景

### 服務間通信練習 (11)
- 跨服務通信覆蓋率 > 85%
- 服務間錯誤處理測試覆蓋服務不可用場景
- 端到端工作流測試覆蓋完整業務流程

這個完整的測試框架為MCP課程提供了從基礎到高級的測試支援，確保學習者的實作符合要求並具備生產級品質。