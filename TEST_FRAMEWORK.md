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

### 練習 4-10: 類似的測試模式，逐漸增加複雜度

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
    "test:cumulative:05": "jest tests/0[1-5]-*",
    "test:all": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:performance": "jest tests/performance",
    "test:integration": "jest tests/integration"
  }
}
```

這個測試框架設計如何？需要我繼續設計文件結構和提示文檔模板嗎？