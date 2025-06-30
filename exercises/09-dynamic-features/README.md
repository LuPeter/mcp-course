# 練習 9: 動態服務器功能

## 概述
這是 MCP 課程中最高級的練習，目標是實作具有動態插件系統、權限控制和自動通知機制的 MCP 服務器。這個練習將挑戰你對 MCP 協議的深度理解，特別是動態功能管理和通知機制。

**難度等級**: ⭐⭐⭐⭐⭐  
**預估完成時間**: 9-10 小時  
**前置要求**: 完成練習 1-8

## 學習目標

完成本練習後，你將能夠：

1. **動態插件系統**
   - 設計可擴展的插件架構
   - 實作運行時工具/資源載入和卸載
   - 管理插件依賴關係

2. **MCP 通知機制**
   - 理解 listChanged 自動通知原理
   - 實作多客戶端通知同步
   - 掌握通知觸發時機

3. **權限控制系統**
   - 設計階層式權限模型
   - 實作權限依賴自動處理
   - 管理會話級權限隔離

4. **企業級功能**
   - 插件管理工具開發
   - 權限管理工具開發
   - 系統監控和狀態管理

## 要實作的功能

### 1. 動態插件系統

實作三個模擬插件：

#### Weather Plugin
- **工具**: `get-weather`, `get-forecast`
- **資源**: `weather-data`
- **權限要求**: `http-fetch`

#### Database Plugin  
- **工具**: `db-query`, `db-backup`, `db-restore`
- **資源**: `schema-info`, `table-stats`
- **權限要求**: `admin`

#### Analysis Plugin
- **工具**: `analyze-data`, `create-chart`
- **資源**: `analysis-templates`
- **權限要求**: `read`, `write`

### 2. 權限控制系統

實作階層式權限模型：
```
read → write → file-ops
            ↓
       http-fetch
            ↓
      plugin-mgmt → admin
```

### 3. 管理工具

#### Plugin Manager Tool
- `list`: 顯示所有可用插件
- `load <plugin-id>`: 載入指定插件
- `unload <plugin-id>`: 卸載指定插件  
- `info <plugin-id>`: 獲取插件詳細信息

#### Permission Control Tool
- `list`: 顯示用戶權限
- `grant <permission>`: 授予權限
- `revoke <permission>`: 撤銷權限
- `check <permission>`: 檢查權限狀態

### 4. 繼承功能

保留前8個練習的所有功能：
- Echo, Calculate, Text-transform 工具
- File-read, File-write 工具
- HTTP-fetch, Content-create 工具
- 靜態資源和動態資源
- 代碼審查提示
- HTTP 傳輸支援
- 會話管理

## 實作步驟

### 第一階段：基礎架構 (2-3小時)

1. **權限系統設計**
   ```typescript
   // 實作權限檢查函數
   function hasPermission(sessionId: string, permission: string): boolean {
     // 檢查直接權限和admin權限
   }
   
   // 實作權限授予函數  
   function grantPermission(sessionId: string, permission: string): boolean {
     // 自動處理權限依賴
   }
   ```

2. **會話管理擴展**
   ```typescript
   interface Session {
     // 新增權限集合
     permissions: Set<string>;
     userId?: string;
   }
   ```

3. **插件系統框架**
   ```typescript
   interface Plugin {
     // 定義插件結構
   }
   
   const availablePlugins: Map<string, Plugin> = new Map();
   const plugins: Map<string, Plugin> = new Map();
   ```

### 第二階段：插件管理 (3-4小時)

1. **插件載入函數**
   ```typescript
   function loadPlugin(pluginId: string): boolean {
     // 1. 檢查插件存在
     // 2. 驗證依賴
     // 3. 動態註冊工具和資源
     // 4. 更新插件狀態
   }
   ```

2. **動態工具註冊**
   ```typescript
   function registerPluginTool(pluginId: string, toolName: string): void {
     // 使用 server.tool() 創建工具實例
     // 重要：這樣創建的工具支援 .enable()/.disable()/.remove()
   }
   ```

3. **插件卸載函數**
   ```typescript
   function unloadPlugin(pluginId: string): boolean {
     // 1. 移除所有工具 (toolInstance.remove())
     // 2. 清理資源
     // 3. 更新狀態
   }
   ```

### 第三階段：管理工具 (2-3小時)

1. **Plugin Manager 工具**
   ```typescript
   server.registerTool('plugin-manager', {
     // 實作插件管理邏輯
   }, async ({ action, pluginId, sessionId }) => {
     // 權限檢查 + 操作執行
   });
   ```

2. **Permission Control 工具**
   ```typescript
   server.registerTool('permission-control', {
     // 實作權限管理邏輯
   }, async ({ action, sessionId, permission }) => {
     // 權限驗證 + 權限操作
   });
   ```

### 第四階段：整合測試 (2小時)

1. **功能測試**
   - 插件載入/卸載
   - 權限授予/撤銷
   - 通知機制驗證

2. **HTTP 模式測試**
   - 多客戶端通知同步
   - 會話隔離
   - 併發操作

## 關鍵技術要點

### 1. 動態工具管理

**重要**: 使用 `server.tool()` 而非 `server.registerTool()`：

```typescript
// ✅ 正確：支援動態管理
const toolInstance = server.tool('tool-name', schema, handler);
toolInstance.enable();  // 啟用
toolInstance.disable(); // 禁用
toolInstance.remove();  // 移除 (自動觸發 listChanged)

// ❌ 錯誤：不支援動態管理
server.registerTool('tool-name', config, handler);
```

### 2. 自動通知機制

MCP SDK 會在以下情況自動發送 `listChanged` 通知：
- 工具啟用/禁用時
- 工具更新/移除時
- 資源新增/移除時

無需手動發送通知！

### 3. 權限依賴處理

```typescript
function grantPermission(sessionId: string, permission: string): boolean {
  const perm = availablePermissions.get(permission);
  
  // 自動授予依賴權限
  if (perm.dependencies) {
    for (const dep of perm.dependencies) {
      session.permissions.add(dep);
    }
  }
  
  session.permissions.add(permission);
}
```

### 4. 錯誤處理模式

```typescript
try {
  const success = loadPlugin(pluginId);
  if (!success) {
    return { content: [{ type: 'text', text: 'Plugin load failed' }] };
  }
} catch (error) {
  // 自動回滾部分載入的功能
  unloadPlugin(pluginId);
  throw error;
}
```

## 測試指南

### 基本功能測試

```bash
# 編譯
npm run build

# 運行服務器 (stdio模式)
npm run dev:09

# 使用 MCP Inspector 測試
npx @modelcontextprotocol/inspector node dist/exercises/09-dynamic-features/server.js
```

### HTTP 模式測試

```bash
# 啟動 HTTP 服務器
node dist/exercises/09-dynamic-features/server.js --http

# 在新終端中運行客戶端測試
```

### 插件管理測試

1. **列出可用插件**
   ```json
   {
     "method": "tools/call",
     "params": {
       "name": "plugin-manager",
       "arguments": {"action": "list"}
     }
   }
   ```

2. **載入天氣插件**
   ```json
   {
     "method": "tools/call", 
     "params": {
       "name": "plugin-manager",
       "arguments": {
         "action": "load",
         "pluginId": "weather-plugin"
       }
     }
   }
   ```

3. **驗證工具列表更新**
   ```json
   {
     "method": "tools/list"
   }
   ```

### 權限管理測試

1. **檢查當前權限**
   ```json
   {
     "method": "tools/call",
     "params": {
       "name": "permission-control", 
       "arguments": {
         "action": "list",
         "sessionId": "your-session-id"
       }
     }
   }
   ```

2. **授予權限**
   ```json
   {
     "method": "tools/call",
     "params": {
       "name": "permission-control",
       "arguments": {
         "action": "grant", 
         "permission": "http-fetch",
         "sessionId": "your-session-id"
       }
     }
   }
   ```

## 常見問題

### Q: 插件載入後客戶端沒看到新工具？
A: 檢查是否使用了 `server.tool()` 方法創建工具實例，而不是 `server.registerTool()`。只有前者支援動態管理和自動通知。

### Q: 權限檢查失敗？
A: 確保權限依賴關係正確實作，檢查 `grantPermission` 函數是否自動授予了前置權限。

### Q: 插件卸載後工具仍然可用？
A: 確保調用了工具實例的 `remove()` 方法，並清理了 `pluginTools` Map。

### Q: 通知機制不工作？
A: 檢查是否使用了 MCP SDK 提供的動態方法（如 `toolInstance.remove()`），這些方法會自動觸發通知。

### Q: HTTP 模式下多客戶端不同步？
A: 確保會話管理正確實作，每個客戶端都在活躍會話列表中。

## 提示

1. **閱讀solutions中的完整實作** - 理解整體架構設計
2. **逐步實作** - 先實作基礎功能，再添加高級特性
3. **測試驅動** - 每實作一個功能立即測試
4. **關注通知** - 注意觀察 listChanged 通知的觸發時機
5. **權限安全** - 確保權限檢查在所有需要的地方都實作

## 成功標準

完成後你的實作應該能夠：

- ✅ 動態載入和卸載插件
- ✅ 自動發送 listChanged 通知
- ✅ 正確管理權限階層和依賴
- ✅ 支援多客戶端同步
- ✅ 提供完整的管理工具
- ✅ 保持所有前置練習功能
- ✅ 支援 stdio 和 HTTP 傳輸模式

祝你完成這個富有挑戰性的練習！這將是你 MCP 開發技能的重要里程碑。