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
  name: '', // TODO: 設定服務器名稱為 'static-resources-server'
  version: '' // TODO: 設定版本號為 '1.0.0'
});

// TODO: 註冊應用配置資源
// 提示：使用 server.registerResource() 方法
// 資源需要：
// - 名稱: 'config'
// - URI: 'config://app'
// - 元數據: title, description, mimeType
// - 處理函數返回JSON配置數據

// TODO: 註冊說明文件資源
// 提示：使用 server.registerResource() 方法
// 資源需要：
// - 名稱: 'help'
// - URI: 'help://guide'
// - 元數據: title, description, mimeType
// - 處理函數返回Markdown文檔

// TODO: 註冊系統狀態資源
// 提示：使用 server.registerResource() 方法
// 資源需要：
// - 名稱: 'status'
// - URI: 'status://health'
// - 元數據: title, description, mimeType
// - 處理函數返回系統狀態信息

// TODO: 實作主函數
async function main() {
  try {
    // TODO: 創建stdio傳輸
    // 提示：使用 StdioServerTransport
    
    // TODO: 連接服務器到傳輸
    // 提示：使用 server.connect()
    
    // TODO: 輸出啟動成功訊息（使用console.error避免干擾stdio）
    
  } catch (error) {
    // TODO: 錯誤處理
  }
}

// TODO: 啟動服務器
// 提示：檢查是否為主模組，然後調用main()
if (require.main === module) {
  main();
}