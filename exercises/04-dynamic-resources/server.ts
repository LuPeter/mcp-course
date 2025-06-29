#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * 練習 4: Dynamic Resources MCP Server
 * 
 * 目標：學習如何建立動態資源系統
 * 
 * 在這個練習中，我們會保留練習1-3的所有功能，並新增：
 * - 動態用戶個人檔案資源 (users://{userId}/profile)
 * - 動態文件內容資源 (files://{category}/{filename})
 * - 動態時區資訊資源 (time://{timezone})
 * 
 * 重點在於學習如何根據不同的參數動態生成資源內容。
 */

// TODO: 創建MCP服務器實例
// 提示：使用 McpServer 類別，需要 name 和 version
const server = new McpServer({
  name: 'FILL_IN_SERVER_NAME', // TODO: 將此替換為 'dynamic-resources-server'
  version: 'FILL_IN_VERSION' // TODO: 將此替換為 '1.0.0'
});

// TODO: 定義模擬用戶資料
// 提示：創建一個用戶物件，包含用戶ID作為key
// const users = {
//   '1': { name: 'Alice', email: 'alice@example.com', role: 'admin' },
//   '2': { name: 'Bob', email: 'bob@example.com', role: 'user' },
//   '3': { name: 'Charlie', email: 'charlie@example.com', role: 'user' }
// };

// TODO: 定義模擬文件資料
// 提示：創建一個文件物件，按分類組織
// const files = {
//   'docs': {
//     'guide.md': 'User Guide\n\n# Getting Started\n\nWelcome to our application!',
//     'api.md': 'API Documentation\n\n## Endpoints\n\n- GET /users\n- POST /users'
//   },
//   'config': {
//     'settings.json': '{\n  "theme": "dark",\n  "language": "en"\n}',
//     'database.json': '{\n  "host": "localhost",\n  "port": 5432\n}'
//   }
// };

// TODO: 定義可用時區列表
// 提示：創建一個時區字串陣列
// const availableTimezones = [
//   'Asia/Taipei', 'Asia/Tokyo', 'Asia/Shanghai', 'UTC', 
//   'America/New_York', 'America/Los_Angeles', 'Europe/London'
// ];

// TODO: 註冊用戶個人檔案動態資源
// 提示：使用迴圈為每個用戶註冊一個資源
// for (const userId of Object.keys(users)) {
//   server.registerResource(
//     `user-profile-${userId}`,
//     `users://${userId}/profile`,
//     {
//       title: `User ${userId} Profile`,
//       description: `Profile information for user ${userId}`,
//       mimeType: 'application/json'
//     },
//     async () => {
//       // TODO: 實作用戶個人檔案資源處理器
//       // 提示：獲取用戶資料並返回JSON格式
//       throw new Error('TODO: Implement user profile resource');
//     }
//   );
// }

// TODO: 註冊文件內容動態資源
// 提示：使用雙重迴圈為每個分類中的每個文件註冊資源
// for (const [category, categoryFiles] of Object.entries(files)) {
//   for (const [filename, content] of Object.entries(categoryFiles)) {
//     // TODO: 根據文件副檔名判斷MIME類型
//     // const mimeType = filename.endsWith('.json') ? 'application/json' : 
//     //                  filename.endsWith('.md') ? 'text/markdown' : 'text/plain';
//     
//     // server.registerResource(
//       // TODO: 完成文件資源註冊
//     // );
//   }
// }

// TODO: 註冊時區資訊動態資源
// 提示：使用迴圈為每個時區註冊一個資源
// for (const timezone of availableTimezones) {
//   server.registerResource(
//     `time-${timezone.replace(/[\/]/g, '-')}`, // 替換斜線為破折號
//     `time://${timezone}`,
//     {
//       title: `Time in ${timezone}`,
//       description: `Current time and timezone information for ${timezone}`,
//       mimeType: 'text/plain'
//     },
//     async () => {
//       // TODO: 實作時區資訊資源處理器
//       // 提示：使用 Date 物件和 toLocaleString 方法
//       throw new Error('TODO: Implement timezone resource');
//     }
//   );
// }

// TODO: 實作主函數
async function main() {
  try {
    // TODO: 創建stdio傳輸
    // const transport = new StdioServerTransport();
    
    // TODO: 連接服務器到傳輸
    // await server.connect(transport);
    
    // TODO: 輸出啟動成功訊息
    // console.error('Dynamic Resources MCP Server started successfully');
    // console.error(`Registered ${Object.keys(users).length} user profiles`);
    // console.error(`Registered ${Object.values(files).reduce((sum, cat) => sum + Object.keys(cat).length, 0)} files`);
    // console.error(`Registered ${availableTimezones.length} timezones`);
    
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