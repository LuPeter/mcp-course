import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';

describe('Exercise 01: Hello World MCP Server', () => {
  let serverProcess: ChildProcess;
  const serverPath = resolve(__dirname, '../../dist/exercises/01-hello-world/server.js');

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
              // 解析響應（可能包含多行）
              const lines = response.split('\\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                // 驗證響應結構
                expect(parsed).toHaveProperty('jsonrpc', '2.0');
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('serverInfo');
                expect(parsed.result.serverInfo.name).toBe('hello-world-server');
                expect(parsed.result.serverInfo.version).toBe('1.0.0');
                expect(parsed.result).toHaveProperty('capabilities');
                expect(parsed.result.capabilities).toHaveProperty('tools');
                
                resolve();
              }
            } catch (error) {
              reject(error);
            }
          }
        });

        serverProcess.stderr?.on('data', (data) => {
          const message = data.toString();
          if (message.includes('Hello World MCP Server started successfully')) {
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
            capabilities: {
              roots: {
                listChanged: true
              }
            },
            clientInfo: {
              name: 'test-client',
              version: '1.0.0'
            }
          }
        };

        serverProcess.stdin?.write(JSON.stringify(initRequest) + '\\n');
      });
    });
  });

  describe('Tools Functionality', () => {
    it('應該列出可用的工具', async () => {
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
              method: 'tools/list',
              params: {}
            };
            
            serverProcess.stdin?.write(JSON.stringify(toolsRequest) + '\\n');
          } else if (responseCount === 2 && initComplete) {
            // 工具列表響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('tools');
                expect(Array.isArray(parsed.result.tools)).toBe(true);
                expect(parsed.result.tools).toHaveLength(1);
                expect(parsed.result.tools[0]).toHaveProperty('name', 'echo');
                expect(parsed.result.tools[0]).toHaveProperty('title', 'Echo Tool');
                expect(parsed.result.tools[0]).toHaveProperty('description', 'Echo back the input message');
                
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

        serverProcess.stdin?.write(JSON.stringify(initRequest) + '\\n');
      });
    });

    it('應該能夠調用echo工具', async () => {
      return new Promise<void>((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Echo tool call timeout'));
        }, 5000);

        let responseCount = 0;
        let initComplete = false;

        serverProcess.stdout?.on('data', (data) => {
          const response = data.toString();
          responseCount++;
          
          if (responseCount === 1 && response.includes('serverInfo')) {
            // 初始化完成，調用echo工具
            initComplete = true;
            const echoRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'echo',
                arguments: {
                  message: 'Hello, MCP!'
                }
              }
            };
            
            serverProcess.stdin?.write(JSON.stringify(echoRequest) + '\\n');
          } else if (responseCount === 2 && initComplete) {
            // Echo工具響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                expect(parsed).toHaveProperty('result');
                expect(parsed.result).toHaveProperty('content');
                expect(Array.isArray(parsed.result.content)).toBe(true);
                expect(parsed.result.content).toHaveLength(1);
                expect(parsed.result.content[0]).toHaveProperty('type', 'text');
                expect(parsed.result.content[0]).toHaveProperty('text', 'Echo: Hello, MCP!');
                
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

        serverProcess.stdin?.write(JSON.stringify(initRequest) + '\\n');
      });
    });
  });

  describe('Error Handling', () => {
    it('應該處理缺少參數的錯誤', async () => {
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
            // 初始化完成，調用沒有參數的echo工具
            initComplete = true;
            const echoRequest = {
              jsonrpc: '2.0',
              id: 2,
              method: 'tools/call',
              params: {
                name: 'echo',
                arguments: {}
              }
            };
            
            serverProcess.stdin?.write(JSON.stringify(echoRequest) + '\\n');
          } else if (responseCount === 2 && initComplete) {
            // Echo工具錯誤響應
            clearTimeout(timeout);
            
            try {
              const lines = response.split('\\n').filter((line: string) => line.trim());
              const jsonLine = lines.find((line: string) => line.startsWith('{'));
              
              if (jsonLine) {
                const parsed = JSON.parse(jsonLine);
                
                // 應該返回錯誤
                expect(parsed).toHaveProperty('error');
                expect(parsed.error).toHaveProperty('message');
                expect(parsed.error.message).toContain('Message parameter is required');
                
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

        serverProcess.stdin?.write(JSON.stringify(initRequest) + '\\n');
      });
    });
  });
});