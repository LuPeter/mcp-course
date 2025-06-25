# 練習 1 提示

## 基本結構

### 1. 服務器初始化
```typescript
const server = new McpServer({
  name: 'hello-world-server',
  version: '1.0.0'
});
```

### 2. 註冊工具
```typescript
server.registerTool(
  'echo',  // 工具名稱
  {
    title: 'Echo Tool',
    description: 'Echo back the input message'
  },
  async (args: any) => {
    // 處理邏輯
    const { message } = args;
    
    // 回傳結果
    return {
      content: [{
        type: 'text' as const,
        text: `Echo: ${message}`
      }]
    };
  }
);
```

### 3. 傳輸連接
```typescript
async function main() {
  try {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Server started successfully');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
```

### 4. 啟動檢查
```typescript
if (require.main === module) {
  main().catch(error => {
    console.error('Server error:', error);
    process.exit(1);
  });
}
```

## 錯誤處理提示

在工具處理函數中，記得檢查必要參數：
```typescript
if (!message) {
  throw new Error('Message parameter is required');
}
```

## 測試提示

編譯並測試：
```bash
npm run build
npm run dev:01
```

使用MCP Inspector測試：
```bash
npx @modelcontextprotocol/inspector node dist/exercises/01-hello-world/server.js
```