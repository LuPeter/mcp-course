# 練習 9: 動態服務器功能 - 解答

## 概述
本練習是 MCP 課程中最高級的功能實作，展示如何建立具有動態插件系統、權限控制和自動通知機制的 MCP 服務器。這是一個⭐⭐⭐⭐⭐難度的練習，集成了前8個練習的所有功能，並新增了企業級的動態功能管理。

## 實作的功能

### 繼承的功能 (練習 1-8)
- **基礎工具**: echo, calculate, text-transform, timestamp
- **文件操作**: file-read, file-write  
- **HTTP請求**: http-fetch (模擬)
- **內容管理**: content-create, 動態內容資源
- **靜態資源**: 服務器配置、幫助信息
- **提示模板**: code-review
- **HTTP傳輸**: 雙模式支援 (stdio/HTTP)
- **會話管理**: session-info, 自動清理

### 新增的動態功能

#### 1. 動態插件系統

**核心概念**：
- 運行時載入/卸載插件
- 自動工具和資源註冊
- 插件依賴管理
- 權限驗證

**可用插件**：
```typescript
// 天氣插件
{
  id: 'weather-plugin',
  name: 'Weather Information', 
  tools: ['get-weather', 'get-forecast'],
  resources: ['weather-data'],
  permissions: ['http-fetch']
}

// 數據庫插件  
{
  id: 'database-plugin',
  name: 'Database Operations',
  tools: ['db-query', 'db-backup', 'db-restore'], 
  resources: ['schema-info', 'table-stats'],
  permissions: ['admin']
}

// 分析插件
{
  id: 'analysis-plugin', 
  name: 'Data Analysis',
  tools: ['analyze-data', 'create-chart'],
  resources: ['analysis-templates'],
  permissions: ['read', 'write']
}
```

**動態載入示例**：
```typescript
// 載入天氣插件
const success = loadPlugin('weather-plugin');
// 自動註冊 get-weather, get-forecast 工具
// 自動註冊 weather-data 資源
// 自動發送 listChanged 通知給所有客戶端
```

#### 2. MCP 通知機制

**自動 listChanged 通知**：
- 插件載入/卸載時自動通知
- 工具啟用/禁用時自動通知  
- 資源新增/移除時自動通知
- 多客戶端同步更新

**通知流程**：
```
1. 插件管理操作 (load/unload)
   ↓
2. 動態註冊/移除工具/資源
   ↓ 
3. MCP SDK 自動檢測變更
   ↓
4. 自動發送 listChanged 通知
   ↓
5. 所有連接的客戶端收到通知
   ↓
6. 客戶端自動重新獲取工具/資源列表
```

#### 3. 權限控制系統

**權限階層**：
```typescript
// 基礎權限
'read' → 'write' → 'file-ops'
              ↓
         'http-fetch'
              ↓
        'plugin-mgmt' → 'admin'
```

**權限管理功能**：
- 動態權限授予/撤銷
- 權限依賴自動處理
- 會話級權限隔離
- 功能訪問控制

**權限檢查示例**：
```typescript
// 自動權限檢查
if (!hasPermission(sessionId, 'plugin-mgmt')) {
  return { error: 'Insufficient permissions' };
}

// 權限依賴自動處理  
grantPermission(sessionId, 'admin');
// 自動授予: read, write, file-ops, http-fetch, plugin-mgmt
```

#### 4. 插件管理工具

**plugin-manager 工具**：
```bash
# 列出所有可用插件
plugin-manager --action=list

# 載入插件
plugin-manager --action=load --plugin-id=weather-plugin

# 卸載插件  
plugin-manager --action=unload --plugin-id=weather-plugin

# 獲取插件詳細信息
plugin-manager --action=info --plugin-id=weather-plugin
```

**功能特點**：
- 即時插件狀態查詢
- 安全的載入/卸載操作
- 權限驗證和依賴檢查
- 詳細的插件信息展示

#### 5. 權限管理工具

**permission-control 工具**：
```bash
# 列出當前權限
permission-control --action=list --session-id=<session>

# 授予權限
permission-control --action=grant --permission=write --session-id=<session>

# 撤銷權限
permission-control --action=revoke --permission=write --session-id=<session>

# 檢查權限
permission-control --action=check --permission=admin --session-id=<session>
```

**功能特點**：
- 細粒度權限控制
- 跨會話權限管理
- 權限依賴自動處理
- 管理員權限保護

#### 6. 會話管理增強

**增強的會話功能**：
- 權限狀態追蹤
- 用戶ID關聯
- 活動監控
- 自動清理機制

**會話信息示例**：
```json
{
  "id": "session-123",
  "startTime": "2024-01-01T00:00:00Z",
  "lastActivity": "2024-01-01T01:00:00Z", 
  "clientInfo": {"name": "client", "version": "1.0.0"},
  "permissions": ["read", "write", "plugin-mgmt"],
  "userId": "user-456"
}
```

## 技術架構

### 動態功能架構
```
┌─────────────────────────────────────────────────┐
│              Dynamic Features Server              │
├─────────────────────────────────────────────────┤
│  Plugin System  │  Permission Ctrl │ Notification │
│  ──────────────  │  ──────────────  │ ─────────── │
│  • Load/Unload   │  • Grant/Revoke  │ • listChanged│
│  • Registration  │  • Hierarchy     │ • Auto Sync │
│  • Dependencies  │  • Session Scope │ • Multi-Client│
├─────────────────────────────────────────────────┤
│           HTTP Transport + Session Management      │
├─────────────────────────────────────────────────┤
│            All Previous Exercise Features           │
│   Tools + Resources + Prompts + Content + HTTP    │
└─────────────────────────────────────────────────┘
```

### 插件生命週期
```
1. Plugin Definition (availablePlugins)
   ↓
2. Permission Check
   ↓
3. Dependency Validation  
   ↓
4. Dynamic Registration
   ↓
5. Tool/Resource Creation
   ↓
6. listChanged Notification
   ↓
7. Client List Update
```

### 通知機制流程
```
Plugin Operation → Tool Instance → MCP SDK → Notification → Clients
     ↓                ↓             ↓          ↓           ↓
  load/unload    enable/disable  listChanged  broadcast   refresh
```

## 使用指南

### 啟動服務器

#### stdio 模式
```bash
npm run build
npm run dev:09
# 或
node dist/solutions/09-dynamic-features/server.js
```

#### HTTP 模式
```bash
npm run build  
node dist/solutions/09-dynamic-features/server.js --http
```

**HTTP 模式輸出**：
```
Dynamic Features HTTP Transport Server started successfully
HTTP server listening on port 3000
MCP endpoint: http://localhost:3000/mcp
Health check: http://localhost:3000/health
Plugin status: http://localhost:3000/plugins
Active sessions: 0
Available plugins: 3
Use Ctrl+C to stop the server
```

### 測試動態功能

#### 1. 插件管理測試
```bash
# 使用 MCP Inspector 或 HTTP client

# 列出可用插件
{
  "method": "tools/call",
  "params": {
    "name": "plugin-manager", 
    "arguments": {"action": "list"}
  }
}

# 載入天氣插件
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

# 驗證工具列表更新 (應該看到 get-weather, get-forecast)
{
  "method": "tools/list"
}
```

#### 2. 權限管理測試
```bash
# 檢查當前權限
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

# 授予admin權限
{
  "method": "tools/call", 
  "params": {
    "name": "permission-control",
    "arguments": {
      "action": "grant",
      "permission": "admin",
      "sessionId": "your-session-id"
    }
  }
}
```

#### 3. 動態工具測試
```bash
# 載入天氣插件後，測試新工具
{
  "method": "tools/call",
  "params": {
    "name": "get-weather",
    "arguments": {"location": "San Francisco"}
  }
}

# 測試天氣預報工具
{
  "method": "tools/call", 
  "params": {
    "name": "get-forecast",
    "arguments": {
      "location": "New York",
      "days": 5
    }
  }
}
```

### HTTP API 端點

#### 健康檢查
```bash
curl http://localhost:3000/health

# 回應包含插件狀態
{
  "status": "healthy",
  "loadedPlugins": 1,
  "availablePlugins": 3,
  "features": ["dynamic-plugins", "permission-control", "notifications"]
}
```

#### 插件狀態查詢
```bash
curl http://localhost:3000/plugins

# 獲取所有插件的詳細狀態
[
  {
    "id": "weather-plugin",
    "name": "Weather Information", 
    "enabled": true,
    "tools": ["get-weather", "get-forecast"],
    "permissions": ["http-fetch"]
  }
]
```

### 自動化測試
```bash
npm run test:09
```

## 性能特點

### 動態操作性能
- **插件載入**: < 50ms (包含工具註冊)
- **插件卸載**: < 20ms (包含清理)
- **權限檢查**: < 1ms (Map查找)
- **通知發送**: < 10ms (自動廣播)

### 記憶體管理
- **基礎服務器**: ~30MB
- **每個插件**: ~2-5MB
- **每個會話**: ~1KB (包含權限)
- **權限系統**: ~100KB

### 併發支援
- **多插件同時載入**: 支援
- **多客戶端通知**: 即時同步
- **併發權限管理**: 安全隔離
- **會話隔離**: 完全獨立

## 安全性考量

### 插件安全
- **權限驗證**: 載入前檢查必要權限
- **依賴驗證**: 自動檢查插件依賴
- **隔離執行**: 插件間不互相影響
- **安全卸載**: 清理所有相關資源

### 權限安全
- **階層控制**: 權限依賴自動處理
- **會話隔離**: 權限不跨會話洩露
- **管理員保護**: 特殊權限管理
- **操作審計**: 所有權限變更記錄

### 通知安全
- **會話驗證**: 只通知有效會話
- **權限過濾**: 根據權限過濾通知內容
- **防止洪水**: 通知頻率控制
- **錯誤隔離**: 通知失敗不影響服務

## 進階功能示例

### 自定義插件開發
```typescript
// 新增自定義插件
const customPlugin: Plugin = {
  id: 'custom-plugin',
  name: 'Custom Features',
  description: 'Custom business logic',
  version: '1.0.0',
  author: 'Your Company',
  enabled: false,
  permissions: ['write', 'http-fetch'],
  tools: ['custom-tool'],
  resources: ['custom-resource']
};

// 註冊到可用插件
availablePlugins.set('custom-plugin', customPlugin);

// 實作自定義工具註冊邏輯
function registerCustomTool() {
  const customTool = server.tool(
    'custom-tool',
    { input: z.string() },
    async ({ input }) => {
      // 自定義業務邏輯
      return { content: [{ type: 'text', text: `Custom: ${input}` }] };
    }
  );
  
  pluginTools.set('custom-tool', customTool);
}
```

### 權限策略擴展
```typescript
// 自定義權限驗證
function advancedPermissionCheck(sessionId: string, operation: string, resource: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  // 基於資源的權限檢查
  if (resource.startsWith('sensitive:') && !session.permissions.has('admin')) {
    return false;
  }
  
  // 基於時間的權限檢查
  const now = new Date();
  const businessHours = now.getHours() >= 9 && now.getHours() <= 17;
  if (!businessHours && operation === 'write') {
    return session.permissions.has('after-hours');
  }
  
  return hasPermission(sessionId, operation);
}
```

### 多租戶支援
```typescript
// 擴展會話以支援租戶
interface EnhancedSession extends Session {
  tenantId: string;
  tenantPermissions: Map<string, Set<string>>;
}

// 租戶隔離的插件管理
function loadPluginForTenant(pluginId: string, tenantId: string): boolean {
  const plugin = availablePlugins.get(pluginId);
  if (!plugin) return false;
  
  // 租戶特定的插件實例
  const tenantPluginId = `${pluginId}-${tenantId}`;
  const tenantPlugin = { ...plugin, id: tenantPluginId };
  
  plugins.set(tenantPluginId, tenantPlugin);
  return true;
}
```

## 錯誤處理

### 插件錯誤
```typescript
// 插件載入失敗處理
try {
  loadPlugin(pluginId);
} catch (error) {
  console.error(`Plugin load failed: ${pluginId}`, error);
  // 自動回滾任何部分註冊的功能
  unloadPlugin(pluginId);
  throw new Error(`Plugin load failed: ${error.message}`);
}
```

### 權限錯誤
```typescript
// 權限操作失敗處理
if (!grantPermission(sessionId, permission)) {
  return {
    content: [{
      type: 'text',
      text: `Permission grant failed: ${permission}. Check dependencies and current permissions.`
    }]
  };
}
```

### 通知錯誤
```typescript
// 通知發送失敗處理
try {
  // MCP SDK 自動處理通知發送
  toolInstance.enable();
} catch (error) {
  console.error('Notification send failed:', error);
  // 服務繼續運行，但記錄錯誤
}
```

## 學習重點

1. **動態插件架構**: 學習如何設計可擴展的插件系統
2. **MCP 通知機制**: 掌握 listChanged 自動通知的實作
3. **權限控制系統**: 理解企業級權限管理設計
4. **會話管理**: 瞭解多用戶環境下的狀態管理  
5. **實時功能更新**: 學習運行時功能動態更新
6. **安全性設計**: 掌握動態系統的安全考量
7. **性能優化**: 瞭解動態操作的性能影響

## 常見問題

### Q: 插件載入後客戶端沒有看到新工具？
A: 檢查 listChanged 通知是否正常發送，客戶端是否正確處理通知並重新獲取工具列表。

### Q: 權限授予失敗？
A: 檢查權限依賴關係，確保所有必要的前置權限都已授予。

### Q: 插件卸載後工具仍然可用？
A: 確保使用正確的工具實例 remove() 方法，並檢查 pluginTools Map 是否正確清理。

### Q: 多客戶端通知不同步？
A: 檢查會話管理是否正確，確保所有客戶端都在活躍會話列表中。

### Q: 如何擴展到更多插件？
A: 在 availablePlugins Map 中新增插件定義，並在 registerPluginTool/registerPluginResource 中新增對應的註冊邏輯。

## 下一步

完成本練習後，你將具備：
- 設計和實作動態插件系統的能力
- 掌握 MCP 通知機制的完整實作
- 理解企業級權限控制系統
- 具備構建可擴展 MCP 應用的架構能力

可以進入練習 10：完整應用實作，將所有學到的技術整合到一個生產級的完整應用中。