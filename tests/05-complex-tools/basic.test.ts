import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Exercise 05: Complex Tools and Error Handling', () => {
  let serverProcess: ChildProcess;
  const serverPath = path.join(__dirname, '../../dist/exercises/05-complex-tools/server.js');
  const dataDir = path.join(__dirname, '../../exercises/05-complex-tools/data');

  beforeAll(async () => {
    // 確保數據目錄存在
    try {
      await fs.mkdir(dataDir, { recursive: true });
    } catch (error) {
      // 目錄可能已存在
    }

    // 創建測試文件
    await fs.writeFile(path.join(dataDir, 'test.txt'), 'Hello, MCP!', 'utf8');
  });

  beforeEach(() => {
    serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });
  });

  afterEach(() => {
    if (serverProcess && !serverProcess.killed) {
      serverProcess.kill();
    }
  });

  afterAll(async () => {
    // 清理測試文件
    try {
      await fs.unlink(path.join(dataDir, 'test.txt'));
      await fs.unlink(path.join(dataDir, 'output.txt'));
    } catch (error) {
      // 文件可能不存在
    }
  });

  const sendRequest = (request: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, 10000);

      let responseData = '';
      
      serverProcess.stdout?.on('data', (data) => {
        responseData += data.toString();
        const lines = responseData.split('\n');
        
        for (const line of lines) {
          if (line.trim()) {
            try {
              const response = JSON.parse(line);
              if (response.id === request.id) {
                clearTimeout(timeout);
                resolve(response);
                return;
              }
            } catch (error) {
              // 忽略非JSON行
            }
          }
        }
      });

      serverProcess.stderr?.on('data', (data) => {
        // 忽略stderr輸出（通常是狀態消息）
      });

      serverProcess.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });

      // 發送請求
      const requestStr = JSON.stringify(request) + '\n';
      serverProcess.stdin?.write(requestStr);
    });
  };

  test('server should initialize successfully', async () => {
    const initRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    };

    const response = await sendRequest(initRequest);
    expect(response.result).toBeDefined();
    expect(response.result.capabilities).toBeDefined();
  }, 15000);

  test('should list all tools including complex ones', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });

    const listToolsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/list',
      params: {}
    };

    const response = await sendRequest(listToolsRequest);
    expect(response.result).toBeDefined();
    expect(response.result.tools).toBeDefined();
    
    const toolNames = response.result.tools.map((tool: any) => tool.name);
    
    // 檢查所有工具是否存在
    expect(toolNames).toContain('echo');
    expect(toolNames).toContain('calculate');
    expect(toolNames).toContain('text-transform');
    expect(toolNames).toContain('timestamp');
    expect(toolNames).toContain('file-read');
    expect(toolNames).toContain('file-write');
    expect(toolNames).toContain('http-fetch');
    expect(toolNames).toContain('data-process');
    
    // 應該至少有8個工具
    expect(response.result.tools.length).toBeGreaterThanOrEqual(8);
  }, 15000);

  test('file-read tool should read existing file', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });

    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'file-read',
        arguments: {
          filename: 'test.txt',
          encoding: 'utf8'
        }
      }
    };

    const response = await sendRequest(toolCallRequest);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].text).toContain('Hello, MCP!');
    expect(response.result.content[0].text).toContain('test.txt');
  }, 15000);

  test('file-write tool should create new file', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });

    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'file-write',
        arguments: {
          filename: 'output.txt',
          content: 'Test output content',
          encoding: 'utf8',
          overwrite: false
        }
      }
    };

    const response = await sendRequest(toolCallRequest);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].text).toContain('File written successfully');
    
    // 驗證文件確實被創建
    const fileContent = await fs.readFile(path.join(dataDir, 'output.txt'), 'utf8');
    expect(fileContent).toBe('Test output content');
  }, 15000);

  test('http-fetch tool should simulate HTTP request', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });

    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'http-fetch',
        arguments: {
          url: 'https://api.example.com/users',
          method: 'GET',
          timeout: 5000
        }
      }
    };

    const response = await sendRequest(toolCallRequest);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].text).toContain('HTTP GET');
    expect(response.result.content[0].text).toContain('Status: 200');
    expect(response.result.content[0].text).toContain('Alice');
  }, 15000);

  test('data-process tool should parse JSON data', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });

    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'data-process',
        arguments: {
          data: '{"name": "Alice", "age": 30}',
          operation: 'parse',
          parameters: {}
        }
      }
    };

    const response = await sendRequest(toolCallRequest);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].text).toContain('Data processing result');
    expect(response.result.content[0].text).toContain('Alice');
  }, 15000);

  test('should handle file operation errors gracefully', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });

    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'file-read',
        arguments: {
          filename: 'nonexistent.txt',
          encoding: 'utf8'
        }
      }
    };

    const response = await sendRequest(toolCallRequest);
    expect(response.error).toBeDefined();
    expect(response.error.message).toContain('File read error');
  }, 15000);

  test('should prevent path traversal attacks', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });

    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'file-read',
        arguments: {
          filename: '../../../etc/passwd',
          encoding: 'utf8'
        }
      }
    };

    const response = await sendRequest(toolCallRequest);
    expect(response.error).toBeDefined();
    expect(response.error.message).toContain('path traversal not allowed');
  }, 15000);

  test('should handle HTTP error responses', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });

    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'http-fetch',
        arguments: {
          url: 'https://api.example.com/error',
          method: 'GET',
          timeout: 5000
        }
      }
    };

    const response = await sendRequest(toolCallRequest);
    expect(response.error).toBeDefined();
    expect(response.error.message).toContain('HTTP 500');
  }, 15000);

  test('should handle invalid JSON in data processing', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test-client', version: '1.0.0' }
      }
    });

    const toolCallRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'data-process',
        arguments: {
          data: 'invalid json',
          operation: 'parse',
          parameters: {}
        }
      }
    };

    const response = await sendRequest(toolCallRequest);
    expect(response.error).toBeDefined();
    expect(response.error.message).toContain('Invalid JSON');
  }, 15000);
});