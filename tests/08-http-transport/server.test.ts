import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import http from 'http';
import { randomUUID } from 'crypto';

/**
 * 練習 8: HTTP 傳輸服務器測試
 * 
 * 測試 HTTP 傳輸功能，包括會話管理和所有集成功能
 */

const EXERCISE_DIR = path.join(__dirname, '../../exercises/08-http-transport');
const SERVER_PATH = path.join(EXERCISE_DIR, 'server.js');
const TIMEOUT = 10000;
const HTTP_PORT = 3001; // 使用不同端口避免衝突

interface JSONRPCRequest {
  jsonrpc: string;
  id: number | string;
  method: string;
  params?: any;
}

interface JSONRPCResponse {
  jsonrpc: string;
  id: number | string;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

// stdio 服務器測試
describe('HTTP Transport Server - stdio Mode', () => {
  let serverProcess: ChildProcess;
  
  beforeEach(async () => {
    serverProcess = spawn('node', [SERVER_PATH], {
      cwd: EXERCISE_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // 等待服務器啟動
    await new Promise(resolve => setTimeout(resolve, 2000));
  });
  
  afterEach(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  });
  
  async function sendRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, TIMEOUT);
      
      let responseData = '';
      
      const onData = (chunk: Buffer) => {
        responseData += chunk.toString();
        try {
          const response = JSON.parse(responseData);
          clearTimeout(timeout);
          serverProcess.stdout?.off('data', onData);
          resolve(response);
        } catch {
          // 等待更多數據
        }
      };
      
      serverProcess.stdout?.on('data', onData);
      serverProcess.stdin?.write(JSON.stringify(request) + '\n');
    });
  }
  
  test('服務器初始化和能力檢查', async () => {
    const request: JSONRPCRequest = {
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
    
    const response = await sendRequest(request);
    
    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(1);
    expect(response.result).toBeDefined();
    expect(response.result.capabilities).toBeDefined();
    expect(response.result.serverInfo).toBeDefined();
    expect(response.result.serverInfo.name).toBe('http-transport-server');
  });
  
  test('基本工具測試 - echo', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' }
      }
    });
    
    // 測試 echo 工具
    const response = await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'echo',
        arguments: {
          message: 'Hello HTTP Transport!'
        }
      }
    });
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].text).toContain('Hello HTTP Transport!');
  });
  
  test('會話管理工具測試', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' }
      }
    });
    
    // 測試會話信息工具
    const response = await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'session-info',
        arguments: {
          action: 'current'
        }
      }
    });
    
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].text).toContain('Active sessions');
  });
  
  test('內容管理工具測試', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' }
      }
    });
    
    // 創建內容
    const createResponse = await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'content-create',
        arguments: {
          type: 'article',
          title: 'HTTP Transport Test Article',
          content: 'This is a test article for HTTP transport.',
          author: 'Test Author'
        }
      }
    });
    
    expect(createResponse.result).toBeDefined();
    expect(createResponse.result.content[0].text).toContain('Content created successfully');
  });
  
  test('資源訪問測試', async () => {
    // 初始化
    await sendRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' }
      }
    });
    
    // 讀取服務器配置
    const response = await sendRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/read',
      params: {
        uri: 'config://server'
      }
    });
    
    expect(response.result).toBeDefined();
    expect(response.result.contents).toBeDefined();
    expect(response.result.contents[0].text).toBeDefined();
    
    const config = JSON.parse(response.result.contents[0].text);
    expect(config.serverName).toBe('http-transport-server');
    expect(config.transports).toContain('stdio');
    expect(config.transports).toContain('http');
  });
});

// HTTP 服務器測試
describe('HTTP Transport Server - HTTP Mode', () => {
  let serverProcess: ChildProcess;
  
  beforeAll(async () => {
    serverProcess = spawn('node', [SERVER_PATH, '--http'], {
      cwd: EXERCISE_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: HTTP_PORT.toString() }
    });
    
    // 等待 HTTP 服務器啟動
    await new Promise(resolve => setTimeout(resolve, 3000));
  });
  
  afterAll(() => {
    if (serverProcess) {
      serverProcess.kill('SIGTERM');
    }
  });
  
  async function sendHttpRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    return new Promise((resolve, reject) => {
      const postData = JSON.stringify(request);
      
      const options = {
        hostname: 'localhost',
        port: HTTP_PORT,
        path: '/mcp',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(postData)
        }
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(TIMEOUT, () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      
      req.write(postData);
      req.end();
    });
  }
  
  async function checkHealth(): Promise<any> {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'localhost',
        port: HTTP_PORT,
        path: '/health',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            resolve(response);
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', (error) => {
        reject(error);
      });
      
      req.setTimeout(TIMEOUT, () => {
        req.destroy();
        reject(new Error('Health check timeout'));
      });
      
      req.end();
    });
  }
  
  test('HTTP 服務器健康檢查', async () => {
    const health = await checkHealth();
    
    expect(health.status).toBe('healthy');
    expect(health.version).toBe('1.0.0');
    expect(health.uptime).toBeGreaterThan(0);
    expect(health.activeSessions).toBeDefined();
  });
  
  test('HTTP MCP 初始化', async () => {
    const request: JSONRPCRequest = {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: {
          name: 'http-test-client',
          version: '1.0.0'
        }
      }
    };
    
    const response = await sendHttpRequest(request);
    
    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(1);
    expect(response.result).toBeDefined();
    expect(response.result.serverInfo.name).toBe('http-transport-server');
  });
  
  test('HTTP 工具調用測試', async () => {
    // 初始化
    await sendHttpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'http-test', version: '1.0.0' }
      }
    });
    
    // 測試計算工具
    const response = await sendHttpRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'calculate',
        arguments: {
          expression: '10 + 5 * 2'
        }
      }
    });
    
    expect(response.result).toBeDefined();
    expect(response.result.content[0].text).toContain('20');
  });
  
  test('HTTP 會話管理測試', async () => {
    // 初始化第一個會話
    await sendHttpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'session-test-1', version: '1.0.0' }
      }
    });
    
    // 初始化第二個會話
    await sendHttpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'session-test-2', version: '1.0.0' }
      }
    });
    
    // 檢查會話列表
    const response = await sendHttpRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'session-info',
        arguments: {
          action: 'list'
        }
      }
    });
    
    expect(response.result).toBeDefined();
    expect(response.result.content[0].text).toContain('Active Sessions');
  });
  
  test('HTTP 併發請求測試', async () => {
    // 初始化會話
    await sendHttpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'concurrent-test', version: '1.0.0' }
      }
    });
    
    // 發送多個併發請求
    const requests = [];
    for (let i = 0; i < 5; i++) {
      requests.push(
        sendHttpRequest({
          jsonrpc: '2.0',
          id: i + 2,
          method: 'tools/call',
          params: {
            name: 'echo',
            arguments: {
              message: `Concurrent message ${i + 1}`
            }
          }
        })
      );
    }
    
    const responses = await Promise.all(requests);
    
    expect(responses).toHaveLength(5);
    responses.forEach((response, index) => {
      expect(response.result).toBeDefined();
      expect(response.result.content[0].text).toContain(`Concurrent message ${index + 1}`);
    });
  });
  
  test('HTTP 錯誤處理測試', async () => {
    // 初始化
    await sendHttpRequest({
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'error-test', version: '1.0.0' }
      }
    });
    
    // 測試無效工具
    const response = await sendHttpRequest({
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'non-existent-tool',
        arguments: {}
      }
    });
    
    expect(response.error).toBeDefined();
    expect(response.error?.message).toContain('Tool not found');
  });
});

// 整合測試
describe('HTTP Transport Server - Integration Tests', () => {
  let stdioProcess: ChildProcess;
  let httpProcess: ChildProcess;
  
  beforeAll(async () => {
    // 啟動 stdio 服務器
    stdioProcess = spawn('node', [SERVER_PATH], {
      cwd: EXERCISE_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // 啟動 HTTP 服務器
    httpProcess = spawn('node', [SERVER_PATH, '--http'], {
      cwd: EXERCISE_DIR,
      stdio: ['pipe', 'pipe', 'pipe'],
      env: { ...process.env, PORT: (HTTP_PORT + 1).toString() }
    });
    
    // 等待服務器啟動
    await new Promise(resolve => setTimeout(resolve, 3000));
  });
  
  afterAll(() => {
    if (stdioProcess) {
      stdioProcess.kill('SIGTERM');
    }
    if (httpProcess) {
      httpProcess.kill('SIGTERM');
    }
  });
  
  test('兩種傳輸模式並行運行', async () => {
    // 測試 stdio 模式
    const stdioRequest = new Promise<JSONRPCResponse>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('stdio request timeout'));
      }, TIMEOUT);
      
      let responseData = '';
      
      const onData = (chunk: Buffer) => {
        responseData += chunk.toString();
        try {
          const response = JSON.parse(responseData);
          clearTimeout(timeout);
          stdioProcess.stdout?.off('data', onData);
          resolve(response);
        } catch {
          // 等待更多數據
        }
      };
      
      stdioProcess.stdout?.on('data', onData);
      stdioProcess.stdin?.write(JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'stdio-integration', version: '1.0.0' }
        }
      }) + '\n');
    });
    
    // 測試 HTTP 模式
    const httpRequest = new Promise<any>((resolve, reject) => {
      const postData = JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'initialize',
        params: {
          protocolVersion: '2024-11-05',
          capabilities: {},
          clientInfo: { name: 'http-integration', version: '1.0.0' }
        }
      });
      
      const options = {
        hostname: 'localhost',
        port: HTTP_PORT + 1,
        path: '/health',
        method: 'GET'
      };
      
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(error);
          }
        });
      });
      
      req.on('error', reject);
      req.setTimeout(TIMEOUT, () => {
        req.destroy();
        reject(new Error('HTTP request timeout'));
      });
      
      req.end();
    });
    
    const [stdioResponse, httpResponse] = await Promise.all([stdioRequest, httpRequest]);
    
    // 驗證兩種模式都正常工作
    expect(stdioResponse.result).toBeDefined();
    expect(httpResponse.status).toBe('healthy');
  });
});
