# 解決方案 03: Basic Tools

這個解決方案展示了如何實作多種實用的MCP工具，包括數學計算、文字處理和時間戳操作。保留了練習1和2的所有功能，並新增了三個強大的工具。

## 🎯 主要概念

### 工具註冊與參數驗證
```typescript
server.registerTool(
  'tool-name',
  {
    title: 'Tool Title',
    description: 'Tool description',
    inputSchema: {
      param1: z.string(),
      param2: z.number(),
      param3: z.enum(['option1', 'option2'])
    }
  },
  async ({ param1, param2, param3 }) => {
    // 工具邏輯
  }
);
```

### 錯誤處理策略
- 使用 `throw new Error()` 處理各種錯誤情況
- 提供具體的錯誤消息
- 預先驗證參數有效性

## 📋 實作的工具

### 1. Echo工具 (來自練習1)
- **功能**: 回傳輸入的訊息
- **參數**: `message: string`
- **用途**: 基本通訊測試

### 2. Calculate工具
- **功能**: 執行基本數學運算
- **參數**: 
  - `operation: 'add' | 'subtract' | 'multiply' | 'divide'`
  - `a: number`
  - `b: number`
- **特點**: 包含除零錯誤處理

### 3. Text-Transform工具
- **功能**: 多種文字轉換操作
- **參數**:
  - `text: string`
  - `operation: 'uppercase' | 'lowercase' | 'reverse' | 'capitalize' | 'word-count'`
- **特點**: 支援複雜的字符串處理

### 4. Timestamp工具
- **功能**: 時間戳生成和格式化
- **參數**:
  - `action: 'current' | 'format' | 'parse'`
  - `timestamp?: number`
  - `format?: 'iso' | 'unix' | 'human' | 'date-only' | 'time-only'`
- **特點**: 多種時間格式支援

## 📋 實作的資源 (來自練習2)

### 1. 應用配置資源
- **URI**: `config://app`
- **格式**: JSON
- **內容**: 工具配置和支援的操作列表

### 2. 用戶指南資源
- **URI**: `help://guide`
- **格式**: Markdown
- **內容**: 所有工具的使用說明和範例

### 3. 系統狀態資源
- **URI**: `status://health`
- **格式**: 純文本
- **內容**: 服務器健康狀態和工具可用性

## 🔧 技術特點

1. **完整的參數驗證**: 使用Zod確保類型安全
2. **全面的錯誤處理**: 處理除零、無效參數等邊界情況
3. **多格式支援**: 時間戳工具支援多種輸出格式
4. **向後相容**: 保留所有前序練習的功能
5. **豐富的文字處理**: 支援多種字符串轉換操作

## 🧪 測試方法

```bash
# 編譯和運行
npm run build
npm run dev:03

# 運行測試
npm run test:03

# 使用 MCP Inspector 測試
npx @modelcontextprotocol/inspector node dist/solutions/03-basic-tools/server.js
```

### 測試用例範例

#### Calculate工具
- `calculate("add", 5, 3)` → "5 add 3 = 8"
- `calculate("multiply", 4, 7)` → "4 multiply 7 = 28"
- `calculate("divide", 10, 0)` → 除零錯誤

#### Text-Transform工具
- `text-transform("hello world", "uppercase")` → "uppercase: HELLO WORLD"
- `text-transform("hello world", "capitalize")` → "capitalize: Hello World"
- `text-transform("hello world", "word-count")` → "word-count: Word count: 2"

#### Timestamp工具
- `timestamp("current", undefined, "iso")` → 當前ISO時間戳
- `timestamp("format", 1640995200, "human")` → 格式化的人類可讀時間
- `timestamp("parse", 1640995200000)` → 解析時間戳

## 🔍 實作細節

### 數學運算處理
```typescript
switch (operation) {
  case 'add': result = a + b; break;
  case 'subtract': result = a - b; break;
  case 'multiply': result = a * b; break;
  case 'divide':
    if (b === 0) throw new Error('Division by zero is not allowed');
    result = a / b;
    break;
}
```

### 文字轉換處理
```typescript
case 'capitalize':
  result = text.split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
  break;
case 'word-count':
  const wordCount = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  result = `Word count: ${wordCount}`;
  break;
```

### 時間戳處理
```typescript
case 'format':
  const date = new Date(timestamp * 1000); // Unix轉毫秒
  if (isNaN(date.getTime())) {
    throw new Error('Invalid timestamp provided');
  }
  // 格式化邏輯
  break;
```

## 📈 性能考量

- 所有工具都是同步操作，響應迅速
- 錯誤處理在參數驗證階段進行，避免無效計算
- 時間戳處理使用內建Date API，效率良好
- 字符串操作針對一般文本長度優化

## 🚀 擴展可能性

1. **更多數學運算**: 幂運算、三角函數、統計函數
2. **進階文字處理**: 正則表達式支援、HTML/Markdown轉換
3. **國際化時間**: 時區支援、多語言格式
4. **輸入歷史**: 記錄和重用之前的計算
5. **批量處理**: 支援陣列輸入的批量操作