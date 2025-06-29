# 練習 03 提示

## 🔍 逐步實作指南

### 1. 導入和服務器設置
```typescript
import { z } from 'zod';

const server = new McpServer({
  name: 'basic-tools-server',
  version: '1.0.0'
});
```

### 2. Echo工具實作 (來自練習1)
```typescript
server.registerTool(
  'echo',
  {
    title: 'Echo Tool',
    description: 'Echo back the input message',
    inputSchema: { message: z.string() }
  },
  async ({ message }: { message: string }) => {
    if (!message) {
      throw new Error('Message parameter is required');
    }
    return {
      content: [{
        type: 'text' as const,
        text: `Echo: ${message}`
      }]
    };
  }
);
```

### 3. Calculate工具實作
```typescript
server.registerTool(
  'calculate',
  {
    title: 'Calculator Tool',
    description: 'Perform basic mathematical operations (add, subtract, multiply, divide)',
    inputSchema: {
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
      a: z.number(),
      b: z.number()
    }
  },
  async ({ operation, a, b }: { operation: string; a: number; b: number }) => {
    let result: number;
    
    switch (operation) {
      case 'add':
        result = a + b;
        break;
      case 'subtract':
        result = a - b;
        break;
      case 'multiply':
        result = a * b;
        break;
      case 'divide':
        if (b === 0) {
          throw new Error('Division by zero is not allowed');
        }
        result = a / b;
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    return {
      content: [{
        type: 'text' as const,
        text: `${a} ${operation} ${b} = ${result}`
      }]
    };
  }
);
```

### 4. Text-Transform工具實作
```typescript
server.registerTool(
  'text-transform',
  {
    title: 'Text Transform Tool',
    description: 'Transform text using various operations',
    inputSchema: {
      text: z.string(),
      operation: z.enum(['uppercase', 'lowercase', 'reverse', 'capitalize', 'word-count'])
    }
  },
  async ({ text, operation }: { text: string; operation: string }) => {
    if (!text) {
      throw new Error('Text parameter is required');
    }
    
    let result: string;
    
    switch (operation) {
      case 'uppercase':
        result = text.toUpperCase();
        break;
      case 'lowercase':
        result = text.toLowerCase();
        break;
      case 'reverse':
        result = text.split('').reverse().join('');
        break;
      case 'capitalize':
        result = text.split(' ')
          .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
          .join(' ');
        break;
      case 'word-count':
        const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
        result = `Word count: ${wordCount}`;
        break;
      default:
        throw new Error(`Unsupported operation: ${operation}`);
    }
    
    return {
      content: [{
        type: 'text' as const,
        text: `${operation}: ${result}`
      }]
    };
  }
);
```

### 5. Timestamp工具實作
```typescript
server.registerTool(
  'timestamp',
  {
    title: 'Timestamp Tool',
    description: 'Generate and format timestamps',
    inputSchema: {
      action: z.enum(['current', 'format', 'parse']),
      timestamp: z.number().optional(),
      format: z.enum(['iso', 'unix', 'human', 'date-only', 'time-only']).optional()
    }
  },
  async ({ action, timestamp, format = 'iso' }) => {
    let result: string;
    
    switch (action) {
      case 'current':
        const now = new Date();
        switch (format) {
          case 'unix':
            result = `Current timestamp: ${Math.floor(now.getTime() / 1000)}`;
            break;
          case 'human':
            result = `Current time: ${now.toLocaleString()}`;
            break;
          case 'date-only':
            result = `Current date: ${now.toDateString()}`;
            break;
          case 'time-only':
            result = `Current time: ${now.toTimeString()}`;
            break;
          case 'iso':
          default:
            result = `Current timestamp: ${now.toISOString()}`;
            break;
        }
        break;
        
      case 'format':
        if (timestamp === undefined) {
          throw new Error('Timestamp parameter is required for format action');
        }
        const date = new Date(timestamp * 1000); // Unix時間戳轉換
        if (isNaN(date.getTime())) {
          throw new Error('Invalid timestamp provided');
        }
        
        switch (format) {
          case 'unix':
            result = `Unix timestamp: ${Math.floor(date.getTime() / 1000)}`;
            break;
          case 'human':
            result = `Formatted time: ${date.toLocaleString()}`;
            break;
          case 'iso':
          default:
            result = `ISO timestamp: ${date.toISOString()}`;
            break;
        }
        break;
        
      case 'parse':
        if (timestamp === undefined) {
          throw new Error('Timestamp parameter is required for parse action');
        }
        const parsedDate = new Date(timestamp);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid timestamp provided');
        }
        result = `Parsed timestamp: ${parsedDate.toISOString()}`;
        break;
        
      default:
        throw new Error(`Unsupported action: ${action}`);
    }
    
    return {
      content: [{
        type: 'text' as const,
        text: result
      }]
    };
  }
);
```

### 6. 靜態資源實作 (來自練習2，更新內容)
```typescript
// Config資源
server.registerResource(
  'config',
  'config://app',
  {
    title: 'Application Configuration',
    description: 'Application configuration data',
    mimeType: 'application/json'
  },
  async () => ({
    contents: [{
      uri: 'config://app',
      text: JSON.stringify({
        name: 'Basic Tools Demo',
        version: '1.0.0',
        features: {
          echo: true,
          calculator: true,
          textTransform: true,
          timestamp: true
        },
        supportedOperations: {
          calculate: ['add', 'subtract', 'multiply', 'divide'],
          textTransform: ['uppercase', 'lowercase', 'reverse', 'capitalize', 'word-count'],
          timestamp: ['current', 'format', 'parse']
        }
      }, null, 2),
      mimeType: 'application/json'
    }]
  })
);

// Help資源
server.registerResource(
  'help',
  'help://guide',
  {
    title: 'User Guide',
    description: 'Application user guide and documentation',
    mimeType: 'text/markdown'
  },
  async () => ({
    contents: [{
      uri: 'help://guide',
      text: `# Basic Tools MCP Server User Guide

## Available Tools

### 1. Echo Tool
- **Usage**: echo(message: string)
- **Example**: echo("Hello World")

### 2. Calculator Tool  
- **Usage**: calculate(operation, a, b)
- **Operations**: add, subtract, multiply, divide
- **Examples**: 
  - calculate("add", 5, 3) → 8
  - calculate("divide", 10, 2) → 5

### 3. Text Transform Tool
- **Usage**: text-transform(text, operation)
- **Operations**: uppercase, lowercase, reverse, capitalize, word-count
- **Examples**:
  - text-transform("hello", "uppercase") → "HELLO"
  - text-transform("hello world", "word-count") → "Word count: 2"

### 4. Timestamp Tool
- **Usage**: timestamp(action, timestamp?, format?)
- **Actions**: current, format, parse
- **Formats**: iso, unix, human, date-only, time-only
`,
      mimeType: 'text/markdown'
    }]
  })
);

// Status資源
server.registerResource(
  'status',
  'status://health',
  {
    title: 'System Status',
    description: 'Current system health and status information',
    mimeType: 'text/plain'
  },
  async () => ({
    contents: [{
      uri: 'status://health',
      text: `System Status: HEALTHY

Tools Available: 4
- echo: Ready
- calculate: Ready  
- text-transform: Ready
- timestamp: Ready

Resources Available: 3
- config://app: Ready
- help://guide: Ready
- status://health: Ready

Memory Usage: ${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)} MB
Uptime: ${Math.floor(process.uptime() / 60)}m ${Math.floor(process.uptime() % 60)}s
`,
      mimeType: 'text/plain'
    }]
  })
);
```

### 7. 主函數實作
```typescript
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Basic Tools MCP Server started successfully');
    console.error('Available tools: echo, calculate, text-transform, timestamp');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}
```

## 🔧 實用技巧

### 字符串處理技巧
```typescript
// Capitalize每個單詞
const capitalize = (text: string) => {
  return text.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// 計算單詞數量（處理多個空格）
const countWords = (text: string) => {
  return text.trim().split(/\s+/).filter(word => word.length > 0).length;
};
```

### 時間戳處理技巧
```typescript
// Unix時間戳轉換
const unixToDate = (timestamp: number) => new Date(timestamp * 1000);
const dateToUnix = (date: Date) => Math.floor(date.getTime() / 1000);

// 檢查時間有效性
const isValidDate = (date: Date) => !isNaN(date.getTime());
```

### 錯誤處理最佳實踐
```typescript
// 具體的錯誤消息
if (b === 0 && operation === 'divide') {
  throw new Error('Division by zero is not allowed');
}

// 參數驗證
if (!text || typeof text !== 'string') {
  throw new Error('Text parameter is required and must be a string');
}

// 操作驗證
if (!['add', 'subtract', 'multiply', 'divide'].includes(operation)) {
  throw new Error(`Unsupported operation: ${operation}`);
}
```

## 🚨 常見錯誤

1. **忘記導入zod**: 確保 `import { z } from 'zod'`
2. **類型轉換錯誤**: 注意Unix時間戳和毫秒時間戳的轉換
3. **除零檢查遺漏**: 除法運算前必須檢查除數是否為零
4. **文字處理邊界情況**: 處理空字符串、多個空格等
5. **錯誤消息不夠具體**: 提供清晰的錯誤描述幫助調試

## 🧪 測試建議

1. **分工具測試**: 先實作一個工具，測試通過後再實作下一個
2. **邊界測試**: 測試除零、空字符串、無效時間戳等邊界情況
3. **參數驗證測試**: 測試無效參數的錯誤處理
4. **功能測試**: 驗證每個操作的正確性
5. **整合測試**: 確保與之前練習的功能相容

## 💡 擴展思考

完成基本實作後，可以思考：
- 如何添加更多數學運算（如幂運算、開方）？
- 如何支援更多文字轉換（如移除標點符號、提取數字）？
- 如何添加時區支援到時間戳工具？
- 如何實作工具的輸入歷史記錄？