#!/usr/bin/env node

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import { randomUUID } from 'crypto';

/**
 * 練習 8: HTTP 傳輸服務器
 *
 * 目標：實作支援 HTTP 傳輸的 MCP 服務器，包括會話管理
 *
 * 要實作的功能：
 * 1. 整合所有前7個練習的功能
 * 2. 新增 Express.js HTTP 服務器支援
 * 3. 實作 StreamableHTTPServerTransport
 * 4. 會話生命週期管理
 * 5. 同時支援 stdio 和 HTTP transport
 * 6. HTTP Client 示例
 */

// TODO: 創建MCP服務器實例
// 提示：使用 McpServer 類別，需要 name 和 version
const server = new McpServer({
  name: 'FILL_IN_SERVER_NAME', // TODO: 將此替換為 'http-transport-server'
  version: 'FILL_IN_VERSION' // TODO: 將此替換為 '1.0.0'
});

// TODO: 定義會話管理接口
// 提示：會話需要追蹤 ID、開始時間、最後活動時間和客戶端信息
interface Session {
  id: string;
  startTime: Date;
  lastActivity: Date;
  clientInfo?: {
    name: string;
    version: string;
  };
}

// TODO: 創建會話存儲
// 提示：使用 Map 來存儲會話，key 是 sessionId，value 是 Session
const sessions: Map<string, Session> = new Map();

// TODO: 模擬的HTTP響應數據 (來自練習5)
// 提示：提供一些示例 API 端點的模擬響應
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

// TODO: 定義內容管理系統存儲 (來自練習7)
// 提示：內容項目包含各種類型的文章和博客
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

// TODO: 創建內容存儲
// 提示：使用 Map 來存儲內容項目
const contentStore: Map<string, ContentItem> = new Map();

// TODO: 初始化示例內容
// 提示：創建一些示例文章和博客項目
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

// TODO: 確保 data 目錄存在
// 提示：創建目錄如果不存在
const dataDir = path.join(__dirname, 'data');

async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// TODO: 生成唯一 ID 函數
// 提示：結合類型、時間戳和隨機字符串
function generateId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}`;
}

// TODO: 會話管理函數
// 提示：實作創建會話、更新活動、清理無效會話
function createSession(clientInfo?: { name: string; version: string }): string {
  // TODO: 實作會話創建邏輯
  // 1. 生成唯一會話 ID (使用 randomUUID())
  // 2. 創建 Session 對象
  // 3. 存儲到 sessions Map
  // 4. 記錄日誌
  // 5. 返回會話 ID
  throw new Error('TODO: 實作會話創建函數');
}

function updateSessionActivity(sessionId: string): void {
  // TODO: 實作活動更新邏輯
  // 提示：找到會話並更新 lastActivity 時間
  throw new Error('TODO: 實作會話活動更新函數');
}

function cleanupInactiveSessions(): void {
  // TODO: 實作會話清理邏輯
  // 提示：刪除超過 30 分鐘未活動的會話
  throw new Error('TODO: 實作會話清理函數');
}

// TODO: 定期清理無效會話
// 提示：使用 setInterval，每5分鐘清理一次
// setInterval(cleanupInactiveSessions, 5 * 60 * 1000);

// ===== 工具註冊 (整合所有前面練習) =====

// TODO: 練習 1: Echo 工具
// 提示：註冊 echo 工具，接收 message 參數，返回 "Echo: {message}"
server.registerTool(
  'echo',
  {
    title: 'Echo Tool',
    description: 'Echo back the input message',
    inputSchema: {
      message: z.string().describe('Message to echo back')
    }
  },
  async ({ message }) => {
    // TODO: 實作 echo 功能
    throw new Error('TODO: 實作 echo 工具');
  }
);

// TODO: 練習 3: 計算工具
// 提示：實作安全的數學表達式計算
server.registerTool(
  'calculate',
  {
    title: 'Calculate Tool',
    description: 'Perform basic arithmetic calculations',
    inputSchema: {
      expression: z.string().describe('Mathematical expression to evaluate')
    }
  },
  async ({ expression }) => {
    // TODO: 實作計算功能
    // 提示：使用 Function() 但要過濾危險字符
    throw new Error('TODO: 實作計算工具');
  }
);

// TODO: 練習 3: 文本轉換工具
// 提示：實作 uppercase, lowercase, reverse, length 操作
server.registerTool(
  'text-transform',
  {
    title: 'Text Transform Tool',
    description: 'Transform text using various operations',
    inputSchema: {
      text: z.string().describe('Text to transform'),
      operation: z.enum(['uppercase', 'lowercase', 'reverse', 'length']).describe('Transform operation')
    }
  },
  async ({ text, operation }) => {
    // TODO: 實作文本轉換功能
    throw new Error('TODO: 實作文本轉換工具');
  }
);

// TODO: 練習 3: 時間戳工具
// 提示：生成 ISO、Unix、可讀格式的時間戳
server.registerTool(
  'timestamp',
  {
    title: 'Timestamp Tool',
    description: 'Generate current timestamp in various formats',
    inputSchema: {
      format: z.enum(['iso', 'unix', 'readable']).describe('Timestamp format')
    }
  },
  async ({ format }) => {
    // TODO: 實作時間戳生成功能
    throw new Error('TODO: 實作時間戳工具');
  }
);

// TODO: 練習 5: 文件讀取工具
// 提示：安全地讀取 data 目錄中的文件
server.registerTool(
  'file-read',
  {
    title: 'File Read Tool',
    description: 'Read contents of a local file',
    inputSchema: {
      filename: z.string().describe('Name of the file to read (relative to data directory)')
    }
  },
  async ({ filename }) => {
    // TODO: 實作文件讀取功能
    // 提示：
    // 1. 確保 data 目錄存在
    // 2. 檢查路徑安全性（防止路徑遍歷）
    // 3. 讀取文件內容
    // 4. 處理文件不存在的情況
    throw new Error('TODO: 實作文件讀取工具');
  }
);

// TODO: 練習 5: 文件寫入工具
// 提示：安全地寫入文件到 data 目錄
server.registerTool(
  'file-write',
  {
    title: 'File Write Tool',
    description: 'Write content to a local file',
    inputSchema: {
      filename: z.string().describe('Name of the file to write'),
      content: z.string().describe('Content to write to the file')
    }
  },
  async ({ filename, content }) => {
    // TODO: 實作文件寫入功能
    throw new Error('TODO: 實作文件寫入工具');
  }
);

// TODO: 練習 5: HTTP 獲取工具
// 提示：使用模擬響應數據
server.registerTool(
  'http-fetch',
  {
    title: 'HTTP Fetch Tool',
    description: 'Perform HTTP requests (simulated)',
    inputSchema: {
      url: z.string().describe('URL to fetch'),
      method: z.enum(['GET', 'POST']).optional().default('GET').describe('HTTP method')
    }
  },
  async ({ url, method = 'GET' }) => {
    // TODO: 實作 HTTP 模擬請求功能
    throw new Error('TODO: 實作 HTTP 獲取工具');
  }
);

// TODO: 練習 5: 數據處理工具
// 提示：處理 JSON 數據，支援 count, sum, average, validate 操作
server.registerTool(
  'data-process',
  {
    title: 'Data Processing Tool',
    description: 'Process and analyze data',
    inputSchema: {
      data: z.string().describe('JSON data to process'),
      operation: z.enum(['count', 'sum', 'average', 'validate']).describe('Processing operation')
    }
  },
  async ({ data, operation }) => {
    // TODO: 實作數據處理功能
    throw new Error('TODO: 實作數據處理工具');
  }
);

// TODO: 練習 7: 內容管理工具
// 提示：實作 content-create, content-update, content-delete
server.registerTool(
  'content-create',
  {
    title: 'Content Creation Tool',
    description: 'Create new content items',
    inputSchema: {
      type: z.enum(['article', 'blog', 'documentation', 'note']).describe('Content type'),
      title: z.string().describe('Title'),
      content: z.string().describe('Content body'),
      author: z.string().describe('Author name'),
      tags: z.array(z.string()).optional().default([]).describe('Tags'),
      status: z.enum(['draft', 'published', 'archived']).optional().default('draft').describe('Status')
    }
  },
  async ({ type, title, content, author, tags = [], status = 'draft' }) => {
    // TODO: 實作內容創建功能
    throw new Error('TODO: 實作內容創建工具');
  }
);

// TODO: 會話管理工具
// 提示：提供會話信息查詢和管理功能
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
    // TODO: 實作會話信息工具
    // 提示：根據 action 返回不同的會話信息
    throw new Error('TODO: 實作會話信息工具');
  }
);

// ===== 資源註冊 (來自練習 2 和 7) =====

// TODO: 練習 2: 服務器配置資源
// 提示：返回服務器配置和狀態信息的 JSON
server.registerResource(
  'server-config',
  'config://server',
  {
    title: 'Server Configuration',
    description: 'Current server configuration and status',
    mimeType: 'application/json'
  },
  async () => {
    // TODO: 實作服務器配置資源
    // 提示：返回包含服務器信息、功能、傳輸方式等的配置對象
    throw new Error('TODO: 實作服務器配置資源');
  }
);

// TODO: 練習 2: 幫助信息資源
// 提示：返回可用工具和使用信息的 Markdown
server.registerResource(
  'help-info',
  'help://info',
  {
    title: 'Help Information',
    description: 'Available tools and usage information',
    mimeType: 'text/markdown'
  },
  async () => {
    // TODO: 實作幫助信息資源
    throw new Error('TODO: 實作幫助信息資源');
  }
);

// TODO: 練習 7: 動態內容資源
// 提示：使用 ResourceTemplate 實作參數化資源
server.registerResource(
  'content',
  new ResourceTemplate('content://{type}/{id}', { list: undefined }),
  {
    title: 'Content Resource',
    description: 'Access content items by type and ID',
    mimeType: 'application/json'
  },
  async (uri: URL) => {
    // TODO: 實作動態內容資源
    // 提示：解析 URI 參數，根據路徑返回不同的內容
    throw new Error('TODO: 實作動態內容資源');
  }
);

// ===== 提示註冊 (來自練習 6) =====

// TODO: 代碼審查提示
// 提示：生成代碼審查模板
server.registerPrompt(
  'code-review',
  {
    title: 'Code Review Template',
    description: 'Generate a structured code review prompt',
    argsSchema: {
      language: z.string(),
      codeContext: z.string(),
      focusAreas: z.string().optional(),
      severity: z.string().optional()
    }
  },
  ({ language, codeContext, focusAreas, severity }) => {
    // TODO: 實作代碼審查提示
    throw new Error('TODO: 實作代碼審查提示');
  }
);

// ===== HTTP 服務器設置 =====

// TODO: 創建 Express 應用程序
// 提示：配置中間件、CORS、健康檢查端點
function createExpressApp(): express.Application {
  const app = express();
  
  // TODO: 配置中間件
  // 提示：JSON 解析、URL 編碼、CORS 頭部
  
  // TODO: 健康檢查端點
  // 提示：GET /health 返回服務器狀態
  
  // TODO: 錯誤處理中間件
  // 提示：捕獲錯誤並返回適當的 JSON-RPC 響應
  
  throw new Error('TODO: 實作 Express 應用程序');
}

// TODO: 主函數
async function main() {
  try {
    // TODO: 確保 data 目錄存在
    await ensureDataDir();
    
    // TODO: 檢查命令行參數決定傳輸方式
    const useHttp = process.argv.includes('--http');
    const port = parseInt(process.env.PORT || '3000');
    
    if (useHttp) {
      // TODO: HTTP 傳輸模式
      // 提示：
      // 1. 創建 Express 應用程序
      // 2. 設置 StreamableHTTPServerTransport
      // 3. 實作 MCP 端點處理 (/mcp)
      // 4. 啟動 HTTP 服務器
      throw new Error('TODO: 實作 HTTP 傳輸模式');
    } else {
      // TODO: stdio 傳輸模式 (預設)
      // 提示：創建 StdioServerTransport 並連接服務器
      throw new Error('TODO: 實作 stdio 傳輸模式');
    }
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// TODO: 啟動服務器
// 提示：檢查是否為主模組，然後調用 main()
if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}

export { server, main };