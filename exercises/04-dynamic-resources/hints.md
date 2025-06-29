# 練習 4: 動態資源系統 - 提示和指導

## 開發提示

### 🎯 開始之前
1. **理解動態資源概念**: 一個資源註冊可以處理多個相似的資源請求
2. **設計URI模式**: 使用清晰的URI結構來表達資源階層
3. **規劃資料結構**: 組織好模擬資料，方便動態註冊

### 🔧 實作提示

#### 服務器初始化
```typescript
const server = new McpServer({
  name: 'dynamic-resources-server', // 替換 FILL_IN_SERVER_NAME
  version: '1.0.0' // 替換 FILL_IN_VERSION
});
```

#### 資料結構設計
```typescript
// 用戶資料 - 使用ID作為key方便查找
const users = {
  '1': { name: 'Alice', email: 'alice@example.com', role: 'admin' },
  '2': { name: 'Bob', email: 'bob@example.com', role: 'user' },
  '3': { name: 'Charlie', email: 'charlie@example.com', role: 'user' }
};

// 文件資料 - 按分類組織
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

// 時區列表
const availableTimezones = [
  'Asia/Taipei', 'Asia/Tokyo', 'Asia/Shanghai', 'UTC', 
  'America/New_York', 'America/Los_Angeles', 'Europe/London'
];
```

#### 動態用戶資源註冊
```typescript
for (const userId of Object.keys(users)) {
  server.registerResource(
    `user-profile-${userId}`,           // 資源名稱
    `users://${userId}/profile`,        // 資源URI
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
```

#### 動態文件資源註冊
```typescript
for (const [category, categoryFiles] of Object.entries(files)) {
  for (const [filename, content] of Object.entries(categoryFiles)) {
    // 根據副檔名判斷MIME類型
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
```

#### 動態時區資源註冊
```typescript
for (const timezone of availableTimezones) {
  server.registerResource(
    `time-${timezone.replace(/[\/]/g, '-')}`, // 替換斜線為破折號
    `time://${timezone}`,
    {
      title: `Time in ${timezone}`,
      description: `Current time and timezone information for ${timezone}`,
      mimeType: 'text/plain'
    },
    async () => {
      try {
        const now = new Date();
        
        // 獲取指定時區的時間
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
```

### 🐛 常見問題和解決方案

#### 問題1: 資源名稱衝突
**症狀**: 多個資源使用相同名稱
**解決方案**: 使用清晰的命名模式，如 `{type}-{param1}-{param2}`

#### 問題2: 特殊字符處理
**症狀**: URI包含不安全字符導致錯誤
**解決方案**: 
```typescript
const safeName = timezone.replace(/[\/]/g, '-').replace(/[^a-zA-Z0-9-]/g, '_');
```

#### 問題3: 時區處理錯誤
**症狀**: 無效時區名稱導致異常
**解決方案**: 添加try-catch處理和時區驗證

### 💡 實作技巧

#### 技巧1: MIME類型自動判斷
```typescript
function getMimeType(filename: string): string {
  if (filename.endsWith('.json')) return 'application/json';
  if (filename.endsWith('.md')) return 'text/markdown';
  if (filename.endsWith('.txt')) return 'text/plain';
  if (filename.endsWith('.html')) return 'text/html';
  return 'text/plain'; // 預設值
}
```

#### 技巧2: 統計資源數量
```typescript
async function main() {
  // ... 服務器啟動邏輯
  
  console.error('Dynamic Resources MCP Server started successfully');
  console.error(`Registered ${Object.keys(users).length} user profiles`);
  console.error(`Registered ${Object.values(files).reduce((sum, cat) => sum + Object.keys(cat).length, 0)} files`);
  console.error(`Registered ${availableTimezones.length} timezones`);
}
```

#### 技巧3: 資源URI設計原則
- 使用清晰的scheme（如 `users://`, `files://`, `time://`）
- 採用階層結構（如 `users/{id}/profile`）
- 避免特殊字符或正確轉義
- 保持一致性

### 🔍 除錯指導

#### 檢查資源註冊
```typescript
// 在註冊後添加日誌
console.error(`Registered resource: ${resourceName} with URI: ${uri}`);
```

#### 驗證資料結構
```typescript
// 檢查資料是否正確載入
console.error(`Loaded ${Object.keys(users).length} users`);
console.error(`Loaded ${Object.keys(files).length} file categories`);
```

#### 測試資源存取
```bash
# 使用MCP Inspector測試
npx @modelcontextprotocol/inspector node dist/exercises/04-dynamic-resources/server.js
```

### 📝 測試策略

#### 單步驗證
1. 先測試服務器啟動
2. 檢查資源列表
3. 測試各種資源讀取
4. 驗證錯誤處理

#### 完整測試
```bash
npm run build
npm run test:04
```

## 進階提示

### 效能最佳化
- 考慮資源內容快取
- 避免重複計算
- 最佳化資料結構存取

### 擴展性考量
- 設計可配置的資料來源
- 支援外部資料載入
- 考慮資源版本控制

## 下一步
完成本練習後，你將掌握：
1. 動態資源系統設計
2. 批量資源註冊技巧
3. 多種內容類型處理
4. URI模式設計原則

準備進入練習5：進階工具與錯誤處理！