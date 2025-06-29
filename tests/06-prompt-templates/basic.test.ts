import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Exercise 06: Prompt Templates System', () => {
  let serverProcess: ChildProcess;
  const serverPath = path.join(__dirname, '../../dist/exercises/06-prompt-templates/server.js');

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
    expect(response.result.capabilities.prompts).toBeDefined();
  }, 15000);

  test('should list all prompts', async () => {
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

    const listPromptsRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'prompts/list',
      params: {}
    };

    const response = await sendRequest(listPromptsRequest);
    expect(response.result).toBeDefined();
    expect(response.result.prompts).toBeDefined();
    
    const promptNames = response.result.prompts.map((prompt: any) => prompt.name);
    
    // 檢查所有提示是否存在
    expect(promptNames).toContain('code-review');
    expect(promptNames).toContain('documentation');
    expect(promptNames).toContain('bug-report');
    expect(promptNames).toContain('meeting-summary');
    
    // 應該至少有4個提示
    expect(response.result.prompts.length).toBeGreaterThanOrEqual(4);
  }, 15000);

  test('code-review prompt should generate structured review template', async () => {
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

    const promptRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'prompts/get',
      params: {
        name: 'code-review',
        arguments: {
          language: 'TypeScript',
          codeContext: 'MCP server implementation',
          focusAreas: ['security', 'performance'],
          severity: 'high'
        }
      }
    };

    const response = await sendRequest(promptRequest);
    expect(response.result).toBeDefined();
    expect(response.result.messages).toBeDefined();
    expect(response.result.messages).toHaveLength(1);
    
    const message = response.result.messages[0];
    expect(message.role).toBe('user');
    expect(message.content.type).toBe('text');
    expect(message.content.text).toContain('TypeScript');
    expect(message.content.text).toContain('high-level');
    expect(message.content.text).toContain('security');
    expect(message.content.text).toContain('performance');
  }, 15000);

  test('documentation prompt should generate documentation template', async () => {
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

    const promptRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'prompts/get',
      params: {
        name: 'documentation',
        arguments: {
          type: 'api',
          name: 'getUserProfile',
          description: 'Retrieves user profile data',
          includeExamples: true,
          targetAudience: 'developer'
        }
      }
    };

    const response = await sendRequest(promptRequest);
    expect(response.result).toBeDefined();
    expect(response.result.messages).toBeDefined();
    expect(response.result.messages).toHaveLength(1);
    
    const message = response.result.messages[0];
    expect(message.role).toBe('user');
    expect(message.content.type).toBe('text');
    expect(message.content.text).toContain('getUserProfile');
    expect(message.content.text).toContain('api');
    expect(message.content.text).toContain('developer');
    expect(message.content.text).toContain('Usage Examples');
  }, 15000);

  test('bug-report prompt should generate bug report template', async () => {
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

    const promptRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'prompts/get',
      params: {
        name: 'bug-report',
        arguments: {
          severity: 'critical',
          component: 'authentication system',
          environment: 'production',
          reproducible: true,
          userImpact: 'Users cannot log in'
        }
      }
    };

    const response = await sendRequest(promptRequest);
    expect(response.result).toBeDefined();
    expect(response.result.messages).toBeDefined();
    expect(response.result.messages).toHaveLength(1);
    
    const message = response.result.messages[0];
    expect(message.role).toBe('user');
    expect(message.content.type).toBe('text');
    expect(message.content.text).toContain('CRITICAL');
    expect(message.content.text).toContain('authentication system');
    expect(message.content.text).toContain('production');
    expect(message.content.text).toContain('Users cannot log in');
  }, 15000);

  test('meeting-summary prompt should generate meeting template', async () => {
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

    const promptRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'prompts/get',
      params: {
        name: 'meeting-summary',
        arguments: {
          meetingType: 'retrospective',
          duration: 60,
          attendees: ['Alice', 'Bob', 'Charlie'],
          includeActionItems: true,
          includeDecisions: true
        }
      }
    };

    const response = await sendRequest(promptRequest);
    expect(response.result).toBeDefined();
    expect(response.result.messages).toBeDefined();
    expect(response.result.messages).toHaveLength(1);
    
    const message = response.result.messages[0];
    expect(message.role).toBe('user');
    expect(message.content.type).toBe('text');
    expect(message.content.text).toContain('retrospective');
    expect(message.content.text).toContain('60 minutes');
    expect(message.content.text).toContain('Alice, Bob, Charlie');
    expect(message.content.text).toContain('Action Items');
    expect(message.content.text).toContain('Decisions Made');
  }, 15000);

  test('should handle prompt parameter validation', async () => {
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

    const promptRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'prompts/get',
      params: {
        name: 'code-review',
        arguments: {
          language: 'TypeScript',
          // 缺少必要的 codeContext 參數
          severity: 'invalid-severity' // 無效的嚴重程度
        }
      }
    };

    const response = await sendRequest(promptRequest);
    expect(response.error).toBeDefined();
    // 應該包含參數驗證錯誤
  }, 15000);

  test('should use default values for optional parameters', async () => {
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

    const promptRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'prompts/get',
      params: {
        name: 'code-review',
        arguments: {
          language: 'JavaScript',
          codeContext: 'Simple function'
          // 不提供可選參數，應該使用預設值
        }
      }
    };

    const response = await sendRequest(promptRequest);
    expect(response.result).toBeDefined();
    expect(response.result.messages).toBeDefined();
    
    const message = response.result.messages[0];
    expect(message.content.text).toContain('medium-level'); // 預設嚴重程度
  }, 15000);

  test('should inherit all tools from previous exercises', async () => {
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
    
    // 檢查繼承的工具
    expect(toolNames).toContain('echo');
    expect(toolNames).toContain('calculate');
    expect(toolNames).toContain('text-transform');
    expect(toolNames).toContain('timestamp');
    expect(toolNames).toContain('file-read');
    expect(toolNames).toContain('file-write');
    expect(toolNames).toContain('http-fetch');
    expect(toolNames).toContain('data-process');
  }, 15000);

  test('should inherit all resources from previous exercises', async () => {
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

    const listResourcesRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/list',
      params: {}
    };

    const response = await sendRequest(listResourcesRequest);
    expect(response.result).toBeDefined();
    expect(response.result.resources).toBeDefined();
    
    const resourceNames = response.result.resources.map((resource: any) => resource.name);
    
    // 檢查繼承的資源
    expect(resourceNames).toContain('server-config');
    expect(resourceNames).toContain('help-info');
  }, 15000);
});