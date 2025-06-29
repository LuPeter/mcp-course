import { spawn, ChildProcess } from 'child_process';
import { resolve } from 'path';

describe('Exercise 01: Hello World MCP Server (Integration)', () => {
  const serverPath = resolve(__dirname, '../../dist/exercises/01-hello-world/server.js');
  let serverProcess: ChildProcess;

  beforeEach(() => {
    serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
  });

  afterEach(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  });

  it('應該能夠列出工具', (done) => {
    let initComplete = false;
    const timeout = setTimeout(() => {
      done(new Error('Test timeout'));
    }, 5000);

    serverProcess.stdout?.on('data', (data) => {
      const response = data.toString().trim();
      
      try {
        const parsed = JSON.parse(response);
        
        if (parsed.result && parsed.result.serverInfo && !initComplete) {
          // 初始化完成，發送工具列表請求
          initComplete = true;
          const toolsRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/list',
            params: {}
          };
          
          serverProcess.stdin?.write(JSON.stringify(toolsRequest) + '\n');
        } else if (parsed.result && parsed.result.tools && initComplete) {
          // 收到工具列表響應
          clearTimeout(timeout);
          
          expect(parsed.result.tools).toHaveLength(1);
          expect(parsed.result.tools[0].name).toBe('echo');
          expect(parsed.result.tools[0].title).toBe('Echo Tool');
          expect(parsed.result.tools[0].description).toBe('Echo back the input message');
          
          done();
        }
      } catch (error) {
        // 忽略JSON解析錯誤
      }
    });

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      done(error);
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

  it('應該能夠調用echo工具', (done) => {
    let initComplete = false;
    const timeout = setTimeout(() => {
      done(new Error('Test timeout'));
    }, 5000);

    serverProcess.stdout?.on('data', (data) => {
      const response = data.toString().trim();
      
      try {
        const parsed = JSON.parse(response);
        
        if (parsed.result && parsed.result.serverInfo && !initComplete) {
          // 初始化完成，調用echo工具
          initComplete = true;
          const echoRequest = {
            jsonrpc: '2.0',
            id: 2,
            method: 'tools/call',
            params: {
              name: 'echo',
              arguments: {
                message: 'Hello, MCP Test!'
              }
            }
          };
          
          serverProcess.stdin?.write(JSON.stringify(echoRequest) + '\n');
        } else if (parsed.result && parsed.result.content && initComplete) {
          // 收到echo工具響應
          clearTimeout(timeout);
          
          expect(parsed.result.content).toHaveLength(1);
          expect(parsed.result.content[0].type).toBe('text');
          expect(parsed.result.content[0].text).toBe('Echo: Hello, MCP Test!');
          
          done();
        }
      } catch (error) {
        // 忽略JSON解析錯誤
      }
    });

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      done(error);
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

  it('應該處理錯誤的工具調用', (done) => {
    let initComplete = false;
    const timeout = setTimeout(() => {
      done(new Error('Test timeout'));
    }, 5000);

    serverProcess.stdout?.on('data', (data) => {
      const response = data.toString().trim();
      
      try {
        const parsed = JSON.parse(response);
        
        if (parsed.result && parsed.result.serverInfo && !initComplete) {
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
          
          serverProcess.stdin?.write(JSON.stringify(echoRequest) + '\n');
        } else if (parsed.error && initComplete) {
          // 收到錯誤響應
          clearTimeout(timeout);
          
          expect(parsed.error.message).toContain('Invalid arguments for tool echo');
          
          done();
        }
      } catch (error) {
        // 忽略JSON解析錯誤
      }
    });

    serverProcess.on('error', (error) => {
      clearTimeout(timeout);
      done(error);
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