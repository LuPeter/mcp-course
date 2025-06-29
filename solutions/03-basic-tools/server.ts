#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

/**
 * 練習 3: Basic Tools MCP Server
 * 
 * 這個練習展示如何實作多種實用的MCP工具，包括數學計算、
 * 文字處理和時間戳操作。學習重點在於參數驗證和錯誤處理。
 * 
 * 提供的功能：
 * - echo工具 (來自練習1)
 * - calculate工具 (基本數學運算)
 * - text-transform工具 (文字轉換)
 * - timestamp工具 (時間戳生成和格式化)
 * - 靜態資源 (來自練習2)
 */

// 創建MCP服務器
const server = new McpServer({
  name: 'basic-tools-server',
  version: '1.0.0'
});

// 練習1的echo工具
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

// 計算工具 - 支援基本數學運算
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

// 文字轉換工具
server.registerTool(
  'text-transform',
  {
    title: 'Text Transform Tool',
    description: 'Transform text using various operations (uppercase, lowercase, reverse, capitalize)',
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

// 時間戳工具
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
  async ({ action, timestamp, format = 'iso' }: { action: string; timestamp?: number; format?: string }) => {
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
        const date = new Date(timestamp * 1000); // 假設輸入是Unix時間戳
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
          case 'date-only':
            result = `Date: ${date.toDateString()}`;
            break;
          case 'time-only':
            result = `Time: ${date.toTimeString()}`;
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
        result = `Parsed timestamp: ${parsedDate.toISOString()} (Unix: ${Math.floor(parsedDate.getTime() / 1000)})`;
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

// 練習2的靜態資源
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
- **Purpose**: Echo back any message
- **Usage**: \`echo(message: string)\`
- **Example**: \`echo("Hello World")\`

### 2. Calculator Tool
- **Purpose**: Perform basic mathematical operations
- **Usage**: \`calculate(operation: "add"|"subtract"|"multiply"|"divide", a: number, b: number)\`
- **Examples**:
  - \`calculate("add", 5, 3)\` → 8
  - \`calculate("multiply", 4, 7)\` → 28
  - \`calculate("divide", 10, 2)\` → 5

### 3. Text Transform Tool
- **Purpose**: Transform text using various operations
- **Usage**: \`text-transform(text: string, operation: "uppercase"|"lowercase"|"reverse"|"capitalize"|"word-count")\`
- **Examples**:
  - \`text-transform("hello world", "uppercase")\` → "HELLO WORLD"
  - \`text-transform("hello world", "capitalize")\` → "Hello World"
  - \`text-transform("hello world", "word-count")\` → "Word count: 2"

### 4. Timestamp Tool
- **Purpose**: Generate and format timestamps
- **Usage**: \`timestamp(action: "current"|"format"|"parse", timestamp?: number, format?: "iso"|"unix"|"human"|"date-only"|"time-only")\`
- **Examples**:
  - \`timestamp("current", undefined, "iso")\` → Current ISO timestamp
  - \`timestamp("format", 1640995200, "human")\` → Formatted human-readable time

## Error Handling

All tools include comprehensive error handling:
- Invalid parameters will return descriptive error messages
- Division by zero is prevented in calculator
- Invalid timestamps are detected and reported
- Unsupported operations are clearly identified

## Resources

- **config://app**: Application configuration and supported operations
- **help://guide**: This user guide
- **status://health**: Server health and status information
`,
      mimeType: 'text/markdown'
    }]
  })
);

server.registerResource(
  'status',
  'status://health',
  {
    title: 'System Status',
    description: 'Current system health and status information',
    mimeType: 'text/plain'
  },
  async () => {
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    return {
      contents: [{
        uri: 'status://health',
        text: `System Status: HEALTHY

Server Information:
- Name: Basic Tools MCP Server
- Version: 1.0.0
- Uptime: ${Math.floor(uptime / 60)}m ${Math.floor(uptime % 60)}s

Tools Available: 4
- echo: Ready
- calculate: Ready
- text-transform: Ready  
- timestamp: Ready

Resources Available: 3
- config://app: Ready
- help://guide: Ready
- status://health: Ready

Memory Usage:
- RSS: ${Math.round(memory.rss / 1024 / 1024)} MB
- Heap Used: ${Math.round(memory.heapUsed / 1024 / 1024)} MB
- Heap Total: ${Math.round(memory.heapTotal / 1024 / 1024)} MB

Node.js Version: ${process.version}
Platform: ${process.platform}
`,
        mimeType: 'text/plain'
      }]
    };
  }
);

// 主函數
async function main() {
  try {
    // 創建stdio傳輸
    const transport = new StdioServerTransport();
    
    // 連接服務器到傳輸
    await server.connect(transport);
    
    // 服務器現在正在運行並監聽stdin/stdout
    console.error('Basic Tools MCP Server started successfully');
    console.error('Available tools: echo, calculate, text-transform, timestamp');
    console.error('Available resources: config://app, help://guide, status://health');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 如果直接運行此文件則啟動服務器
if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}