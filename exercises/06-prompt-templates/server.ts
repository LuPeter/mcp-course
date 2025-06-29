#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
// TODO: 導入需要的模組（如果需要文件操作）
// import fs from 'fs/promises';
// import path from 'path';

/**
 * 練習 6: 提示模板系統
 * 
 * 目標：學習如何實作MCP提示模板系統
 * 
 * 在這個練習中，我們會保留練習1-5的所有功能，並新增：
 * - 代碼審查提示模板 (code-review)
 * - 文檔生成提示模板 (documentation)
 * - 錯誤報告提示模板 (bug-report)
 * - 會議總結提示模板 (meeting-summary)
 * - 提示參數自動完成功能
 * 
 * 重點在於學習提示模板的設計模式和參數化技巧。
 */

// TODO: 創建MCP服務器實例
const server = new McpServer({
  name: 'FILL_IN_SERVER_NAME', // TODO: 將此替換為 'prompt-templates-server'
  version: 'FILL_IN_VERSION' // TODO: 將此替換為 '1.0.0'
});

// TODO: 如果需要，定義模擬數據和配置
// const dataDir = path.join(__dirname, 'data');

// TODO: 註冊來自練習1-5的所有工具
// 包括：echo, calculate, text-transform, timestamp, file-read, file-write, http-fetch, data-process

// TODO: 註冊來自練習2的靜態資源
// 包括：server-config, help-info

// TODO: 註冊代碼審查提示模板
// server.registerPrompt(
//   'code-review',
//   {
//     title: 'Code Review Template',
//     description: 'Generate a structured code review prompt',
//     inputSchema: {
//       language: z.string().describe('Programming language of the code'),
//       codeContext: z.string().describe('Context or purpose of the code'),
//       focusAreas: z.array(z.string()).optional().describe('Specific areas to focus on'),
//       severity: z.enum(['low', 'medium', 'high']).optional().default('medium')
//     }
//   },
//   async ({ language, codeContext, focusAreas = [], severity = 'medium' }) => {
//     // TODO: 實作代碼審查提示生成
//     // 提示：
//     // 1. 根據嚴重程度設定不同的審查指導
//     // 2. 包含焦點領域的特殊說明
//     // 3. 生成結構化的審查提示
//     // 4. 返回格式化的消息陣列
//     
//     throw new Error('TODO: Implement code review prompt template');
//   }
// );

// TODO: 註冊文檔生成提示模板
// server.registerPrompt(
//   'documentation',
//   {
//     title: 'Documentation Template',
//     description: 'Generate documentation for code or APIs',
//     inputSchema: {
//       type: z.enum(['api', 'function', 'class', 'module', 'readme']),
//       name: z.string().describe('Name of the item to document'),
//       description: z.string().optional(),
//       includeExamples: z.boolean().optional().default(true),
//       targetAudience: z.enum(['developer', 'user', 'admin']).optional().default('developer')
//     }
//   },
//   async ({ type, name, description = '', includeExamples = true, targetAudience = 'developer' }) => {
//     // TODO: 實作文檔生成提示
//     // 提示：
//     // 1. 根據文檔類型調整結構
//     // 2. 針對不同受眾優化語言
//     // 3. 可選擇是否包含範例
//     // 4. 生成完整的文檔結構指導
//     
//     throw new Error('TODO: Implement documentation prompt template');
//   }
// );

// TODO: 註冊錯誤報告提示模板
// server.registerPrompt(
//   'bug-report',
//   {
//     title: 'Bug Report Template',
//     description: 'Generate a structured bug report template',
//     inputSchema: {
//       severity: z.enum(['critical', 'high', 'medium', 'low']),
//       component: z.string().describe('Component or module where the bug occurs'),
//       environment: z.string().optional(),
//       reproducible: z.boolean().optional().default(true),
//       userImpact: z.string().optional()
//     }
//   },
//   async ({ severity, component, environment = 'not specified', reproducible = true, userImpact = '' }) => {
//     // TODO: 實作錯誤報告提示生成
//     // 提示：
//     // 1. 根據嚴重程度設定優先級
//     // 2. 包含環境和重現資訊
//     // 3. 描述用戶影響
//     // 4. 生成結構化的報告模板
//     
//     throw new Error('TODO: Implement bug report prompt template');
//   }
// );

// TODO: 註冊會議總結提示模板
// server.registerPrompt(
//   'meeting-summary',
//   {
//     title: 'Meeting Summary Template',
//     description: 'Generate meeting summary and action items',
//     inputSchema: {
//       meetingType: z.enum(['standup', 'planning', 'retrospective', 'review', 'general']),
//       duration: z.number().optional(),
//       attendees: z.array(z.string()).optional(),
//       includeActionItems: z.boolean().optional().default(true),
//       includeDecisions: z.boolean().optional().default(true)
//     }
//   },
//   async ({ meetingType, duration, attendees = [], includeActionItems = true, includeDecisions = true }) => {
//     // TODO: 實作會議總結提示生成
//     // 提示：
//     // 1. 根據會議類型調整重點
//     // 2. 包含參與者和時間資訊
//     // 3. 可選擇包含行動項目和決定
//     // 4. 生成結構化的總結模板
//     
//     throw new Error('TODO: Implement meeting summary prompt template');
//   }
// );

// TODO: 實作主函數
async function main() {
  try {
    // TODO: 如果需要，確保數據目錄存在
    // await ensureDataDir();
    
    // TODO: 創建stdio傳輸
    // const transport = new StdioServerTransport();
    
    // TODO: 連接服務器到傳輸
    // await server.connect(transport);
    
    // TODO: 輸出啟動成功訊息
    // console.error('Prompt Templates MCP Server started successfully');
    // console.error('Available prompts: code-review, documentation, bug-report, meeting-summary');
    
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