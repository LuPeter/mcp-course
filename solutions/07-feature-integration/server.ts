#!/usr/bin/env node

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import fs from 'fs/promises';
import path from 'path';

/**
 * 練習 7: 整合功能服務器
 * 
 * 本練習展示如何實作功能整合的MCP服務器，將資源、工具和提示協同工作
 * 
 * 新增功能：
 * - 內容管理系統模擬
 * - 跨功能數據流協同
 * - 內容CRUD操作
 * - 內容生成和優化提示
 */

const server = new McpServer({
  name: 'feature-integration-server',
  version: '1.0.0'
});

// 模擬的HTTP響應數據 (來自練習5)
const mockHttpResponses: { [key: string]: any } = {
  'https://api.example.com/users': {
    status: 200,
    data: [
      { id: 1, name: 'Alice', email: 'alice@example.com' },
      { id: 2, name: 'Bob', email: 'bob@example.com' }
    ]
  },
  'https://api.example.com/posts': {
    status: 200,
    data: [
      { id: 1, title: 'Hello World', content: 'This is a test post' },
      { id: 2, title: 'MCP Tutorial', content: 'Learning MCP is fun!' }
    ]
  },
  'https://api.example.com/error': {
    status: 500,
    error: 'Internal Server Error'
  }
};

// 內容管理系統存儲
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

// 內存存儲 (實際應用中會使用數據庫)
const contentStore: Map<string, ContentItem> = new Map();

// 初始化一些示例內容
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

contentStore.set('blog-1', {
  id: 'blog-1',
  type: 'blog',
  title: 'Getting Started with MCP',
  content: 'This blog post will guide you through the basics of implementing MCP servers.',
  author: 'Developer',
  createdAt: '2024-01-02T00:00:00Z',
  updatedAt: '2024-01-02T00:00:00Z',
  tags: ['tutorial', 'beginner', 'mcp'],
  status: 'published'
});

// 確保 data 目錄存在
const dataDir = path.join(__dirname, 'data');

async function ensureDataDir() {
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// 生成唯一 ID
function generateId(type: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${type}-${timestamp}-${random}`;
}

// 註冊來自練習1-6的所有工具
server.registerTool(
  'echo',
  {
    title: 'Echo Tool',
    description: 'Echo back the input message',
    inputSchema: {
      message: z.string().describe('The message to echo back')
    }
  },
  async ({ message }) => ({
    content: [{ type: 'text', text: `Echo: ${message}` }]
  })
);

server.registerTool(
  'calculate',
  {
    title: 'Calculator Tool',
    description: 'Perform basic mathematical operations',
    inputSchema: {
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']).describe('The mathematical operation to perform'),
      a: z.number().describe('First number'),
      b: z.number().describe('Second number')
    }
  },
  async ({ operation, a, b }) => {
    try {
      let result: number;
      
      switch (operation) {
        case 'add':
          result = a + b;
          break;
        case 'subtract':
          result = a - b;
          break;
        case 'multiply':
          result = a * b;
          break;
        case 'divide':
          if (b === 0) {
            throw new Error('Division by zero is not allowed');
          }
          result = a / b;
          break;
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      return {
        content: [{ 
          type: 'text', 
          text: `${a} ${operation} ${b} = ${result}` 
        }]
      };
    } catch (error) {
      throw new Error(`Calculation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

server.registerTool(
  'text-transform',
  {
    title: 'Text Transform Tool',
    description: 'Transform text in various ways',
    inputSchema: {
      text: z.string().describe('The text to transform'),
      operation: z.enum(['uppercase', 'lowercase', 'reverse', 'length']).describe('The transformation to apply')
    }
  },
  async ({ text, operation }) => {
    try {
      let result: string;
      
      switch (operation) {
        case 'uppercase':
          result = text.toUpperCase();
          break;
        case 'lowercase':
          result = text.toLowerCase();
          break;
        case 'reverse':
          result = text.split('').reverse().join('');
          break;
        case 'length':
          result = `Length: ${text.length}`;
          break;
        default:
          throw new Error(`Unknown transformation: ${operation}`);
      }
      
      return {
        content: [{ 
          type: 'text', 
          text: `${operation}("${text}") = ${result}` 
        }]
      };
    } catch (error) {
      throw new Error(`Text transformation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

server.registerTool(
  'timestamp',
  {
    title: 'Timestamp Tool',
    description: 'Generate and format timestamps',
    inputSchema: {
      format: z.enum(['iso', 'unix', 'readable']).describe('The timestamp format'),
      timezone: z.string().optional().describe('Timezone (default: UTC)')
    }
  },
  async ({ format, timezone = 'UTC' }) => {
    try {
      const now = new Date();
      let result: string;
      
      switch (format) {
        case 'iso':
          result = now.toISOString();
          break;
        case 'unix':
          result = Math.floor(now.getTime() / 1000).toString();
          break;
        case 'readable':
          result = now.toLocaleString('en-US', { 
            timeZone: timezone,
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
          });
          break;
        default:
          throw new Error(`Unknown format: ${format}`);
      }
      
      return {
        content: [{ 
          type: 'text', 
          text: `Current timestamp (${format}): ${result}` 
        }]
      };
    } catch (error) {
      throw new Error(`Timestamp generation error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// 文件操作工具 (來自練習5)
server.registerTool(
  'file-read',
  {
    title: 'File Read Tool',
    description: 'Read files from the data directory',
    inputSchema: {
      filename: z.string().describe('Name of the file to read'),
      encoding: z.enum(['utf8', 'base64']).optional().default('utf8').describe('File encoding')
    }
  },
  async ({ filename, encoding = 'utf8' }) => {
    try {
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename: path traversal not allowed');
      }
      
      const filePath = path.join(dataDir, filename);
      
      try {
        await fs.access(filePath);
      } catch {
        throw new Error(`File not found: ${filename}`);
      }
      
      const content = await fs.readFile(filePath, encoding);
      const stats = await fs.stat(filePath);
      
      return {
        content: [{
          type: 'text',
          text: `File: ${filename}
Size: ${stats.size} bytes
Modified: ${stats.mtime.toISOString()}
Encoding: ${encoding}

Content:
${content}`
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`File read error: ${error.message}`);
      }
      throw new Error('File read error: Unknown error occurred');
    }
  }
);

server.registerTool(
  'file-write',
  {
    title: 'File Write Tool',
    description: 'Write files to the data directory',
    inputSchema: {
      filename: z.string().describe('Name of the file to write'),
      content: z.string().describe('Content to write to the file'),
      encoding: z.enum(['utf8', 'base64']).optional().default('utf8').describe('File encoding'),
      overwrite: z.boolean().optional().default(false).describe('Whether to overwrite existing files')
    }
  },
  async ({ filename, content, encoding = 'utf8', overwrite = false }) => {
    try {
      if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
        throw new Error('Invalid filename: path traversal not allowed');
      }
      
      const filePath = path.join(dataDir, filename);
      
      if (!overwrite) {
        try {
          await fs.access(filePath);
          throw new Error(`File already exists: ${filename}. Use overwrite=true to replace it.`);
        } catch (error) {
          if (error instanceof Error && !error.message.includes('ENOENT')) {
            throw error;
          }
        }
      }
      
      await fs.writeFile(filePath, content, encoding);
      const stats = await fs.stat(filePath);
      
      return {
        content: [{
          type: 'text',
          text: `File written successfully: ${filename}
Size: ${stats.size} bytes
Modified: ${stats.mtime.toISOString()}
Encoding: ${encoding}`
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`File write error: ${error.message}`);
      }
      throw new Error('File write error: Unknown error occurred');
    }
  }
);

server.registerTool(
  'http-fetch',
  {
    title: 'HTTP Fetch Tool',
    description: 'Simulate HTTP requests to mock endpoints',
    inputSchema: {
      url: z.string().url().describe('URL to fetch'),
      method: z.enum(['GET', 'POST', 'PUT', 'DELETE']).optional().default('GET').describe('HTTP method'),
      timeout: z.number().optional().default(5000).describe('Request timeout in milliseconds')
    }
  },
  async ({ url, method = 'GET', timeout = 5000 }) => {
    try {
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 50));
      
      if (timeout <= 0) {
        throw new Error('Request timeout must be positive');
      }
      
      const mockResponse = mockHttpResponses[url];
      
      if (!mockResponse) {
        throw new Error(`No mock response configured for URL: ${url}`);
      }
      
      if (mockResponse.status >= 400) {
        throw new Error(`HTTP ${mockResponse.status}: ${mockResponse.error || 'Unknown error'}`);
      }
      
      return {
        content: [{
          type: 'text',
          text: `HTTP ${method} ${url}
Status: ${mockResponse.status}
Response: ${JSON.stringify(mockResponse.data, null, 2)}`
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`HTTP request error: ${error.message}`);
      }
      throw new Error('HTTP request error: Unknown error occurred');
    }
  }
);

server.registerTool(
  'data-process',
  {
    title: 'Data Processing Tool',
    description: 'Process JSON data with various transformations',
    inputSchema: {
      data: z.string().describe('JSON data to process'),
      operation: z.enum(['parse', 'stringify', 'filter', 'map', 'reduce']).describe('Processing operation'),
      parameters: z.record(z.any()).optional().describe('Operation parameters')
    }
  },
  async ({ data, operation, parameters = {} }) => {
    try {
      let result: any;
      
      switch (operation) {
        case 'parse':
          try {
            result = JSON.parse(data);
          } catch {
            throw new Error('Invalid JSON data');
          }
          break;
          
        case 'stringify':
          try {
            const parsed = JSON.parse(data);
            result = JSON.stringify(parsed, null, parameters.indent || 2);
          } catch {
            throw new Error('Invalid JSON data for stringify operation');
          }
          break;
          
        case 'filter':
          try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
              throw new Error('Filter operation requires an array');
            }
            const filterKey = parameters.key;
            const filterValue = parameters.value;
            if (!filterKey) {
              throw new Error('Filter operation requires a key parameter');
            }
            result = parsed.filter(item => item[filterKey] === filterValue);
          } catch (error) {
            if (error instanceof Error) {
              throw error;
            }
            throw new Error('Invalid data for filter operation');
          }
          break;
          
        case 'map':
          try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
              throw new Error('Map operation requires an array');
            }
            const mapKey = parameters.key;
            if (!mapKey) {
              throw new Error('Map operation requires a key parameter');
            }
            result = parsed.map(item => item[mapKey]);
          } catch (error) {
            if (error instanceof Error) {
              throw error;
            }
            throw new Error('Invalid data for map operation');
          }
          break;
          
        case 'reduce':
          try {
            const parsed = JSON.parse(data);
            if (!Array.isArray(parsed)) {
              throw new Error('Reduce operation requires an array');
            }
            const reduceKey = parameters.key;
            const reduceOp = parameters.operation || 'sum';
            if (!reduceKey) {
              throw new Error('Reduce operation requires a key parameter');
            }
            
            if (reduceOp === 'sum') {
              result = parsed.reduce((acc, item) => acc + (Number(item[reduceKey]) || 0), 0);
            } else if (reduceOp === 'count') {
              result = parsed.length;
            } else {
              throw new Error(`Unknown reduce operation: ${reduceOp}`);
            }
          } catch (error) {
            if (error instanceof Error) {
              throw error;
            }
            throw new Error('Invalid data for reduce operation');
          }
          break;
          
        default:
          throw new Error(`Unknown operation: ${operation}`);
      }
      
      return {
        content: [{
          type: 'text',
          text: `Data processing result (${operation}):
${typeof result === 'object' ? JSON.stringify(result, null, 2) : result}`
        }]
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(`Data processing error: ${error.message}`);
      }
      throw new Error('Data processing error: Unknown error occurred');
    }
  }
);

// 新增：內容管理工具
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

// 註冊靜態資源 (來自練習2)
server.registerResource(
  'server-config',
  'config://server',
  {
    title: 'Server Configuration',
    description: 'Current server configuration',
    mimeType: 'application/json'
  },
  async () => ({
    contents: [{
      uri: 'config://server',
      text: JSON.stringify({
        name: 'feature-integration-server',
        version: '1.0.0',
        features: ['tools', 'resources', 'prompts', 'content-management'],
        maxConcurrency: 10,
        timeout: 30000
      }, null, 2),
      mimeType: 'application/json'
    }]
  })
);

server.registerResource(
  'help-info',
  'help://info',
  {
    title: 'Help Information',
    description: 'Available commands and usage information',
    mimeType: 'text/markdown'
  },
  async () => ({
    contents: [{
      uri: 'help://info',
      text: `# Feature Integration Server Help

## Available Tools
- \`echo\`: Echo back messages
- \`calculate\`: Perform mathematical operations
- \`text-transform\`: Transform text (case, reverse, etc.)
- \`timestamp\`: Generate and format timestamps
- \`file-read\`: Read files from data directory
- \`file-write\`: Write files to data directory
- \`http-fetch\`: Simulate HTTP requests
- \`data-process\`: Process JSON data with transformations
- \`content-create\`: Create new content items
- \`content-update\`: Update existing content items
- \`content-delete\`: Delete content items

## Available Prompts
- \`code-review\`: Generate code review templates
- \`documentation\`: Create documentation templates
- \`bug-report\`: Generate bug report templates
- \`meeting-summary\`: Create meeting summary templates
- \`content-generation\`: Generate content based on specifications
- \`content-optimization\`: Optimize existing content

## Resources
- \`config://server\`: Server configuration
- \`help://info\`: This help information
- \`content://{type}/{id}\`: Dynamic content resources

## Content Management
The server includes a complete content management system with CRUD operations.
Content types: article, blog, documentation, note
Content statuses: draft, published, archived
`,
      mimeType: 'text/markdown'
    }]
  })
);

// 註冊內容根資源
server.registerResource(
  'content-root',
  'content://',
  {
    title: 'Content Root',
    description: 'List all content items',
    mimeType: 'application/json'
  },
  async () => {
    const allContent = Array.from(contentStore.values());
    return {
      contents: [{
        uri: 'content://',
        text: JSON.stringify({
          total: allContent.length,
          content: allContent
        }, null, 2),
        mimeType: 'application/json'
      }]
    };
  }
);

// 新增：動態內容資源
server.registerResource(
  'content',
  new ResourceTemplate('content://{type}/{id}', { list: undefined }),
  {
    title: 'Content Resource',
    description: 'Access content items by type and ID',
    mimeType: 'application/json'
  },
  async (uri: URL, { type, id }: { type?: string; id?: string }) => {
    try {
      // 檢查是否有參數，如果沒有，則基於 URI 路徑解析
      if (!type && !id) {
        const urlPath = uri.pathname;
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
        }
        return {
          contents: [{
            uri: uri.href,
            text: JSON.stringify({ error: 'Invalid URI format' }, null, 2),
            mimeType: 'application/json'
          }]
        };
      }
      
      // 使用模板參數處理
      if (type && id) {
        // Get specific content: content://article/123
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
      } else if (type && !id) {
        // List content by type: content://article
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
      } else {
        throw new Error('Invalid content URI format');
      }
    } catch (error) {
      throw new Error(`Content resource error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
);

// 註冊來自練習6的所有提示
server.registerPrompt(
  'code-review',
  {
    title: 'Code Review Template',
    description: 'Generate a structured code review prompt',
    argsSchema: {
      language: z.string(),
      codeContext: z.string(),
      focusAreas: z.string().optional(),
      severity: z.string().optional()
    }
  },
  ({ language, codeContext, focusAreas, severity }) => {
    const currentSeverity = severity || 'medium';
    const areas = focusAreas ? focusAreas.split(',').map(s => s.trim()) : [];
    
    const focusText = areas.length > 0 
      ? `\n\n**Focus Areas:**\n${areas.map((area: string) => `- ${area}`).join('\n')}`
      : '';
    
    const severityInstructions: Record<string, string> = {
      low: 'Provide general feedback and suggestions for improvement.',
      medium: 'Conduct a thorough review focusing on best practices and potential issues.',
      high: 'Perform a comprehensive review including security, performance, and maintainability analysis.'
    };

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please perform a ${currentSeverity}-level code review for the following ${language} code.

**Context:** ${codeContext}${focusText}

**Review Instructions:**
${severityInstructions[currentSeverity] || severityInstructions.medium}

**Please provide:**
1. **Overall Assessment** - General code quality and structure
2. **Specific Issues** - Bugs, anti-patterns, or improvements needed
3. **Best Practices** - Adherence to ${language} conventions
4. **Recommendations** - Concrete suggestions for improvement
5. **Rating** - Overall code quality score (1-10)

Please be constructive and provide specific examples where possible.`
          }
        }
      ]
    };
  }
);

server.registerPrompt(
  'documentation',
  {
    title: 'Documentation Template',
    description: 'Generate documentation for code or APIs',
    argsSchema: {
      type: z.string(),
      name: z.string(),
      description: z.string().optional(),
      includeExamples: z.string().optional(),
      targetAudience: z.string().optional()
    }
  },
  ({ type, name, description, includeExamples, targetAudience }) => {
    const currentTargetAudience = targetAudience || 'developer';
    const shouldIncludeExamples = includeExamples !== 'false';
    
    const exampleSection = shouldIncludeExamples 
      ? '\n\n**Usage Examples:**\nPlease provide practical examples showing how to use this effectively.'
      : '';
    
    const audienceInstructions: Record<string, string> = {
      developer: 'Focus on technical details, implementation notes, and code examples.',
      user: 'Emphasize ease of use, practical applications, and clear step-by-step instructions.',
      admin: 'Include configuration details, deployment considerations, and maintenance procedures.'
    };

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please generate comprehensive documentation for the following ${type}: **${name}**

${description ? `**Description:** ${description}\n` : ''}**Target Audience:** ${currentTargetAudience}

**Documentation Guidelines:**
${audienceInstructions[currentTargetAudience] || audienceInstructions.developer}

**Please include the following sections:**
1. **Overview** - What this ${type} does and why it's useful
2. **Syntax/Signature** - Technical specification or interface
3. **Parameters** - Input parameters, types, and descriptions
4. **Return Values** - Output format and expected results
5. **Error Handling** - Common errors and how to handle them${exampleSection}
6. **Notes** - Additional considerations, limitations, or tips

Please format the documentation clearly with appropriate headers and code blocks where needed.`
          }
        }
      ]
    };
  }
);

server.registerPrompt(
  'bug-report',
  {
    title: 'Bug Report Template',
    description: 'Generate a structured bug report template',
    argsSchema: {
      severity: z.string(),
      component: z.string(),
      environment: z.string().optional(),
      reproducible: z.string().optional(),
      userImpact: z.string().optional()
    }
  },
  ({ severity, component, environment, reproducible, userImpact }) => {
    const currentEnvironment = environment || 'not specified';
    const isReproducible = reproducible !== 'false';
    
    const priorityMap: Record<string, string> = {
      critical: 'P0 - System down, blocking all users',
      high: 'P1 - Major functionality broken, affecting many users',
      medium: 'P2 - Important feature not working correctly',
      low: 'P3 - Minor issue, workaround available'
    };

    const impactSection = userImpact 
      ? `\n**User Impact:** ${userImpact}\n`
      : '';

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me create a detailed bug report with the following information:

**Bug Summary:** [Brief description of the issue]

**Severity:** ${severity.toUpperCase()} (${priorityMap[severity] || 'Unknown priority'})
**Component:** ${component}
**Environment:** ${currentEnvironment}
**Reproducible:** ${isReproducible ? 'Yes' : 'No'}${impactSection}

**Please structure the bug report with these sections:**

1. **Description**
   - Clear, concise summary of what's wrong
   - What was expected vs. what actually happened

2. **Steps to Reproduce**
   - Detailed step-by-step instructions
   - Include any specific data or configurations needed

3. **Actual Results**
   - What currently happens (include error messages, screenshots)

4. **Expected Results**
   - What should happen instead

5. **Additional Information**
   - Browser/OS/version details
   - Console logs or error traces
   - Related tickets or dependencies

6. **Workaround** (if available)
   - Temporary solution or alternative approach

Please format this as a clear, actionable bug report that developers can easily understand and reproduce.`
          }
        }
      ]
    };
  }
);

server.registerPrompt(
  'meeting-summary',
  {
    title: 'Meeting Summary Template',
    description: 'Generate meeting summary and action items',
    argsSchema: {
      meetingType: z.string(),
      duration: z.string().optional(),
      attendees: z.string().optional(),
      includeActionItems: z.string().optional(),
      includeDecisions: z.string().optional()
    }
  },
  ({ meetingType, duration, attendees, includeActionItems, includeDecisions }) => {
    const durationNum = duration ? parseInt(duration) : null;
    const durationText = durationNum ? ` (${durationNum} minutes)` : '';
    
    const attendeeNames = attendees ? attendees.split(',').map(s => s.trim()) : [];
    const attendeeList = attendeeNames.length > 0 
      ? `\n**Attendees:** ${attendeeNames.join(', ')}\n`
      : '';

    const shouldIncludeActionItems = includeActionItems !== 'false';
    const shouldIncludeDecisions = includeDecisions !== 'false';

    const actionItemsSection = shouldIncludeActionItems 
      ? '\n6. **Action Items**\n   - [ ] Action item 1 (Owner: [Name], Due: [Date])\n   - [ ] Action item 2 (Owner: [Name], Due: [Date])'
      : '';

    const decisionsSection = shouldIncludeDecisions 
      ? '\n5. **Decisions Made**\n   - Decision 1: [Description and rationale]\n   - Decision 2: [Description and rationale]'
      : '';

    const meetingTypeTemplates: Record<string, string> = {
      standup: 'Focus on what was done yesterday, what will be done today, and any blockers.',
      planning: 'Cover goals, priorities, timeline, and resource allocation.',
      retrospective: 'Discuss what went well, what could be improved, and action items.',
      review: 'Present deliverables, gather feedback, and discuss next steps.',
      general: 'Cover the main topics discussed and key outcomes.'
    };

    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Please help me create a comprehensive summary for a ${meetingType} meeting${durationText}.

${attendeeList}**Meeting Focus:** ${meetingTypeTemplates[meetingType] || meetingTypeTemplates.general}

**Please structure the summary as follows:**

1. **Meeting Overview**
   - Date, time, and purpose
   - Key objectives and agenda items covered

2. **Key Discussion Points**
   - Main topics discussed
   - Important points raised by participants

3. **Progress Updates** (if applicable)
   - Status of ongoing projects or tasks
   - Milestones achieved or missed

4. **Issues and Challenges**
   - Problems identified
   - Blockers or risks discussed${decisionsSection}${actionItemsSection}

7. **Next Steps**
   - Follow-up meetings scheduled
   - Important deadlines or milestones

Please format this as a clear, organized summary that can be easily shared with stakeholders and serve as a reference for future meetings.`
          }
        }
      ]
    };
  }
);

// 新增：內容生成提示
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

// 新增：內容優化提示
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

async function main() {
  try {
    // 確保數據目錄存在
    await ensureDataDir();
    
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    console.error('Feature Integration MCP Server started successfully');
    console.error('Available tools: echo, calculate, text-transform, timestamp, file-read, file-write, http-fetch, data-process, content-create, content-update, content-delete');
    console.error('Available resources: server-config, help-info, content');
    console.error('Available prompts: code-review, documentation, bug-report, meeting-summary, content-generation, content-optimization');
    console.error(`Data directory: ${dataDir}`);
    console.error(`Initial content items: ${contentStore.size}`);
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}