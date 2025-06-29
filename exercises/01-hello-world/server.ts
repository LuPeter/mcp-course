#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

/**
 * 練習 1: Hello World MCP Server
 * 
 * 目標：建立最基本的MCP服務器，實作一個echo工具
 * 
 * 要實作的功能：
 * 1. 創建MCP服務器實例
 * 2. 註冊一個echo工具，將輸入的訊息原樣返回
 * 3. 連接stdio傳輸
 * 4. 基本的錯誤處理
 */

// TODO: 創建MCP服務器實例
// 提示：使用 McpServer 類別，需要 name 和 version
const server = new McpServer({
  name: 'FILL_IN_SERVER_NAME', // TODO: 將此替換為 'hello-world-server'
  version: 'FILL_IN_VERSION' // TODO: 將此替換為 '1.0.0'
});

// TODO: 註冊echo工具
// 提示：使用 server.registerTool() 方法
// server.registerTool(
//   'echo',
//   {
//     title: 'Echo Tool',
//     description: 'Echo back the input message',
//     inputSchema: { message: z.string() }
//   },
//   async ({ message }: { message: string }) => {
//     // TODO: 實作echo功能
//     // 提示：返回 { content: [{ type: 'text', text: `Echo: ${message}` }] }
//     throw new Error('TODO: Implement echo functionality');
//   }
// );

// TODO: 實作主函數
async function main() {
  try {
    // TODO: 創建stdio傳輸
    // const transport = new StdioServerTransport();
    
    // TODO: 連接服務器到傳輸  
    // await server.connect(transport);
    
    // TODO: 輸出啟動成功訊息（使用console.error避免干擾stdio）
    // console.error('Hello World MCP Server started successfully');
    
    throw new Error('TODO: Implement main function');
  } catch (error) {
    // TODO: 錯誤處理
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