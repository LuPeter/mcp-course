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
 * 練習 9: 動態服務器功能
 *
 * 目標：實作 MCP 的高級動態功能，包括動態插件系統、權限控制和自動通知機制
 *
 * 要實作的功能：
 * 1. 保留前8個練習的所有功能
 * 2. 動態插件系統：運行時載入/卸載工具和資源
 * 3. MCP 通知機制：listChanged 自動通知
 * 4. 插件管理工具：plugin-manager
 * 5. 權限控制工具：permission-control  
 * 6. 多客戶端通知同步
 * 
 * 學習重點：
 * - 使用 server.tool() 方法創建可動態管理的工具實例
 * - 實作權限階層和依賴管理
 * - 掌握 MCP 自動通知機制
 * - 插件生命週期管理
 */

// TODO: 創建MCP服務器實例
// 提示：使用 McpServer 類別，需要 name 和 version
const server = new McpServer({
  name: 'FILL_IN_SERVER_NAME', // TODO: 將此替換為 'dynamic-features-server'
  version: 'FILL_IN_VERSION' // TODO: 將此替換為 '1.0.0'
});

// TODO: 定義會話管理接口 (擴展自練習8)
// 提示：會話需要包含權限信息
interface Session {
  id: string;
  startTime: Date;
  lastActivity: Date;
  clientInfo?: {
    name: string;
    version: string;
  };
  permissions: Set<string>; // TODO: 新增權限集合
  userId?: string; // TODO: 新增用戶ID
}

// TODO: 創建會話存儲
const sessions: Map<string, Session> = new Map();

// TODO: 定義權限系統接口
// 提示：權限有階層和依賴關係
interface Permission {
  id: string;
  name: string;
  description: string;
  level: 'basic' | 'advanced' | 'admin';
  dependencies?: string[]; // TODO: 權限依賴列表
}

// TODO: 定義可用權限
// 提示：建立權限階層：read → write → file-ops, http-fetch → plugin-mgmt → admin
const availablePermissions: Map<string, Permission> = new Map([
  ['read', { 
    id: 'read', 
    name: 'Read Access', 
    description: 'Basic read-only access', 
    level: 'basic' 
  }],
  // TODO: 新增其他權限定義
  // ['write', { id: 'write', name: 'Write Access', description: 'Write and modify content', level: 'basic', dependencies: ['read'] }],
  // ['file-ops', { id: 'file-ops', name: 'File Operations', description: 'File system operations', level: 'advanced', dependencies: ['write'] }],
  // ['http-fetch', { id: 'http-fetch', name: 'HTTP Requests', description: 'External HTTP requests', level: 'advanced', dependencies: ['read'] }],
  // ['plugin-mgmt', { id: 'plugin-mgmt', name: 'Plugin Management', description: 'Manage dynamic plugins', level: 'admin', dependencies: ['write'] }],
  // ['admin', { id: 'admin', name: 'Administrator', description: 'Full system access', level: 'admin', dependencies: ['read', 'write', 'file-ops', 'http-fetch', 'plugin-mgmt'] }]
]);

// TODO: 定義動態插件系統接口
// 提示：插件包含工具、資源、提示和權限要求
interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  dependencies?: string[]; // TODO: 插件依賴
  permissions: string[]; // TODO: 所需權限
  tools?: string[]; // TODO: 提供的工具
  resources?: string[]; // TODO: 提供的資源
  prompts?: string[]; // TODO: 提供的提示
}

// TODO: 創建插件存儲
const plugins: Map<string, Plugin> = new Map();
const pluginTools: Map<string, any> = new Map(); // TODO: 存儲工具實例
const pluginResources: Map<string, any> = new Map(); // TODO: 存儲資源實例

// TODO: 定義可用插件庫
// 提示：模擬三個不同類型的插件
const availablePlugins: Map<string, Plugin> = new Map([
  ['weather-plugin', {
    id: 'weather-plugin',
    name: 'Weather Information',
    description: 'Provides weather information and forecasts',
    version: '1.0.0',
    author: 'Weather Corp',
    enabled: false,
    permissions: ['http-fetch'],
    tools: ['get-weather', 'get-forecast'],
    resources: ['weather-data']
  }],
  // TODO: 新增其他插件定義
  // ['database-plugin', { ... }],
  // ['analysis-plugin', { ... }]
]);

// TODO: 內容管理存儲 (繼承自練習7)
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

// TODO: 模擬的HTTP響應數據 (來自練習5)
const mockHttpResponses: { [key: string]: any } = {
  'https://api.example.com/users': {
    status: 200,
    data: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  },
  // TODO: 新增天氣API模擬響應
  // 'https://api.weather.com/current': { ... }
};

// TODO: 初始化示例內容
contentStore.set('article-1', {
  id: 'article-1',
  type: 'article',
  title: 'Dynamic MCP Features',
  content: 'This article explains dynamic features in MCP including plugin systems and notifications.',
  author: 'System',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  tags: ['mcp', 'dynamic', 'plugins'],
  status: 'published'
});

// TODO: 確保data目錄存在
const dataDir = path.join(__dirname, 'data');

async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// TODO: 生成唯一ID函數
function generateId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}`;
}

// TODO: 會話管理函數 (擴展自練習8)
function createSession(clientInfo?: { name: string; version: string }): string {
  // TODO: 實作會話創建邏輯
  // 提示：
  // 1. 生成唯一會話ID (使用 randomUUID())
  // 2. 創建Session對象，包含權限集合
  // 3. 預設給予 'read' 權限
  // 4. 存儲到sessions Map
  // 5. 記錄日誌
  // 6. 返回會話ID
  throw new Error('TODO: 實作會話創建函數');
}

function updateSessionActivity(sessionId: string): void {
  // TODO: 實作活動更新邏輯
  throw new Error('TODO: 實作會話活動更新函數');
}

function cleanupInactiveSessions(): void {
  // TODO: 實作會話清理邏輯
  throw new Error('TODO: 實作會話清理函數');
}

// TODO: 定期清理無效會話
// setInterval(cleanupInactiveSessions, 5 * 60 * 1000);

// TODO: 權限管理函數
function hasPermission(sessionId: string, permission: string): boolean {
  // TODO: 實作權限檢查邏輯
  // 提示：
  // 1. 獲取會話
  // 2. 檢查直接權限
  // 3. 檢查admin權限
  // 4. 返回布林值
  throw new Error('TODO: 實作權限檢查函數');
}

function grantPermission(sessionId: string, permission: string): boolean {
  // TODO: 實作權限授予邏輯
  // 提示：
  // 1. 獲取會話和權限定義
  // 2. 檢查權限依賴，自動授予前置權限
  // 3. 添加權限到會話
  // 4. 記錄日誌
  // 5. 返回成功狀態
  throw new Error('TODO: 實作權限授予函數');
}

// TODO: 插件管理函數
function loadPlugin(pluginId: string): boolean {
  // TODO: 實作插件載入邏輯
  // 提示：
  // 1. 獲取插件定義
  // 2. 檢查依賴插件
  // 3. 載入插件到plugins Map
  // 4. 動態註冊工具和資源
  // 5. 記錄日誌
  // 6. 返回成功狀態
  throw new Error('TODO: 實作插件載入函數');
}

function unloadPlugin(pluginId: string): boolean {
  // TODO: 實作插件卸載邏輯
  // 提示：
  // 1. 獲取插件
  // 2. 移除所有工具 (使用toolInstance.remove())
  // 3. 移除所有資源
  // 4. 標記為未載入
  // 5. 清理插件工具/資源Map
  // 6. 記錄日誌
  throw new Error('TODO: 實作插件卸載函數');
}

function registerPluginTool(pluginId: string, toolName: string): void {
  // TODO: 實作插件工具註冊邏輯
  // 提示：根據toolName使用switch註冊不同的工具
  // 使用 server.tool() 方法創建工具實例
  // 例如：
  // case 'get-weather':
  //   const weatherTool = server.tool('get-weather', schema, handler);
  //   pluginTools.set(toolName, weatherTool);
  //   break;
  throw new Error('TODO: 實作插件工具註冊函數');
}

function registerPluginResource(pluginId: string, resourceName: string): void {
  // TODO: 實作插件資源註冊邏輯
  // 提示：使用 server.registerResource() 註冊資源
  throw new Error('TODO: 實作插件資源註冊函數');
}

// ===== 核心工具註冊 (繼承前8個練習) =====

// TODO: 練習 1: Echo 工具
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
    // TODO: 實作echo功能
    throw new Error('TODO: 實作echo工具');
  }
);

// TODO: 練習 3: 計算工具
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
    throw new Error('TODO: 實作計算工具');
  }
);

// TODO: 練習 3: 文本轉換工具
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

// TODO: 練習 5: 文件讀取工具
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
    throw new Error('TODO: 實作文件讀取工具');
  }
);

// TODO: 練習 7: 內容創建工具
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

// ===== 練習 9: 新增動態功能工具 =====

// TODO: 插件管理工具
server.registerTool(
  'plugin-manager',
  {
    title: 'Plugin Manager',
    description: 'Manage dynamic plugins (load, unload, list)',
    inputSchema: {
      action: z.enum(['list', 'load', 'unload', 'info']).describe('Plugin management action'),
      pluginId: z.string().optional().describe('Plugin ID (required for load/unload/info)'),
      sessionId: z.string().optional().describe('Session ID for permission check')
    }
  },
  async ({ action, pluginId, sessionId }) => {
    // TODO: 實作插件管理功能
    // 提示：
    // 1. 檢查權限 (需要 plugin-mgmt 權限)
    // 2. 根據action執行不同操作
    // 3. list: 返回可用插件列表
    // 4. load: 載入指定插件
    // 5. unload: 卸載指定插件
    // 6. info: 返回插件詳細信息
    throw new Error('TODO: 實作插件管理工具');
  }
);

// TODO: 權限控制工具
server.registerTool(
  'permission-control',
  {
    title: 'Permission Control Tool',
    description: 'Manage user permissions and access control',
    inputSchema: {
      action: z.enum(['list', 'grant', 'revoke', 'check']).describe('Permission action'),
      sessionId: z.string().optional().describe('Target session ID'),
      permission: z.string().optional().describe('Permission to grant/revoke/check'),
      currentSessionId: z.string().optional().describe('Current session ID for auth')
    }
  },
  async ({ action, sessionId, permission, currentSessionId }) => {
    // TODO: 實作權限控制功能
    // 提示：
    // 1. 檢查操作權限 (管理其他用戶需要admin權限)
    // 2. 根據action執行不同操作
    // 3. list: 列出用戶權限和可用權限
    // 4. grant: 授予權限 (自動處理依賴)
    // 5. revoke: 撤銷權限
    // 6. check: 檢查權限狀態
    throw new Error('TODO: 實作權限控制工具');
  }
);

// TODO: 會話信息工具 (繼承自練習8)
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
    // TODO: 實作會話信息功能
    throw new Error('TODO: 實作會話信息工具');
  }
);

// ===== 資源註冊 (繼承自練習2和7) =====

// TODO: 服務器配置資源
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
    // 提示：返回包含插件狀態、會話狀態、功能列表的配置對象
    throw new Error('TODO: 實作服務器配置資源');
  }
);

// TODO: 幫助信息資源
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
    // 提示：返回動態功能的使用說明和範例
    throw new Error('TODO: 實作幫助信息資源');
  }
);

// TODO: 動態內容資源 (繼承自練習7)
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
    throw new Error('TODO: 實作動態內容資源');
  }
);

// ===== 提示註冊 (繼承自練習6) =====

// TODO: 代碼審查提示
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

// ===== HTTP 服務器設置 (繼承自練習8) =====

// TODO: 創建Express應用程序
function createExpressApp(): express.Application {
  const app = express();
  
  // TODO: 配置中間件
  // 提示：JSON解析、CORS、URL編碼
  
  // TODO: 健康檢查端點
  // 提示：返回插件狀態、會話狀態等
  
  // TODO: 插件狀態端點
  // 提示：GET /plugins 返回所有插件狀態
  
  // TODO: 錯誤處理中間件
  
  throw new Error('TODO: 實作Express應用程序');
}

// TODO: 主函數
async function main() {
  try {
    // TODO: 初始化
    await ensureDataDir();
    
    // TODO: 檢查命令行參數決定傳輸方式
    const useHttp = process.argv.includes('--http');
    const port = parseInt(process.env.PORT || '3000');
    
    if (useHttp) {
      // TODO: HTTP 傳輸模式
      // 提示：
      // 1. 創建Express應用程序
      // 2. 設置StreamableHTTPServerTransport
      // 3. 實作MCP端點處理 (/mcp)
      // 4. 實作SSE通知端點 (GET /mcp)
      // 5. 實作會話關閉端點 (DELETE /mcp)
      // 6. 啟動HTTP服務器
      throw new Error('TODO: 實作HTTP傳輸模式');
    } else {
      // TODO: stdio 傳輸模式 (預設)
      // 提示：創建StdioServerTransport並連接服務器
      throw new Error('TODO: 實作stdio傳輸模式');
    }
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// TODO: 優雅關閉
// 提示：清理會話、卸載插件
process.on('SIGINT', async () => {
  console.error('\\nShutting down Dynamic Features Server...');
  // TODO: 實作清理邏輯
  process.exit(0);
});

// TODO: 啟動服務器
if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}

export { server, main };