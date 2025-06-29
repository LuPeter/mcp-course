#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

/**
 * 練習 3: Dynamic Resources MCP Server
 * 
 * 這個練習展示如何創建動態資源，根據資源URI的內容生成不同的資料。
 * 雖然不使用ResourceTemplate，但仍然可以實現動態的資源功能。
 * 
 * 提供的功能：
 * - 用戶個人檔案資源 (user-profile-{userId})
 * - 文件資源 (file-{category}-{filename})
 * - 時間資源 (time-{timezone})
 */

// 創建MCP服務器
const server = new McpServer({
  name: 'dynamic-resources-server',
  version: '1.0.0'
});

// 模擬用戶數據
const users = {
  '1': { name: 'Alice', email: 'alice@example.com', role: 'admin' },
  '2': { name: 'Bob', email: 'bob@example.com', role: 'user' },
  '3': { name: 'Charlie', email: 'charlie@example.com', role: 'user' }
};

// 模擬文件數據
const files = {
  'docs': {
    'guide.md': 'User Guide\n\n# Getting Started\n\nWelcome to our application!',
    'api.md': 'API Documentation\n\n## Endpoints\n\n- GET /users\n- POST /users'
  },
  'config': {
    'settings.json': '{\n  "theme": "dark",\n  "language": "en"\n}',
    'database.json': '{\n  "host": "localhost",\n  "port": 5432\n}'
  }
};

// 可用的時區列表
const availableTimezones = [
  'Asia/Taipei', 'Asia/Tokyo', 'Asia/Shanghai', 'UTC', 
  'America/New_York', 'America/Los_Angeles', 'Europe/London'
];

// 註冊用戶個人檔案動態資源
for (const userId of Object.keys(users)) {
  server.registerResource(
    `user-profile-${userId}`,
    `users://${userId}/profile`,
    {
      title: `User ${userId} Profile`,
      description: `Profile information for user ${userId}`,
      mimeType: 'application/json'
    },
    async () => {
      const user = users[userId as keyof typeof users];
      
      return {
        contents: [{
          uri: `users://${userId}/profile`,
          text: JSON.stringify({
            id: userId,
            name: user.name,
            email: user.email,
            role: user.role,
            lastLogin: new Date().toISOString(),
            profileComplete: true
          }, null, 2),
          mimeType: 'application/json'
        }]
      };
    }
  );
}

// 註冊文件內容動態資源
for (const [category, categoryFiles] of Object.entries(files)) {
  for (const [filename, content] of Object.entries(categoryFiles)) {
    const mimeType = filename.endsWith('.json') ? 'application/json' : 
                     filename.endsWith('.md') ? 'text/markdown' : 'text/plain';
    
    server.registerResource(
      `file-${category}-${filename}`,
      `files://${category}/${filename}`,
      {
        title: `File: ${category}/${filename}`,
        description: `Content of ${filename} from ${category} category`,
        mimeType
      },
      async () => ({
        contents: [{
          uri: `files://${category}/${filename}`,
          text: content,
          mimeType
        }]
      })
    );
  }
}

// 註冊時區資訊動態資源
for (const timezone of availableTimezones) {
  server.registerResource(
    `time-${timezone.replace(/[\/]/g, '-')}`, // 替換斜線為破折號用於資源名稱
    `time://${timezone}`,
    {
      title: `Time in ${timezone}`,
      description: `Current time and timezone information for ${timezone}`,
      mimeType: 'text/plain'
    },
    async () => {
      try {
        const now = new Date();
        const timeInTimezone = now.toLocaleString('en-US', { 
          timeZone: timezone,
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false
        });
        
        const utcTime = now.toUTCString();
        const offset = now.toLocaleString('en-US', { 
          timeZone: timezone, 
          timeZoneName: 'longOffset' 
        }).split(' ').pop();
        
        const content = `Timezone Information
==================

Timezone: ${timezone}
Current Time: ${timeInTimezone}
UTC Time: ${utcTime}
Offset: ${offset}
Timestamp: ${now.getTime()}`;
        
        return {
          contents: [{
            uri: `time://${timezone}`,
            text: content,
            mimeType: 'text/plain'
          }]
        };
      } catch (error) {
        throw new Error(`Error getting time for timezone: ${timezone}`);
      }
    }
  );
}

// 主函數
async function main() {
  try {
    // 創建stdio傳輸
    const transport = new StdioServerTransport();
    
    // 連接服務器到傳輸
    await server.connect(transport);
    
    // 服務器現在正在運行並監聽stdin/stdout
    console.error('Dynamic Resources MCP Server started successfully');
    console.error(`Registered ${Object.keys(users).length} user profiles`);
    console.error(`Registered ${Object.values(files).reduce((sum, cat) => sum + Object.keys(cat).length, 0)} files`);
    console.error(`Registered ${availableTimezones.length} timezones`);
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