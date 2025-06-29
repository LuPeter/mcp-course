import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';

describe('Exercise 04: Dynamic Resources MCP Server', () => {
  let serverProcess: ChildProcess;
  const serverPath = resolve(__dirname, '../../dist/exercises/04-dynamic-resources/server.js');

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
                expect(parsed.result.serverInfo.name).toBe('dynamic-resources-server');
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
          if (message.includes('Dynamic Resources MCP Server started successfully')) {
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

  describe('Dynamic Resources Functionality', () => {
    it('應該列出所有可用的動態資源', async () => {
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
                expect(parsed.result.resources.length).toBeGreaterThan(10); // 至少有用戶+文件+時區資源
                
                // 檢查用戶個人檔案資源
                const userResource = parsed.result.resources.find((r: any) => r.name === 'user-profile-1');
                expect(userResource).toBeDefined();
                expect(userResource.title).toBe('User 1 Profile');
                expect(userResource.mimeType).toBe('application/json');
                
                // 檢查文件內容資源
                const fileResource = parsed.result.resources.find((r: any) => r.name === 'file-docs-guide.md');
                expect(fileResource).toBeDefined();
                expect(fileResource.title).toBe('File: docs/guide.md');
                expect(fileResource.mimeType).toBe('text/markdown');
                
                // 檢查時區資訊資源
                const timezoneResource = parsed.result.resources.find((r: any) => r.name === 'time-Asia-Taipei');
                expect(timezoneResource).toBeDefined();
                expect(timezoneResource.title).toBe('Time in Asia/Taipei');
                expect(timezoneResource.mimeType).toBe('text/plain');
                
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

    it('應該能夠讀取用戶個人檔案資源', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('User profile resource read timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，讀取用戶資源
            initComplete = true;
            const readRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'resources/read',
              params: {
                uri: 'users://1/profile'
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
                expect(content).toHaveProperty('uri', 'users://1/profile');
                expect(content).toHaveProperty('mimeType', 'application/json');
                expect(content).toHaveProperty('text');
                
                // 驗證JSON內容
                const userProfile = JSON.parse(content.text);
                expect(userProfile).toHaveProperty('id', '1');
                expect(userProfile).toHaveProperty('name', 'Alice');
                expect(userProfile).toHaveProperty('email', 'alice@example.com');
                expect(userProfile).toHaveProperty('role', 'admin');
                
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

    it('應該能夠讀取文件內容資源', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('File content resource read timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，讀取文件資源
            initComplete = true;
            const readRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'resources/read',
              params: {
                uri: 'files://docs/guide.md'
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
                expect(content).toHaveProperty('uri', 'files://docs/guide.md');
                expect(content).toHaveProperty('mimeType', 'text/markdown');
                expect(content).toHaveProperty('text');
                
                // 驗證文件內容
                expect(content.text).toContain('User Guide');
                expect(content.text).toContain('Getting Started');
                
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

    it('應該能夠讀取時區資訊資源', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timezone resource read timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，讀取時區資源
            initComplete = true;
            const readRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'resources/read',
              params: {
                uri: 'time://Asia/Tokyo'
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
                expect(content).toHaveProperty('uri', 'time://Asia/Tokyo');
                expect(content).toHaveProperty('mimeType', 'text/plain');
                expect(content).toHaveProperty('text');
                
                // 驗證時區內容
                expect(content.text).toContain('Timezone Information');
                expect(content.text).toContain('Timezone: Asia/Tokyo');
                expect(content.text).toContain('Current Time:');
                expect(content.text).toContain('UTC Time:');
                
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
    it('應該處理不存在的用戶', async () => {
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
            // 初始化完成，讀取不存在的用戶
            initComplete = true;
            const readRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'resources/read',
              params: {
                uri: 'users://999/profile'
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
                
                // 應該返回錯誤（資源不存在）
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

    it('應該處理無效的時區', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Invalid timezone test timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，讀取無效時區
            initComplete = true;
            const readRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'resources/read',
              params: {
                uri: 'time://Invalid/Timezone'
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
                
                // 應該返回錯誤（無效時區資源不存在）
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