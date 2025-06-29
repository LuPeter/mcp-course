import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';

describe('Exercise 02: Static Resources MCP Server', () => {
  let serverProcess: ChildProcess;
  const serverPath = resolve(__dirname, '../../dist/exercises/02-static-resources/server.js');

  beforeEach(() => {
    // 每個測試前啟動服務器
    serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
  });

  afterEach(async () => {
    // 每個測試後清理服務器
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
      await new Promise(resolve => setTimeout(resolve, 100));
      if (!serverProcess.killed) {
        serverProcess.kill('SIGKILL');
      }
    }
  });

  describe('Server Initialization', () => {
    it('應該能夠啟動並初始化', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Server initialization timeout'));
        }, 5000);

        let response = '';
        
        serverProcess.stdout?.on('data', (data) => {
          response += data.toString();
          
          // 檢查是否收到完整的JSON-RPC響應
          if (response.includes('{"result":')) {
            clearTimeout(timeout);
            
            try {
              // 解析響應
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                // 驗證響應結構
                expect(parsed).toHaveProperty('jsonrpc', '2.0');
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('serverInfo');
                expect(parsed.result.serverInfo.name).toBe('static-resources-server');
                expect(parsed.result.serverInfo.version).toBe('1.0.0');
                expect(parsed.result).toHaveProperty('capabilities');
                expect(parsed.result.capabilities).toHaveProperty('resources');
                
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          }
        });

        serverProcess.stderr?.on('data', (data) => {
          const message = data.toString();
          if (message.includes('Static Resources MCP Server started successfully')) {
            // 服務器啟動成功的確認信息
          } else if (message.includes('error') || message.includes('Error')) {
            clearTimeout(timeout);
            reject(new Error(`Server error: ${message}`));
          }
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });

        // 發送初始化請求
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        };

        serverProcess.stdin?.write(JSON.stringify(initRequest) + '\n');
      });
    });
  });

  describe('Resources Functionality', () => {
    it('應該列出所有可用的資源', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Resources list timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，發送資源列表請求
            initComplete = true;
            const resourcesRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'resources/list'
            };
            
            serverProcess.stdin?.write(JSON.stringify(resourcesRequest) + '\n');
          } else if (responseCount === 2 && initComplete) {
            // 資源列表響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('resources');
                expect(Array.isArray(parsed.result.resources)).toBe(true);
                expect(parsed.result.resources).toHaveLength(3);
                
                // 檢查配置資源
                const configResource = parsed.result.resources.find((r: any) => r.name === 'config');
                expect(configResource).toBeDefined();
                expect(configResource.uri).toBe('config://app');
                expect(configResource.title).toBe('Application Configuration');
                expect(configResource.mimeType).toBe('application/json');
                
                // 檢查說明資源
                const helpResource = parsed.result.resources.find((r: any) => r.name === 'help');
                expect(helpResource).toBeDefined();
                expect(helpResource.uri).toBe('help://guide');
                expect(helpResource.title).toBe('User Guide');
                expect(helpResource.mimeType).toBe('text/markdown');
                
                // 檢查狀態資源
                const statusResource = parsed.result.resources.find((r: any) => r.name === 'status');
                expect(statusResource).toBeDefined();
                expect(statusResource.uri).toBe('status://health');
                expect(statusResource.title).toBe('System Status');
                expect(statusResource.mimeType).toBe('text/plain');
                
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          }
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });

        // 發送初始化請求
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        };

        serverProcess.stdin?.write(JSON.stringify(initRequest) + '\n');
      });
    });

    it('應該能夠讀取配置資源', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Config resource read timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，讀取配置資源
            initComplete = true;
            const readRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'resources/read',
              params: {
                uri: 'config://app'
              }
            };
            
            serverProcess.stdin?.write(JSON.stringify(readRequest) + '\n');
          } else if (responseCount === 2 && initComplete) {
            // 讀取響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('contents');
                expect(Array.isArray(parsed.result.contents)).toBe(true);
                expect(parsed.result.contents).toHaveLength(1);
                
                const content = parsed.result.contents[0];
                expect(content).toHaveProperty('uri', 'config://app');
                expect(content).toHaveProperty('mimeType', 'application/json');
                expect(content).toHaveProperty('text');
                
                // 驗證JSON內容
                const config = JSON.parse(content.text);
                expect(config).toHaveProperty('name', 'Static Resources Demo');
                expect(config).toHaveProperty('version', '1.0.0');
                expect(config).toHaveProperty('features');
                
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          }
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });

        // 發送初始化請求
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        };

        serverProcess.stdin?.write(JSON.stringify(initRequest) + '\n');
      });
    });

    it('應該能夠讀取狀態資源', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Status resource read timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，讀取狀態資源
            initComplete = true;
            const readRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'resources/read',
              params: {
                uri: 'status://health'
              }
            };
            
            serverProcess.stdin?.write(JSON.stringify(readRequest) + '\n');
          } else if (responseCount === 2 && initComplete) {
            // 讀取響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('contents');
                expect(Array.isArray(parsed.result.contents)).toBe(true);
                expect(parsed.result.contents).toHaveLength(1);
                
                const content = parsed.result.contents[0];
                expect(content).toHaveProperty('uri', 'status://health');
                expect(content).toHaveProperty('mimeType', 'text/plain');
                expect(content).toHaveProperty('text');
                
                // 驗證狀態內容
                expect(content.text).toContain('System Status: HEALTHY');
                expect(content.text).toContain('Uptime:');
                expect(content.text).toContain('Memory Usage:');
                expect(content.text).toContain('Node.js Version:');
                
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          }
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });

        // 發送初始化請求
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        };

        serverProcess.stdin?.write(JSON.stringify(initRequest) + '\n');
      });
    });
  });

  describe('Error Handling', () => {
    it('應該處理不存在的資源', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Error handling test timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，讀取不存在的資源
            initComplete = true;
            const readRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'resources/read',
              params: {
                uri: 'invalid://resource'
              }
            };
            
            serverProcess.stdin?.write(JSON.stringify(readRequest) + '\n');
          } else if (responseCount === 2 && initComplete) {
            // 錯誤響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                // 應該返回錯誤
                expect(parsed).toHaveProperty('error');
                expect(parsed.error).toHaveProperty('message');
                
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          }
        });

        serverProcess.on('error', (error) => {
          clearTimeout(timeout);
          reject(error);
        });

        // 發送初始化請求
        const initRequest = {
          jsonrpc: '2.0',
          id: 1,
          method: 'initialize',
          params: {
            protocolVersion: '2024-11-05',
            capabilities: {},
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        };

        serverProcess.stdin?.write(JSON.stringify(initRequest) + '\n');
      });
    });
  });
});