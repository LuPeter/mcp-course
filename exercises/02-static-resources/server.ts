#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * 練習 2: Static Resources MCP Server
 * 
 * 目標：學習如何註冊和提供靜態資源
 * 
 * 要實作的功能：
 * 1. 創建MCP服務器實例
 * 2. 註冊三個靜態資源：
 *    - config://app (JSON配置)
 *    - help://guide (Markdown說明)
 *    - status://health (純文本狀態)
 * 3. 連接stdio傳輸
 * 4. 基本的錯誤處理
 */

// TODO: 創建MCP服務器實例
// 提示：使用 McpServer 類別，需要 name 和 version
const server = new McpServer({
  name: 'FILL_IN_SERVER_NAME', // TODO: 將此替換為 'static-resources-server'
  version: 'FILL_IN_VERSION' // TODO: 將此替換為 '1.0.0'
});

// TODO: 註冊應用配置資源
// 提示：使用 server.registerResource() 方法
// server.registerResource(
//   'config',
//   'config://app',
//   {
//     title: 'Application Configuration',
//     description: 'Server configuration settings',
//     mimeType: 'application/json'
//   },
//   async () => {
//     // TODO: 返回配置JSON數據
//     throw new Error('TODO: Implement config resource');
//   }
// );

// TODO: 註冊說明文件資源
// server.registerResource(
//   'help',
//   'help://guide',
//   {
//     title: 'Help Guide',
//     description: 'User guide and documentation',
//     mimeType: 'text/markdown'
//   },
//   async () => {
//     // TODO: 返回說明文檔
//     throw new Error('TODO: Implement help resource');
//   }
// );

// TODO: 註冊系統狀態資源
// server.registerResource(
//   'status',
//   'status://health',
//   {
//     title: 'System Status',
//     description: 'Current system status and health',
//     mimeType: 'text/plain'
//   },
//   async () => {
//     // TODO: 返回狀態信息
//     throw new Error('TODO: Implement status resource');
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
    // console.error('Static Resources MCP Server started successfully');
    
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