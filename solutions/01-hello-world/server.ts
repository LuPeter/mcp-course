#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * 練習 1: Hello World MCP Server
 * 
 * 這是最基本的MCP服務器實作，提供：
 * - 一個簡單的echo工具
 * - 基本的錯誤處理
 * - stdio傳輸協議
 */

// 創建MCP服務器
const server = new McpServer({
  name: 'hello-world-server',
  version: '1.0.0'
});

// 註冊echo工具
server.registerTool(
  'echo',
  {
    title: 'Echo Tool',
    description: 'Echo back the input message'
  },
  async (args: any) => {
    const { message } = args;
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

// 主函數
async function main() {
  try {
    // 創建stdio傳輸
    const transport = new StdioServerTransport();
    
    // 連接服務器到傳輸
    await server.connect(transport);
    
    // 服務器現在正在運行並監聽stdin/stdout
    console.error('Hello World MCP Server started successfully');
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