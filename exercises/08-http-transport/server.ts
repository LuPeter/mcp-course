#!/usr/bin/env node

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/http.js';
import { z } from 'zod';
// import express from 'express';
import fs from 'fs/promises';
import path from 'path';
// import http from 'http';
// import { randomUUID } from 'crypto';

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
// interface Session {
//   id: string;
//   startTime: Date;
//   lastActivity: Date;
//   clientInfo?: {
//     name: string;
//     version: string;
//   };
// }

// TODO: 創建會話存儲
// const sessions: Map<string, Session> = new Map();

// TODO: 模擬的HTTP響應數據 (來自練習5)
// const mockHttpResponses: { [key: string]: any } = {
//   'https://api.example.com/users': {
//     status: 200,
//     data: [
//       { id: 1, name: 'Alice', email: 'alice@example.com' },
//       { id: 2, name: 'Bob', email: 'bob@example.com' }
//     ]
//   },
//   'https://api.example.com/posts': {
//     status: 200,
//     data: [
//       { id: 1, title: 'Hello World', content: 'This is a test post' },
//       { id: 2, title: 'MCP Tutorial', content: 'Learning MCP is fun!' }
//     ]
//   },
//   'https://api.example.com/error': {
//     status: 500,
//     error: 'Internal Server Error'
//   }
// };

// TODO: 定義內容管理系統存儲 (來自練習7)
// interface ContentItem {
//   id: string;
//   type: 'article' | 'blog' | 'documentation' | 'note';
//   title: string;
//   content: string;
//   author: string;
//   createdAt: string;
//   updatedAt: string;
//   tags: string[];
//   status: 'draft' | 'published' | 'archived';
// }

// TODO: 創建內容存儲
// const contentStore: Map<string, ContentItem> = new Map();

// TODO: 初始化示例內容
// 提示：創建一些示例文章和博客項目

// TODO: 確保 data 目錄存在
// const dataDir = path.join(__dirname, 'data');
// async function ensureDataDir() {
//   try {
//     await fs.access(dataDir);
//   } catch {
//     await fs.mkdir(dataDir, { recursive: true });
//   }
// }

// TODO: 生成唯一 ID 函數
// function generateId(type: string): string {
//   const timestamp = Date.now();
//   const random = Math.random().toString(36).substring(2, 8);
//   return `${type}-${timestamp}-${random}`;
// }

// TODO: 會話管理工具函數
// function createSession(clientInfo?: { name: string; version: string }): string {
//   // 實作會話創建邏輯
//   throw new Error('TODO: Implement createSession function');
// }

// function updateSessionActivity(sessionId: string): void {
//   // 實作會話活動更新邏輯
//   throw new Error('TODO: Implement updateSessionActivity function');
// }

// function cleanupInactiveSessions(): void {
//   // 實作無效會話清理邏輯
//   throw new Error('TODO: Implement cleanupInactiveSessions function');
// }

// TODO: 定期清理無效會話
// setInterval(cleanupInactiveSessions, 5 * 60 * 1000); // 每5分鐘清理一次

// ===== 工具註冊 (整合所有前面練習) =====

// TODO: 註冊 echo 工具 (來自練習 1)
// server.registerTool(
//   'echo',
//   {
//     title: 'Echo Tool',
//     description: 'Echo back the input message',
//     inputSchema: {
//       message: z.string().describe('Message to echo back')
//     }
//   },
//   async ({ message }) => {
//     throw new Error('TODO: Implement echo tool');
//   }
// );

// TODO: 註冊計算工具 (來自練習 3)
// server.registerTool(
//   'calculate',
//   {
//     title: 'Calculate Tool',
//     description: 'Perform basic arithmetic calculations',
//     inputSchema: {
//       expression: z.string().describe('Mathematical expression to evaluate')
//     }
//   },
//   async ({ expression }) => {
//     throw new Error('TODO: Implement calculate tool');
//   }
// );

// TODO: 註冊文本轉換工具 (來自練習 3)
// server.registerTool(
//   'text-transform',
//   // TODO: 實作完整的工具配置和處理函數
//   async ({ text, operation }) => {
//     throw new Error('TODO: Implement text-transform tool');
//   }
// );

// TODO: 註冊時間戳工具 (來自練習 3)
// server.registerTool(
//   'timestamp',
//   // TODO: 實作完整的工具配置和處理函數
//   async ({ format }) => {
//     throw new Error('TODO: Implement timestamp tool');
//   }
// );

// TODO: 註冊文件讀取工具 (來自練習 5)
// server.registerTool(
//   'file-read',
//   // TODO: 實作完整的工具配置和處理函數
//   async ({ filename }) => {
//     throw new Error('TODO: Implement file-read tool');
//   }
// );

// TODO: 註冊文件寫入工具 (來自練習 5)
// server.registerTool(
//   'file-write',
//   // TODO: 實作完整的工具配置和處理函數
//   async ({ filename, content }) => {
//     throw new Error('TODO: Implement file-write tool');
//   }
// );

// TODO: 註冊 HTTP 獲取工具 (來自練習 5)
// server.registerTool(
//   'http-fetch',
//   // TODO: 實作完整的工具配置和處理函數
//   async ({ url, method }) => {
//     throw new Error('TODO: Implement http-fetch tool');
//   }
// );

// TODO: 註冊數據處理工具 (來自練習 5)
// server.registerTool(
//   'data-process',
//   // TODO: 實作完整的工具配置和處理函數
//   async ({ data, operation }) => {
//     throw new Error('TODO: Implement data-process tool');
//   }
// );

// TODO: 註冊內容管理工具 (來自練習 7)
// server.registerTool(
//   'content-create',
//   // TODO: 實作完整的工具配置和處理函數
//   async ({ type, title, content, author, tags, status }) => {
//     throw new Error('TODO: Implement content-create tool');
//   }
// );

// server.registerTool(
//   'content-update',
//   // TODO: 實作完整的工具配置和處理函數
//   async ({ id, title, content, author, tags, status }) => {
//     throw new Error('TODO: Implement content-update tool');
//   }
// );

// server.registerTool(
//   'content-delete',
//   // TODO: 實作完整的工具配置和處理函數
//   async ({ id, force }) => {
//     throw new Error('TODO: Implement content-delete tool');
//   }
// );

// TODO: 新增會話管理工具
// server.registerTool(
//   'session-info',
//   {
//     title: 'Session Information Tool',
//     description: 'Get information about current session and active sessions',
//     inputSchema: {
//       action: z.enum(['current', 'list', 'cleanup']).describe('Action to perform')
//     }
//   },
//   async ({ action }) => {
//     throw new Error('TODO: Implement session-info tool');
//   }
// );

// ===== 資源註冊 (來自練習 2 和 7) =====

// TODO: 註冊服務器配置資源 (來自練習 2)
// server.registerResource(
//   'server-config',
//   'config://server',
//   {
//     title: 'Server Configuration',
//     description: 'Current server configuration and status',
//     mimeType: 'application/json'
//   },
//   async () => {
//     throw new Error('TODO: Implement server-config resource');
//   }
// );

// TODO: 註冊幫助信息資源 (來自練習 2)
// server.registerResource(
//   'help-info',
//   'help://info',
//   {
//     title: 'Help Information',
//     description: 'Available tools and usage information',
//     mimeType: 'text/markdown'
//   },
//   async () => {
//     throw new Error('TODO: Implement help-info resource');
//   }
// );

// TODO: 註冊動態內容資源 (來自練習 7)
// server.registerResource(
//   'content',
//   new ResourceTemplate('content://{type}/{id}', { list: undefined }),
//   {
//     title: 'Content Resource',
//     description: 'Access content items by type and ID',
//     mimeType: 'application/json'
//   },
//   async (uri: URL) => {
//     throw new Error('TODO: Implement content resource');
//   }
// );

// TODO: 註冊根級內容資源
// server.registerResource(
//   'content-root',
//   'content://',
//   {
//     title: 'Content Root',
//     description: 'Root content listing',
//     mimeType: 'application/json'
//   },
//   async () => {
//     throw new Error('TODO: Implement content-root resource');
//   }
// );

// ===== 提示註冊 (來自練習 6) =====

// TODO: 註冊代碼審查提示
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
//     throw new Error('TODO: Implement code-review prompt');
//   }
// );

// TODO: 註冊文檔生成提示
// server.registerPrompt(
//   'documentation',
//   // TODO: 實作完整的提示配置和處理函數
//   ({ subject, documentType, audience, detailLevel }) => {
//     throw new Error('TODO: Implement documentation prompt');
//   }
// );

// TODO: 註冊錯誤報告提示
// server.registerPrompt(
//   'bug-report',
//   // TODO: 實作完整的提示配置和處理函數
//   ({ application, issueType, priority, environment }) => {
//     throw new Error('TODO: Implement bug-report prompt');
//   }
// );

// TODO: 註冊會議摘要提示
// server.registerPrompt(
//   'meeting-summary',
//   // TODO: 實作完整的提示配置和處理函數
//   ({ meetingType, duration, participants, topics }) => {
//     throw new Error('TODO: Implement meeting-summary prompt');
//   }
// );

// TODO: 註冊內容生成提示 (來自練習 7)
// server.registerPrompt(
//   'content-generation',
//   // TODO: 實作完整的提示配置和處理函數
//   ({ contentType, topic, targetAudience, length, tone, keywords }) => {
//     throw new Error('TODO: Implement content-generation prompt');
//   }
// );

// TODO: 註冊內容優化提示 (來自練習 7)
// server.registerPrompt(
//   'content-optimization',
//   // TODO: 實作完整的提示配置和處理函數
//   ({ contentText, optimizationGoals, targetMetrics, currentIssues }) => {
//     throw new Error('TODO: Implement content-optimization prompt');
//   }
// );

// ===== HTTP 服務器設置 =====

// TODO: 創建 Express 應用程序
// function createExpressApp(): express.Application {
//   const app = express();
//   
//   // TODO: 添加中間件
//   // app.use(express.json({ limit: '10mb' }));
//   // app.use(express.urlencoded({ extended: true }));
//   
//   // TODO: 添加 CORS 支援
//   // app.use((req, res, next) => {
//   //   res.header('Access-Control-Allow-Origin', '*');
//   //   res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
//   //   res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
//   //   
//   //   if (req.method === 'OPTIONS') {
//   //     res.sendStatus(200);
//   //   } else {
//   //     next();
//   //   }
//   // });
//   
//   // TODO: 添加健康檢查端點
//   // app.get('/health', (req, res) => {
//   //   res.json({
//   //     status: 'healthy',
//   //     timestamp: new Date().toISOString(),
//   //     uptime: process.uptime(),
//   //     activeSessions: sessions.size,
//   //     version: '1.0.0'
//   //   });
//   // });
//   
//   // TODO: 添加錯誤處理
//   // app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
//   //   console.error('Express error:', err);
//   //   res.status(500).json({
//   //     error: 'Internal server error',
//   //     message: err.message
//   //   });
//   // });
//   
//   return app;
// }

// TODO: 實作主函數
async function main() {
  try {
    // TODO: 確保數據目錄存在
    // await ensureDataDir();
    
    // TODO: 檢查命令行參數決定傳輸方式
    // const useHttp = process.argv.includes('--http');
    // const port = parseInt(process.env.PORT || '3000');
    
    // if (useHttp) {
    //   // TODO: HTTP 傳輸模式
    //   console.error('Starting HTTP transport server...');
    //   
    //   // TODO: 創建 Express 應用
    //   const app = createExpressApp();
    //   const httpServer = http.createServer(app);
    //   
    //   // TODO: 創建 StreamableHTTPServerTransport
    //   const transport = new StreamableHTTPServerTransport({
    //     server: httpServer,
    //     path: '/mcp'
    //   });
    //   
    //   // TODO: 連接服務器到 HTTP 傳輸
    //   await server.connect(transport);
    //   
    //   // TODO: 啟動 HTTP 服務器
    //   httpServer.listen(port, () => {
    //     console.error(`HTTP Transport Server started successfully`);
    //     console.error(`HTTP server listening on port ${port}`);
    //     console.error(`MCP endpoint: http://localhost:${port}/mcp`);
    //     console.error(`Health check: http://localhost:${port}/health`);
    //     console.error(`Active sessions: ${sessions.size}`);
    //     console.error('Use Ctrl+C to stop the server');
    //   });
    //   
    //   // TODO: 優雅關閉
    //   process.on('SIGINT', () => {
    //     console.error('\nShutting down HTTP server...');
    //     httpServer.close(() => {
    //       console.error('HTTP server closed.');
    //       process.exit(0);
    //     });
    //   });
    //   
    // } else {
    //   // TODO: stdio 傳輸模式 (默認)
    //   console.error('Starting stdio transport server...');
    //   
    //   const transport = new StdioServerTransport();
    //   await server.connect(transport);
    //   
    //   console.error('Stdio Transport Server started successfully');
    //   console.error('Server is ready to receive JSON-RPC messages via stdio');
    // }
    
    // TODO: 創建stdio傳輸
    // const transport = new StdioServerTransport();
    
    // TODO: 連接服務器到傳輸  
    // await server.connect(transport);
    
    // TODO: 輸出啟動成功訊息（使用console.error避免干擾stdio）
    // console.error('HTTP Transport Server started successfully');
    
    throw new Error('TODO: Implement main function');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// TODO: 啟動服務器
// 提示：檢查是否為主模組，然後調用main()
if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}

// TODO: 導出服務器和主函數
// export { server, main };
