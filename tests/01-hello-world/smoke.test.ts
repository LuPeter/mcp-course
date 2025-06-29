import { spawn } from 'child_process';
import { resolve } from 'path';

describe('Exercise 01: Hello World MCP Server (Smoke Test)', () => {
  const serverPath = resolve(__dirname, '../../dist/solutions/01-hello-world/server.js');

  it('應該能夠啟動服務器', (done) => {
    const serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let hasStarted = false;
    const timeout = setTimeout(() => {
      if (!hasStarted) {
        serverProcess.kill();
        done(new Error('Server did not start within timeout'));
      }
    }, 3000);

    serverProcess.stderr?.on('data', (data) => {
      const message = data.toString();
      console.log('Server stderr:', message);
      
      if (message.includes('Hello World MCP Server started successfully')) {
        hasStarted = true;
        clearTimeout(timeout);
        serverProcess.kill();
        done();
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

  it('應該回應初始化請求', (done) => {
    const serverProcess = spawn('node', [serverPath], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    const timeout = setTimeout(() => {
      serverProcess.kill();
      done(new Error('No response within timeout'));
    }, 3000);

    serverProcess.stdout?.on('data', (data) => {
      const response = data.toString().trim();
      console.log('Server response:', response);
      
      try {
        const parsed = JSON.parse(response);
        if (parsed.result && parsed.result.serverInfo) {
          clearTimeout(timeout);
          serverProcess.kill();
          
          expect(parsed.result.serverInfo.name).toBe('hello-world-server');
          expect(parsed.result.serverInfo.version).toBe('1.0.0');
          done();
        }
      } catch (error) {
        // 忽略JSON解析錯誤，可能是部分響應
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