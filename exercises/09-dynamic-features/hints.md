# 練習 9 實作提示

## 核心概念提示

### 1. 動態工具 vs 靜態工具

**關鍵差異**：
```typescript
// ❌ 靜態工具 - 無法動態管理
server.registerTool('tool-name', config, handler);

// ✅ 動態工具 - 支援 enable/disable/remove
const toolInstance = server.tool('tool-name', schema, handler);
toolInstance.enable();   // 啟用工具
toolInstance.disable();  // 禁用工具 (從 listTools 中隱藏)
toolInstance.remove();   // 完全移除工具 (觸發 listChanged 通知)
```

### 2. 自動通知機制

MCP SDK 在以下情況**自動**發送 `listChanged` 通知：
- `toolInstance.enable()` - 工具變為可用
- `toolInstance.disable()` - 工具變為不可用
- `toolInstance.remove()` - 工具被移除
- `toolInstance.update()` - 工具配置更新

**重要**：無需手動發送通知！

## 逐步實作提示

### 階段1：權限系統基礎

#### 提示 1.1：權限檢查函數
```typescript
function hasPermission(sessionId: string, permission: string): boolean {
  const session = sessions.get(sessionId);
  if (!session) return false;
  
  // 1. 檢查直接權限
  if (session.permissions.has(permission)) return true;
  
  // 2. admin 用戶擁有所有權限
  if (session.permissions.has('admin')) return true;
  
  return false;
}
```

#### 提示 1.2：權限依賴處理
```typescript
function grantPermission(sessionId: string, permission: string): boolean {
  const session = sessions.get(sessionId);
  const perm = availablePermissions.get(permission);
  
  if (!session || !perm) return false;
  
  // 自動授予依賴權限
  if (perm.dependencies) {
    for (const dep of perm.dependencies) {
      session.permissions.add(dep);
    }
  }
  
  session.permissions.add(permission);
  return true;
}
```

#### 提示 1.3：會話創建擴展
```typescript
function createSession(clientInfo?: { name: string; version: string }): string {
  const sessionId = randomUUID();
  const session: Session = {
    id: sessionId,
    startTime: new Date(),
    lastActivity: new Date(),
    clientInfo,
    permissions: new Set(['read']) // 預設權限
  };
  
  sessions.set(sessionId, session);
  return sessionId;
}
```

### 階段2：插件系統實作

#### 提示 2.1：插件載入函數
```typescript
function loadPlugin(pluginId: string): boolean {
  const plugin = availablePlugins.get(pluginId);
  if (!plugin) {
    console.error(`Plugin not found: ${pluginId}`);
    return false;
  }
  
  // 檢查依賴
  if (plugin.dependencies) {
    for (const dep of plugin.dependencies) {
      if (!plugins.has(dep) || !plugins.get(dep)?.enabled) {
        console.error(`Plugin dependency not satisfied: ${dep}`);
        return false;
      }
    }
  }
  
  // 載入插件
  const loadedPlugin = { ...plugin, enabled: true };
  plugins.set(pluginId, loadedPlugin);
  
  // 動態註冊工具
  if (plugin.tools) {
    for (const toolName of plugin.tools) {
      registerPluginTool(pluginId, toolName);
    }
  }
  
  // 動態註冊資源
  if (plugin.resources) {
    for (const resourceName of plugin.resources) {
      registerPluginResource(pluginId, resourceName);
    }
  }
  
  console.error(`Plugin loaded: ${pluginId}`);
  return true;
}
```

#### 提示 2.2：插件卸載函數
```typescript
function unloadPlugin(pluginId: string): boolean {
  const plugin = plugins.get(pluginId);
  if (!plugin || !plugin.enabled) return false;
  
  // 移除工具 (自動觸發 listChanged 通知)
  if (plugin.tools) {
    for (const toolName of plugin.tools) {
      const toolInstance = pluginTools.get(toolName);
      if (toolInstance) {
        toolInstance.remove(); // 關鍵：自動通知
        pluginTools.delete(toolName);
      }
    }
  }
  
  // 移除資源
  if (plugin.resources) {
    for (const resourceName of plugin.resources) {
      pluginResources.delete(resourceName);
    }
  }
  
  plugin.enabled = false;
  console.error(`Plugin unloaded: ${pluginId}`);
  return true;
}
```

#### 提示 2.3：動態工具註冊
```typescript
function registerPluginTool(pluginId: string, toolName: string): void {
  switch (toolName) {
    case 'get-weather':
      const weatherTool = server.tool(  // 關鍵：使用 server.tool()
        'get-weather',
        {
          location: z.string().describe('Location to get weather for')
        },
        async ({ location }) => {
          return {
            content: [{
              type: 'text',
              text: `Weather in ${location}: Sunny, 22°C`
            }]
          };
        }
      );
      pluginTools.set(toolName, weatherTool); // 保存實例引用
      break;
      
    case 'get-forecast':
      const forecastTool = server.tool(
        'get-forecast', 
        {
          location: z.string(),
          days: z.number().min(1).max(7)
        },
        async ({ location, days }) => {
          return {
            content: [{
              type: 'text',
              text: `${days}-day forecast for ${location}: Mostly sunny`
            }]
          };
        }
      );
      pluginTools.set(toolName, forecastTool);
      break;
      
    // ... 其他工具
  }
}
```

### 階段3：管理工具實作

#### 提示 3.1：Plugin Manager 工具
```typescript
server.registerTool(
  'plugin-manager',
  {
    title: 'Plugin Manager',
    description: 'Manage dynamic plugins',
    inputSchema: {
      action: z.enum(['list', 'load', 'unload', 'info']),
      pluginId: z.string().optional(),
      sessionId: z.string().optional()
    }
  },
  async ({ action, pluginId, sessionId }) => {
    // 權限檢查
    if (sessionId && !hasPermission(sessionId, 'plugin-mgmt')) {
      return {
        content: [{ type: 'text', text: 'Error: Insufficient permissions' }]
      };
    }
    
    switch (action) {
      case 'list':
        const pluginList = Array.from(availablePlugins.values()).map(plugin => ({
          id: plugin.id,
          name: plugin.name,
          enabled: plugins.get(plugin.id)?.enabled || false,
          permissions: plugin.permissions
        }));
        
        return {
          content: [{
            type: 'text',
            text: `Available Plugins:\n${JSON.stringify(pluginList, null, 2)}`
          }]
        };
        
      case 'load':
        if (!pluginId) {
          return { content: [{ type: 'text', text: 'Error: Plugin ID required' }] };
        }
        
        const loadSuccess = loadPlugin(pluginId);
        return {
          content: [{
            type: 'text',
            text: loadSuccess ? `Plugin loaded: ${pluginId}` : `Failed to load: ${pluginId}`
          }]
        };
        
      case 'unload':
        if (!pluginId) {
          return { content: [{ type: 'text', text: 'Error: Plugin ID required' }] };
        }
        
        const unloadSuccess = unloadPlugin(pluginId);
        return {
          content: [{
            type: 'text', 
            text: unloadSuccess ? `Plugin unloaded: ${pluginId}` : `Failed to unload: ${pluginId}`
          }]
        };
        
      case 'info':
        if (!pluginId) {
          return { content: [{ type: 'text', text: 'Error: Plugin ID required' }] };
        }
        
        const plugin = availablePlugins.get(pluginId);
        if (!plugin) {
          return { content: [{ type: 'text', text: `Plugin not found: ${pluginId}` }] };
        }
        
        return {
          content: [{
            type: 'text',
            text: `Plugin Info:\n${JSON.stringify(plugin, null, 2)}`
          }]
        };
    }
  }
);
```

#### 提示 3.2：Permission Control 工具
```typescript
server.registerTool(
  'permission-control',
  {
    title: 'Permission Control Tool',
    description: 'Manage user permissions',
    inputSchema: {
      action: z.enum(['list', 'grant', 'revoke', 'check']),
      sessionId: z.string().optional(),
      permission: z.string().optional(),
      currentSessionId: z.string().optional()
    }
  },
  async ({ action, sessionId, permission, currentSessionId }) => {
    // 權限檢查：管理其他用戶需要 admin 權限
    if (currentSessionId && sessionId !== currentSessionId) {
      if (!hasPermission(currentSessionId, 'admin')) {
        return {
          content: [{ type: 'text', text: 'Error: Admin permission required' }]
        };
      }
    }
    
    const targetSessionId = sessionId || currentSessionId;
    if (!targetSessionId) {
      return { content: [{ type: 'text', text: 'Error: Session ID required' }] };
    }
    
    const session = sessions.get(targetSessionId);
    if (!session) {
      return { content: [{ type: 'text', text: 'Error: Session not found' }] };
    }
    
    switch (action) {
      case 'list':
        const userPermissions = Array.from(session.permissions);
        const availablePerms = Array.from(availablePermissions.values());
        
        return {
          content: [{
            type: 'text',
            text: `Current Permissions: ${userPermissions.join(', ')}\n\nAvailable:\n${JSON.stringify(availablePerms, null, 2)}`
          }]
        };
        
      case 'grant':
        if (!permission) {
          return { content: [{ type: 'text', text: 'Error: Permission name required' }] };
        }
        
        const granted = grantPermission(targetSessionId, permission);
        return {
          content: [{
            type: 'text',
            text: granted ? `Permission granted: ${permission}` : `Failed to grant: ${permission}`
          }]
        };
        
      case 'revoke':
        if (!permission) {
          return { content: [{ type: 'text', text: 'Error: Permission name required' }] };
        }
        
        session.permissions.delete(permission);
        return {
          content: [{
            type: 'text',
            text: `Permission revoked: ${permission}`
          }]
        };
        
      case 'check':
        if (!permission) {
          return { content: [{ type: 'text', text: 'Error: Permission name required' }] };
        }
        
        const hasPerms = hasPermission(targetSessionId, permission);
        return {
          content: [{
            type: 'text',
            text: `Permission ${permission}: ${hasPerms ? 'GRANTED' : 'DENIED'}`
          }]
        };
    }
  }
);
```

### 階段4：HTTP傳輸實作

#### 提示 4.1：Express應用設置
```typescript
function createExpressApp(): express.Application {
  const app = express();
  
  // 中間件配置
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  
  // CORS 支援
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, mcp-session-id');
    
    if (req.method === 'OPTIONS') {
      res.sendStatus(200);
      return;
    }
    next();
  });
  
  // 健康檢查端點
  app.get('/health', (req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      activeSessions: sessions.size,
      loadedPlugins: Array.from(plugins.values()).filter(p => p.enabled).length,
      availablePlugins: availablePlugins.size,
      features: ['dynamic-plugins', 'permission-control', 'notifications']
    });
  });
  
  // 插件狀態端點
  app.get('/plugins', (req, res) => {
    const pluginStatus = Array.from(availablePlugins.values()).map(plugin => ({
      id: plugin.id,
      name: plugin.name,
      enabled: plugins.get(plugin.id)?.enabled || false,
      permissions: plugin.permissions,
      tools: plugin.tools || []
    }));
    
    res.json(pluginStatus);
  });
  
  return app;
}
```

#### 提示 4.2：HTTP傳輸處理
```typescript
if (useHttp) {
  const app = createExpressApp();
  const transports: { [sessionId: string]: StreamableHTTPServerTransport } = {};
  
  // MCP 端點
  app.post('/mcp', async (req, res) => {
    const sessionId = req.headers['mcp-session-id'] as string | undefined;
    let transport: StreamableHTTPServerTransport;
    
    if (sessionId && transports[sessionId]) {
      transport = transports[sessionId];
      updateSessionActivity(sessionId);
    } else if (!sessionId && isInitializeRequest(req.body)) {
      transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (sessionId) => {
          transports[sessionId] = transport;
          createSession({ name: 'http-client', version: '1.0.0' });
        }
      });
      
      transport.onclose = () => {
        if (transport.sessionId) {
          delete transports[transport.sessionId];
          sessions.delete(transport.sessionId);
        }
      };
      
      await server.connect(transport);
    } else {
      res.status(400).json({
        jsonrpc: '2.0',
        error: { code: -32000, message: 'Invalid session' },
        id: null
      });
      return;
    }
    
    await transport.handleRequest(req, res, req.body);
  });
  
  app.listen(port, () => {
    console.error(`Dynamic Features Server listening on port ${port}`);
  });
}
```

## 常見錯誤和解決方案

### 錯誤1：工具載入後客戶端看不到
**原因**：使用了 `server.registerTool()` 而不是 `server.tool()`
```typescript
// ❌ 錯誤
server.registerTool('tool-name', config, handler);

// ✅ 正確  
const toolInstance = server.tool('tool-name', schema, handler);
```

### 錯誤2：通知沒有發送
**原因**：沒有使用工具實例的動態方法
```typescript
// ❌ 錯誤：手動管理
pluginTools.delete(toolName);

// ✅ 正確：自動通知
toolInstance.remove(); // 自動觸發 listChanged
pluginTools.delete(toolName);
```

### 錯誤3：權限檢查失敗
**原因**：沒有處理權限依賴
```typescript
function grantPermission(sessionId: string, permission: string): boolean {
  const perm = availablePermissions.get(permission);
  
  // 必須處理依賴權限
  if (perm.dependencies) {
    for (const dep of perm.dependencies) {
      session.permissions.add(dep);
    }
  }
  
  session.permissions.add(permission);
}
```

### 錯誤4：插件卸載不完整
**原因**：沒有清理所有相關資源
```typescript
function unloadPlugin(pluginId: string): boolean {
  // 1. 移除工具實例
  if (plugin.tools) {
    for (const toolName of plugin.tools) {
      const toolInstance = pluginTools.get(toolName);
      if (toolInstance) {
        toolInstance.remove(); // 重要！
        pluginTools.delete(toolName); // 清理Map
      }
    }
  }
  
  // 2. 清理資源
  if (plugin.resources) {
    for (const resourceName of plugin.resources) {
      pluginResources.delete(resourceName);
    }
  }
  
  // 3. 更新狀態
  plugin.enabled = false;
}
```

## 測試提示

### 測試序列1：基本插件管理
```bash
1. 啟動服務器
2. 列出插件：plugin-manager --action=list
3. 載入插件：plugin-manager --action=load --plugin-id=weather-plugin  
4. 驗證工具：tools/list (應該看到 get-weather, get-forecast)
5. 測試工具：get-weather --location="Tokyo"
6. 卸載插件：plugin-manager --action=unload --plugin-id=weather-plugin
7. 驗證清理：tools/list (工具應該消失)
```

### 測試序列2：權限管理
```bash
1. 檢查權限：permission-control --action=list
2. 載入數據庫插件：plugin-manager --action=load --plugin-id=database-plugin
   (應該失敗，因為需要admin權限)
3. 授予admin：permission-control --action=grant --permission=admin
4. 再次載入：plugin-manager --action=load --plugin-id=database-plugin
   (應該成功)
5. 測試工具：db-query --query="SELECT * FROM users"
```

### 測試序列3：HTTP模式
```bash
1. 啟動HTTP模式：--http
2. 檢查健康狀態：curl http://localhost:3000/health
3. 檢查插件狀態：curl http://localhost:3000/plugins
4. 使用HTTP客戶端測試插件管理
5. 驗證多客戶端通知同步
```

## 成功檢查清單

- [ ] 可以動態載入/卸載插件
- [ ] listChanged通知自動發送  
- [ ] 權限依賴自動處理
- [ ] 多客戶端通知同步
- [ ] HTTP和stdio模式都正常工作
- [ ] 所有前置練習功能保持正常
- [ ] 錯誤處理健全
- [ ] 會話隔離正確實作

記住：這是最高難度的練習，需要耐心和細心。建議分階段實作，每完成一個功能就進行測試！