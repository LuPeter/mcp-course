#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

/**
 * 練習 7: 整合功能服務器
 * 
 * 本練習展示如何實作功能整合的MCP服務器，將資源、工具和提示協同工作
 * 
 * 新增功能：
 * - 內容管理系統模擬
 * - 跨功能數據流協同
 * - 內容CRUD操作
 * - 內容生成和優化提示
 */

// TODO: 創建MCP服務器實例
const server = new McpServer({
  name: 'FILL_IN_SERVER_NAME', // TODO: 將此替換為 'feature-integration-server'
  version: 'FILL_IN_VERSION' // TODO: 將此替換為 '1.0.0'
});

// TODO: 模擬的HTTP響應數據 (來自練習5)
const mockHttpResponses: { [key: string]: any } = {
  // TODO: 添加模擬數據
};

// TODO: 內容管理系統存儲
interface ContentItem {
  // TODO: 定義內容項目接口
  // id: string;
  // type: 'article' | 'blog' | 'documentation' | 'note';
  // title: string;
  // content: string;
  // author: string;
  // createdAt: string;
  // updatedAt: string;
  // tags: string[];
  // status: 'draft' | 'published' | 'archived';
}

// TODO: 內存存儲 (實際應用中會使用數據庫)
const contentStore: Map<string, ContentItem> = new Map();

// TODO: 初始化一些示例內容
// contentStore.set('article-1', {
//   id: 'article-1',
//   type: 'article',
//   title: 'MCP Protocol Overview',
//   content: 'The Model Context Protocol (MCP) is a standardized way for applications to provide context to LLMs.',
//   author: 'System',
//   createdAt: '2024-01-01T00:00:00Z',
//   updatedAt: '2024-01-01T00:00:00Z',
//   tags: ['mcp', 'protocol', 'overview'],
//   status: 'published'
// });

// 確保 data 目錄存在
const dataDir = path.join(__dirname, 'data');

async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// TODO: 生成唯一 ID
function generateId(type: string): string {
  // TODO: 實作 ID 生成邏輯
  // const timestamp = Date.now();
  // const random = Math.random().toString(36).substring(2, 8);
  // return `${type}-${timestamp}-${random}`;
  throw new Error('TODO: Implement generateId function');
}

// TODO: 註冊來自練習1-6的所有工具
// server.registerTool(
//   'echo',
//   {
//     title: 'Echo Tool',
//     description: 'Echo back the input message',
//     inputSchema: {
//       message: z.string().describe('The message to echo back')
//     }
//   },
//   async ({ message }) => ({
//     content: [{ type: 'text', text: `Echo: ${message}` }]
//   })
// );

// TODO: 新增內容管理工具
// server.registerTool(
//   'content-create',
//   {
//     title: 'Content Creation Tool',
//     description: 'Create new content items in the content management system',
//     inputSchema: {
//       type: z.enum(['article', 'blog', 'documentation', 'note']).describe('Type of content to create'),
//       title: z.string().describe('Title of the content'),
//       content: z.string().describe('Content body'),
//       author: z.string().describe('Author name'),
//       tags: z.array(z.string()).optional().default([]).describe('Content tags'),
//       status: z.enum(['draft', 'published', 'archived']).optional().default('draft').describe('Content status')
//     }
//   },
//   async ({ type, title, content, author, tags = [], status = 'draft' }) => {
//     // TODO: 實作內容創建邏輯
//     throw new Error('TODO: Implement content creation');
//   }
// );

// TODO: 註冊靜態資源 (來自練習2)
// server.registerResource(
//   'server-config',
//   'config://server',
//   {
//     title: 'Server Configuration',
//     description: 'Current server configuration',
//     mimeType: 'application/json'
//   },
//   async () => ({
//     contents: [{
//       uri: 'config://server',
//       text: JSON.stringify({
//         name: 'feature-integration-server',
//         version: '1.0.0',
//         features: ['tools', 'resources', 'prompts', 'content-management'],
//         maxConcurrency: 10,
//         timeout: 30000
//       }, null, 2),
//       mimeType: 'application/json'
//     }]
//   })
// );

// TODO: 新增動態內容資源
// server.registerResource(
//   'content',
//   'content://{type}/{id}',
//   {
//     title: 'Content Resource',
//     description: 'Access content items by type and ID',
//     mimeType: 'application/json'
//   },
//   async (uri) => {
//     // TODO: 實作內容資源邏輯
//     throw new Error('TODO: Implement content resource');
//   }
// );

// TODO: 註冊來自練習6的所有提示
// server.registerPrompt(
//   'code-review',
//   {
//     title: 'Code Review Template',
//     description: 'Generate a structured code review prompt',
//     argsSchema: {
//       language: z.string(),
//       codeContext: z.string(),
//       focusAreas: z.string().optional(),
//       severity: z.string().optional()
//     }
//   },
//   ({ language, codeContext, focusAreas, severity }) => {
//     // TODO: 實作代碼審查提示
//     throw new Error('TODO: Implement code review prompt');
//   }
// );

// TODO: 新增內容生成提示
// server.registerPrompt(
//   'content-generation',
//   {
//     title: 'Content Generation Template',
//     description: 'Generate content based on specifications',
//     argsSchema: {
//       contentType: z.string(),
//       topic: z.string(),
//       targetAudience: z.string().optional(),
//       length: z.string().optional(),
//       tone: z.string().optional(),
//       keywords: z.string().optional()
//     }
//   },
//   ({ contentType, topic, targetAudience, length, tone, keywords }) => {
//     // TODO: 實作內容生成提示
//     throw new Error('TODO: Implement content generation prompt');
//   }
// );

// TODO: 新增內容優化提示
// server.registerPrompt(
//   'content-optimization',
//   {
//     title: 'Content Optimization Template',
//     description: 'Optimize existing content for better performance',
//     argsSchema: {
//       contentText: z.string(),
//       optimizationGoals: z.string().optional(),
//       targetMetrics: z.string().optional(),
//       currentIssues: z.string().optional()
//     }
//   },
//   ({ contentText, optimizationGoals, targetMetrics, currentIssues }) => {
//     // TODO: 實作內容優化提示
//     throw new Error('TODO: Implement content optimization prompt');
//   }
// );

async function main() {
  try {
    // TODO: 確保數據目錄存在
    // await ensureDataDir();
    
    // TODO: 創建stdio傳輸
    // const transport = new StdioServerTransport();
    
    // TODO: 連接服務器到傳輸
    // await server.connect(transport);
    
    // TODO: 輸出啟動成功訊息
    // console.error('Feature Integration MCP Server started successfully');
    // console.error('Available tools: echo, calculate, text-transform, timestamp, file-read, file-write, http-fetch, data-process, content-create, content-update, content-delete');
    // console.error('Available resources: server-config, help-info, content');
    // console.error('Available prompts: code-review, documentation, bug-report, meeting-summary, content-generation, content-optimization');
    // console.error(`Data directory: ${dataDir}`);
    // console.error(`Initial content items: ${contentStore.size}`);
    
    throw new Error('TODO: Implement main function');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// TODO: 啟動服務器
if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}