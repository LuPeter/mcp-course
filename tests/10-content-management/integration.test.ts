import { describe, test, expect, beforeAll, afterAll, beforeEach, afterEach } from '@jest/globals';
import { spawn, ChildProcess } from 'child_process';
import path from 'path';
import fs from 'fs/promises';

/**
 * 練習 10 MCP服務器整合測試
 * 
 * 測試範圍：
 * - MCP服務器啟動和初始化
 * - Resources端點測試
 * - Tools調用測試
 * - Prompts功能測試
 * - 錯誤處理測試
 * - 端到端工作流測試
 */

// 測試配置
const SERVER_PATH = path.join(process.cwd(), 'dist', 'solutions', '10-content-management', 'server.js');
const TEST_DB_PATH = path.join(process.cwd(), 'data', 'test_integration_content.db');
const SERVER_TIMEOUT = 10000; // 10秒服務器啟動超時

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: any;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

class MCPTestClient {
  private server: ChildProcess | null = null;
  private messageId = 1;
  private responsePromises = new Map<number, {
    resolve: (value: MCPResponse) => void;
    reject: (error: Error) => void;
  }>();

  async startServer(): Promise<void> {
    return new Promise((resolve, reject) => {
      // 清理測試資料庫
      this.cleanupTestDatabase();

      this.server = spawn('node', [SERVER_PATH], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env, NODE_ENV: 'test' }
      });

      let initialized = false;
      const timeout = setTimeout(() => {
        if (!initialized) {
          reject(new Error('服務器啟動超時'));
        }
      }, SERVER_TIMEOUT);

      this.server.stdout?.on('data', (data) => {
        const output = data.toString();
        console.log('Server stdout:', output);

        if (output.includes('內容管理服務器已啟動') && !initialized) {
          initialized = true;
          clearTimeout(timeout);
          resolve();
        }

        // 處理JSON-RPC響應
        const lines = output.split('\n').filter(line => line.trim());
        for (const line of lines) {
          try {
            const response: MCPResponse = JSON.parse(line);
            if (response.id && this.responsePromises.has(response.id)) {
              const { resolve: resolvePromise } = this.responsePromises.get(response.id)!;
              this.responsePromises.delete(response.id);
              resolvePromise(response);
            }
          } catch {
            // 不是JSON響應，忽略
          }
        }
      });

      this.server.stderr?.on('data', (data) => {
        console.error('Server stderr:', data.toString());
      });

      this.server.on('error', (error) => {
        console.error('Server process error:', error);
        if (!initialized) {
          clearTimeout(timeout);
          reject(error);
        }
      });

      this.server.on('exit', (code) => {
        console.log(`Server process exited with code ${code}`);
        if (!initialized) {
          clearTimeout(timeout);
          reject(new Error(`服務器異常退出，代碼: ${code}`));
        }
      });
    });
  }

  async stopServer(): Promise<void> {
    if (this.server) {
      this.server.kill('SIGTERM');
      await new Promise(resolve => {
        this.server!.on('exit', resolve);
        setTimeout(() => {
          if (this.server && !this.server.killed) {
            this.server.kill('SIGKILL');
          }
          resolve(undefined);
        }, 5000);
      });
      this.server = null;
    }
    await this.cleanupTestDatabase();
  }

  private async cleanupTestDatabase(): Promise<void> {
    try {
      await fs.unlink(TEST_DB_PATH);
    } catch {
      // 檔案不存在時忽略錯誤
    }
  }

  async sendRequest(method: string, params?: any): Promise<MCPResponse> {
    if (!this.server || !this.server.stdin) {
      throw new Error('服務器未啟動');
    }

    const id = this.messageId++;
    const request: MCPRequest = {
      jsonrpc: '2.0',
      id,
      method,
      params
    };

    return new Promise((resolve, reject) => {
      this.responsePromises.set(id, { resolve, reject });

      const requestStr = JSON.stringify(request) + '\n';
      this.server!.stdin!.write(requestStr);

      // 設置請求超時
      setTimeout(() => {
        if (this.responsePromises.has(id)) {
          this.responsePromises.delete(id);
          reject(new Error(`請求超時: ${method}`));
        }
      }, 5000);
    });
  }

  async initialize(): Promise<void> {
    const response = await this.sendRequest('initialize', {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: {
        name: 'test-client',
        version: '1.0.0'
      }
    });

    if (response.error) {
      throw new Error(`初始化失敗: ${response.error.message}`);
    }

    // 發送initialized通知
    await this.sendRequest('initialized', {});
  }
}

describe('MCP服務器整合測試', () => {
  let client: MCPTestClient;

  beforeAll(async () => {
    // 確保dist目錄存在且已編譯
    const distExists = await fs.access(SERVER_PATH).then(() => true).catch(() => false);
    if (!distExists) {
      throw new Error(`服務器文件不存在: ${SERVER_PATH}，請先運行 npm run build`);
    }

    client = new MCPTestClient();
    await client.startServer();
    await client.initialize();
  }, 30000);

  afterAll(async () => {
    await client.stopServer();
  }, 15000);

  describe('服務器初始化', () => {
    test('應該成功初始化MCP協議', async () => {
      // 初始化已在beforeAll中完成
      expect(true).toBe(true);
    });

    test('應該支援capabilities查詢', async () => {
      const response = await client.sendRequest('initialize', {
        protocolVersion: '2024-11-05',
        capabilities: {},
        clientInfo: { name: 'test', version: '1.0.0' }
      });

      expect(response.error).toBeUndefined();
      expect(response.result).toBeDefined();
      expect(response.result.capabilities).toBeDefined();
    });
  });

  describe('Resources測試', () => {
    test('應該列出所有可用資源', async () => {
      const response = await client.sendRequest('resources/list');

      expect(response.error).toBeUndefined();
      expect(response.result.resources).toBeDefined();
      expect(Array.isArray(response.result.resources)).toBe(true);

      const resourceNames = response.result.resources.map((r: any) => r.name);
      expect(resourceNames).toContain('articles-list');
      expect(resourceNames).toContain('tags-list');
      expect(resourceNames).toContain('article-detail');
      expect(resourceNames).toContain('articles-by-tag');
    });

    test('應該讀取文章列表資源', async () => {
      const response = await client.sendRequest('resources/read', {
        uri: 'content://articles'
      });

      expect(response.error).toBeUndefined();
      expect(response.result.contents).toBeDefined();
      expect(Array.isArray(response.result.contents)).toBe(true);
      expect(response.result.contents.length).toBeGreaterThan(0);

      const content = response.result.contents[0];
      expect(content.uri).toBe('content://articles');
      expect(typeof content.text).toBe('string');

      // 驗證返回的是有效的JSON
      const articles = JSON.parse(content.text);
      expect(Array.isArray(articles)).toBe(true);
    });

    test('應該讀取標籤列表資源', async () => {
      const response = await client.sendRequest('resources/read', {
        uri: 'content://tags'
      });

      expect(response.error).toBeUndefined();
      expect(response.result.contents).toBeDefined();

      const content = response.result.contents[0];
      const tags = JSON.parse(content.text);
      expect(Array.isArray(tags)).toBe(true);
    });

    test('應該讀取特定文章資源', async () => {
      // 首先創建一篇文章
      const createResponse = await client.sendRequest('tools/call', {
        name: 'article-create',
        arguments: {
          title: '測試文章',
          content: '測試內容',
          author: '測試作者',
          status: 'published'
        }
      });

      expect(createResponse.error).toBeUndefined();

      // 讀取創建的文章
      const readResponse = await client.sendRequest('resources/read', {
        uri: 'content://articles/1'
      });

      expect(readResponse.error).toBeUndefined();
      expect(readResponse.result.contents).toBeDefined();

      const content = readResponse.result.contents[0];
      const article = JSON.parse(content.text);
      expect(article.title).toBe('測試文章');
      expect(article.content).toBe('測試內容');
      expect(article.author).toBe('測試作者');
    });

    test('應該處理不存在的文章資源', async () => {
      const response = await client.sendRequest('resources/read', {
        uri: 'content://articles/99999'
      });

      expect(response.error).toBeUndefined();
      expect(response.result.contents[0].text).toContain('文章不存在');
    });
  });

  describe('Tools測試', () => {
    test('應該列出所有可用工具', async () => {
      const response = await client.sendRequest('tools/list');

      expect(response.error).toBeUndefined();
      expect(response.result.tools).toBeDefined();
      expect(Array.isArray(response.result.tools)).toBe(true);

      const toolNames = response.result.tools.map((t: any) => t.name);
      expect(toolNames).toContain('article-create');
      expect(toolNames).toContain('article-update');
      expect(toolNames).toContain('article-delete');
      expect(toolNames).toContain('article-list');
      expect(toolNames).toContain('tag-manage');
      expect(toolNames).toContain('database-health');
    });

    test('應該創建文章', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'article-create',
        arguments: {
          title: '新文章',
          content: '新文章的內容',
          author: '作者名',
          status: 'draft',
          tags: ['測試', '範例']
        }
      });

      expect(response.error).toBeUndefined();
      expect(response.result.content).toBeDefined();
      expect(response.result.content[0].text).toContain('文章創建成功');
    });

    test('應該更新文章', async () => {
      // 首先創建文章
      const createResponse = await client.sendRequest('tools/call', {
        name: 'article-create',
        arguments: {
          title: '原標題',
          content: '原內容',
          author: '作者',
          status: 'draft'
        }
      });

      expect(createResponse.error).toBeUndefined();

      // 更新文章
      const updateResponse = await client.sendRequest('tools/call', {
        name: 'article-update',
        arguments: {
          id: 2, // 假設這是第二篇文章
          title: '更新後標題',
          status: 'published'
        }
      });

      expect(updateResponse.error).toBeUndefined();
      expect(updateResponse.result.content[0].text).toContain('文章更新成功');
    });

    test('應該查詢文章列表', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'article-list',
        arguments: {
          status: 'published',
          limit: 5,
          orderBy: 'created_at',
          orderDirection: 'DESC'
        }
      });

      expect(response.error).toBeUndefined();
      expect(response.result.content[0].text).toContain('文章列表查詢結果');
    });

    test('應該管理標籤', async () => {
      // 創建標籤
      const createTagResponse = await client.sendRequest('tools/call', {
        name: 'tag-manage',
        arguments: {
          action: 'create',
          tagName: '新標籤'
        }
      });

      expect(createTagResponse.error).toBeUndefined();
      expect(createTagResponse.result.content[0].text).toContain('標籤操作成功');

      // 為文章分配標籤
      const assignResponse = await client.sendRequest('tools/call', {
        name: 'tag-manage',
        arguments: {
          action: 'assign',
          tagName: '新標籤',
          articleId: 1
        }
      });

      expect(assignResponse.error).toBeUndefined();
      expect(assignResponse.result.content[0].text).toContain('標籤分配成功');
    });

    test('應該檢查資料庫健康狀態', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'database-health',
        arguments: {}
      });

      expect(response.error).toBeUndefined();
      expect(response.result.content[0].text).toContain('資料庫健康檢查報告');
      expect(response.result.content[0].text).toContain('連接狀態');
      expect(response.result.content[0].text).toContain('數據統計');
    });

    test('應該處理無效的工具參數', async () => {
      const response = await client.sendRequest('tools/call', {
        name: 'article-create',
        arguments: {
          title: '', // 無效的空標題
          content: '內容',
          author: '作者'
        }
      });

      expect(response.error).toBeUndefined();
      expect(response.result.isError).toBe(true);
      expect(response.result.content[0].text).toContain('創建文章失敗');
    });
  });

  describe('Prompts測試', () => {
    test('應該列出所有可用提示', async () => {
      const response = await client.sendRequest('prompts/list');

      expect(response.error).toBeUndefined();
      expect(response.result.prompts).toBeDefined();
      expect(Array.isArray(response.result.prompts)).toBe(true);

      const promptNames = response.result.prompts.map((p: any) => p.name);
      expect(promptNames).toContain('article-template');
      expect(promptNames).toContain('content-optimization');
    });

    test('應該生成文章模板', async () => {
      const response = await client.sendRequest('prompts/get', {
        name: 'article-template',
        arguments: {
          topic: 'TypeScript最佳實踐',
          length: 'medium',
          style: 'technical'
        }
      });

      expect(response.error).toBeUndefined();
      expect(response.result.messages).toBeDefined();
      expect(Array.isArray(response.result.messages)).toBe(true);
      expect(response.result.messages.length).toBeGreaterThan(0);

      const message = response.result.messages[0];
      expect(message.role).toBe('assistant');
      expect(message.content.text).toContain('TypeScript最佳實踐');
      expect(message.content.text).toContain('article-create');
    });

    test('應該提供內容優化建議', async () => {
      // 首先創建一篇文章
      await client.sendRequest('tools/call', {
        name: 'article-create',
        arguments: {
          title: '需要優化的文章',
          content: '這是一篇內容簡單的文章，需要優化。',
          author: '作者',
          status: 'draft'
        }
      });

      // 獲取優化建議
      const response = await client.sendRequest('prompts/get', {
        name: 'content-optimization',
        arguments: {
          articleId: 3, // 假設這是第三篇文章
          focus: 'readability'
        }
      });

      expect(response.error).toBeUndefined();
      expect(response.result.messages[0].content.text).toContain('文章內容優化分析');
      expect(response.result.messages[0].content.text).toContain('需要優化的文章');
      expect(response.result.messages[0].content.text).toContain('可讀性優化建議');
    });

    test('應該處理不存在的文章優化請求', async () => {
      const response = await client.sendRequest('prompts/get', {
        name: 'content-optimization',
        arguments: {
          articleId: 99999,
          focus: 'seo'
        }
      });

      expect(response.error).toBeUndefined();
      expect(response.result.messages[0].content.text).toContain('找不到ID為 99999 的文章');
    });
  });

  describe('端到端工作流測試', () => {
    test('完整文章管理工作流', async () => {
      // 1. 檢查初始狀態
      const healthResponse = await client.sendRequest('tools/call', {
        name: 'database-health',
        arguments: {}
      });
      expect(healthResponse.error).toBeUndefined();

      // 2. 創建文章
      const createResponse = await client.sendRequest('tools/call', {
        name: 'article-create',
        arguments: {
          title: '完整工作流測試文章',
          content: '這是一篇用於測試完整工作流的文章。',
          author: '測試工程師',
          status: 'draft',
          tags: ['工作流', '測試']
        }
      });
      expect(createResponse.error).toBeUndefined();

      // 3. 通過資源讀取文章列表
      const listResponse = await client.sendRequest('resources/read', {
        uri: 'content://articles'
      });
      expect(listResponse.error).toBeUndefined();
      const articles = JSON.parse(listResponse.result.contents[0].text);
      const testArticle = articles.find((a: any) => a.title === '完整工作流測試文章');
      expect(testArticle).toBeDefined();

      // 4. 更新文章狀態
      const updateResponse = await client.sendRequest('tools/call', {
        name: 'article-update',
        arguments: {
          id: testArticle.id,
          status: 'published'
        }
      });
      expect(updateResponse.error).toBeUndefined();

      // 5. 驗證更新
      const readResponse = await client.sendRequest('resources/read', {
        uri: `content://articles/${testArticle.id}`
      });
      expect(readResponse.error).toBeUndefined();
      const updatedArticle = JSON.parse(readResponse.result.contents[0].text);
      expect(updatedArticle.status).toBe('published');

      // 6. 按標籤查詢
      const tagResponse = await client.sendRequest('resources/read', {
        uri: 'content://articles/by-tag/測試'
      });
      expect(tagResponse.error).toBeUndefined();
      const tagResults = JSON.parse(tagResponse.result.contents[0].text);
      expect(tagResults.articles.length).toBeGreaterThan(0);

      // 7. 獲取優化建議
      const optimizeResponse = await client.sendRequest('prompts/get', {
        name: 'content-optimization',
        arguments: {
          articleId: testArticle.id,
          focus: 'engagement'
        }
      });
      expect(optimizeResponse.error).toBeUndefined();

      // 8. 最終清理
      const deleteResponse = await client.sendRequest('tools/call', {
        name: 'article-delete',
        arguments: {
          id: testArticle.id
        }
      });
      expect(deleteResponse.error).toBeUndefined();
    });

    test('內容生成到發布工作流', async () => {
      // 1. 生成文章模板
      const templateResponse = await client.sendRequest('prompts/get', {
        name: 'article-template',
        arguments: {
          topic: '自動化測試',
          length: 'short',
          style: 'casual'
        }
      });
      expect(templateResponse.error).toBeUndefined();

      // 2. 使用模板創建文章
      const createResponse = await client.sendRequest('tools/call', {
        name: 'article-create',
        arguments: {
          title: '自動化測試',
          content: '基於模板生成的文章內容...',
          author: 'AI助手',
          status: 'draft',
          tags: ['自動化測試', '教程']
        }
      });
      expect(createResponse.error).toBeUndefined();

      // 3. 查詢草稿文章
      const draftResponse = await client.sendRequest('tools/call', {
        name: 'article-list',
        arguments: {
          status: 'draft',
          limit: 10
        }
      });
      expect(draftResponse.error).toBeUndefined();

      // 4. 發布文章
      const publishResponse = await client.sendRequest('tools/call', {
        name: 'article-update',
        arguments: {
          id: 4, // 假設是第4篇文章
          status: 'published'
        }
      });
      expect(publishResponse.error).toBeUndefined();
    });
  });

  describe('錯誤處理和邊界條件', () => {
    test('應該處理無效的JSON-RPC請求', async () => {
      // 這個測試需要直接向服務器發送無效數據
      // 由於我們的測試客戶端會自動格式化請求，這裡主要測試邏輯錯誤
      const response = await client.sendRequest('invalid-method');
      expect(response.error).toBeDefined();
    });

    test('應該處理大量並發請求', async () => {
      const promises = [];
      
      // 並發創建多篇文章
      for (let i = 0; i < 10; i++) {
        promises.push(
          client.sendRequest('tools/call', {
            name: 'article-create',
            arguments: {
              title: `並發測試文章 ${i}`,
              content: `並發測試內容 ${i}`,
              author: `作者 ${i}`,
              status: 'draft'
            }
          })
        );
      }

      const responses = await Promise.all(promises);
      
      // 所有請求都應該成功
      responses.forEach(response => {
        expect(response.error).toBeUndefined();
      });
    }, 15000);

    test('應該處理資料庫連接問題', async () => {
      // 這個測試比較難模擬，因為需要破壞資料庫連接
      // 我們主要測試健康檢查的錯誤處理
      const response = await client.sendRequest('tools/call', {
        name: 'database-health',
        arguments: {}
      });
      
      expect(response.error).toBeUndefined();
      expect(response.result.content[0].text).toContain('連接狀態');
    });
  });
});