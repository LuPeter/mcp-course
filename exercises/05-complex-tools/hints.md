# 練習 5: 複雜工具與錯誤處理 - 提示和指導

## 開發提示

### 🎯 開始之前
1. **理解異步概念**: 掌握 async/await 和 Promise 的使用
2. **錯誤處理思維**: 預想可能的錯誤場景並提前處理
3. **安全性優先**: 始終考慮輸入驗證和安全性檢查

### 🔧 實作提示

#### 服務器初始化
```typescript
const server = new McpServer({
  name: 'complex-tools-server', // 替換 FILL_IN_SERVER_NAME
  version: '1.0.0' // 替換 FILL_IN_VERSION
});
```

#### 模組導入和基本設置
```typescript
import fs from 'fs/promises';
import path from 'path';

// 模擬 HTTP 響應數據
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

// 數據目錄設置
const dataDir = path.join(__dirname, 'data');
```

#### 數據目錄初始化
```typescript
async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}
```

### 🛠️ 工具實作指導

#### 1. 文件讀取工具實作
```typescript
server.registerTool(
  'file-read',
  {
    title: 'File Read Tool',
    description: 'Read files from the data directory',
    inputSchema: {
      filename: z.string().describe('Name of the file to read'),
      encoding: z.enum(['utf8', 'base64']).optional().default('utf8').describe('File encoding')
    }
  },
  async ({ filename, encoding = 'utf8' }) => {
    try {
      // 安全性檢查：防止路徑遍歷攻擊
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename: path traversal not allowed');
      }
      
      const filePath = path.join(dataDir, filename);
      
      // 檢查文件是否存在
      try {
        await fs.access(filePath);
      } catch {
        throw new Error(`File not found: ${filename}`);
      }
      
      // 讀取文件和獲取統計信息
      const content = await fs.readFile(filePath, encoding);
      const stats = await fs.stat(filePath);
      
      return {
        content: [{
          type: 'text',
          text: `File: ${filename}
Size: ${stats.size} bytes
Modified: ${stats.mtime.toISOString()}
Encoding: ${encoding}

Content:
${content}`
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`File read error: ${error.message}`);
      }
      throw new Error('File read error: Unknown error occurred');
    }
  }
);
```

#### 2. 文件寫入工具實作
```typescript
server.registerTool(
  'file-write',
  {
    title: 'File Write Tool',
    description: 'Write files to the data directory',
    inputSchema: {
      filename: z.string().describe('Name of the file to write'),
      content: z.string().describe('Content to write to the file'),
      encoding: z.enum(['utf8', 'base64']).optional().default('utf8').describe('File encoding'),
      overwrite: z.boolean().optional().default(false).describe('Whether to overwrite existing files')
    }
  },
  async ({ filename, content, encoding = 'utf8', overwrite = false }) => {
    try {
      // 安全性檢查
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename: path traversal not allowed');
      }
      
      const filePath = path.join(dataDir, filename);
      
      // 檢查文件是否已存在
      if (!overwrite) {
        try {
          await fs.access(filePath);
          throw new Error(`File already exists: ${filename}. Use overwrite=true to replace it.`);
        } catch (error) {
          // 文件不存在，可以繼續寫入
          if (error instanceof Error && !error.message.includes('ENOENT')) {
            throw error;
          }
        }
      }
      
      // 寫入文件
      await fs.writeFile(filePath, content, encoding);
      const stats = await fs.stat(filePath);
      
      return {
        content: [{
          type: 'text',
          text: `File written successfully: ${filename}
Size: ${stats.size} bytes
Modified: ${stats.mtime.toISOString()}
Encoding: ${encoding}`
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`File write error: ${error.message}`);
      }
      throw new Error('File write error: Unknown error occurred');
    }
  }
);
```

#### 3. HTTP 請求模擬工具實作
```typescript
server.registerTool(
  'http-fetch',
  {
    title: 'HTTP Fetch Tool',
    description: 'Simulate HTTP requests to mock endpoints',
    inputSchema: {
      url: z.string().url().describe('URL to fetch'),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional().default('GET').describe('HTTP method'),
      timeout: z.number().optional().default(5000).describe('Request timeout in milliseconds')
    }
  },
  async ({ url, method = 'GET', timeout = 5000 }) => {
    try {
      // 模擬網路延遲
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
      // 檢查超時
      if (timeout <= 0) {
        throw new Error('Request timeout must be positive');
      }
      
      // 查找模擬響應
      const mockResponse = mockHttpResponses[url];
      
      if (!mockResponse) {
        throw new Error(`No mock response configured for URL: ${url}`);
      }
      
      // 檢查錯誤狀態碼
      if (mockResponse.status >= 400) {
        throw new Error(`HTTP ${mockResponse.status}: ${mockResponse.error || 'Unknown error'}`);
      }
      
      return {
        content: [{
          type: 'text',
          text: `HTTP ${method} ${url}
Status: ${mockResponse.status}
Response: ${JSON.stringify(mockResponse.data, null, 2)}`
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`HTTP request error: ${error.message}`);
      }
      throw new Error('HTTP request error: Unknown error occurred');
    }
  }
);
```

#### 4. 數據處理工具實作
```typescript
server.registerTool(
  'data-process',
  {
    title: 'Data Processing Tool',
    description: 'Process JSON data with various transformations',
    inputSchema: {
      data: z.string().describe('JSON data to process'),
      operation: z.enum(['parse', 'stringify', 'filter', 'map', 'reduce']).describe('Processing operation'),
      parameters: z.record(z.any()).optional().describe('Operation parameters')
    }
  },
  async ({ data, operation, parameters = {} }) => {
    try {
      let result: any;
      
      switch (operation) {
        case 'parse':
          try {
            result = JSON.parse(data);
          } catch {
            throw new Error('Invalid JSON data');
          }
          break;
          
        case 'stringify':
          try {
            const parsed = JSON.parse(data);
            result = JSON.stringify(parsed, null, parameters.indent || 2);
          } catch {
            throw new Error('Invalid JSON data for stringify operation');
          }
          break;
          
        case 'filter':
          try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
              throw new Error('Filter operation requires an array');
            }
            const filterKey = parameters.key;
            const filterValue = parameters.value;
            if (!filterKey) {
              throw new Error('Filter operation requires a key parameter');
            }
            result = parsed.filter(item => item[filterKey] === filterValue);
          } catch (error) {
            if (error instanceof Error) {
              throw error;
            }
            throw new Error('Invalid data for filter operation');
          }
          break;
          
        case 'map':
          try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
              throw new Error('Map operation requires an array');
            }
            const mapKey = parameters.key;
            if (!mapKey) {
              throw new Error('Map operation requires a key parameter');
            }
            result = parsed.map(item => item[mapKey]);
          } catch (error) {
            if (error instanceof Error) {
              throw error;
            }
            throw new Error('Invalid data for map operation');
          }
          break;
          
        case 'reduce':
          try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
              throw new Error('Reduce operation requires an array');
            }
            const reduceKey = parameters.key;
            const reduceOp = parameters.operation || 'sum';
            if (!reduceKey) {
              throw new Error('Reduce operation requires a key parameter');
            }
            
            if (reduceOp === 'sum') {
              result = parsed.reduce((acc, item) => acc + (Number(item[reduceKey]) || 0), 0);
            } else if (reduceOp === 'count') {
              result = parsed.length;
            } else {
              throw new Error(`Unknown reduce operation: ${reduceOp}`);
            }
          } catch (error) {
            if (error instanceof Error) {
              throw error;
            }
            throw new Error('Invalid data for reduce operation');
          }
          break;
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      return {
        content: [{
          type: 'text',
          text: `Data processing result (${operation}):
${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Data processing error: ${error.message}`);
      }
      throw new Error('Data processing error: Unknown error occurred');
    }
  }
);
```

### 🐛 常見問題和解決方案

#### 問題1: 文件權限錯誤
**症狀**: EACCES 或 EPERM 錯誤
**解決方案**: 
```typescript
try {
  await fs.access(filePath, fs.constants.R_OK | fs.constants.W_OK);
} catch {
  throw new Error('Insufficient file permissions');
}
```

#### 問題2: 異步操作超時
**症狀**: 長時間無響應
**解決方案**:
```typescript
const timeoutPromise = new Promise((_, reject) => 
  setTimeout(() => reject(new Error('Operation timeout')), timeout)
);

const result = await Promise.race([
  actualOperation(),
  timeoutPromise
]);
```

#### 問題3: 記憶體洩漏
**症狀**: 記憶體使用量持續增長
**解決方案**: 及時清理資源，使用適當的錯誤處理

### 💡 最佳實踐

#### 錯誤處理策略
```typescript
try {
  // 主要邏輯
} catch (error) {
  if (error instanceof Error) {
    // 記錄具體錯誤
    console.error(`Operation failed: ${error.message}`);
    throw new Error(`Specific error: ${error.message}`);
  }
  // 處理未知錯誤
  throw new Error('Unknown error occurred');
}
```

#### 輸入驗證模式
```typescript
function validateAndSanitize(input: string): string {
  // 基本驗證
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input');
  }
  
  // 安全性檢查
  if (input.includes('..') || /[<>:"\\|?*]/.test(input)) {
    throw new Error('Invalid characters in input');
  }
  
  return input.trim();
}
```

#### 資源管理
```typescript
async function safeOperation() {
  let resource: any = null;
  try {
    resource = await acquireResource();
    return await useResource(resource);
  } finally {
    if (resource) {
      await releaseResource(resource);
    }
  }
}
```

### 🔍 除錯指導

#### 檢查文件操作
```typescript
// 添加詳細日誌
console.error(`Attempting to read file: ${filePath}`);
console.error(`File exists: ${await fs.access(filePath).then(() => true).catch(() => false)}`);
```

#### 驗證數據處理
```typescript
// 檢查輸入數據
console.error(`Input data type: ${typeof data}`);
console.error(`Input data length: ${data.length}`);
```

#### 測試HTTP模擬
```typescript
// 列出可用的模擬端點
console.error('Available mock endpoints:', Object.keys(mockHttpResponses));
```

### 📝 測試策略

#### 單元測試模式
1. 測試正常情況
2. 測試邊界條件
3. 測試錯誤情況
4. 測試安全性檢查

#### 整合測試
```bash
# 準備測試文件
echo "Test content" > exercises/05-complex-tools/data/test.txt

# 運行測試
npm run build
npm run test:05
```

### 🚀 性能優化

#### 文件操作優化
- 使用流式處理大文件
- 實作文件快取機制
- 批量處理多個文件

#### 併發控制
```typescript
const concurrencyLimit = 5;
const semaphore = new Array(concurrencyLimit).fill(null);

async function limitedOperation(operation: () => Promise<any>) {
  await Promise.race(semaphore.map(async (_, index) => {
    await operation();
    semaphore[index] = null;
  }));
}
```

## 進階提示

### 生產環境考量
- 實作適當的日誌記錄
- 添加性能監控
- 考慮負載均衡和擴展性

### 安全性強化
- 實作速率限制
- 添加輸入清理
- 考慮資源使用限制

### 可維護性
- 使用適當的抽象層
- 實作配置管理
- 添加完整的文檔

## 下一步
完成本練習後，你將掌握複雜異步操作和錯誤處理，可以進入練習 6：提示模板系統的學習。