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
 * 本練習展示 MCP 的高級動態功能，包括：
 * - 動態插件系統：運行時載入/卸載工具和資源
 * - MCP 通知機制：listChanged 自動通知
 * - 插件管理工具：plugin-manager
 * - 權限控制工具：permission-control
 * - 多客戶端通知同步
 * 
 * 新增功能：
 * - 動態插件載入/卸載系統
 * - 權限控制和功能開關
 * - 自動 listChanged 通知機制
 * - 插件管理工具
 * - 權限管理工具
 * - 多客戶端同步通知
 */

const server = new McpServer({
  name: 'dynamic-features-server',
  version: '1.0.0'
});

// 會話管理 (繼承自練習8)
interface Session {
  id: string;
  startTime: Date;
  lastActivity: Date;
  clientInfo?: {
    name: string;
    version: string;
  };
  permissions: Set<string>;
  userId?: string;
}

const sessions: Map<string, Session> = new Map();

// 權限系統
interface Permission {
  id: string;
  name: string;
  description: string;
  level: 'basic' | 'advanced' | 'admin';
  dependencies?: string[];
}

const availablePermissions: Map<string, Permission> = new Map([
  ['read', { id: 'read', name: 'Read Access', description: 'Basic read-only access', level: 'basic' }],
  ['write', { id: 'write', name: 'Write Access', description: 'Write and modify content', level: 'basic', dependencies: ['read'] }],
  ['file-ops', { id: 'file-ops', name: 'File Operations', description: 'File system operations', level: 'advanced', dependencies: ['write'] }],
  ['http-fetch', { id: 'http-fetch', name: 'HTTP Requests', description: 'External HTTP requests', level: 'advanced', dependencies: ['read'] }],
  ['plugin-mgmt', { id: 'plugin-mgmt', name: 'Plugin Management', description: 'Manage dynamic plugins', level: 'admin', dependencies: ['write'] }],
  ['admin', { id: 'admin', name: 'Administrator', description: 'Full system access', level: 'admin', dependencies: ['read', 'write', 'file-ops', 'http-fetch', 'plugin-mgmt'] }]
]);

// 動態插件系統
interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author: string;
  enabled: boolean;
  dependencies?: string[];
  permissions: string[];
  tools?: string[];
  resources?: string[];
  prompts?: string[];
}

const plugins: Map<string, Plugin> = new Map();
const pluginTools: Map<string, any> = new Map(); // 存儲工具實例
const pluginResources: Map<string, any> = new Map(); // 存儲資源實例

// 模擬的插件庫
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
  ['database-plugin', {
    id: 'database-plugin',
    name: 'Database Operations',
    description: 'Database query and management tools',
    version: '2.0.0',
    author: 'DB Systems',
    enabled: false,
    permissions: ['admin'],
    tools: ['db-query', 'db-backup', 'db-restore'],
    resources: ['schema-info', 'table-stats']
  }],
  ['analysis-plugin', {
    id: 'analysis-plugin',
    name: 'Data Analysis',
    description: 'Advanced data analysis and visualization',
    version: '1.5.0',
    author: 'Analytics Lab',
    enabled: false,
    permissions: ['read', 'write'],
    tools: ['analyze-data', 'create-chart'],
    resources: ['analysis-templates']
  }]
]);

// 內容管理存儲 (繼承自練習7)
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

// 模擬的HTTP響應數據 (來自練習5)
const mockHttpResponses: { [key: string]: any } = {
  'https://api.example.com/users': {
    status: 200,
    data: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  },
  'https://api.weather.com/current': {
    status: 200,
    data: {
      location: 'San Francisco',
      temperature: 22,
      condition: 'Sunny',
      humidity: 65,
      wind: '10 km/h'
    }
  }
};

// 初始化示例內容
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

// 確保data目錄存在
const dataDir = path.join(__dirname, 'data');

async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 生成唯一ID函數
function generateId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}`;
}

// 會話管理函數
function createSession(clientInfo?: { name: string; version: string }): string {
  const sessionId = randomUUID();
  const session: Session = {
    id: sessionId,
    startTime: new Date(),
    lastActivity: new Date(),
    clientInfo,
    permissions: new Set(['read']) // 預設只有讀取權限
  };
  
  sessions.set(sessionId, session);
  console.error(`Session created: ${sessionId} for client: ${clientInfo?.name || 'unknown'}`);
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
  const thirtyMinutesAgo = new Date(now.getTime() - 30 * 60 * 1000);
  
  for (const [sessionId, session] of sessions.entries()) {
    if (session.lastActivity < thirtyMinutesAgo) {
      sessions.delete(sessionId);
      console.error(`Session expired and removed: ${sessionId}`);
    }
  }
}

// 定期清理無效會話
setInterval(cleanupInactiveSessions, 5 * 60 * 1000);

// 權限管理函數
function hasPermission(sessionId: string, permission: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  const perm = availablePermissions.get(permission);
  if (!perm) return false;
  
  // 檢查直接權限
  if (session.permissions.has(permission)) return true;
  
  // 檢查是否有管理員權限
  if (session.permissions.has('admin')) return true;
  
  return false;
}

function grantPermission(sessionId: string, permission: string): boolean {
  const session = sessions.get(sessionId);
  const perm = availablePermissions.get(permission);
  
  if (!session || !perm) return false;
  
  // 檢查依賴權限
  if (perm.dependencies) {
    for (const dep of perm.dependencies) {
      if (!session.permissions.has(dep)) {
        session.permissions.add(dep);
      }
    }
  }
  
  session.permissions.add(permission);
  console.error(`Permission granted: ${permission} to session ${sessionId}`);
  return true;
}

// 插件管理函數
function loadPlugin(pluginId: string): boolean {
  const plugin = availablePlugins.get(pluginId);
  if (!plugin) return false;
  
  // 檢查依賴
  if (plugin.dependencies) {
    for (const dep of plugin.dependencies) {
      if (!plugins.has(dep) || !plugins.get(dep)?.enabled) {
        console.error(`Plugin dependency not satisfied: ${dep}`);
        return false;
      }
    }
  }
  
  // 載入插件
  const loadedPlugin = { ...plugin, enabled: true };
  plugins.set(pluginId, loadedPlugin);
  
  // 動態註冊工具
  if (plugin.tools) {
    for (const toolName of plugin.tools) {
      registerPluginTool(pluginId, toolName);
    }
  }
  
  // 動態註冊資源
  if (plugin.resources) {
    for (const resourceName of plugin.resources) {
      registerPluginResource(pluginId, resourceName);
    }
  }
  
  console.error(`Plugin loaded: ${pluginId}`);
  return true;
}

function unloadPlugin(pluginId: string): boolean {
  const plugin = plugins.get(pluginId);
  if (!plugin || !plugin.enabled) return false;
  
  // 移除工具
  if (plugin.tools) {
    for (const toolName of plugin.tools) {
      const toolInstance = pluginTools.get(toolName);
      if (toolInstance) {
        toolInstance.remove(); // 自動觸發 listChanged 通知
        pluginTools.delete(toolName);
      }
    }
  }
  
  // 移除資源
  if (plugin.resources) {
    for (const resourceName of plugin.resources) {
      const resourceInstance = pluginResources.get(resourceName);
      if (resourceInstance) {
        // 注意：MCP SDK 可能沒有直接的資源移除方法，這裡是概念性示範
        pluginResources.delete(resourceName);
      }
    }
  }
  
  // 標記為未載入
  plugin.enabled = false;
  console.error(`Plugin unloaded: ${pluginId}`);
  return true;
}

function registerPluginTool(pluginId: string, toolName: string): void {
  // 動態註冊插件工具的示例實作
  switch (toolName) {
    case 'get-weather':
      const weatherTool = server.tool(
        'get-weather',
        {
          location: z.string().describe('Location to get weather for')
        },
        async ({ location }) => {
          // 模擬天氣API調用
          return {
            content: [{
              type: 'text',
              text: `Weather in ${location}: Sunny, 22°C, Humidity: 65%`
            }]
          };
        }
      );
      pluginTools.set(toolName, weatherTool);
      break;
      
    case 'get-forecast':
      const forecastTool = server.tool(
        'get-forecast',
        {
          location: z.string().describe('Location to get forecast for'),
          days: z.number().min(1).max(7).describe('Number of days')
        },
        async ({ location, days }) => {
          return {
            content: [{
              type: 'text',
              text: `${days}-day forecast for ${location}: Mostly sunny with temperatures 20-25°C`
            }]
          };
        }
      );
      pluginTools.set(toolName, forecastTool);
      break;
      
    case 'db-query':
      const dbQueryTool = server.tool(
        'db-query',
        {
          query: z.string().describe('SQL query to execute'),
          database: z.string().optional().describe('Database name')
        },
        async ({ query, database = 'default' }) => {
          // 模擬數據庫查詢
          return {
            content: [{
              type: 'text',
              text: `Query executed on ${database}: ${query}\nResult: [mock data]`
            }]
          };
        }
      );
      pluginTools.set(toolName, dbQueryTool);
      break;
      
    case 'analyze-data':
      const analysisTool = server.tool(
        'analyze-data',
        {
          data: z.string().describe('JSON data to analyze'),
          type: z.enum(['statistical', 'trend', 'correlation']).describe('Analysis type')
        },
        async ({ data, type }) => {
          // 模擬數據分析
          return {
            content: [{
              type: 'text',
              text: `${type} analysis completed for provided data. Summary: [mock analysis results]`
            }]
          };
        }
      );
      pluginTools.set(toolName, analysisTool);
      break;
  }
}

function registerPluginResource(pluginId: string, resourceName: string): void {
  // 動態註冊插件資源的示例實作
  switch (resourceName) {
    case 'weather-data':
      server.registerResource(
        'weather-data',
        'weather://current',
        {
          title: 'Current Weather Data',
          description: 'Real-time weather information',
          mimeType: 'application/json'
        },
        async () => {
          const weatherData = {
            timestamp: new Date().toISOString(),
            locations: {
              'san-francisco': { temp: 22, condition: 'sunny' },
              'new-york': { temp: 15, condition: 'cloudy' },
              'london': { temp: 12, condition: 'rainy' }
            }
          };
          
          return {
            contents: [{
              uri: 'weather://current',
              mimeType: 'application/json',
              text: JSON.stringify(weatherData, null, 2)
            }]
          };
        }
      );
      break;
      
    case 'schema-info':
      server.registerResource(
        'schema-info',
        'db://schema',
        {
          title: 'Database Schema Information',
          description: 'Database schema and table structure',
          mimeType: 'application/json'
        },
        async () => {
          const schemaInfo = {
            database: 'production',
            tables: [
              { name: 'users', columns: ['id', 'name', 'email'], rowCount: 1500 },
              { name: 'orders', columns: ['id', 'user_id', 'total', 'created_at'], rowCount: 8200 }
            ]
          };
          
          return {
            contents: [{
              uri: 'db://schema',
              mimeType: 'application/json',
              text: JSON.stringify(schemaInfo, null, 2)
            }]
          };
        }
      );
      break;
  }
}

// ===== 核心工具註冊 (繼承前8個練習) =====

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
  async ({ message }) => {
    return {
      content: [{ type: 'text', text: `Echo: ${message}` }]
    };
  }
);

// 練習 3: 計算工具
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
    try {
      // 安全的數學表達式計算
      const sanitized = expression.replace(/[^0-9+\-*/().\s]/g, '');
      if (sanitized !== expression) {
        throw new Error('Invalid characters in expression');
      }
      
      const result = Function(`"use strict"; return (${sanitized})`)();
      return {
        content: [{ type: 'text', text: `Result: ${result}` }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'Calculation failed'}` }]
      };
    }
  }
);

// 練習 3: 文本轉換工具
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
        result = `Length: ${text.length} characters`;
        break;
      default:
        result = text;
    }
    
    return {
      content: [{ type: 'text', text: result }]
    };
  }
);

// 練習 3: 時間戳工具
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
        result = now.toLocaleString();
        break;
      default:
        result = now.toISOString();
    }
    
    return {
      content: [{ type: 'text', text: result }]
    };
  }
);

// 練習 5: 文件讀取工具
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
    try {
      await ensureDataDir();
      
      // 安全路徑檢查
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename: path traversal not allowed');
      }
      
      const filePath = path.join(dataDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        content: [{ type: 'text', text: content }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'File read failed'}` }]
      };
    }
  }
);

// 練習 5: 文件寫入工具
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
    try {
      await ensureDataDir();
      
      // 安全路徑檢查
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename: path traversal not allowed');
      }
      
      const filePath = path.join(dataDir, filename);
      await fs.writeFile(filePath, content, 'utf-8');
      
      return {
        content: [{ type: 'text', text: `File written successfully: ${filename}` }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'File write failed'}` }]
      };
    }
  }
);

// 練習 5: HTTP 獲取工具
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
    try {
      // 模擬HTTP請求延遲
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const response = mockHttpResponses[url];
      if (!response) {
        throw new Error(`No mock response available for URL: ${url}`);
      }
      
      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.error || 'Request failed'}`);
      }
      
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            method,
            url,
            status: response.status,
            data: response.data
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : 'HTTP request failed'}` }]
      };
    }
  }
);

// 練習 7: 內容創建工具
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
    const id = generateId(type);
    const now = new Date().toISOString();
    
    const contentItem: ContentItem = {
      id,
      type,
      title,
      content,
      author,
      tags,
      status,
      createdAt: now,
      updatedAt: now
    };
    
    contentStore.set(id, contentItem);
    
    return {
      content: [{
        type: 'text',
        text: `Content created successfully: ${id}\nTitle: ${title}\nType: ${type}\nStatus: ${status}`
      }]
    };
  }
);

// ===== 練習 9: 新增動態功能工具 =====

// 插件管理工具
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
    // 權限檢查
    if (sessionId && !hasPermission(sessionId, 'plugin-mgmt')) {
      return {
        content: [{ type: 'text', text: 'Error: Insufficient permissions for plugin management' }]
      };
    }
    
    switch (action) {
      case 'list':
        const pluginList = Array.from(availablePlugins.values()).map(plugin => ({
          id: plugin.id,
          name: plugin.name,
          version: plugin.version,
          enabled: plugins.get(plugin.id)?.enabled || false,
          permissions: plugin.permissions
        }));
        
        return {
          content: [{
            type: 'text',
            text: `Available Plugins:\n${JSON.stringify(pluginList, null, 2)}`
          }]
        };
        
      case 'load':
        if (!pluginId) {
          return {
            content: [{ type: 'text', text: 'Error: Plugin ID required for load action' }]
          };
        }
        
        const loadSuccess = loadPlugin(pluginId);
        return {
          content: [{
            type: 'text',
            text: loadSuccess ? `Plugin loaded successfully: ${pluginId}` : `Failed to load plugin: ${pluginId}`
          }]
        };
        
      case 'unload':
        if (!pluginId) {
          return {
            content: [{ type: 'text', text: 'Error: Plugin ID required for unload action' }]
          };
        }
        
        const unloadSuccess = unloadPlugin(pluginId);
        return {
          content: [{
            type: 'text',
            text: unloadSuccess ? `Plugin unloaded successfully: ${pluginId}` : `Failed to unload plugin: ${pluginId}`
          }]
        };
        
      case 'info':
        if (!pluginId) {
          return {
            content: [{ type: 'text', text: 'Error: Plugin ID required for info action' }]
          };
        }
        
        const plugin = availablePlugins.get(pluginId);
        if (!plugin) {
          return {
            content: [{ type: 'text', text: `Plugin not found: ${pluginId}` }]
          };
        }
        
        const pluginInfo = {
          ...plugin,
          enabled: plugins.get(pluginId)?.enabled || false
        };
        
        return {
          content: [{
            type: 'text',
            text: `Plugin Information:\n${JSON.stringify(pluginInfo, null, 2)}`
          }]
        };
        
      default:
        return {
          content: [{ type: 'text', text: 'Error: Invalid action' }]
        };
    }
  }
);

// 權限控制工具
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
    // 基本權限檢查 - 需要admin權限來管理其他用戶權限
    if (currentSessionId && sessionId !== currentSessionId && !hasPermission(currentSessionId, 'admin')) {
      return {
        content: [{ type: 'text', text: 'Error: Admin permission required to manage other users' }]
      };
    }
    
    const targetSessionId = sessionId || currentSessionId;
    if (!targetSessionId) {
      return {
        content: [{ type: 'text', text: 'Error: Session ID required' }]
      };
    }
    
    const session = sessions.get(targetSessionId);
    if (!session) {
      return {
        content: [{ type: 'text', text: 'Error: Session not found' }]
      };
    }
    
    switch (action) {
      case 'list':
        const userPermissions = Array.from(session.permissions);
        const availablePerms = Array.from(availablePermissions.values());
        
        return {
          content: [{
            type: 'text',
            text: `Session ${targetSessionId} Permissions:\nGranted: ${userPermissions.join(', ')}\n\nAvailable Permissions:\n${JSON.stringify(availablePerms, null, 2)}`
          }]
        };
        
      case 'grant':
        if (!permission) {
          return {
            content: [{ type: 'text', text: 'Error: Permission name required for grant action' }]
          };
        }
        
        const grantSuccess = grantPermission(targetSessionId, permission);
        return {
          content: [{
            type: 'text',
            text: grantSuccess ? `Permission granted: ${permission}` : `Failed to grant permission: ${permission}`
          }]
        };
        
      case 'revoke':
        if (!permission) {
          return {
            content: [{ type: 'text', text: 'Error: Permission name required for revoke action' }]
          };
        }
        
        session.permissions.delete(permission);
        return {
          content: [{
            type: 'text',
            text: `Permission revoked: ${permission}`
          }]
        };
        
      case 'check':
        if (!permission) {
          return {
            content: [{ type: 'text', text: 'Error: Permission name required for check action' }]
          };
        }
        
        const hasPerms = hasPermission(targetSessionId, permission);
        return {
          content: [{
            type: 'text',
            text: `Permission check for ${permission}: ${hasPerms ? 'GRANTED' : 'DENIED'}`
          }]
        };
        
      default:
        return {
          content: [{ type: 'text', text: 'Error: Invalid action' }]
        };
    }
  }
);

// 會話信息工具 (繼承自練習8)
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
    switch (action) {
      case 'current':
        // 在實際應用中，需要從請求上下文獲取當前會話ID
        return {
          content: [{
            type: 'text',
            text: `Active sessions: ${sessions.size}\nSession management: Enabled\nCleanup interval: 5 minutes`
          }]
        };
        
      case 'list':
        const sessionList = Array.from(sessions.values()).map(session => ({
          id: session.id,
          startTime: session.startTime,
          lastActivity: session.lastActivity,
          client: session.clientInfo?.name || 'unknown',
          permissions: Array.from(session.permissions)
        }));
        
        return {
          content: [{
            type: 'text',
            text: `Active Sessions:\n${JSON.stringify(sessionList, null, 2)}`
          }]
        };
        
      case 'cleanup':
        const beforeCount = sessions.size;
        cleanupInactiveSessions();
        const afterCount = sessions.size;
        const cleaned = beforeCount - afterCount;
        
        return {
          content: [{
            type: 'text',
            text: `Session cleanup completed. Removed ${cleaned} inactive sessions. Active sessions: ${afterCount}`
          }]
        };
        
      default:
        return {
          content: [{ type: 'text', text: 'Invalid action' }]
        };
    }
  }
);

// ===== 資源註冊 (繼承自練習2和7) =====

// 服務器配置資源
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
      server: {
        name: 'dynamic-features-server',
        version: '1.0.0',
        startTime: new Date().toISOString(),
        features: [
          'dynamic-plugins',
          'permission-control',
          'session-management',
          'http-transport',
          'notification-system'
        ]
      },
      plugins: {
        available: availablePlugins.size,
        loaded: Array.from(plugins.values()).filter(p => p.enabled).length,
        loadedPlugins: Array.from(plugins.values()).filter(p => p.enabled).map(p => p.id)
      },
      sessions: {
        active: sessions.size,
        permissions: Array.from(availablePermissions.keys())
      },
      transport: {
        type: process.argv.includes('--http') ? 'http' : 'stdio',
        port: process.env.PORT || 3000
      }
    };
    
    return {
      contents: [{
        uri: 'config://server',
        mimeType: 'application/json',
        text: JSON.stringify(config, null, 2)
      }]
    };
  }
);

// 幫助信息資源
server.registerResource(
  'help-info',
  'help://info',
  {
    title: 'Help Information',
    description: 'Available tools and usage information',
    mimeType: 'text/markdown'
  },
  async () => {
    const helpContent = `# Dynamic Features Server Help

## Available Features

### Core Tools (Inherited)
- **echo**: Echo back messages
- **calculate**: Mathematical calculations
- **text-transform**: Text transformations (uppercase, lowercase, reverse, length)
- **timestamp**: Generate timestamps in various formats
- **file-read/write**: File operations
- **http-fetch**: HTTP requests (simulated)
- **content-create**: Content management

### Dynamic Features (New in Exercise 9)
- **plugin-manager**: Manage dynamic plugins
  - \`list\`: Show available plugins
  - \`load <plugin-id>\`: Load a plugin
  - \`unload <plugin-id>\`: Unload a plugin
  - \`info <plugin-id>\`: Get plugin details
  
- **permission-control**: Manage user permissions
  - \`list\`: Show current permissions
  - \`grant <permission>\`: Grant permission
  - \`revoke <permission>\`: Revoke permission
  - \`check <permission>\`: Check permission status

- **session-info**: Session management
  - \`current\`: Current session info
  - \`list\`: List all sessions
  - \`cleanup\`: Clean up inactive sessions

### Dynamic Plugin System
Available plugins that can be dynamically loaded:
- **weather-plugin**: Weather information and forecasts
- **database-plugin**: Database operations (requires admin permissions)
- **analysis-plugin**: Data analysis tools

### Permission System
- **read**: Basic read-only access
- **write**: Write and modify content
- **file-ops**: File system operations
- **http-fetch**: External HTTP requests
- **plugin-mgmt**: Plugin management
- **admin**: Full system access

### Notification System
The server automatically sends \`listChanged\` notifications when:
- Plugins are loaded or unloaded
- Tools are enabled, disabled, updated, or removed
- Dynamic features change

## Usage Examples

\`\`\`bash
# Load weather plugin
plugin-manager --action=load --plugin-id=weather-plugin

# Check permissions
permission-control --action=list

# Grant write permission
permission-control --action=grant --permission=write

# Use dynamically loaded weather tool
get-weather --location="San Francisco"
\`\`\`
`;
    
    return {
      contents: [{
        uri: 'help://info',
        mimeType: 'text/markdown',
        text: helpContent
      }]
    };
  }
);

// 動態內容資源 (繼承自練習7)
server.registerResource(
  'content',
  new ResourceTemplate('content://{type}/{id}', { list: undefined }),
  {
    title: 'Content Resource',
    description: 'Access content items by type and ID',
    mimeType: 'application/json'
  },
  async (uri: URL) => {
    const pathParts = uri.pathname.split('/').filter(Boolean);
    
    if (pathParts.length === 0) {
      // 列出所有內容
      const allContent = Array.from(contentStore.values());
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(allContent, null, 2)
        }]
      };
    }
    
    if (pathParts.length === 1) {
      // 按類型列出內容
      const type = pathParts[0];
      const contentByType = Array.from(contentStore.values()).filter(item => item.type === type);
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(contentByType, null, 2)
        }]
      };
    }
    
    if (pathParts.length === 2) {
      // 獲取特定內容項目
      const [type, id] = pathParts;
      const content = contentStore.get(id);
      
      if (!content || content.type !== type) {
        throw new Error(`Content not found: ${type}/${id}`);
      }
      
      return {
        contents: [{
          uri: uri.href,
          mimeType: 'application/json',
          text: JSON.stringify(content, null, 2)
        }]
      };
    }
    
    throw new Error('Invalid content URI format');
  }
);

// ===== 提示註冊 (繼承自練習6) =====

// 代碼審查提示
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
    const focusText = focusAreas ? ` Focus particularly on: ${focusAreas}.` : '';
    const severityText = severity ? ` This is a ${severity} priority review.` : '';
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please perform a comprehensive code review for the following ${language} code:

Context: ${codeContext}${focusText}${severityText}

Please analyze:
1. Code quality and best practices
2. Security vulnerabilities
3. Performance considerations
4. Error handling
5. Dynamic plugin integration patterns (if applicable)
6. Permission and access control (if applicable)
7. Documentation and comments
8. Testing considerations

Provide specific recommendations for improvement and highlight any critical issues.`
          }
        }
      ]
    };
  }
);

// ===== HTTP 服務器設置 (繼承自練習8) =====

function createExpressApp(): express.Application {
  const app = express();
  
  // 中間件
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // CORS 支援
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    
    next();
  });
  
  // 健康檢查端點
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      activeSessions: sessions.size,
      loadedPlugins: Array.from(plugins.values()).filter(p => p.enabled).length,
      availablePlugins: availablePlugins.size,
      version: '1.0.0',
      transport: 'http',
      features: ['dynamic-plugins', 'permission-control', 'notifications']
    });
  });
  
  // 插件狀態端點
  app.get('/plugins', (req, res) => {
    const pluginStatus = Array.from(availablePlugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      version: plugin.version,
      enabled: plugins.get(plugin.id)?.enabled || false,
      permissions: plugin.permissions,
      tools: plugin.tools || [],
      resources: plugin.resources || []
    }));
    
    res.json(pluginStatus);
  });
  
  // 錯誤處理中間件
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express error:', error);
    res.status(500).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Internal server error'
      },
      id: null
    });
  });
  
  return app;
}

// ===== 主函數 =====

async function main() {
  try {
    await ensureDataDir();
    
    const useHttp = process.argv.includes('--http');
    const port = parseInt(process.env.PORT || '3000');
    
    if (useHttp) {
      // HTTP 傳輸模式
      const app = createExpressApp();
      const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
      
      // MCP 端點
      app.post('/mcp', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'] as string | undefined;
        let transport: StreamableHTTPServerTransport;
        
        if (sessionId && transports[sessionId]) {
          transport = transports[sessionId];
          updateSessionActivity(sessionId);
        } else if (!sessionId && isInitializeRequest(req.body)) {
          transport = new StreamableHTTPServerTransport({
            sessionIdGenerator: () => randomUUID(),
            onsessioninitialized: (sessionId) => {
              transports[sessionId] = transport;
              createSession({ name: 'http-client', version: '1.0.0' });
            }
          });
          
          transport.onclose = () => {
            if (transport.sessionId) {
              delete transports[transport.sessionId];
              sessions.delete(transport.sessionId);
              console.error(`HTTP session closed: ${transport.sessionId}`);
            }
          };
          
          await server.connect(transport);
        } else {
          res.status(400).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Invalid session ID or missing initialize request'
            },
            id: null
          });
          return;
        }
        
        try {
          await transport.handleRequest(req, res, req.body);
        } catch (error) {
          console.error('Transport error:', error);
          res.status(500).json({
            jsonrpc: '2.0',
            error: {
              code: -32000,
              message: 'Transport error'
            },
            id: null
          });
        }
      });
      
      // 服務器到客戶端通知 (SSE)
      app.get('/mcp', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'] as string;
        const transport = transports[sessionId];
        
        if (!transport) {
          res.status(400).json({
            error: 'Invalid session ID'
          });
          return;
        }
        
        updateSessionActivity(sessionId);
        
        // 設置 SSE 頭部
        res.writeHead(200, {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*'
        });
        
        // 維持連接活躍
        const heartbeat = setInterval(() => {
          res.write('data: {"type":"heartbeat"}\\n\\n');
        }, 30000);
        
        req.on('close', () => {
          clearInterval(heartbeat);
        });
      });
      
      // 關閉會話
      app.delete('/mcp', async (req, res) => {
        const sessionId = req.headers['mcp-session-id'] as string;
        const transport = transports[sessionId];
        
        if (transport) {
          await transport.close();
          delete transports[sessionId];
          sessions.delete(sessionId);
        }
        
        res.json({ success: true });
      });
      
      app.listen(port, () => {
        console.error(`Dynamic Features HTTP Transport Server started successfully`);
        console.error(`HTTP server listening on port ${port}`);
        console.error(`MCP endpoint: http://localhost:${port}/mcp`);
        console.error(`Health check: http://localhost:${port}/health`);
        console.error(`Plugin status: http://localhost:${port}/plugins`);
        console.error(`Active sessions: ${sessions.size}`);
        console.error(`Available plugins: ${availablePlugins.size}`);
        console.error(`Use Ctrl+C to stop the server`);
      });
      
    } else {
      // stdio 傳輸模式 (預設)
      console.error('Dynamic Features Server starting in stdio mode...');
      console.error(`Available plugins: ${availablePlugins.size}`);
      console.error(`Active sessions will be managed automatically`);
      
      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error('Dynamic Features Server started successfully');
    }
    
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGINT', async () => {
  console.error('\\nShutting down Dynamic Features Server...');
  
  // 清理所有會話
  sessions.clear();
  
  // 卸載所有插件
  for (const pluginId of plugins.keys()) {
    unloadPlugin(pluginId);
  }
  
  console.error('Server shutdown complete');
  process.exit(0);
});

// 啟動服務器
if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}

export { server, main };