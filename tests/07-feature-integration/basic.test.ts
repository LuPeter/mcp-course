import { spawn, ChildProcess } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';

describe('Exercise 07: Feature Integration Server', () => {
  let serverProcess: ChildProcess;
  const serverPath = path.join(__dirname, '../../dist/exercises/07-feature-integration/server.js');

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
    expect(response.result.capabilities.tools).toBeDefined();
    expect(response.result.capabilities.resources).toBeDefined();
    expect(response.result.capabilities.prompts).toBeDefined();
  }, 15000);

  test('should list all tools including content management', async () => {
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
    
    // 檢查新增的內容管理工具
    expect(toolNames).toContain('content-create');
    expect(toolNames).toContain('content-update');
    expect(toolNames).toContain('content-delete');
    
    // 應該至少有11個工具
    expect(response.result.tools.length).toBeGreaterThanOrEqual(11);
  }, 15000);

  test('should create new content item', async () => {
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

    const createContentRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'content-create',
        arguments: {
          type: 'article',
          title: 'Test Article',
          content: 'This is a test article content',
          author: 'Test Author',
          tags: ['test', 'article'],
          status: 'draft'
        }
      }
    };

    const response = await sendRequest(createContentRequest);
    expect(response.result).toBeDefined();
    expect(response.result.content).toBeDefined();
    expect(response.result.content[0].text).toContain('Content created successfully');
    expect(response.result.content[0].text).toContain('Type: article');
    expect(response.result.content[0].text).toContain('Title: Test Article');
    expect(response.result.content[0].text).toContain('Author: Test Author');
  }, 15000);

  test('should update existing content item', async () => {
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

    // 創建內容
    const createContentRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'content-create',
        arguments: {
          type: 'blog',
          title: 'Original Title',
          content: 'Original content',
          author: 'Original Author'
        }
      }
    };

    const createResponse = await sendRequest(createContentRequest);
    const contentId = createResponse.result.content[0].text.match(/ID: ([^\n]+)/)[1];

    // 更新內容
    const updateContentRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'content-update',
        arguments: {
          id: contentId,
          title: 'Updated Title',
          status: 'published'
        }
      }
    };

    const response = await sendRequest(updateContentRequest);
    expect(response.result).toBeDefined();
    expect(response.result.content[0].text).toContain('Content updated successfully');
    expect(response.result.content[0].text).toContain('Title: Updated Title');
    expect(response.result.content[0].text).toContain('Status: published');
  }, 15000);

  test('should delete content item', async () => {
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

    // 創建內容
    const createContentRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'content-create',
        arguments: {
          type: 'note',
          title: 'Delete Me',
          content: 'This will be deleted',
          author: 'Test Author'
        }
      }
    };

    const createResponse = await sendRequest(createContentRequest);
    const contentId = createResponse.result.content[0].text.match(/ID: ([^\n]+)/)[1];

    // 刪除內容
    const deleteContentRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'content-delete',
        arguments: {
          id: contentId
        }
      }
    };

    const response = await sendRequest(deleteContentRequest);
    expect(response.result).toBeDefined();
    expect(response.result.content[0].text).toContain('Content deleted successfully');
    expect(response.result.content[0].text).toContain('Title: Delete Me');
  }, 15000);

  test('should list all resources including content resource', async () => {
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
    
    // 檢查新增的內容資源
    expect(resourceNames).toContain('content');
    
    // 應該至少有3個資源
    expect(response.result.resources.length).toBeGreaterThanOrEqual(3);
  }, 15000);

  test('should access content resource', async () => {
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

    const readResourceRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/read',
      params: {
        uri: 'content://'
      }
    };

    const response = await sendRequest(readResourceRequest);
    expect(response.result).toBeDefined();
    expect(response.result.contents).toBeDefined();
    expect(response.result.contents[0]).toBeDefined();
    
    const contentData = JSON.parse(response.result.contents[0].text);
    expect(contentData.total).toBeDefined();
    expect(contentData.content).toBeDefined();
    expect(Array.isArray(contentData.content)).toBe(true);
  }, 15000);

  test('should list all prompts including content prompts', async () => {
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
    
    // 檢查繼承的提示
    expect(promptNames).toContain('code-review');
    expect(promptNames).toContain('documentation');
    expect(promptNames).toContain('bug-report');
    expect(promptNames).toContain('meeting-summary');
    
    // 檢查新增的內容提示
    expect(promptNames).toContain('content-generation');
    expect(promptNames).toContain('content-optimization');
    
    // 應該至少有6個提示
    expect(response.result.prompts.length).toBeGreaterThanOrEqual(6);
  }, 15000);

  test('content-generation prompt should generate content template', async () => {
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
        name: 'content-generation',
        arguments: {
          contentType: 'blog post',
          topic: 'Machine Learning Basics',
          targetAudience: 'beginners',
          length: 'medium',
          tone: 'educational',
          keywords: 'AI, neural networks, data science'
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
    expect(message.content.text).toContain('blog post');
    expect(message.content.text).toContain('Machine Learning Basics');
    expect(message.content.text).toContain('beginners');
    expect(message.content.text).toContain('educational');
    expect(message.content.text).toContain('AI, neural networks, data science');
  }, 15000);

  test('content-optimization prompt should generate optimization template', async () => {
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
        name: 'content-optimization',
        arguments: {
          contentText: 'This is some basic content that needs improvement.',
          optimizationGoals: 'readability, engagement',
          targetMetrics: 'user engagement, time on page',
          currentIssues: 'too basic, lacks examples'
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
    expect(message.content.text).toContain('This is some basic content that needs improvement.');
    expect(message.content.text).toContain('readability, engagement');
    expect(message.content.text).toContain('user engagement, time on page');
    expect(message.content.text).toContain('too basic, lacks examples');
  }, 15000);

  test('should handle content workflow: create via prompt and manage via tools', async () => {
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

    // 1. 使用提示生成內容想法
    const promptRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'prompts/get',
      params: {
        name: 'content-generation',
        arguments: {
          contentType: 'article',
          topic: 'MCP Integration',
          targetAudience: 'developers'
        }
      }
    };

    const promptResponse = await sendRequest(promptRequest);
    expect(promptResponse.result).toBeDefined();

    // 2. 使用工具創建內容
    const createContentRequest = {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/call',
      params: {
        name: 'content-create',
        arguments: {
          type: 'article',
          title: 'MCP Integration Guide',
          content: 'Generated content based on prompt template',
          author: 'System',
          tags: ['mcp', 'integration', 'guide']
        }
      }
    };

    const createResponse = await sendRequest(createContentRequest);
    expect(createResponse.result).toBeDefined();
    expect(createResponse.result.content[0].text).toContain('Content created successfully');

    // 3. 通過資源訪問創建的內容
    const contentId = createResponse.result.content[0].text.match(/ID: ([^\n]+)/)[1];
    const readResourceRequest = {
      jsonrpc: '2.0',
      id: 4,
      method: 'resources/read',
      params: {
        uri: `content://article/${contentId}`
      }
    };

    const resourceResponse = await sendRequest(readResourceRequest);
    expect(resourceResponse.result).toBeDefined();
    expect(resourceResponse.result.contents[0]).toBeDefined();
    
    const contentData = JSON.parse(resourceResponse.result.contents[0].text);
    expect(contentData.title).toBe('MCP Integration Guide');
    expect(contentData.type).toBe('article');
  }, 15000);

  test('should handle error cases gracefully', async () => {
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

    // 嘗試更新不存在的內容
    const updateNonExistentRequest = {
      jsonrpc: '2.0',
      id: 2,
      method: 'tools/call',
      params: {
        name: 'content-update',
        arguments: {
          id: 'non-existent-id',
          title: 'New Title'
        }
      }
    };

    const response = await sendRequest(updateNonExistentRequest);
    expect(response.error).toBeDefined();
    expect(response.error.message).toContain('Content not found');
  }, 15000);
});