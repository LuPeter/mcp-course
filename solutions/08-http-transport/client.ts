#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';

/**
 * 練習 8: HTTP 傳輸客戶端示例
 * 
 * 此客戶端展示如何連接到 HTTP MCP 服務器並使用各種功能
 * 
 * 功能演示：
 * - StreamableHTTPClientTransport 使用
 * - 工具調用 (echo, calculate, session-info)
 * - 資源讀取 (config, help, content)
 * - 提示獲取 (code-review)
 * - 錯誤處理和重連
 */

interface ClientConfig {
  serverUrl: string;
  timeout: number;
  retryAttempts: number;
}

class MCPHTTPClient {
  private client: Client;
  private transport: StreamableHTTPClientTransport;
  private config: ClientConfig;
  private connected: boolean = false;

  constructor(config: Partial<ClientConfig> = {}) {
    this.config = {
      serverUrl: 'http://localhost:3000/mcp',
      timeout: 10000,
      retryAttempts: 3,
      ...config
    };

    this.client = new Client({
      name: 'http-client-demo',
      version: '1.0.0'
    });

    this.transport = new StreamableHTTPClientTransport(new URL(this.config.serverUrl));
  }

  async connect(): Promise<void> {
    try {
      console.log(`正在連接到 MCP 服務器: ${this.config.serverUrl}`);
      
      await this.client.connect(this.transport);
      this.connected = true;
      
      console.log('✅ 成功連接到 MCP 服務器');
      
      // 顯示服務器信息
      const serverInfo = this.client.getServerCapabilities();
      console.log('服務器能力:', JSON.stringify(serverInfo, null, 2));
      
    } catch (error) {
      this.connected = false;
      throw new Error(`連接失敗: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      try {
        await this.client.close();
        this.connected = false;
        console.log('✅ 已斷開與 MCP 服務器的連接');
      } catch (error) {
        console.error('斷開連接時發生錯誤:', error);
      }
    }
  }

  async listTools(): Promise<void> {
    if (!this.connected) {
      throw new Error('客戶端未連接');
    }

    try {
      console.log('\n📋 獲取可用工具列表...');
      const tools = await this.client.listTools();
      
      console.log(`找到 ${tools.tools.length} 個工具:`);
      tools.tools.forEach((tool, index) => {
        console.log(`${index + 1}. ${tool.name}: ${tool.description}`);
      });
    } catch (error) {
      console.error('獲取工具列表失敗:', error);
    }
  }

  async callEchoTool(message: string): Promise<void> {
    if (!this.connected) {
      throw new Error('客戶端未連接');
    }

    try {
      console.log(`\n🔄 調用 echo 工具: "${message}"`);
      
      const result = await this.client.callTool({
        name: 'echo',
        arguments: { message }
      });
      
      console.log('工具回應:');
      if (result.content && Array.isArray(result.content)) {
        result.content.forEach((content: any, index: number) => {
          if (content.type === 'text') {
            console.log(`${index + 1}. ${content.text}`);
          }
        });
      }
    } catch (error) {
      console.error('調用 echo 工具失敗:', error);
    }
  }

  async callCalculateTool(expression: string): Promise<void> {
    if (!this.connected) {
      throw new Error('客戶端未連接');
    }

    try {
      console.log(`\n🧮 調用 calculate 工具: "${expression}"`);
      
      const result = await this.client.callTool({
        name: 'calculate',
        arguments: { expression }
      });
      
      console.log('計算結果:');
      if (result.content && Array.isArray(result.content)) {
        result.content.forEach((content: any, index: number) => {
          if (content.type === 'text') {
            console.log(`${index + 1}. ${content.text}`);
          }
        });
      }
    } catch (error) {
      console.error('調用 calculate 工具失敗:', error);
    }
  }

  async callSessionInfoTool(action: 'current' | 'list' | 'cleanup' = 'current'): Promise<void> {
    if (!this.connected) {
      throw new Error('客戶端未連接');
    }

    try {
      console.log(`\n📊 調用 session-info 工具: action="${action}"`);
      
      const result = await this.client.callTool({
        name: 'session-info',
        arguments: { action }
      });
      
      console.log('會話信息:');
      if (result.content && Array.isArray(result.content)) {
        result.content.forEach((content: any, index: number) => {
          if (content.type === 'text') {
            console.log(`${index + 1}. ${content.text}`);
          }
        });
      }
    } catch (error) {
      console.error('調用 session-info 工具失敗:', error);
    }
  }

  async listResources(): Promise<void> {
    if (!this.connected) {
      throw new Error('客戶端未連接');
    }

    try {
      console.log('\n📂 獲取可用資源列表...');
      const resources = await this.client.listResources();
      
      console.log(`找到 ${resources.resources.length} 個資源:`);
      resources.resources.forEach((resource, index) => {
        console.log(`${index + 1}. ${resource.uri}: ${resource.name} (${resource.mimeType || 'unknown'})`);
      });
    } catch (error) {
      console.error('獲取資源列表失敗:', error);
    }
  }

  async readResource(uri: string): Promise<void> {
    if (!this.connected) {
      throw new Error('客戶端未連接');
    }

    try {
      console.log(`\n📖 讀取資源: ${uri}`);
      
      const result = await this.client.readResource({ uri });
      
      console.log('資源內容:');
      if (result.contents && Array.isArray(result.contents)) {
        result.contents.forEach((content: any, index: number) => {
          console.log(`${index + 1}. URI: ${content.uri}`);
          console.log(`   類型: ${content.mimeType || 'text/plain'}`);
          if (content.text && typeof content.text === 'string') {
            const preview = content.text.length > 200 
              ? content.text.substring(0, 200) + '...' 
              : content.text;
            console.log(`   內容預覽: ${preview}`);
          }
        });
      }
    } catch (error) {
      console.error(`讀取資源 ${uri} 失敗:`, error);
    }
  }

  async listPrompts(): Promise<void> {
    if (!this.connected) {
      throw new Error('客戶端未連接');
    }

    try {
      console.log('\n💬 獲取可用提示列表...');
      const prompts = await this.client.listPrompts();
      
      console.log(`找到 ${prompts.prompts.length} 個提示:`);
      prompts.prompts.forEach((prompt, index) => {
        console.log(`${index + 1}. ${prompt.name}: ${prompt.description}`);
      });
    } catch (error) {
      console.error('獲取提示列表失敗:', error);
    }
  }

  async getPrompt(name: string, args: any = {}): Promise<void> {
    if (!this.connected) {
      throw new Error('客戶端未連接');
    }

    try {
      console.log(`\n🎯 獲取提示: ${name}`);
      
      const result = await this.client.getPrompt({
        name,
        arguments: args
      });
      
      console.log('提示內容:');
      if (result.messages && Array.isArray(result.messages)) {
        result.messages.forEach((message: any, index: number) => {
          console.log(`${index + 1}. 角色: ${message.role}`);
          if (message.content && message.content.type === 'text' && typeof message.content.text === 'string') {
            const preview = message.content.text.length > 300 
              ? message.content.text.substring(0, 300) + '...' 
              : message.content.text;
            console.log(`   內容預覽: ${preview}`);
          }
        });
      }
    } catch (error) {
      console.error(`獲取提示 ${name} 失敗:`, error);
    }
  }

  async runComprehensiveTest(): Promise<void> {
    console.log('🚀 開始綜合功能測試...\n');

    try {
      // 1. 列出所有功能
      await this.listTools();
      await this.listResources();
      await this.listPrompts();

      // 2. 測試基本工具
      await this.callEchoTool('Hello from HTTP client!');
      await this.callCalculateTool('2 + 3 * 4');

      // 3. 測試會話管理
      await this.callSessionInfoTool('current');
      await this.callSessionInfoTool('list');

      // 4. 測試資源讀取
      await this.readResource('config://server');
      await this.readResource('help://info');

      // 5. 測試提示獲取
      await this.getPrompt('code-review', {
        language: 'TypeScript',
        codeContext: 'MCP HTTP client implementation',
        focusAreas: 'error handling, performance',
        severity: 'medium'
      });

      console.log('\n✅ 綜合功能測試完成!');

    } catch (error) {
      console.error('\n❌ 綜合功能測試失敗:', error);
    }
  }
}

// CLI 介面
async function main() {
  const args = process.argv.slice(2);
  const serverUrl = args.find(arg => arg.startsWith('--url='))?.split('=')[1] || 'http://localhost:3000/mcp';
  const command = args.find(arg => !arg.startsWith('--')) || 'test';

  const client = new MCPHTTPClient({ serverUrl });

  try {
    await client.connect();

    switch (command) {
      case 'test':
        await client.runComprehensiveTest();
        break;
      
      case 'tools':
        await client.listTools();
        break;
      
      case 'resources':
        await client.listResources();
        break;
      
      case 'prompts':
        await client.listPrompts();
        break;
      
      case 'echo':
        const message = args[1] || 'Hello from MCP HTTP client!';
        await client.callEchoTool(message);
        break;
      
      case 'calc':
        const expression = args[1] || '2 + 2';
        await client.callCalculateTool(expression);
        break;
      
      case 'session':
        const action = (args[1] as 'current' | 'list' | 'cleanup') || 'current';
        await client.callSessionInfoTool(action);
        break;
      
      case 'config':
        await client.readResource('config://server');
        break;
      
      case 'help':
        await client.readResource('help://info');
        break;
      
      default:
        console.log('可用命令:');
        console.log('  test     - 運行綜合功能測試');
        console.log('  tools    - 列出可用工具');
        console.log('  resources - 列出可用資源');
        console.log('  prompts  - 列出可用提示');
        console.log('  echo [message] - 調用 echo 工具');
        console.log('  calc [expression] - 調用 calculate 工具');
        console.log('  session [current|list|cleanup] - 會話管理');
        console.log('  config   - 讀取服務器配置');
        console.log('  help     - 讀取幫助信息');
        console.log('');
        console.log('選項:');
        console.log('  --url=http://localhost:3000/mcp - 服務器 URL');
    }

  } catch (error) {
    console.error('❌ 客戶端錯誤:', error instanceof Error ? error.message : error);
    process.exit(1);
  } finally {
    await client.disconnect();
  }
}

// 錯誤處理
process.on('unhandledRejection', (reason, promise) => {
  console.error('未處理的 Promise 拒絕:', reason);
  process.exit(1);
});

process.on('uncaughtException', (error) => {
  console.error('未捕獲的異常:', error);
  process.exit(1);
});

// 優雅關閉
process.on('SIGINT', async () => {
  console.log('\n正在關閉客戶端...');
  process.exit(0);
});

// 啟動客戶端
if (require.main === module) {
  main().catch(error => {
    console.error('客戶端啟動失敗:', error);
    process.exit(1);
  });
}

export { MCPHTTPClient };