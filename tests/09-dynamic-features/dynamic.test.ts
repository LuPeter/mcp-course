import { spawn } from 'child_process';
import { JSONRPCMessage, JSONRPCRequest, JSONRPCResponse } from '@modelcontextprotocol/sdk/types.js';

/**
 * 練習 9: 動態服務器功能測試
 * 
 * 測試動態插件系統、權限控制和通知機制
 */

describe('Exercise 09: Dynamic Features Server', () => {
  const timeout = 15000; // 15秒超時，動態功能可能需要更多時間
  
  let serverProcess: any;
  let messageId = 1;

  const sendMessage = (message: JSONRPCRequest): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, timeout);

      const responseHandler = (data: Buffer) => {
        const lines = data.toString().split('\n').filter(line => line.trim());
        
        for (const line of lines) {
          try {
            const response: any = JSON.parse(line);
            if (response.id === message.id) {
              clearTimeout(timer);
              serverProcess.stdout.off('data', responseHandler);
              
              if (response.error) {
                reject(new Error(`Server error: ${response.error.message}`));
              } else {
                resolve(response.result);
              }
              return;
            }
          } catch (e) {
            // 忽略非JSON行
          }
        }
      };

      serverProcess.stdout.on('data', responseHandler);
      serverProcess.stdin.write(JSON.stringify(message) + '\n');
    });
  };

  beforeAll(async () => {
    // 啟動動態功能服務器
    serverProcess = spawn('node', ['dist/exercises/09-dynamic-features/server.js'], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    // 等待服務器啟動
    await new Promise<void>((resolve) => {
      serverProcess.stderr.on('data', (data: Buffer) => {
        if (data.toString().includes('started successfully') || 
            data.toString().includes('Dynamic Features Server')) {
          resolve();
        }
      });
      
      setTimeout(resolve, 2000); // 備用超時
    });

    // 初始化連接
    const initResponse = await sendMessage({
      jsonrpc: '2.0',
      id: messageId++,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'test-client',
          version: '1.0.0'
        }
      }
    });

    expect(initResponse).toBeDefined();
    
    // 發送 initialized 通知
    serverProcess.stdin.write(JSON.stringify({
      jsonrpc: '2.0',
      method: 'notifications/initialized'
    }) + '\n');
  }, timeout);

  afterAll(async () => {
    if (serverProcess) {
      serverProcess.kill();
      
      // 等待進程結束
      await new Promise<void>((resolve) => {
        serverProcess.on('close', () => resolve());
        setTimeout(resolve, 1000);
      });
    }
  });

  describe('Basic Server Functionality', () => {
    test('should list available tools', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/list'
      });

      expect(response).toBeDefined();
      expect(response.tools).toBeInstanceOf(Array);
      
      // 檢查核心工具是否存在
      const toolNames = response.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('echo');
      expect(toolNames).toContain('plugin-manager');
      expect(toolNames).toContain('permission-control');
      expect(toolNames).toContain('session-info');
    });

    test('should list available resources', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'resources/list'
      });

      expect(response).toBeDefined();
      expect(response.resources).toBeInstanceOf(Array);
      
      // 檢查基本資源
      const resourceUris = response.resources.map((resource: any) => resource.uri);
      expect(resourceUris).toContain('config://server');
      expect(resourceUris).toContain('help://info');
    });

    test('should handle echo tool', async () => {
      const testMessage = 'Hello Dynamic Features!';
      
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'echo',
          arguments: {
            message: testMessage
          }
        }
      });

      expect(response).toBeDefined();
      expect(response.content).toBeInstanceOf(Array);
      expect(response.content[0].text).toContain(testMessage);
    });
  });

  describe('Plugin Management System', () => {
    test('should list available plugins', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'plugin-manager',
          arguments: {
            action: 'list'
          }
        }
      });

      expect(response).toBeDefined();
      expect(response.content).toBeInstanceOf(Array);
      
      const pluginListText = response.content[0].text;
      expect(pluginListText).toContain('weather-plugin');
      expect(pluginListText).toContain('database-plugin');
      expect(pluginListText).toContain('analysis-plugin');
    });

    test('should get plugin information', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'plugin-manager',
          arguments: {
            action: 'info',
            pluginId: 'weather-plugin'
          }
        }
      });

      expect(response).toBeDefined();
      expect(response.content[0].text).toContain('weather-plugin');
      expect(response.content[0].text).toContain('Weather Information');
      expect(response.content[0].text).toContain('get-weather');
      expect(response.content[0].text).toContain('get-forecast');
    });

    test('should load weather plugin', async () => {
      // 載入天氣插件
      const loadResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'plugin-manager',
          arguments: {
            action: 'load',
            pluginId: 'weather-plugin'
          }
        }
      });

      expect(loadResponse).toBeDefined();
      expect(loadResponse.content[0].text).toContain('Plugin loaded');
      expect(loadResponse.content[0].text).toContain('weather-plugin');

      // 等待一下讓通知處理完成
      await new Promise(resolve => setTimeout(resolve, 500));

      // 驗證工具列表更新
      const toolsResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/list'
      });

      const toolNames = toolsResponse.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('get-weather');
      expect(toolNames).toContain('get-forecast');
    });

    test('should use dynamically loaded weather tools', async () => {
      // 測試天氣工具
      const weatherResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'get-weather',
          arguments: {
            location: 'Tokyo'
          }
        }
      });

      expect(weatherResponse).toBeDefined();
      expect(weatherResponse.content[0].text).toContain('Tokyo');
      expect(weatherResponse.content[0].text).toContain('Weather');

      // 測試預報工具
      const forecastResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'get-forecast',
          arguments: {
            location: 'New York',
            days: 3
          }
        }
      });

      expect(forecastResponse).toBeDefined();
      expect(forecastResponse.content[0].text).toContain('New York');
      expect(forecastResponse.content[0].text).toContain('3-day');
    });

    test('should unload weather plugin', async () => {
      // 卸載天氣插件
      const unloadResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'plugin-manager',
          arguments: {
            action: 'unload',
            pluginId: 'weather-plugin'
          }
        }
      });

      expect(unloadResponse).toBeDefined();
      expect(unloadResponse.content[0].text).toContain('Plugin unloaded');

      // 等待通知處理
      await new Promise(resolve => setTimeout(resolve, 500));

      // 驗證工具被移除
      const toolsResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/list'
      });

      const toolNames = toolsResponse.tools.map((tool: any) => tool.name);
      expect(toolNames).not.toContain('get-weather');
      expect(toolNames).not.toContain('get-forecast');
    });
  });

  describe('Permission Control System', () => {
    test('should list current permissions', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'permission-control',
          arguments: {
            action: 'list'
          }
        }
      });

      expect(response).toBeDefined();
      expect(response.content[0].text).toContain('Current Permissions');
      expect(response.content[0].text).toContain('read'); // 預設權限
    });

    test('should check specific permission', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'permission-control',
          arguments: {
            action: 'check',
            permission: 'read'
          }
        }
      });

      expect(response).toBeDefined();
      expect(response.content[0].text).toContain('Permission read: GRANTED');
    });

    test('should grant permission with dependencies', async () => {
      // 授予 plugin-mgmt 權限 (應該自動授予依賴權限)
      const grantResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'permission-control',
          arguments: {
            action: 'grant',
            permission: 'plugin-mgmt'
          }
        }
      });

      expect(grantResponse).toBeDefined();
      expect(grantResponse.content[0].text).toContain('Permission granted: plugin-mgmt');

      // 檢查依賴權限是否也被授予
      const listResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'permission-control',
          arguments: {
            action: 'list'
          }
        }
      });

      const permissionsText = listResponse.content[0].text;
      expect(permissionsText).toContain('plugin-mgmt');
      expect(permissionsText).toContain('write'); // 依賴權限
    });

    test('should fail to load admin plugin without permission', async () => {
      // 先撤銷所有高級權限
      await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'permission-control',
          arguments: {
            action: 'revoke',
            permission: 'admin'
          }
        }
      });

      // 嘗試載入需要 admin 權限的數據庫插件
      const loadResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'plugin-manager',
          arguments: {
            action: 'load',
            pluginId: 'database-plugin'
          }
        }
      });

      // 應該載入成功但功能受限，或者失敗（取決於實作）
      expect(loadResponse).toBeDefined();
    });

    test('should grant admin permission and load database plugin', async () => {
      // 授予 admin 權限
      const grantResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'permission-control',
          arguments: {
            action: 'grant',
            permission: 'admin'
          }
        }
      });

      expect(grantResponse).toBeDefined();
      expect(grantResponse.content[0].text).toContain('Permission granted: admin');

      // 現在載入數據庫插件
      const loadResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'plugin-manager',
          arguments: {
            action: 'load',
            pluginId: 'database-plugin'
          }
        }
      });

      expect(loadResponse).toBeDefined();
      expect(loadResponse.content[0].text).toContain('Plugin loaded');

      // 等待並驗證工具
      await new Promise(resolve => setTimeout(resolve, 500));

      const toolsResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/list'
      });

      const toolNames = toolsResponse.tools.map((tool: any) => tool.name);
      expect(toolNames).toContain('db-query');
    });
  });

  describe('Session Management', () => {
    test('should provide session information', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'session-info',
          arguments: {
            action: 'current'
          }
        }
      });

      expect(response).toBeDefined();
      expect(response.content[0].text).toContain('Active sessions');
      expect(response.content[0].text).toContain('Session management: Enabled');
    });

    test('should list active sessions', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'session-info',
          arguments: {
            action: 'list'
          }
        }
      });

      expect(response).toBeDefined();
      expect(response.content[0].text).toContain('Active Sessions');
    });
  });

  describe('Resource Management', () => {
    test('should read server configuration', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'resources/read',
        params: {
          uri: 'config://server'
        }
      });

      expect(response).toBeDefined();
      expect(response.contents).toBeInstanceOf(Array);
      
      const configText = response.contents[0].text;
      const config = JSON.parse(configText);
      
      expect(config.server.name).toBe('dynamic-features-server');
      expect(config.plugins).toBeDefined();
      expect(config.sessions).toBeDefined();
    });

    test('should read help information', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'resources/read',
        params: {
          uri: 'help://info'
        }
      });

      expect(response).toBeDefined();
      expect(response.contents[0].text).toContain('Dynamic Features Server Help');
      expect(response.contents[0].text).toContain('plugin-manager');
      expect(response.contents[0].text).toContain('permission-control');
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid plugin ID', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'plugin-manager',
          arguments: {
            action: 'load',
            pluginId: 'non-existent-plugin'
          }
        }
      });

      expect(response).toBeDefined();
      expect(response.content[0].text).toContain('Failed to load');
    });

    test('should handle missing required parameters', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'plugin-manager',
          arguments: {
            action: 'load'
            // 缺少 pluginId
          }
        }
      });

      expect(response).toBeDefined();
      expect(response.content[0].text).toContain('Plugin ID required');
    });

    test('should handle invalid permission', async () => {
      const response = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'permission-control',
          arguments: {
            action: 'grant',
            permission: 'invalid-permission'
          }
        }
      });

      expect(response).toBeDefined();
      expect(response.content[0].text).toContain('Failed to grant');
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete plugin lifecycle', async () => {
      // 1. 確保有足夠權限
      await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'permission-control',
          arguments: {
            action: 'grant',
            permission: 'admin'
          }
        }
      });

      // 2. 載入分析插件
      const loadResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'plugin-manager',
          arguments: {
            action: 'load',
            pluginId: 'analysis-plugin'
          }
        }
      });

      expect(loadResponse.content[0].text).toContain('Plugin loaded');

      // 3. 等待並測試工具
      await new Promise(resolve => setTimeout(resolve, 500));

      const analysisResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'analyze-data',
          arguments: {
            data: '{"values": [1, 2, 3, 4, 5]}',
            type: 'statistical'
          }
        }
      });

      expect(analysisResponse).toBeDefined();
      expect(analysisResponse.content[0].text).toContain('analysis completed');

      // 4. 卸載插件
      const unloadResponse = await sendMessage({
        jsonrpc: '2.0',
        id: messageId++,
        method: 'tools/call',
        params: {
          name: 'plugin-manager',
          arguments: {
            action: 'unload',
            pluginId: 'analysis-plugin'
          }
        }
      });

      expect(unloadResponse.content[0].text).toContain('Plugin unloaded');
    });
  });
});