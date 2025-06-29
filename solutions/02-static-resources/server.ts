#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * 練習 2: Static Resources MCP Server
 * 
 * 這個練習展示如何註冊和提供靜態資源，包括：
 * - 應用程式配置資源
 * - 說明文件資源
 * - 不同 MIME 類型的資源
 */

// 創建MCP服務器
const server = new McpServer({
  name: 'static-resources-server',
  version: '1.0.0'
});

// 註冊應用配置資源
server.registerResource(
  'config',
  'config://app',
  {
    title: 'Application Configuration',
    description: 'Application configuration data',
    mimeType: 'application/json'
  },
  async (uri: URL) => ({
    contents: [{
      uri: uri.href,
      text: JSON.stringify({
        name: 'Static Resources Demo',
        version: '1.0.0',
        environment: 'development',
        features: {
          logging: true,
          debugging: true,
          caching: false
        }
      }, null, 2),
      mimeType: 'application/json'
    }]
  })
);

// 註冊說明文件資源
server.registerResource(
  'help',
  'help://guide',
  {
    title: 'User Guide',
    description: 'Application user guide and documentation',
    mimeType: 'text/markdown'
  },
  async (uri: URL) => ({
    contents: [{
      uri: uri.href,
      text: `# Static Resources Demo

## Overview
This is a demonstration of MCP static resources.

## Available Resources
- **config://app** - Application configuration
- **help://guide** - This user guide
- **status://health** - System status

## Usage
Use the MCP client to read these resources and incorporate them into your context.
`,
      mimeType: 'text/markdown'
    }]
  })
);

// 註冊狀態資源
server.registerResource(
  'status',
  'status://health',
  {
    title: 'System Status',
    description: 'Current system health and status information',
    mimeType: 'text/plain'
  },
  async (uri: URL) => ({
    contents: [{
      uri: uri.href,
      text: `System Status: HEALTHY
Uptime: ${process.uptime().toFixed(2)} seconds
Memory Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB
Node.js Version: ${process.version}
Platform: ${process.platform}`,
      mimeType: 'text/plain'
    }]
  })
);

// 主函數
async function main() {
  try {
    // 創建stdio傳輸
    const transport = new StdioServerTransport();
    
    // 連接服務器到傳輸
    await server.connect(transport);
    
    // 服務器現在正在運行並監聽stdin/stdout
    console.error('Static Resources MCP Server started successfully');
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