import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';

describe('Exercise 03: Basic Tools MCP Server', () => {
  let serverProcess: ChildProcess;
  const serverPath = resolve(__dirname, '../../dist/exercises/03-basic-tools/server.js');

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
                expect(parsed.result.serverInfo.name).toBe('basic-tools-server');
                expect(parsed.result.serverInfo.version).toBe('1.0.0');
                expect(parsed.result).toHaveProperty('capabilities');
                expect(parsed.result.capabilities).toHaveProperty('tools');
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
          if (message.includes('Basic Tools MCP Server started successfully')) {
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

  describe('Tools Functionality', () => {
    it('應該列出所有可用的工具', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Tools list timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，發送工具列表請求
            initComplete = true;
            const toolsRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/list'
            };
            
            serverProcess.stdin?.write(JSON.stringify(toolsRequest) + '\n');
          } else if (responseCount === 2 && initComplete) {
            // 工具列表響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('tools');
                expect(Array.isArray(parsed.result.tools)).toBe(true);
                expect(parsed.result.tools).toHaveLength(4);
                
                // 檢查echo工具
                const echoTool = parsed.result.tools.find((t: any) => t.name === 'echo');
                expect(echoTool).toBeDefined();
                expect(echoTool.title).toBe('Echo Tool');
                
                // 檢查calculate工具
                const calcTool = parsed.result.tools.find((t: any) => t.name === 'calculate');
                expect(calcTool).toBeDefined();
                expect(calcTool.title).toBe('Calculator Tool');
                
                // 檢查text-transform工具
                const textTool = parsed.result.tools.find((t: any) => t.name === 'text-transform');
                expect(textTool).toBeDefined();
                expect(textTool.title).toBe('Text Transform Tool');
                
                // 檢查timestamp工具
                const timestampTool = parsed.result.tools.find((t: any) => t.name === 'timestamp');
                expect(timestampTool).toBeDefined();
                expect(timestampTool.title).toBe('Timestamp Tool');
                
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

    it('應該能夠使用calculate工具進行數學運算', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Calculate tool test timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，調用calculate工具
            initComplete = true;
            const toolCallRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'calculate',
                arguments: {
                  operation: 'add',
                  a: 5,
                  b: 3
                }
              }
            };
            
            serverProcess.stdin?.write(JSON.stringify(toolCallRequest) + '\n');
          } else if (responseCount === 2 && initComplete) {
            // 工具調用響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('content');
                expect(Array.isArray(parsed.result.content)).toBe(true);
                expect(parsed.result.content).toHaveLength(1);
                
                const content = parsed.result.content[0];
                expect(content).toHaveProperty('type', 'text');
                expect(content).toHaveProperty('text');
                expect(content.text).toContain('5 add 3 = 8');
                
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

    it('應該能夠使用text-transform工具轉換文字', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Text transform tool test timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，調用text-transform工具
            initComplete = true;
            const toolCallRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'text-transform',
                arguments: {
                  text: 'hello world',
                  operation: 'uppercase'
                }
              }
            };
            
            serverProcess.stdin?.write(JSON.stringify(toolCallRequest) + '\n');
          } else if (responseCount === 2 && initComplete) {
            // 工具調用響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('content');
                expect(Array.isArray(parsed.result.content)).toBe(true);
                expect(parsed.result.content).toHaveLength(1);
                
                const content = parsed.result.content[0];
                expect(content).toHaveProperty('type', 'text');
                expect(content).toHaveProperty('text');
                expect(content.text).toContain('HELLO WORLD');
                
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

    it('應該能夠使用timestamp工具處理時間', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Timestamp tool test timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，調用timestamp工具
            initComplete = true;
            const toolCallRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'timestamp',
                arguments: {
                  action: 'current',
                  format: 'iso'
                }
              }
            };
            
            serverProcess.stdin?.write(JSON.stringify(toolCallRequest) + '\n');
          } else if (responseCount === 2 && initComplete) {
            // 工具調用響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('content');
                expect(Array.isArray(parsed.result.content)).toBe(true);
                expect(parsed.result.content).toHaveLength(1);
                
                const content = parsed.result.content[0];
                expect(content).toHaveProperty('type', 'text');
                expect(content).toHaveProperty('text');
                expect(content.text).toMatch(/Current timestamp: \d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
                
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
    it('應該處理除零錯誤', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Division by zero test timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，嘗試除零
            initComplete = true;
            const toolCallRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'calculate',
                arguments: {
                  operation: 'divide',
                  a: 10,
                  b: 0
                }
              }
            };
            
            serverProcess.stdin?.write(JSON.stringify(toolCallRequest) + '\n');
          } else if (responseCount === 2 && initComplete) {
            // 錯誤響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                // 應該返回錯誤（SDK包裝在result中）
                expect(parsed).toHaveProperty('result');
                if (parsed.error) {
                  expect(parsed.error).toHaveProperty('message');
                  expect(parsed.error.message).toContain('Division by zero');
                } else {
                  expect(parsed.result).toHaveProperty('isError', true);
                  expect(parsed.result).toHaveProperty('content');
                  expect(parsed.result.content[0].text).toContain('Division by zero');
                }
                
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

    it('應該處理無效的文字轉換操作', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Invalid operation test timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，使用無效操作
            initComplete = true;
            const toolCallRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'text-transform',
                arguments: {
                  text: 'hello',
                  operation: 'invalid-operation'
                }
              }
            };
            
            serverProcess.stdin?.write(JSON.stringify(toolCallRequest) + '\n');
          } else if (responseCount === 2 && initComplete) {
            // 錯誤響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                // 應該返回錯誤（參數驗證失敗）
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
                
                // 檢查說明資源
                const helpResource = parsed.result.resources.find((r: any) => r.name === 'help');
                expect(helpResource).toBeDefined();
                expect(helpResource.uri).toBe('help://guide');
                
                // 檢查狀態資源
                const statusResource = parsed.result.resources.find((r: any) => r.name === 'status');
                expect(statusResource).toBeDefined();
                expect(statusResource.uri).toBe('status://health');
                
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