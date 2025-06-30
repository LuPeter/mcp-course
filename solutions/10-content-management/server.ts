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
 * 練習 10: 持久化MCP應用 - 簡易內容管理器 - 完整實作
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

// 文章列表資源
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
      const articles = await getArticles();
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(articles, null, 2)
        }]
      };
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

// 單篇文章資源（動態）
server.registerResource(
  'article-detail',
  new ResourceTemplate('content://articles/{id}', { list: undefined }),
  {
    title: '文章詳情',
    description: '獲取特定文章的詳細信息'
  },
  async (uri, params) => {
    try {
      const id = parseInt(params.id as string);
      if (isNaN(id)) {
        return {
          contents: [{
            uri: uri.href,
            text: '錯誤：無效的文章ID'
          }]
        };
      }
      
      const article = await getArticleById(id);
      
      if (!article) {
        return {
          contents: [{
            uri: uri.href,
            text: '文章不存在'
          }]
        };
      }
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(article, null, 2)
        }]
      };
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

// 標籤列表資源
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
      const tags = await getTags();
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify(tags, null, 2)
        }]
      };
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

// 按標籤過濾文章資源（動態）
server.registerResource(
  'articles-by-tag',
  new ResourceTemplate('content://articles/by-tag/{tagName}', { list: undefined }),
  {
    title: '按標籤篩選文章',
    description: '獲取特定標籤下的所有文章'
  },
  async (uri, params) => {
    try {
      const tagName = decodeURIComponent(params.tagName as string);
      const articles = await getArticlesByTag(tagName);
      
      return {
        contents: [{
          uri: uri.href,
          text: JSON.stringify({
            tag: tagName,
            count: articles.length,
            articles
          }, null, 2)
        }]
      };
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

// 創建文章工具
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
      // 創建文章
      const articleId = await createArticle({ title, content, author, status });
      
      // 處理標籤
      if (tags && tags.length > 0) {
        for (const tagName of tags) {
          const tagId = await getOrCreateTag(tagName);
          await assignTagToArticle(articleId, tagId);
        }
      }
      
      // 獲取創建的文章（包含標籤）
      const createdArticle = await getArticleById(articleId);
      
      return {
        content: [{
          type: 'text',
          text: `✅ 文章創建成功！\n\nID: ${articleId}\n標題: ${title}\n作者: ${author}\n狀態: ${status}\n標籤: ${tags?.join(', ') || '無'}\n\n創建的文章：\n${JSON.stringify(createdArticle, null, 2)}`
        }]
      };
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `❌ 創建文章失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// 更新文章工具
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
      const updates: Partial<Article> = {};
      if (title !== undefined) updates.title = title;
      if (content !== undefined) updates.content = content;
      if (author !== undefined) updates.author = author;
      if (status !== undefined) updates.status = status;
      
      const success = await updateArticle(id, updates);
      
      if (!success) {
        return {
          content: [{
            type: 'text',
            text: `❌ 文章更新失敗：文章ID ${id} 不存在`
          }],
          isError: true
        };
      }
      
      // 獲取更新後的文章
      const updatedArticle = await getArticleById(id);
      
      return {
        content: [{
          type: 'text',
          text: `✅ 文章更新成功！\n\n更新的欄位：${Object.keys(updates).join(', ')}\n\n更新後的文章：\n${JSON.stringify(updatedArticle, null, 2)}`
        }]
      };
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `❌ 更新文章失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// 刪除文章工具
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
      // 先獲取文章信息（用於確認）
      const article = await getArticleById(id);
      if (!article) {
        return {
          content: [{
            type: 'text',
            text: `❌ 刪除失敗：文章ID ${id} 不存在`
          }],
          isError: true
        };
      }
      
      const success = await deleteArticle(id);
      
      if (success) {
        return {
          content: [{
            type: 'text',
            text: `✅ 文章刪除成功！\n\n已刪除的文章：\n標題: ${article.title}\n作者: ${article.author}\nID: ${id}`
          }]
        };
      } else {
        return {
          content: [{
            type: 'text',
            text: `❌ 文章刪除失敗：無法刪除文章ID ${id}`
          }],
          isError: true
        };
      }
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `❌ 刪除文章失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// 文章列表工具（帶過濾）
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
      const articles = await getArticles({
        status,
        limit,
        offset,
        orderBy,
        orderDirection
      });
      
      return {
        content: [{
          type: 'text',
          text: `📚 文章列表查詢結果\n\n` +
                `篩選條件：\n` +
                `- 狀態: ${status || '全部'}\n` +
                `- 排序: ${orderBy} ${orderDirection}\n` +
                `- 分頁: ${offset + 1}-${offset + limit} (限制${limit}筆)\n\n` +
                `找到 ${articles.length} 篇文章：\n\n` +
                JSON.stringify(articles, null, 2)
        }]
      };
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `❌ 查詢文章列表失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// 標籤管理工具
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
      switch (action) {
        case 'create': {
          const tagId = await getOrCreateTag(tagName);
          return {
            content: [{
              type: 'text',
              text: `✅ 標籤操作成功！\n\n標籤 "${tagName}" 已創建或已存在\nID: ${tagId}`
            }]
          };
        }
        
        case 'assign': {
          if (!articleId) {
            return {
              content: [{
                type: 'text',
                text: '❌ assign操作需要提供articleId'
              }],
              isError: true
            };
          }
          
          const tagId = await getOrCreateTag(tagName);
          const success = await assignTagToArticle(articleId, tagId);
          
          if (success) {
            return {
              content: [{
                type: 'text',
                text: `✅ 標籤分配成功！\n\n為文章 ${articleId} 分配了標籤 "${tagName}"`
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `❌ 標籤分配失敗：可能文章或標籤不存在`
              }],
              isError: true
            };
          }
        }
        
        case 'remove': {
          if (!articleId) {
            return {
              content: [{
                type: 'text',
                text: '❌ remove操作需要提供articleId'
              }],
              isError: true
            };
          }
          
          // 先找到標籤ID
          const tags = await getTags();
          const tag = tags.find(t => t.name === tagName);
          
          if (!tag) {
            return {
              content: [{
                type: 'text',
                text: `❌ 標籤 "${tagName}" 不存在`
              }],
              isError: true
            };
          }
          
          const success = await removeTagFromArticle(articleId, tag.id!);
          
          if (success) {
            return {
              content: [{
                type: 'text',
                text: `✅ 標籤移除成功！\n\n從文章 ${articleId} 移除了標籤 "${tagName}"`
              }]
            };
          } else {
            return {
              content: [{
                type: 'text',
                text: `❌ 標籤移除失敗：標籤可能未分配給該文章`
              }],
              isError: true
            };
          }
        }
        
        default:
          return {
            content: [{
              type: 'text',
              text: `❌ 不支援的操作: ${action}`
            }],
            isError: true
          };
      }
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `❌ 標籤管理操作失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// 資料庫健康檢查工具
server.registerTool(
  'database-health',
  {
    title: '資料庫健康檢查',
    description: '檢查資料庫連接狀態和數據統計',
    inputSchema: {}
  },
  async () => {
    try {
      const health = await checkDatabaseHealth();
      
      return {
        content: [{
          type: 'text',
          text: `🏥 資料庫健康檢查報告\n\n` +
                `連接狀態: ${health.connected ? '✅ 正常' : '❌ 異常'}\n` +
                `表結構: ${health.tablesExist ? '✅ 完整' : '❌ 缺失'}\n\n` +
                `📊 數據統計:\n` +
                `- 文章數量: ${health.recordCount.articles}\n` +
                `- 標籤數量: ${health.recordCount.tags}\n` +
                `- 標籤關聯: ${health.recordCount.articleTags}\n\n` +
                `系統狀態: ${health.connected && health.tablesExist ? '🟢 健康' : '🔴 需要檢查'}`
        }]
      };
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        content: [{
          type: 'text',
          text: `❌ 健康檢查失敗：${dbError.message}`
        }],
        isError: true
      };
    }
  }
);

// =====================================================
// MCP Prompts - 整合內容生成與資料庫
// =====================================================

// 文章模板提示
server.registerPrompt(
  'article-template',
  {
    title: '文章內容模板',
    description: '生成文章內容模板，可直接保存到資料庫',
    argsSchema: {
      topic: z.string().describe('文章主題'),
      length: z.enum(['short', 'medium', 'long']).default('medium').describe('文章長度'),
      style: z.enum(['technical', 'casual', 'formal']).default('casual').describe('寫作風格')
    }
  },
  async ({ topic, length, style }) => {
    try {
      const lengthMap = {
        short: '簡短',
        medium: '中等長度',
        long: '詳細'
      };
      
      const styleMap = {
        technical: '技術性',
        casual: '輕鬆',
        formal: '正式'
      };
      
      const template = `# ${topic}

## 概述
請在此處撰寫關於"${topic}"的${lengthMap[length]}介紹。

## 主要內容

### 背景
[描述${topic}的背景和重要性]

### 核心概念
[解釋${topic}的核心概念和原理]

### 實際應用
[提供${topic}的實際應用場景和範例]

### 最佳實踐
[分享關於${topic}的最佳實踐和建議]

## 總結
[總結${topic}的要點和未來發展]

---
*本文採用${styleMap[style]}的寫作風格，長度設定為${lengthMap[length]}。*

## 建議標籤
建議為此文章添加以下標籤：
- ${topic.toLowerCase()}
- 教程
- 技術

## 使用說明
要將此模板保存為文章，可以使用 article-create 工具：

\`\`\`json
{
  "title": "${topic}",
  "content": "[在此貼上完整的文章內容]",
  "author": "[作者名稱]",
  "status": "draft",
  "tags": ["${topic.toLowerCase()}", "教程", "技術"]
}
\`\`\``;
      
      return {
        messages: [{
          role: 'assistant',
          content: {
            type: 'text',
            text: template
          }
        }]
      };
    } catch (error) {
      return {
        messages: [{
          role: 'assistant',
          content: {
            type: 'text',
            text: `❌ 生成文章模板失敗：${error}`
          }
        }]
      };
    }
  }
);

// 內容優化提示
server.registerPrompt(
  'content-optimization',
  {
    title: '內容優化建議',
    description: '分析現有文章並提供優化建議',
    argsSchema: {
      articleId: z.number().int().positive().describe('要分析的文章ID'),
      focus: z.enum(['readability', 'seo', 'engagement']).default('readability').describe('優化重點')
    }
  },
  async ({ articleId, focus }) => {
    try {
      // 從資料庫獲取文章內容
      const article = await getArticleById(articleId);
      
      if (!article) {
        return {
          messages: [{
            role: 'assistant',
            content: {
              type: 'text',
              text: `❌ 找不到ID為 ${articleId} 的文章`
            }
          }]
        };
      }
      
      const focusMap = {
        readability: '可讀性',
        seo: 'SEO優化',
        engagement: '用戶參與度'
      };
      
      const analysis = `# 文章內容優化分析

## 文章資訊
- **標題**: ${article.title}
- **作者**: ${article.author}
- **狀態**: ${article.status}
- **字數**: ${article.content.length} 字元
- **標籤**: ${article.tags || '無'}

## ${focusMap[focus]}分析

### 當前文章內容
\`\`\`
${article.content.substring(0, 500)}${article.content.length > 500 ? '...' : ''}
\`\`\`

### 優化建議

${focus === 'readability' ? `
#### 可讀性優化建議：
1. **段落結構**: 檢查段落長度，建議每段不超過3-4句
2. **標題層級**: 使用適當的標題層級 (##, ###) 組織內容
3. **列表使用**: 將重點內容整理成列表形式
4. **語言簡潔**: 避免過於複雜的句式
5. **視覺元素**: 考慮添加代碼範例、圖表等
` : ''}

${focus === 'seo' ? `
#### SEO優化建議：
1. **關鍵字**: 確認標題包含主要關鍵字
2. **元描述**: 為文章添加簡潔的摘要
3. **內部連結**: 添加相關文章的連結
4. **標籤優化**: 使用相關且熱門的標籤
5. **內容長度**: 確保內容深度足夠
` : ''}

${focus === 'engagement' ? `
#### 用戶參與度優化建議：
1. **開頭吸引**: 用問題或故事開始文章
2. **互動元素**: 添加問題、練習或思考點
3. **實用性**: 提供可操作的建議或步驟
4. **範例豐富**: 使用具體的範例和案例
5. **行動呼籲**: 在文章末尾添加明確的行動建議
` : ''}

### 具體修改建議
1. 標題優化：考慮更具體或更吸引人的標題
2. 內容結構：添加小標題分隔不同主題
3. 標籤改進：${article.tags ? '當前標籤不錯，可以考慮添加更多相關標籤' : '建議添加相關標籤以提高可發現性'}

### 更新建議
使用 article-update 工具應用這些優化：

\`\`\`json
{
  "id": ${articleId},
  "title": "[優化後的標題]",
  "content": "[優化後的內容]",
  "status": "published"
}
\`\`\``;

      return {
        messages: [{
          role: 'assistant',
          content: {
            type: 'text',
            text: analysis
          }
        }]
      };
    } catch (error) {
      const dbError = handleDatabaseError(error);
      return {
        messages: [{
          role: 'assistant',
          content: {
            type: 'text',
            text: `❌ 內容優化分析失敗：${dbError.message}`
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
    // 初始化資料庫
    console.log('🔧 正在初始化資料庫...');
    await initializeApp();
    
    console.log('🚀 正在啟動內容管理服務器...');
    
    // 啟動MCP服務器
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.log('✅ 內容管理服務器已啟動');
    console.log('📊 資料庫已就緒，可以開始使用');
    console.log('');
    console.log('📚 可用功能：');
    console.log('  Resources: content://articles, content://tags, content://articles/{id}, content://articles/by-tag/{tagName}');
    console.log('  Tools: article-create, article-update, article-delete, article-list, tag-manage, database-health');
    console.log('  Prompts: article-template, content-optimization');
    
  } catch (error) {
    console.error('❌ 服務器啟動失敗:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGINT', async () => {
  console.log('\n🔄 正在關閉服務器...');
  try {
    await cleanup();
    console.log('✅ 服務器已安全關閉');
    process.exit(0);
  } catch (error) {
    console.error('❌ 關閉過程中發生錯誤:', error);
    process.exit(1);
  }
});

process.on('SIGTERM', async () => {
  console.log('\n🔄 接收到終止信號，正在關閉...');
  try {
    await cleanup();
    process.exit(0);
  } catch (error) {
    console.error('❌ 終止過程中發生錯誤:', error);
    process.exit(1);
  }
});

// 啟動服務器
if (process.argv[1] === new URL(import.meta.url).pathname) {
  main().catch((error) => {
    console.error('💥 未處理的錯誤:', error);
    process.exit(1);
  });
}