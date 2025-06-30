#!/usr/bin/env node

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import {
  Article,
  Tag,
  ArticleWithTags,
  createArticle,
  getArticles,
  getArticleById,
  updateArticle,
  deleteArticle,
  getTags,
  getOrCreateTag,
  assignTagToArticle,
  removeTagFromArticle,
  getArticlesByTag,
  checkDatabaseHealth,
  initializeApp,
  cleanup,
  handleDatabaseError
} from './database.js';

/**
 * 練習 10: 持久化MCP應用 - 簡易內容管理器
 * 
 * 本練習整合前9個練習的所有知識，並新增SQLite資料庫整合功能：
 * 
 * 核心功能：
 * - MCP Resources 映射到資料庫查詢操作
 * - MCP Tools 映射到資料庫CRUD操作  
 * - MCP Prompts 整合內容生成與資料庫存儲
 * - 完整的錯誤處理和數據驗證
 * - 資料持久化與狀態管理
 * 
 * 新增特性：
 * - SQLite資料庫整合
 * - 文章與標籤管理系統
 * - 動態資源與工具
 * - 數據持久化
 * - 事務處理
 */

const server = new McpServer({
  name: 'content-management-server',
  version: '1.0.0'
});

// =====================================================
// MCP Resources - 映射到資料庫查詢操作
// =====================================================

// TODO 1: 註冊文章列表資源
// 提示：使用getArticles()函數獲取所有文章
server.registerResource(
  'articles-list',
  'content://articles',
  {
    title: '文章列表',
    description: '獲取所有文章的列表',
    mimeType: 'application/json'
  },
  async (uri) => {
    try {
      // TODO: 實現文章列表資源
      // 1. 調用getArticles()獲取文章列表
      // 2. 格式化為JSON
      // 3. 包含標籤信息
      // 4. 處理錯誤情況
      
      throw new Error('TODO: 實現articles-list資源');
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        contents: [{
          uri: uri.href,
          text: `錯誤：無法獲取文章列表 - ${dbError.message}`
        }]
      };
    }
  }
);

// TODO 2: 註冊單篇文章資源（動態）
// 提示：使用ResourceTemplate處理參數化URI
server.registerResource(
  'article-detail',
  new ResourceTemplate('content://articles/{id}', { list: undefined }),
  {
    title: '文章詳情',
    description: '獲取特定文章的詳細信息'
  },
  async (uri, { id }) => {
    try {
      // TODO: 實現文章詳情資源
      // 1. 解析文章ID
      // 2. 調用getArticleById()獲取文章
      // 3. 處理文章不存在的情況
      // 4. 返回格式化的文章數據
      
      throw new Error('TODO: 實現article-detail資源');
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        contents: [{
          uri: uri.href,
          text: `錯誤：無法獲取文章 - ${dbError.message}`
        }]
      };
    }
  }
);

// TODO 3: 註冊標籤列表資源
server.registerResource(
  'tags-list',
  'content://tags',
  {
    title: '標籤列表',
    description: '獲取所有可用的標籤',
    mimeType: 'application/json'
  },
  async (uri) => {
    try {
      // TODO: 實現標籤列表資源
      // 1. 調用getTags()獲取所有標籤
      // 2. 格式化為JSON
      // 3. 可選：包含每個標籤的文章數量
      
      throw new Error('TODO: 實現tags-list資源');
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        contents: [{
          uri: uri.href,
          text: `錯誤：無法獲取標籤列表 - ${dbError.message}`
        }]
      };
    }
  }
);

// TODO 4: 註冊按標籤過濾文章資源（動態）
server.registerResource(
  'articles-by-tag',
  new ResourceTemplate('content://articles/by-tag/{tagName}', { list: undefined }),
  {
    title: '按標籤篩選文章',
    description: '獲取特定標籤下的所有文章'
  },
  async (uri, { tagName }) => {
    try {
      // TODO: 實現按標籤篩選文章資源
      // 1. 解析標籤名稱
      // 2. 調用getArticlesByTag()獲取相關文章
      // 3. 處理標籤不存在的情況
      // 4. 返回格式化的文章列表
      
      throw new Error('TODO: 實現articles-by-tag資源');
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        contents: [{
          uri: uri.href,
          text: `錯誤：無法獲取標籤下的文章 - ${dbError.message}`
        }]
      };
    }
  }
);

// =====================================================
// MCP Tools - 映射到資料庫CRUD操作
// =====================================================

// TODO 5: 註冊創建文章工具
server.registerTool(
  'article-create',
  {
    title: '創建文章',
    description: '創建一篇新文章並保存到資料庫',
    inputSchema: {
      title: z.string().min(1, '標題不能為空'),
      content: z.string().min(1, '內容不能為空'),
      author: z.string().min(1, '作者不能為空'),
      status: z.enum(['draft', 'published', 'archived']).default('draft'),
      tags: z.array(z.string()).optional().describe('文章標籤列表')
    }
  },
  async ({ title, content, author, status, tags }) => {
    try {
      // TODO: 實現創建文章工具
      // 1. 驗證輸入數據
      // 2. 調用createArticle()創建文章
      // 3. 處理標籤分配（如果提供）
      // 4. 返回創建成功的消息和文章ID
      
      throw new Error('TODO: 實現article-create工具');
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `創建文章失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// TODO 6: 註冊更新文章工具
server.registerTool(
  'article-update',
  {
    title: '更新文章',
    description: '更新現有文章的信息',
    inputSchema: {
      id: z.number().int().positive('文章ID必須是正整數'),
      title: z.string().min(1).optional(),
      content: z.string().min(1).optional(),
      author: z.string().min(1).optional(),
      status: z.enum(['draft', 'published', 'archived']).optional()
    }
  },
  async ({ id, title, content, author, status }) => {
    try {
      // TODO: 實現更新文章工具
      // 1. 驗證文章是否存在
      // 2. 準備更新數據
      // 3. 調用updateArticle()更新文章
      // 4. 返回更新結果
      
      throw new Error('TODO: 實現article-update工具');
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `更新文章失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// TODO 7: 註冊刪除文章工具
server.registerTool(
  'article-delete',
  {
    title: '刪除文章',
    description: '從資料庫中刪除指定的文章',
    inputSchema: {
      id: z.number().int().positive('文章ID必須是正整數')
    }
  },
  async ({ id }) => {
    try {
      // TODO: 實現刪除文章工具
      // 1. 檢查文章是否存在
      // 2. 調用deleteArticle()刪除文章
      // 3. 返回刪除結果
      // 4. 注意：相關的標籤關聯會自動刪除
      
      throw new Error('TODO: 實現article-delete工具');
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `刪除文章失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// TODO 8: 註冊文章列表工具（帶過濾）
server.registerTool(
  'article-list',
  {
    title: '文章列表查詢',
    description: '查詢文章列表，支援過濾和排序',
    inputSchema: {
      status: z.enum(['draft', 'published', 'archived']).optional(),
      limit: z.number().int().positive().max(100).default(10),
      offset: z.number().int().min(0).default(0),
      orderBy: z.enum(['created_at', 'updated_at', 'title']).default('created_at'),
      orderDirection: z.enum(['ASC', 'DESC']).default('DESC')
    }
  },
  async ({ status, limit, offset, orderBy, orderDirection }) => {
    try {
      // TODO: 實現文章列表查詢工具
      // 1. 構建查詢選項
      // 2. 調用getArticles()獲取文章
      // 3. 格式化返回結果
      // 4. 包含分頁信息
      
      throw new Error('TODO: 實現article-list工具');
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `查詢文章列表失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// TODO 9: 註冊標籤管理工具
server.registerTool(
  'tag-manage',
  {
    title: '標籤管理',
    description: '創建新標籤或為文章分配/移除標籤',
    inputSchema: {
      action: z.enum(['create', 'assign', 'remove']),
      tagName: z.string().min(1, '標籤名稱不能為空'),
      articleId: z.number().int().positive().optional().describe('文章ID，assign和remove操作時必需')
    }
  },
  async ({ action, tagName, articleId }) => {
    try {
      // TODO: 實現標籤管理工具
      // 1. 根據action執行不同操作
      // 2. create: 創建新標籤
      // 3. assign: 為文章分配標籤
      // 4. remove: 從文章移除標籤
      // 5. 驗證必要參數
      
      throw new Error('TODO: 實現tag-manage工具');
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `標籤管理操作失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// TODO 10: 註冊資料庫健康檢查工具
server.registerTool(
  'database-health',
  {
    title: '資料庫健康檢查',
    description: '檢查資料庫連接狀態和數據統計',
    inputSchema: {}
  },
  async () => {
    try {
      // TODO: 實現資料庫健康檢查工具
      // 1. 調用checkDatabaseHealth()獲取狀態
      // 2. 格式化健康報告
      // 3. 包含統計信息
      
      throw new Error('TODO: 實現database-health工具');
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `健康檢查失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// =====================================================
// MCP Prompts - 整合內容生成與資料庫
// =====================================================

// TODO 11: 註冊文章模板提示
server.registerPrompt(
  'article-template',
  {
    title: '文章內容模板',
    description: '生成文章內容模板，可直接保存到資料庫',
    arguments: [
      {
        name: 'topic',
        description: '文章主題',
        required: true
      },
      {
        name: 'length',
        description: '文章長度（short/medium/long）',
        required: false
      },
      {
        name: 'style',
        description: '寫作風格（technical/casual/formal）',
        required: false
      }
    ]
  },
  async ({ topic, length = 'medium', style = 'casual' }) => {
    try {
      // TODO: 實現文章模板提示
      // 1. 根據參數生成文章模板
      // 2. 包含標題、內容結構
      // 3. 提供保存到資料庫的指導
      // 4. 建議相關標籤
      
      throw new Error('TODO: 實現article-template提示');
    } catch (error) {
      return {
        messages: [{
          role: 'assistant',
          content: {
            type: 'text',
            text: `生成文章模板失敗：${error}`
          }
        }]
      };
    }
  }
);

// TODO 12: 註冊內容優化提示
server.registerPrompt(
  'content-optimization',
  {
    title: '內容優化建議',
    description: '分析現有文章並提供優化建議',
    arguments: [
      {
        name: 'articleId',
        description: '要分析的文章ID',
        required: true
      },
      {
        name: 'focus',
        description: '優化重點（readability/seo/engagement）',
        required: false
      }
    ]
  },
  async ({ articleId, focus = 'readability' }) => {
    try {
      // TODO: 實現內容優化提示
      // 1. 從資料庫獲取文章內容
      // 2. 分析文章結構和內容
      // 3. 根據focus提供具體建議
      // 4. 包含可行動的改進建議
      
      throw new Error('TODO: 實現content-optimization提示');
    } catch (error) {
      return {
        messages: [{
          role: 'assistant',
          content: {
            type: 'text',
            text: `內容優化分析失敗：${error}`
          }
        }]
      };
    }
  }
);

// =====================================================
// 伺服器啟動和清理
// =====================================================

async function main(): Promise<void> {
  try {
    // TODO 13: 初始化資料庫
    console.log('🔧 正在初始化資料庫...');
    // 調用initializeApp()初始化資料庫
    
    console.log('🚀 正在啟動內容管理服務器...');
    
    // TODO 14: 啟動MCP服務器
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.log('✅ 內容管理服務器已啟動');
    console.log('📊 資料庫已就緒，可以開始使用');
    
  } catch (error) {
    console.error('❌ 服務器啟動失敗:', error);
    process.exit(1);
  }
}

// TODO 15: 實現優雅關閉
process.on('SIGINT', async () => {
  console.log('\\n🔄 正在關閉服務器...');
  try {
    // 調用cleanup()清理資源
    await cleanup();
    console.log('✅ 服務器已安全關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉過程中發生錯誤:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\\n🔄 接收到終止信號，正在關閉...');
  try {
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('❌ 終止過程中發生錯誤:', error);
    process.exit(1);
  }
});

// 啟動服務器
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error('💥 未處理的錯誤:', error);
    process.exit(1);
  });
}