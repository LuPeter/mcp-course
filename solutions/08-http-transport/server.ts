#!/usr/bin/env node

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import express from 'express';
import fs from 'fs/promises';
import path from 'path';
import http from 'http';
import { randomUUID } from 'crypto';

/**
 * 練習 8: HTTP 傳輸服務器
 * 
 * 本練習展示如何實作支援 HTTP 傳輸的 MCP 服務器，包括會話管理
 * 
 * 新增功能：
 * - Express.js HTTP 服務器
 * - StreamableHTTPServerTransport
 * - 會話生命週期管理
 * - 同時支援 stdio 和 HTTP transport
 * - HTTP Client 示例
 */

const server = new McpServer({
  name: 'http-transport-server',
  version: '1.0.0'
});

// 會話管理
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

contentStore.set('blog-1', {
  id: 'blog-1',
  type: 'blog',
  title: 'Getting Started with MCP',
  content: 'This blog post will guide you through the basics of implementing MCP servers.',
  author: 'Developer',
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
  tags: ['tutorial', 'beginner', 'mcp'],
  status: 'published'
});

// 確保 data 目錄存在
const dataDir = path.join(__dirname, 'data');

async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 生成唯一 ID
function generateId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}`;
}

// 會話管理工具
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

function updateSessionActivity(sessionId: string): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.lastActivity = new Date();
  }
}

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

// 定期清理無效會話
setInterval(cleanupInactiveSessions, 5 * 60 * 1000); // 每5分鐘清理一次

// ===== 工具註冊 (整合所有前面練習) =====

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

// 練習 3: 文本轉換工具
server.registerTool(
  'text-transform',
  {
    title: 'Text Transform Tool',
    description: 'Transform text using various operations',
    inputSchema: {
      text: z.string().describe('Text to transform'),
      operation: z.enum(['uppercase', 'lowercase', 'reverse', 'length']).describe('Transform operation to apply')
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
        throw new Error(`Unknown operation: ${operation}`);
    }
    
    return {
      content: [{
        type: 'text',
        text: `Operation: ${operation}\nInput: ${text}\nResult: ${result}`
      }]
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
        throw new Error(`Unknown format: ${format}`);
    }
    
    return {
      content: [{
        type: 'text',
        text: `Current timestamp (${format}): ${result}`
      }]
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
      
      // 安全性檢查：防止路徑遍歷
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename: path traversal not allowed');
      }
      
      const filePath = path.join(dataDir, filename);
      const content = await fs.readFile(filePath, 'utf-8');
      
      return {
        content: [{
          type: 'text',
          text: `File: ${filename}\nContent:\n${content}`
        }]
      };
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        throw new Error(`File not found: ${filename}`);
      }
      throw new Error(`File read error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      filename: z.string().describe('Name of the file to write (relative to data directory)'),
      content: z.string().describe('Content to write to the file')
    }
  },
  async ({ filename, content }) => {
    try {
      await ensureDataDir();
      
      // 安全性檢查：防止路徑遍歷
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename: path traversal not allowed');
      }
      
      const filePath = path.join(dataDir, filename);
      await fs.writeFile(filePath, content, 'utf-8');
      
      return {
        content: [{
          type: 'text',
          text: `File written successfully: ${filename}\nContent length: ${content.length} characters`
        }]
      };
    } catch (error) {
      throw new Error(`File write error: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
      // 模擬延遲
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const mockResponse = mockHttpResponses[url];
      if (!mockResponse) {
        throw new Error(`No mock response available for: ${url}`);
      }
      
      if (mockResponse.error) {
        throw new Error(`HTTP ${mockResponse.status}: ${mockResponse.error}`);
      }
      
      return {
        content: [{
          type: 'text',
          text: `HTTP ${method} ${url}\nStatus: ${mockResponse.status}\nResponse: ${JSON.stringify(mockResponse.data, null, 2)}`
        }]
      };
    } catch (error) {
      throw new Error(`HTTP fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// 練習 5: 數據處理工具
server.registerTool(
  'data-process',
  {
    title: 'Data Processing Tool',
    description: 'Process and analyze data with potential failures',
    inputSchema: {
      data: z.string().describe('JSON data to process'),
      operation: z.enum(['count', 'sum', 'average', 'validate']).describe('Processing operation')
    }
  },
  async ({ data, operation }) => {
    try {
      let parsedData: any;
      
      try {
        parsedData = JSON.parse(data);
      } catch {
        throw new Error('Invalid JSON data provided');
      }
      
      if (!Array.isArray(parsedData)) {
        throw new Error('Data must be a JSON array');
      }
      
      let result: string;
      
      switch (operation) {
        case 'count':
          result = `Count: ${parsedData.length} items`;
          break;
        case 'sum':
          const sum = parsedData.reduce((acc: number, item: any) => {
            const num = typeof item === 'number' ? item : Number(item);
            if (isNaN(num)) throw new Error('Non-numeric data found for sum operation');
            return acc + num;
          }, 0);
          result = `Sum: ${sum}`;
          break;
        case 'average':
          if (parsedData.length === 0) throw new Error('Cannot calculate average of empty array');
          const avg = parsedData.reduce((acc: number, item: any) => {
            const num = typeof item === 'number' ? item : Number(item);
            if (isNaN(num)) throw new Error('Non-numeric data found for average operation');
            return acc + num;
          }, 0) / parsedData.length;
          result = `Average: ${avg}`;
          break;
        case 'validate':
          const valid = parsedData.every((item: any) => 
            typeof item === 'object' && item !== null && 'id' in item
          );
          result = `Validation: ${valid ? 'All items have required "id" field' : 'Some items missing "id" field'}`;
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      return {
        content: [{
          type: 'text',
          text: `Data processing completed\nOperation: ${operation}\nResult: ${result}\nProcessed ${parsedData.length} items`
        }]
      };
    } catch (error) {
      throw new Error(`Data processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// 練習 7: 內容管理工具
server.registerTool(
  'content-create',
  {
    title: 'Content Creation Tool',
    description: 'Create new content items in the content management system',
    inputSchema: {
      type: z.enum(['article', 'blog', 'documentation', 'note']).describe('Type of content to create'),
      title: z.string().describe('Title of the content'),
      content: z.string().describe('Content body'),
      author: z.string().describe('Author name'),
      tags: z.array(z.string()).optional().default([]).describe('Content tags'),
      status: z.enum(['draft', 'published', 'archived']).optional().default('draft').describe('Content status')
    }
  },
  async ({ type, title, content, author, tags = [], status = 'draft' }) => {
    try {
      const id = generateId(type);
      const now = new Date().toISOString();
      
      const contentItem: ContentItem = {
        id,
        type,
        title,
        content,
        author,
        createdAt: now,
        updatedAt: now,
        tags,
        status
      };
      
      contentStore.set(id, contentItem);
      
      return {
        content: [{
          type: 'text',
          text: `Content created successfully:
ID: ${id}
Type: ${type}
Title: ${title}
Author: ${author}
Status: ${status}
Tags: ${tags.join(', ')}
Created: ${now}`
        }]
      };
    } catch (error) {
      throw new Error(`Content creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

server.registerTool(
  'content-update',
  {
    title: 'Content Update Tool',
    description: 'Update existing content items',
    inputSchema: {
      id: z.string().describe('Content ID to update'),
      title: z.string().optional().describe('New title'),
      content: z.string().optional().describe('New content body'),
      author: z.string().optional().describe('New author name'),
      tags: z.array(z.string()).optional().describe('New tags'),
      status: z.enum(['draft', 'published', 'archived']).optional().describe('New status')
    }
  },
  async ({ id, title, content, author, tags, status }) => {
    try {
      const existingItem = contentStore.get(id);
      
      if (!existingItem) {
        throw new Error(`Content not found: ${id}`);
      }
      
      const updatedItem: ContentItem = {
        ...existingItem,
        ...(title && { title }),
        ...(content && { content }),
        ...(author && { author }),
        ...(tags && { tags }),
        ...(status && { status }),
        updatedAt: new Date().toISOString()
      };
      
      contentStore.set(id, updatedItem);
      
      return {
        content: [{
          type: 'text',
          text: `Content updated successfully:
ID: ${id}
Type: ${updatedItem.type}
Title: ${updatedItem.title}
Author: ${updatedItem.author}
Status: ${updatedItem.status}
Tags: ${updatedItem.tags.join(', ')}
Updated: ${updatedItem.updatedAt}`
        }]
      };
    } catch (error) {
      throw new Error(`Content update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

server.registerTool(
  'content-delete',
  {
    title: 'Content Delete Tool',
    description: 'Delete content items',
    inputSchema: {
      id: z.string().describe('Content ID to delete'),
      force: z.boolean().optional().default(false).describe('Force delete without confirmation')
    }
  },
  async ({ id, force = false }) => {
    try {
      const existingItem = contentStore.get(id);
      
      if (!existingItem) {
        throw new Error(`Content not found: ${id}`);
      }
      
      if (existingItem.status === 'published' && !force) {
        throw new Error(`Cannot delete published content without force flag: ${id}`);
      }
      
      contentStore.delete(id);
      
      return {
        content: [{
          type: 'text',
          text: `Content deleted successfully:
ID: ${id}
Type: ${existingItem.type}
Title: ${existingItem.title}
Status: ${existingItem.status}
Deleted at: ${new Date().toISOString()}`
        }]
      };
    } catch (error) {
      throw new Error(`Content deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// 會話管理工具
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
              text: `Active sessions: ${sessions.size}
Session cleanup runs every 5 minutes
Max inactive time: 30 minutes`
            }]
          };
        case 'list':
          const sessionList = Array.from(sessions.values()).map(session => 
            `ID: ${session.id.substring(0, 8)}...
Started: ${session.startTime.toISOString()}
Last Activity: ${session.lastActivity.toISOString()}
Client: ${session.clientInfo?.name || 'Unknown'} ${session.clientInfo?.version || ''}`
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
              text: `Session cleanup completed
Sessions before: ${beforeCount}
Sessions after: ${afterCount}
Cleaned up: ${beforeCount - afterCount} inactive sessions`
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

// ===== 資源註冊 (來自練習 2 和 7) =====

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
        resources: {
          subscribe: false,
          listChanged: false
        },
        tools: {
          listChanged: false
        },
        prompts: {
          listChanged: false
        }
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

// 練習 2: 幫助信息資源
server.registerResource(
  'help-info',
  'help://info',
  {
    title: 'Help Information',
    description: 'Available tools and usage information',
    mimeType: 'text/markdown'
  },
  async () => {
    const helpContent = `# HTTP Transport Server Help

## Available Tools

### Basic Tools
- **echo**: Echo back input messages
- **calculate**: Perform mathematical calculations
- **text-transform**: Transform text (uppercase, lowercase, reverse, length)
- **timestamp**: Generate timestamps in various formats

### File Operations
- **file-read**: Read local files from data directory
- **file-write**: Write content to local files in data directory

### Network Operations  
- **http-fetch**: Perform HTTP requests (simulated)
- **data-process**: Process and analyze JSON data

### Content Management
- **content-create**: Create new content items
- **content-update**: Update existing content items
- **content-delete**: Delete content items

### Session Management
- **session-info**: Get session information and manage sessions

## Available Resources

### Static Resources
- **config://server**: Server configuration and status
- **help://info**: This help information

### Dynamic Resources
- **content://**: List all content
- **content://{type}**: List content by type (article, blog, documentation, note)
- **content://{type}/{id}**: Get specific content item

## Available Prompts

### Development Prompts
- **code-review**: Generate code review prompts
- **documentation**: Generate documentation prompts
- **bug-report**: Generate bug report prompts
- **meeting-summary**: Generate meeting summary prompts

### Content Prompts
- **content-generation**: Generate content creation prompts
- **content-optimization**: Generate content optimization prompts

## Transport Options

### stdio Transport (Default)
\`\`\`bash
node dist/solutions/08-http-transport/server.js
\`\`\`

### HTTP Transport
\`\`\`bash
node dist/solutions/08-http-transport/server.js --http
# Server will start on http://localhost:3000
\`\`\`

## Usage Examples

### Echo Tool
\`\`\`json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "echo",
    "arguments": { "message": "Hello World!" }
  }
}
\`\`\`

### Content Creation
\`\`\`json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "content-create",
    "arguments": {
      "type": "article",
      "title": "My Article",
      "content": "Article content here",
      "author": "Author Name"
    }
  }
}
\`\`\`

### Resource Access
\`\`\`json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "resources/read",
  "params": {
    "uri": "content://article"
  }
}
\`\`\`

## Session Management

- Sessions are automatically created for HTTP connections
- Sessions expire after 30 minutes of inactivity
- Session cleanup runs every 5 minutes
- Use **session-info** tool to monitor sessions

## Error Handling

- All tools include comprehensive error handling
- HTTP transport includes session management errors
- File operations include path traversal protection
- Content operations include validation and state checking
`;
    
    return {
      contents: [{
        uri: 'help://info',
        text: helpContent,
        mimeType: 'text/markdown'
      }]
    };
  }
);

// 練習 7: 動態內容資源
server.registerResource(
  'content',
  new ResourceTemplate('content://{type}/{id}', { list: undefined }),
  {
    title: 'Content Resource',
    description: 'Access content items by type and ID',
    mimeType: 'application/json'
  },
  async (uri: URL) => {
    try {
      const urlPath = uri.pathname;
      const pathParts = urlPath.split('/').filter(Boolean);
      
      if (pathParts.length === 0) {
        // List all content: content://
        const allContent = Array.from(contentStore.values());
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              total: allContent.length,
              content: allContent
            }, null, 2),
            mimeType: 'application/json'
          }]
        };
      } else if (pathParts.length === 1) {
        // List content by type: content://article
        const [type] = pathParts;
        const contentByType = Array.from(contentStore.values())
          .filter(item => item.type === type);
        
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              type,
              total: contentByType.length,
              content: contentByType
            }, null, 2),
            mimeType: 'application/json'
          }]
        };
      } else if (pathParts.length === 2) {
        // Get specific content: content://article/123
        const [type, id] = pathParts;
        const content = contentStore.get(id);
        
        if (!content) {
          throw new Error(`Content not found: ${id}`);
        }
        
        if (content.type !== type) {
          throw new Error(`Content type mismatch: expected ${type}, got ${content.type}`);
        }
        
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(content, null, 2),
            mimeType: 'application/json'
          }]
        };
      } else {
        throw new Error('Invalid content URI format');
      }
    } catch (error) {
      throw new Error(`Content resource error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// 根級內容資源
server.registerResource(
  'content-root',
  'content://',
  {
    title: 'Content Root',
    description: 'Root content listing',
    mimeType: 'application/json'
  },
  async () => {
    const allContent = Array.from(contentStore.values());
    return {
      contents: [{
        uri: 'content://',
        text: JSON.stringify({
          total: allContent.length,
          content: allContent
        }, null, 2),
        mimeType: 'application/json'
      }]
    };
  }
);

// ===== 提示註冊 (來自練習 6) =====

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
    const currentSeverity = severity || 'medium';
    const currentFocusAreas = focusAreas || 'code quality, security, performance';
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please perform a comprehensive code review for the following ${language} code:

**Code Context:**
${codeContext}

**Review Focus Areas:** ${currentFocusAreas}
**Review Severity Level:** ${currentSeverity}

**Please provide:**

1. **Code Quality Assessment**
   - Overall code structure and organization
   - Naming conventions and readability
   - Code complexity and maintainability

2. **Security Analysis**
   - Potential security vulnerabilities
   - Input validation and sanitization
   - Authentication and authorization issues

3. **Performance Considerations**
   - Algorithmic efficiency
   - Resource usage optimization
   - Potential bottlenecks

4. **Best Practices Compliance**
   - Language-specific best practices
   - Design pattern usage
   - Error handling mechanisms

5. **Specific Recommendations**
   - Priority-ranked improvement suggestions
   - Code refactoring opportunities
   - Testing recommendations

6. **Risk Assessment**
   - Critical issues requiring immediate attention
   - Medium-priority improvements
   - Nice-to-have enhancements

Please be thorough but constructive in your feedback, providing specific examples and actionable recommendations.`
          }
        }
      ]
    };
  }
);

// 文檔生成提示
server.registerPrompt(
  'documentation',
  {
    title: 'Documentation Generation Template',
    description: 'Generate comprehensive documentation prompts',
    argsSchema: {
      subject: z.string(),
      documentType: z.string().optional(),
      audience: z.string().optional(),
      detailLevel: z.string().optional()
    }
  },
  ({ subject, documentType, audience, detailLevel }) => {
    const currentDocType = documentType || 'user guide';
    const currentAudience = audience || 'general users';
    const currentDetailLevel = detailLevel || 'comprehensive';
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please create ${currentDetailLevel} ${currentDocType} documentation for: **${subject}**

**Documentation Specifications:**
- **Document Type:** ${currentDocType}
- **Target Audience:** ${currentAudience}
- **Detail Level:** ${currentDetailLevel}

**Required Sections:**

1. **Overview**
   - Brief introduction and purpose
   - Key features and benefits
   - Prerequisites and requirements

2. **Getting Started**
   - Installation/setup instructions
   - Quick start guide
   - Basic usage examples

3. **Detailed Usage**
   - Step-by-step procedures
   - Configuration options
   - Advanced features

4. **Examples and Use Cases**
   - Common scenarios
   - Code examples (if applicable)
   - Best practices

5. **Troubleshooting**
   - Common issues and solutions
   - Error messages and fixes
   - Support resources

6. **Reference**
   - API documentation (if applicable)
   - Configuration reference
   - Glossary of terms

**Documentation Standards:**
- Use clear, concise language appropriate for ${currentAudience}
- Include practical examples and screenshots where helpful
- Organize content with proper headings and structure
- Provide cross-references and links where applicable
- Ensure accuracy and completeness

Please create comprehensive, user-friendly documentation that serves as a complete resource for understanding and using ${subject}.`
          }
        }
      ]
    };
  }
);

// 錯誤報告提示
server.registerPrompt(
  'bug-report',
  {
    title: 'Bug Report Template',
    description: 'Generate structured bug report prompts',
    argsSchema: {
      application: z.string(),
      issueType: z.string().optional(),
      priority: z.string().optional(),
      environment: z.string().optional()
    }
  },
  ({ application, issueType, priority, environment }) => {
    const currentIssueType = issueType || 'functional bug';
    const currentPriority = priority || 'medium';
    const currentEnvironment = environment || 'production';
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help create a comprehensive bug report for: **${application}**

**Bug Report Details:**
- **Application:** ${application}
- **Issue Type:** ${currentIssueType}
- **Priority:** ${currentPriority}
- **Environment:** ${currentEnvironment}

**Required Information:**

1. **Bug Summary**
   - Clear, concise title describing the issue
   - Brief one-sentence summary

2. **Description**
   - Detailed description of the problem
   - What was expected vs. what actually happened
   - Impact on users or system functionality

3. **Steps to Reproduce**
   - Numbered, step-by-step instructions
   - Specific actions taken before the issue occurred
   - Any relevant input data or conditions

4. **Environment Details**
   - Operating system and version
   - Browser/application version
   - Hardware specifications (if relevant)
   - Network conditions (if relevant)

5. **Evidence**
   - Screenshots or screen recordings
   - Error messages or logs
   - Console output or debug information

6. **Additional Context**
   - Frequency of occurrence (always, sometimes, once)
   - Workarounds or temporary solutions
   - Related issues or recent changes

7. **Technical Analysis** (if applicable)
   - Suspected root cause
   - Affected components or modules
   - Potential fixes or investigation areas

**Bug Report Standards:**
- Use clear, objective language
- Provide specific details rather than general descriptions
- Include all relevant technical information
- Categorize severity appropriately

Please create a thorough, actionable bug report that will help developers quickly understand, reproduce, and fix the issue in ${application}.`
          }
        }
      ]
    };
  }
);

// 會議摘要提示
server.registerPrompt(
  'meeting-summary',
  {
    title: 'Meeting Summary Template',
    description: 'Generate structured meeting summary prompts',
    argsSchema: {
      meetingType: z.string(),
      duration: z.string().optional(),
      participants: z.string().optional(),
      topics: z.string().optional()
    }
  },
  ({ meetingType, duration, participants, topics }) => {
    const currentDuration = duration || '1 hour';
    const currentParticipants = participants || 'team members';
    const currentTopics = topics || 'project-related discussions';
    
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please create a comprehensive summary for this ${meetingType}:

**Meeting Details:**
- **Type:** ${meetingType}
- **Duration:** ${currentDuration}
- **Participants:** ${currentParticipants}
- **Main Topics:** ${currentTopics}

**Summary Structure:**

1. **Meeting Overview**
   - Meeting purpose and objectives
   - Date, time, and duration
   - List of attendees and their roles

2. **Key Discussion Points**
   - Major topics covered
   - Important decisions made
   - Concerns or issues raised

3. **Action Items**
   - Specific tasks assigned
   - Responsible parties
   - Due dates and deadlines
   - Priority levels

4. **Decisions Made**
   - Formal decisions and approvals
   - Voting results (if applicable)
   - Policy changes or updates

5. **Follow-up Items**
   - Information to be gathered
   - Research or investigation needed
   - Future meetings or discussions planned

6. **Key Outcomes**
   - Major achievements or progress
   - Problems solved or resolved
   - Next steps and milestones

7. **Open Issues**
   - Unresolved questions or concerns
   - Items requiring further discussion
   - Escalation needs

**Summary Guidelines:**
- Be objective and factual
- Use clear, professional language
- Highlight important decisions and commitments
- Include specific deadlines and responsibilities
- Focus on actionable outcomes

Please create a clear, actionable meeting summary that participants can reference for follow-up activities and accountability.`
          }
        }
      ]
    };
  }
);

// 內容生成提示 (來自練習 7)
server.registerPrompt(
  'content-generation',
  {
    title: 'Content Generation Template',
    description: 'Generate content based on specifications',
    argsSchema: {
      contentType: z.string(),
      topic: z.string(),
      targetAudience: z.string().optional(),
      length: z.string().optional(),
      tone: z.string().optional(),
      keywords: z.string().optional()
    }
  },
  ({ contentType, topic, targetAudience, length, tone, keywords }) => {
    const currentAudience = targetAudience || 'general';
    const currentLength = length || 'medium';
    const currentTone = tone || 'professional';
    const keywordList = keywords ? keywords.split(',').map(s => s.trim()) : [];

    const lengthGuidelines: Record<string, string> = {
      short: 'Keep it concise (200-500 words)',
      medium: 'Provide balanced coverage (500-1000 words)',
      long: 'Create comprehensive content (1000+ words)'
    };

    const toneGuidelines: Record<string, string> = {
      professional: 'Use formal, authoritative language',
      casual: 'Use conversational, friendly language',
      technical: 'Use precise, technical terminology',
      educational: 'Use clear, instructional language'
    };

    const keywordSection = keywordList.length > 0 
      ? `\n\n**Keywords to Include:** ${keywordList.join(', ')}`
      : '';

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please generate ${contentType} content on the topic: **${topic}**

**Content Specifications:**
- **Target Audience:** ${currentAudience}
- **Length:** ${currentLength} (${lengthGuidelines[currentLength] || 'As appropriate'})
- **Tone:** ${currentTone} (${toneGuidelines[currentTone] || 'Professional'})${keywordSection}

**Content Requirements:**
1. **Opening Hook** - Capture attention immediately
2. **Clear Structure** - Use headers and logical flow
3. **Value Proposition** - Explain why this matters to the audience
4. **Supporting Evidence** - Include examples, data, or credible sources
5. **Actionable Insights** - Provide practical takeaways
6. **Engaging Conclusion** - Summarize key points and next steps

**Additional Guidelines:**
- Make the content scannable with bullet points and short paragraphs
- Include relevant examples and use cases
- Optimize for the specified target audience
- Maintain the requested tone throughout
- Ensure the content is original and valuable

Please create compelling, well-structured content that meets these specifications.`
          }
        }
      ]
    };
  }
);

// 內容優化提示 (來自練習 7)
server.registerPrompt(
  'content-optimization',
  {
    title: 'Content Optimization Template',
    description: 'Optimize existing content for better performance',
    argsSchema: {
      contentText: z.string(),
      optimizationGoals: z.string().optional(),
      targetMetrics: z.string().optional(),
      currentIssues: z.string().optional()
    }
  },
  ({ contentText, optimizationGoals, targetMetrics, currentIssues }) => {
    const goals = optimizationGoals || 'readability, engagement, clarity';
    const metrics = targetMetrics || 'user engagement, comprehension, action rate';
    const issues = currentIssues || 'none specified';

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze and optimize the following content:

**Original Content:**
${contentText}

**Optimization Parameters:**
- **Goals:** ${goals}
- **Target Metrics:** ${metrics}
- **Current Issues:** ${issues}

**Please provide:**

1. **Content Analysis**
   - Strengths of the current content
   - Areas needing improvement
   - Readability assessment

2. **Optimization Recommendations**
   - Specific changes to improve clarity
   - Structural improvements
   - Language and tone adjustments

3. **SEO & Engagement Improvements**
   - Better headlines or hooks
   - Enhanced call-to-action elements
   - Keyword optimization opportunities

4. **Revised Content**
   - Provide an optimized version
   - Highlight key changes made
   - Explain the rationale for changes

5. **Performance Predictions**
   - Expected improvements in target metrics
   - Potential risks or trade-offs
   - Measurement recommendations

Please focus on making the content more effective for its intended purpose while maintaining its core message and value.`
          }
        }
      ]
    };
  }
);

// ===== HTTP 服務器設置 =====

function createExpressApp(): express.Application {
  const app = express();
  
  // 中間件
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
  
  // MCP 端點處理會在主函數中設置

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
  
  // 錯誤處理
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error('Express error:', err);
    res.status(500).json({
      error: 'Internal server error',
      message: err.message
    });
  });
  
  return app;
}

// 主函數
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
      
      // 會話存儲
      const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
      
      // 更新MCP端點處理
      app.post('/mcp', async (req, res) => {
        try {
          const sessionId = req.headers['mcp-session-id'] as string | undefined;
          let transport: StreamableHTTPServerTransport;
          
          if (sessionId && transports[sessionId]) {
            // 重用現有transport
            transport = transports[sessionId];
          } else {
            // 創建新transport
            transport = new StreamableHTTPServerTransport({
              sessionIdGenerator: () => randomUUID(),
              onsessioninitialized: (sessionId) => {
                transports[sessionId] = transport;
                createSession({ name: 'http-client', version: '1.0.0' });
                console.error(`New HTTP session created: ${sessionId}`);
              }
            });
            
            // 清理transport
            transport.onclose = () => {
              if (transport.sessionId) {
                delete transports[transport.sessionId];
                console.error(`HTTP session closed: ${transport.sessionId}`);
              }
            };
            
            await server.connect(transport);
          }
          
          await transport.handleRequest(req, res, req.body);
        } catch (error) {
          console.error('MCP request error:', error);
          res.status(500).json({ error: 'Internal server error' });
        }
      });
      
      // 啟動 HTTP 服務器
      app.listen(port, () => {
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
        process.exit(0);
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

// 啟動服務器
if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}

export { server, main };
