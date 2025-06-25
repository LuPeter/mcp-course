#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

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
  // TODO: 設定服務器名稱和版本
});

// TODO: 註冊echo工具
// 提示：使用 server.registerTool() 方法
// 工具需要：
// - 名稱: 'echo'
// - 標題和描述
// - 處理函數，接收參數並返回結果

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