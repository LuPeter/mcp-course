#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
// TODO: 導入 z 來自 zod 用於參數驗證
// 提示：從 'zod' 導入

/**
 * 練習 3: Basic Tools MCP Server
 * 
 * 目標：學習如何實作多種實用的MCP工具
 * 
 * 在這個練習中，我們會保留練習1和2的所有功能，並新增：
 * - calculate工具 (基本數學運算)
 * - text-transform工具 (文字轉換)
 * - timestamp工具 (時間戳生成和格式化)
 * 
 * 重點在於學習參數驗證和錯誤處理。
 */

// TODO: 創建MCP服務器實例
// 提示：使用 McpServer 類別，需要 name 和 version
const server = new McpServer({
  name: '', // TODO: 設定服務器名稱為 'basic-tools-server'
  version: '' // TODO: 設定版本號為 '1.0.0'
});

// TODO: 註冊echo工具 (來自練習1)
// 提示：使用 server.registerTool() 方法
// 工具需要：
// - 名稱: 'echo'
// - 配置對象包含 title, description, inputSchema
// - inputSchema: { message: z.string() }
// - 處理函數: async ({ message }) => {}

// TODO: 註冊calculate工具
// 提示：使用 server.registerTool() 方法
// 工具需要：
// - 名稱: 'calculate'
// - 配置對象包含 title, description, inputSchema
// - inputSchema: { 
//     operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
//     a: z.number(),
//     b: z.number()
//   }
// - 處理函數: async ({ operation, a, b }) => {}
// - 支援四則運算，注意除零錯誤處理

// TODO: 註冊text-transform工具
// 提示：使用 server.registerTool() 方法
// 工具需要：
// - 名稱: 'text-transform'
// - 配置對象包含 title, description, inputSchema
// - inputSchema: {
//     text: z.string(),
//     operation: z.enum(['uppercase', 'lowercase', 'reverse', 'capitalize', 'word-count'])
//   }
// - 處理函數: async ({ text, operation }) => {}
// - 支援多種文字轉換操作

// TODO: 註冊timestamp工具
// 提示：使用 server.registerTool() 方法
// 工具需要：
// - 名稱: 'timestamp'
// - 配置對象包含 title, description, inputSchema
// - inputSchema: {
//     action: z.enum(['current', 'format', 'parse']),
//     timestamp: z.number().optional(),
//     format: z.enum(['iso', 'unix', 'human', 'date-only', 'time-only']).optional()
//   }
// - 處理函數: async ({ action, timestamp, format }) => {}
// - 支援時間戳的生成、格式化和解析

// TODO: 註冊靜態資源 (來自練習2)
// 提示：註冊三個資源：config://app, help://guide, status://health
// 更新資源內容以反映新的工具功能

// TODO: 實作主函數
async function main() {
  try {
    // TODO: 創建stdio傳輸
    // 提示：使用 StdioServerTransport
    
    // TODO: 連接服務器到傳輸
    // 提示：使用 server.connect()
    
    // TODO: 輸出啟動成功訊息
    // 提示：使用console.error避免干擾stdio
    
  } catch (error) {
    // TODO: 錯誤處理
  }
}

// TODO: 啟動服務器
// 提示：檢查是否為主模組，然後調用main()
if (require.main === module) {
  main();
}