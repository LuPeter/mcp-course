#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
// TODO: 導入需要的模組
// import fs from 'fs/promises';
// import path from 'path';

/**
 * 練習 5: 複雜工具與錯誤處理
 * 
 * 目標：學習如何實作複雜的異步工具和完整的錯誤處理機制
 * 
 * 在這個練習中，我們會保留練習1-4的所有功能，並新增：
 * - 異步文件操作工具 (file-read, file-write)
 * - HTTP 請求模擬工具 (http-fetch)
 * - 數據處理工具 (data-process)
 * - 完整的錯誤分類和處理機制
 * 
 * 重點在於學習異步操作、錯誤處理和安全性考量。
 */

// TODO: 創建MCP服務器實例
const server = new McpServer({
  name: 'FILL_IN_SERVER_NAME', // TODO: 將此替換為 'complex-tools-server'
  version: 'FILL_IN_VERSION' // TODO: 將此替換為 '1.0.0'
});

// TODO: 定義模擬HTTP響應數據
// const mockHttpResponses: { [key: string]: any } = {
//   'https://api.example.com/users': {
//     status: 200,
//     data: [
//       { id: 1, name: 'Alice', email: 'alice@example.com' },
//       { id: 2, name: 'Bob', email: 'bob@example.com' }
//     ]
//   },
//   // 更多模擬響應...
// };

// TODO: 設定數據目錄路徑
// const dataDir = path.join(__dirname, 'data');

// TODO: 確保數據目錄存在的函數
// async function ensureDataDir() {
//   try {
//     await fs.access(dataDir);
//   } catch {
//     await fs.mkdir(dataDir, { recursive: true });
//   }
// }

// TODO: 註冊echo工具 (來自練習1)
// server.registerTool(
//   'echo',
//   {
//     title: 'Echo Tool',
//     description: 'Echo back the input message',
//     inputSchema: { message: z.string() }
//   },
//   async ({ message }) => {
//     // TODO: 實作echo功能
//     throw new Error('TODO: Implement echo tool');
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
//   async () => {
//     // TODO: 實作服務器配置資源
//     throw new Error('TODO: Implement server config resource');
//   }
// );

// TODO: 註冊基本工具 (來自練習3)
// 包括：calculate, text-transform, timestamp

// TODO: 註冊文件讀取工具
// server.registerTool(
//   'file-read',
//   {
//     title: 'File Read Tool',
//     description: 'Read files from the data directory',
//     inputSchema: {
//       filename: z.string().describe('Name of the file to read'),
//       encoding: z.enum(['utf8', 'base64']).optional().default('utf8')
//     }
//   },
//   async ({ filename, encoding = 'utf8' }) => {
//     try {
//       // TODO: 實作文件讀取功能
//       // 提示：
//       // 1. 檢查文件名安全性（防止路徑遍歷）
//       // 2. 檢查文件是否存在
//       // 3. 讀取文件內容
//       // 4. 獲取文件統計信息
//       // 5. 返回格式化的結果
//       
//       throw new Error('TODO: Implement file read functionality');
//     } catch (error) {
//       // TODO: 適當的錯誤處理
//       throw new Error(`File read error: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }
// );

// TODO: 註冊文件寫入工具
// server.registerTool(
//   'file-write',
//   {
//     title: 'File Write Tool',
//     description: 'Write files to the data directory',
//     inputSchema: {
//       filename: z.string().describe('Name of the file to write'),
//       content: z.string().describe('Content to write'),
//       encoding: z.enum(['utf8', 'base64']).optional().default('utf8'),
//       overwrite: z.boolean().optional().default(false)
//     }
//   },
//   async ({ filename, content, encoding = 'utf8', overwrite = false }) => {
//     try {
//       // TODO: 實作文件寫入功能
//       // 提示：
//       // 1. 檢查文件名安全性
//       // 2. 檢查是否允許覆蓋
//       // 3. 寫入文件
//       // 4. 獲取寫入結果統計
//       // 5. 返回確認信息
//       
//       throw new Error('TODO: Implement file write functionality');
//     } catch (error) {
//       // TODO: 適當的錯誤處理
//       throw new Error(`File write error: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }
// );

// TODO: 註冊HTTP請求模擬工具
// server.registerTool(
//   'http-fetch',
//   {
//     title: 'HTTP Fetch Tool',
//     description: 'Simulate HTTP requests to mock endpoints',
//     inputSchema: {
//       url: z.string().url().describe('URL to fetch'),
//       method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional().default('GET'),
//       timeout: z.number().optional().default(5000)
//     }
//   },
//   async ({ url, method = 'GET', timeout = 5000 }) => {
//     try {
//       // TODO: 實作HTTP請求模擬
//       // 提示：
//       // 1. 模擬網路延遲
//       // 2. 檢查URL是否有模擬響應
//       // 3. 處理錯誤狀態碼
//       // 4. 返回模擬響應
//       
//       throw new Error('TODO: Implement HTTP fetch functionality');
//     } catch (error) {
//       // TODO: 適當的錯誤處理
//       throw new Error(`HTTP request error: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }
// );

// TODO: 註冊數據處理工具
// server.registerTool(
//   'data-process',
//   {
//     title: 'Data Processing Tool',
//     description: 'Process JSON data with various transformations',
//     inputSchema: {
//       data: z.string().describe('JSON data to process'),
//       operation: z.enum(['parse', 'stringify', 'filter', 'map', 'reduce']),
//       parameters: z.record(z.any()).optional()
//     }
//   },
//   async ({ data, operation, parameters = {} }) => {
//     try {
//       // TODO: 實作數據處理功能
//       // 提示：
//       // 1. 根據operation類型進行不同處理
//       // 2. parse: JSON.parse(data)
//       // 3. stringify: JSON.stringify with formatting
//       // 4. filter: 陣列過濾操作
//       // 5. map: 陣列映射操作
//       // 6. reduce: 陣列歸約操作
//       
//       throw new Error('TODO: Implement data processing functionality');
//     } catch (error) {
//       // TODO: 適當的錯誤處理
//       throw new Error(`Data processing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
//     }
//   }
// );

// TODO: 實作主函數
async function main() {
  try {
    // TODO: 確保數據目錄存在
    // await ensureDataDir();
    
    // TODO: 創建stdio傳輸
    // const transport = new StdioServerTransport();
    
    // TODO: 連接服務器到傳輸
    // await server.connect(transport);
    
    // TODO: 輸出啟動成功訊息
    // console.error('Complex Tools MCP Server started successfully');
    
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