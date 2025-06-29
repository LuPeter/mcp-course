#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

/**
 * 練習 5: Complex Tools and Error Handling MCP Server
 * 
 * 本練習展示如何實作複雜的異步工具和完整的錯誤處理機制
 * 
 * 新增功能：
 * - 異步文件操作工具
 * - HTTP 請求模擬工具
 * - 數據處理工具
 * - 完整的錯誤分類和處理
 */

const server = new McpServer({
  name: 'complex-tools-server',
  version: '1.0.0'
});

// 模擬的HTTP響應數據
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

// 確保 data 目錄存在
const dataDir = path.join(__dirname, 'data');

async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 註冊 echo 工具 (來自練習1)
server.registerTool(
  'echo',
  {
    title: 'Echo Tool',
    description: 'Echo back the input message',
    inputSchema: {
      message: z.string().describe('The message to echo back')
    }
  },
  async ({ message }) => ({
    content: [{ type: 'text', text: `Echo: ${message}` }]
  })
);

// 註冊靜態資源 (來自練習2)
server.registerResource(
  'server-config',
  'config://server',
  {
    title: 'Server Configuration',
    description: 'Current server configuration',
    mimeType: 'application/json'
  },
  async () => ({
    contents: [{
      uri: 'config://server',
      text: JSON.stringify({
        name: 'complex-tools-server',
        version: '1.0.0',
        features: ['tools', 'resources', 'error-handling'],
        maxConcurrency: 10,
        timeout: 30000
      }, null, 2),
      mimeType: 'application/json'
    }]
  })
);

server.registerResource(
  'help-info',
  'help://info',
  {
    title: 'Help Information',
    description: 'Available commands and usage information',
    mimeType: 'text/markdown'
  },
  async () => ({
    contents: [{
      uri: 'help://info',
      text: `# Complex Tools Server Help

## Available Tools
- \`echo\`: Echo back messages
- \`calculate\`: Perform mathematical operations
- \`text-transform\`: Transform text (case, reverse, etc.)
- \`timestamp\`: Generate and format timestamps
- \`file-read\`: Read files from data directory
- \`file-write\`: Write files to data directory
- \`http-fetch\`: Simulate HTTP requests
- \`data-process\`: Process JSON data with transformations

## Error Handling
This server implements comprehensive error handling for:
- File system operations
- Network requests
- Data validation
- Processing errors
`,
      mimeType: 'text/markdown'
    }]
  })
);

// 註冊基本工具 (來自練習3)
server.registerTool(
  'calculate',
  {
    title: 'Calculator Tool',
    description: 'Perform basic mathematical operations',
    inputSchema: {
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('The mathematical operation to perform'),
      a: z.number().describe('First number'),
      b: z.number().describe('Second number')
    }
  },
  async ({ operation, a, b }) => {
    try {
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
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      return {
        content: [{ 
          type: 'text', 
          text: `${a} ${operation} ${b} = ${result}` 
        }]
      };
    } catch (error) {
      throw new Error(`Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

server.registerTool(
  'text-transform',
  {
    title: 'Text Transform Tool',
    description: 'Transform text in various ways',
    inputSchema: {
      text: z.string().describe('The text to transform'),
      operation: z.enum(['uppercase', 'lowercase', 'reverse', 'length']).describe('The transformation to apply')
    }
  },
  async ({ text, operation }) => {
    try {
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
        case 'length':
          result = `Length: ${text.length}`;
          break;
        default:
          throw new Error(`Unknown transformation: ${operation}`);
      }
      
      return {
        content: [{ 
          type: 'text', 
          text: `${operation}("${text}") = ${result}` 
        }]
      };
    } catch (error) {
      throw new Error(`Text transformation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

server.registerTool(
  'timestamp',
  {
    title: 'Timestamp Tool',
    description: 'Generate and format timestamps',
    inputSchema: {
      format: z.enum(['iso', 'unix', 'readable']).describe('The timestamp format'),
      timezone: z.string().optional().describe('Timezone (default: UTC)')
    }
  },
  async ({ format, timezone = 'UTC' }) => {
    try {
      const now = new Date();
      let result: string;
      
      switch (format) {
        case 'iso':
          result = now.toISOString();
          break;
        case 'unix':
          result = Math.floor(now.getTime() / 1000).toString();
          break;
        case 'readable':
          result = now.toLocaleString('en-US', { 
            timeZone: timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          break;
        default:
          throw new Error(`Unknown format: ${format}`);
      }
      
      return {
        content: [{ 
          type: 'text', 
          text: `Current timestamp (${format}): ${result}` 
        }]
      };
    } catch (error) {
      throw new Error(`Timestamp generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// 新增：複雜工具 - 文件讀取（異步）
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

// 新增：複雜工具 - 文件寫入（異步）
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
      // 安全性檢查：防止路徑遍歷攻擊
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

// 新增：複雜工具 - HTTP 請求模擬（異步）
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
      
      const mockResponse = mockHttpResponses[url];
      
      if (!mockResponse) {
        throw new Error(`No mock response configured for URL: ${url}`);
      }
      
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

// 新增：複雜工具 - 數據處理（可能失敗）
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

async function main() {
  try {
    // 確保數據目錄存在
    await ensureDataDir();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('Complex Tools MCP Server started successfully');
    console.error('Available tools: echo, calculate, text-transform, timestamp, file-read, file-write, http-fetch, data-process');
    console.error('Available resources: server-config, help-info');
    console.error(`Data directory: ${dataDir}`);
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