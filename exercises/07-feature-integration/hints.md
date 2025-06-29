# 練習 7: 整合功能服務器 - 提示和指導

## 開發提示

### 🎯 開始之前
1. **回顾前置知識**: 確保熟悉練習 1-6 的所有功能
2. **理解整合思維**: 考慮功能間的協同和數據流
3. **設計優先**: 先設計整體架構再實作細節

### 🔧 實作提示

#### 服務器初始化
```typescript
const server = new McpServer({
  name: 'feature-integration-server', // 替換 FILL_IN_SERVER_NAME
  version: '1.0.0' // 替換 FILL_IN_VERSION
});
```

#### 內容數據模型
```typescript
interface ContentItem {
  id: string;
  type: 'article' | 'blog' | 'documentation' | 'note';
  title: string;
  content: string;
  author: string;
  createdAt: string;
  updatedAt: string;
  tags: string[];
  status: 'draft' | 'published' | 'archived';
}

// 內存存儲
const contentStore: Map<string, ContentItem> = new Map();

// 初始化示例數據
contentStore.set('article-1', {
  id: 'article-1',
  type: 'article',
  title: 'MCP Protocol Overview',
  content: 'The Model Context Protocol (MCP) is a standardized way for applications to provide context to LLMs.',
  author: 'System',
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  tags: ['mcp', 'protocol', 'overview'],
  status: 'published'
});
```

### 🛠️ 內容管理工具實作指導

#### 1. ID 生成函數
```typescript
function generateId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}`;
}
```

#### 2. 內容創建工具
```typescript
server.registerTool(
  'content-create',
  {
    title: 'Content Creation Tool',
    description: 'Create new content items in the content management system',
    inputSchema: {
      type: z.enum(['article', 'blog', 'documentation', 'note']).describe('Type of content to create'),
      title: z.string().describe('Title of the content'),
      content: z.string().describe('Content body'),
      author: z.string().describe('Author name'),
      tags: z.array(z.string()).optional().default([]).describe('Content tags'),
      status: z.enum(['draft', 'published', 'archived']).optional().default('draft').describe('Content status')
    }
  },
  async ({ type, title, content, author, tags = [], status = 'draft' }) => {
    try {
      const id = generateId(type);
      const now = new Date().toISOString();
      
      const contentItem: ContentItem = {
        id,
        type,
        title,
        content,
        author,
        createdAt: now,
        updatedAt: now,
        tags,
        status
      };
      
      contentStore.set(id, contentItem);
      
      return {
        content: [{
          type: 'text',
          text: `Content created successfully:
ID: ${id}
Type: ${type}
Title: ${title}
Author: ${author}
Status: ${status}
Tags: ${tags.join(', ')}
Created: ${now}`
        }]
      };
    } catch (error) {
      throw new Error(`Content creation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
```

#### 3. 內容更新工具
```typescript
server.registerTool(
  'content-update',
  {
    title: 'Content Update Tool',
    description: 'Update existing content items',
    inputSchema: {
      id: z.string().describe('Content ID to update'),
      title: z.string().optional().describe('New title'),
      content: z.string().optional().describe('New content body'),
      author: z.string().optional().describe('New author name'),
      tags: z.array(z.string()).optional().describe('New tags'),
      status: z.enum(['draft', 'published', 'archived']).optional().describe('New status')
    }
  },
  async ({ id, title, content, author, tags, status }) => {
    try {
      const existingItem = contentStore.get(id);
      
      if (!existingItem) {
        throw new Error(`Content not found: ${id}`);
      }
      
      const updatedItem: ContentItem = {
        ...existingItem,
        ...(title && { title }),
        ...(content && { content }),
        ...(author && { author }),
        ...(tags && { tags }),
        ...(status && { status }),
        updatedAt: new Date().toISOString()
      };
      
      contentStore.set(id, updatedItem);
      
      return {
        content: [{
          type: 'text',
          text: `Content updated successfully:
ID: ${id}
Type: ${updatedItem.type}
Title: ${updatedItem.title}
Author: ${updatedItem.author}
Status: ${updatedItem.status}
Tags: ${updatedItem.tags.join(', ')}
Updated: ${updatedItem.updatedAt}`
        }]
      };
    } catch (error) {
      throw new Error(`Content update error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
```

#### 4. 內容刪除工具
```typescript
server.registerTool(
  'content-delete',
  {
    title: 'Content Delete Tool',
    description: 'Delete content items',
    inputSchema: {
      id: z.string().describe('Content ID to delete'),
      force: z.boolean().optional().default(false).describe('Force delete without confirmation')
    }
  },
  async ({ id, force = false }) => {
    try {
      const existingItem = contentStore.get(id);
      
      if (!existingItem) {
        throw new Error(`Content not found: ${id}`);
      }
      
      if (existingItem.status === 'published' && !force) {
        throw new Error(`Cannot delete published content without force flag: ${id}`);
      }
      
      contentStore.delete(id);
      
      return {
        content: [{
          type: 'text',
          text: `Content deleted successfully:
ID: ${id}
Type: ${existingItem.type}
Title: ${existingItem.title}
Status: ${existingItem.status}
Deleted at: ${new Date().toISOString()}`
        }]
      };
    } catch (error) {
      throw new Error(`Content deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
```

### 📚 動態內容資源實作指導

#### 內容資源註冊
```typescript
server.registerResource(
  'content',
  'content://{type}/{id}',
  {
    title: 'Content Resource',
    description: 'Access content items by type and ID',
    mimeType: 'application/json'
  },
  async (uri) => {
    try {
      const urlPath = new URL(uri).pathname;
      const pathParts = urlPath.split('/').filter(Boolean);
      
      if (pathParts.length === 0) {
        // List all content: content://
        const allContent = Array.from(contentStore.values());
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              total: allContent.length,
              content: allContent
            }, null, 2),
            mimeType: 'application/json'
          }]
        };
      } else if (pathParts.length === 1) {
        // List content by type: content://article
        const [type] = pathParts;
        const contentByType = Array.from(contentStore.values())
          .filter(item => item.type === type);
        
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({
              type,
              total: contentByType.length,
              content: contentByType
            }, null, 2),
            mimeType: 'application/json'
          }]
        };
      } else if (pathParts.length === 2) {
        // Get specific content: content://article/123
        const [type, id] = pathParts;
        const content = contentStore.get(id);
        
        if (!content) {
          throw new Error(`Content not found: ${id}`);
        }
        
        if (content.type !== type) {
          throw new Error(`Content type mismatch: expected ${type}, got ${content.type}`);
        }
        
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify(content, null, 2),
            mimeType: 'application/json'
          }]
        };
      } else {
        throw new Error('Invalid content URI format');
      }
    } catch (error) {
      throw new Error(`Content resource error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);
```

### 🎨 內容相關提示實作指導

#### 1. 內容生成提示
```typescript
server.registerPrompt(
  'content-generation',
  {
    title: 'Content Generation Template',
    description: 'Generate content based on specifications',
    argsSchema: {
      contentType: z.string(),
      topic: z.string(),
      targetAudience: z.string().optional(),
      length: z.string().optional(),
      tone: z.string().optional(),
      keywords: z.string().optional()
    }
  },
  ({ contentType, topic, targetAudience, length, tone, keywords }) => {
    const currentAudience = targetAudience || 'general';
    const currentLength = length || 'medium';
    const currentTone = tone || 'professional';
    const keywordList = keywords ? keywords.split(',').map(s => s.trim()) : [];

    const lengthGuidelines: Record<string, string> = {
      short: 'Keep it concise (200-500 words)',
      medium: 'Provide balanced coverage (500-1000 words)',
      long: 'Create comprehensive content (1000+ words)'
    };

    const toneGuidelines: Record<string, string> = {
      professional: 'Use formal, authoritative language',
      casual: 'Use conversational, friendly language',
      technical: 'Use precise, technical terminology',
      educational: 'Use clear, instructional language'
    };

    const keywordSection = keywordList.length > 0 
      ? `\n\n**Keywords to Include:** ${keywordList.join(', ')}`
      : '';

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please generate ${contentType} content on the topic: **${topic}**

**Content Specifications:**
- **Target Audience:** ${currentAudience}
- **Length:** ${currentLength} (${lengthGuidelines[currentLength] || 'As appropriate'})
- **Tone:** ${currentTone} (${toneGuidelines[currentTone] || 'Professional'})${keywordSection}

**Content Requirements:**
1. **Opening Hook** - Capture attention immediately
2. **Clear Structure** - Use headers and logical flow
3. **Value Proposition** - Explain why this matters to the audience
4. **Supporting Evidence** - Include examples, data, or credible sources
5. **Actionable Insights** - Provide practical takeaways
6. **Engaging Conclusion** - Summarize key points and next steps

**Additional Guidelines:**
- Make the content scannable with bullet points and short paragraphs
- Include relevant examples and use cases
- Optimize for the specified target audience
- Maintain the requested tone throughout
- Ensure the content is original and valuable

Please create compelling, well-structured content that meets these specifications.`
          }
        }
      ]
    };
  }
);
```

#### 2. 內容優化提示
```typescript
server.registerPrompt(
  'content-optimization',
  {
    title: 'Content Optimization Template',
    description: 'Optimize existing content for better performance',
    argsSchema: {
      contentText: z.string(),
      optimizationGoals: z.string().optional(),
      targetMetrics: z.string().optional(),
      currentIssues: z.string().optional()
    }
  },
  ({ contentText, optimizationGoals, targetMetrics, currentIssues }) => {
    const goals = optimizationGoals || 'readability, engagement, clarity';
    const metrics = targetMetrics || 'user engagement, comprehension, action rate';
    const issues = currentIssues || 'none specified';

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please analyze and optimize the following content:

**Original Content:**
${contentText}

**Optimization Parameters:**
- **Goals:** ${goals}
- **Target Metrics:** ${metrics}
- **Current Issues:** ${issues}

**Please provide:**

1. **Content Analysis**
   - Strengths of the current content
   - Areas needing improvement
   - Readability assessment

2. **Optimization Recommendations**
   - Specific changes to improve clarity
   - Structural improvements
   - Language and tone adjustments

3. **SEO & Engagement Improvements**
   - Better headlines or hooks
   - Enhanced call-to-action elements
   - Keyword optimization opportunities

4. **Revised Content**
   - Provide an optimized version
   - Highlight key changes made
   - Explain the rationale for changes

5. **Performance Predictions**
   - Expected improvements in target metrics
   - Potential risks or trade-offs
   - Measurement recommendations

Please focus on making the content more effective for its intended purpose while maintaining its core message and value.`
          }
        }
      ]
    };
  }
);
```

### 🔄 整合現有功能指導

#### 複製所有工具的模式
```typescript
// 從練習 1-6 複製所有工具
server.registerTool('echo', /* ... */);
server.registerTool('calculate', /* ... */);
server.registerTool('text-transform', /* ... */);
server.registerTool('timestamp', /* ... */);
server.registerTool('file-read', /* ... */);
server.registerTool('file-write', /* ... */);
server.registerTool('http-fetch', /* ... */);
server.registerTool('data-process', /* ... */);

// 從練習 2 複製所有資源
server.registerResource('server-config', /* ... */);
server.registerResource('help-info', /* ... */);

// 從練習 6 複製所有提示
server.registerPrompt('code-review', /* ... */);
server.registerPrompt('documentation', /* ... */);
server.registerPrompt('bug-report', /* ... */);
server.registerPrompt('meeting-summary', /* ... */);
```

### 🐛 常見問題和解決方案

#### 問題1: 內容 ID 衝突
**症狀**: 生成重複的內容 ID
**解決方案**:
```typescript
function generateId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}`;
}

// 添加重複檢查
function generateUniqueId(type: string): string {
  let id: string;
  do {
    id = generateId(type);
  } while (contentStore.has(id));
  return id;
}
```

#### 問題2: URI 解析錯誤
**症狀**: 動態資源 URI 解析失敗
**解決方案**:
```typescript
// 使用 URL 構造函數安全解析
const urlPath = new URL(uri).pathname;
const pathParts = urlPath.split('/').filter(Boolean);

// 添加錯誤處理
if (pathParts.length > 2) {
  throw new Error('Invalid content URI format. Expected: content://{type}/{id}');
}
```

#### 問題3: 內容狀態管理
**症狀**: 發布內容無法刪除
**解決方案**:
```typescript
// 添加 force 參數和狀態檢查
if (existingItem.status === 'published' && !force) {
  throw new Error(`Cannot delete published content without force flag: ${id}`);
}
```

#### 問題4: 數據一致性
**症狀**: 更新操作部分失敗
**解決方案**:
```typescript
// 使用展開運算符安全更新
const updatedItem: ContentItem = {
  ...existingItem,
  ...(title && { title }),
  ...(content && { content }),
  updatedAt: new Date().toISOString()
};
```

### 💡 設計模式和最佳實踐

#### 錯誤處理統一模式
```typescript
async function handleContentOperation<T>(
  operation: () => Promise<T>,
  operationName: string
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw new Error(`${operationName} error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
```

#### 內容驗證模式
```typescript
function validateContentItem(item: Partial<ContentItem>): string[] {
  const errors: string[] = [];
  
  if (item.title && item.title.length < 1) {
    errors.push('Title cannot be empty');
  }
  
  if (item.content && item.content.length < 1) {
    errors.push('Content cannot be empty');
  }
  
  return errors;
}
```

#### 響應格式化模式
```typescript
function formatContentResponse(item: ContentItem, operation: string): string {
  return `Content ${operation} successfully:
ID: ${item.id}
Type: ${item.type}
Title: ${item.title}
Author: ${item.author}
Status: ${item.status}
Tags: ${item.tags.join(', ')}
Updated: ${item.updatedAt}`;
}
```

### 🔍 除錯指導

#### 檢查內容存儲狀態
```typescript
// 添加調試輸出
console.error(`Content store size: ${contentStore.size}`);
console.error(`Available content IDs: ${Array.from(contentStore.keys()).join(', ')}`);
```

#### 驗證工具註冊
```typescript
// 確認所有工具都已註冊
const expectedTools = [
  'echo', 'calculate', 'text-transform', 'timestamp',
  'file-read', 'file-write', 'http-fetch', 'data-process',
  'content-create', 'content-update', 'content-delete'
];

console.error(`Expected tools: ${expectedTools.length}`);
```

#### 測試內容操作
```typescript
// 手動測試內容CRUD
const testContent = {
  type: 'article' as const,
  title: 'Test Article',
  content: 'Test content',
  author: 'Test Author'
};

// 在 main 函數中添加測試
console.error('Testing content operations...');
```

### 📝 測試策略

#### 單元測試模式
1. 測試每個工具的獨立功能
2. 測試資源的各種訪問模式
3. 測試提示的參數處理
4. 測試錯誤情況

#### 整合測試流程
```bash
# 1. 測試服務器初始化
npm run build
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' | node dist/exercises/07-feature-integration/server.js

# 2. 測試內容創建
echo '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"content-create","arguments":{"type":"article","title":"Test","content":"Content","author":"Author"}}}' | node dist/exercises/07-feature-integration/server.js

# 3. 測試內容資源訪問
echo '{"jsonrpc":"2.0","id":3,"method":"resources/read","params":{"uri":"content://"}}' | node dist/exercises/07-feature-integration/server.js
```

### 🚀 進階技巧

#### 內容搜索功能
```typescript
// 可選擴展：添加搜索工具
server.registerTool(
  'content-search',
  {
    title: 'Content Search Tool',
    description: 'Search content by keywords and filters',
    inputSchema: {
      query: z.string(),
      type: z.enum(['article', 'blog', 'documentation', 'note']).optional(),
      status: z.enum(['draft', 'published', 'archived']).optional(),
      author: z.string().optional()
    }
  },
  async ({ query, type, status, author }) => {
    // 實作搜索邏輯
  }
);
```

#### 批量操作
```typescript
// 可選擴展：批量更新工具
server.registerTool(
  'content-batch-update',
  {
    title: 'Batch Content Update Tool',
    description: 'Update multiple content items at once',
    inputSchema: {
      ids: z.array(z.string()),
      updates: z.object({
        status: z.enum(['draft', 'published', 'archived']).optional(),
        tags: z.array(z.string()).optional()
      })
    }
  },
  async ({ ids, updates }) => {
    // 實作批量更新邏輯
  }
);
```

#### 內容統計
```typescript
// 可選擴展：統計資源
server.registerResource(
  'content-stats',
  'stats://content',
  {
    title: 'Content Statistics',
    description: 'Content statistics and analytics',
    mimeType: 'application/json'
  },
  async () => {
    const stats = {
      total: contentStore.size,
      byType: {},
      byStatus: {},
      byAuthor: {}
    };
    
    // 計算統計數據
    return {
      contents: [{
        uri: 'stats://content',
        text: JSON.stringify(stats, null, 2),
        mimeType: 'application/json'
      }]
    };
  }
);
```

## 下一步
完成本練習後，你將掌握如何構建複雜的 MCP 整合應用，可以進入練習 8：HTTP 傳輸服務器的學習。