# 練習 03: Basic Tools

## 🎯 學習目標

這個練習將教你如何實作多種實用的MCP工具，包括數學計算、文字處理和時間戳操作。重點在於學習參數驗證和錯誤處理。

這個練習會保留練習1和2的所有功能，並新增三個新工具。

## 📋 任務清單

### 步驟 1: 服務器設置
- [ ] 設定服務器名稱為 `'basic-tools-server'`
- [ ] 設定版本為 `'1.0.0'`
- [ ] 導入 `z` 來自 `zod` 用於參數驗證

### 步驟 2: 保留之前的功能
- [ ] 註冊echo工具 (來自練習1)
- [ ] 註冊三個靜態資源 (來自練習2)

### 步驟 3: 註冊calculate工具
- [ ] 名稱: `'calculate'`
- [ ] 標題: `'Calculator Tool'`
- [ ] 描述: `'Perform basic mathematical operations'`
- [ ] 參數驗證:
  - `operation`: `z.enum(['add', 'subtract', 'multiply', 'divide'])`
  - `a`: `z.number()`
  - `b`: `z.number()`
- [ ] 支援四則運算
- [ ] 處理除零錯誤
- [ ] 返回格式化的計算結果

### 步驟 4: 註冊text-transform工具
- [ ] 名稱: `'text-transform'`
- [ ] 標題: `'Text Transform Tool'`
- [ ] 描述: `'Transform text using various operations'`
- [ ] 參數驗證:
  - `text`: `z.string()`
  - `operation`: `z.enum(['uppercase', 'lowercase', 'reverse', 'capitalize', 'word-count'])`
- [ ] 實作所有轉換操作:
  - `uppercase`: 轉為大寫
  - `lowercase`: 轉為小寫
  - `reverse`: 字符反轉
  - `capitalize`: 每個單詞首字母大寫
  - `word-count`: 計算單詞數量

### 步驟 5: 註冊timestamp工具
- [ ] 名稱: `'timestamp'`
- [ ] 標題: `'Timestamp Tool'`
- [ ] 描述: `'Generate and format timestamps'`
- [ ] 參數驗證:
  - `action`: `z.enum(['current', 'format', 'parse'])`
  - `timestamp`: `z.number().optional()`
  - `format`: `z.enum(['iso', 'unix', 'human', 'date-only', 'time-only']).optional()`
- [ ] 實作所有操作:
  - `current`: 獲取當前時間
  - `format`: 格式化給定時間戳
  - `parse`: 解析時間戳

### 步驟 6: 更新靜態資源
- [ ] 更新config資源內容以反映新工具
- [ ] 更新help資源以包含新工具的說明
- [ ] 更新status資源以顯示所有工具狀態

### 步驟 7: 完成服務器設置
- [ ] 創建 StdioServerTransport
- [ ] 連接服務器到傳輸
- [ ] 添加錯誤處理
- [ ] 添加啟動成功訊息

## 🔧 工具實作範例

### Calculate工具範例
```typescript
server.registerTool(
  'calculate',
  {
    title: 'Calculator Tool',
    description: 'Perform basic mathematical operations',
    inputSchema: {
      operation: z.enum(['add', 'subtract', 'multiply', 'divide']),
      a: z.number(),
      b: z.number()
    }
  },
  async ({ operation, a, b }) => {
    // 實作計算邏輯
    // 注意處理除零錯誤
  }
);
```

### 錯誤處理範例
```typescript
if (operation === 'divide' && b === 0) {
  throw new Error('Division by zero is not allowed');
}
```

## 🧪 測試你的實作

```bash
# 編譯程式碼
npm run build

# 運行測試（應該會失敗直到你完成實作）
npm run test:03

# 手動測試你的服務器
npm run dev:03
```

### 預期的功能
實作完成後，你的服務器應該支援：
- 4個工具：echo, calculate, text-transform, timestamp
- 3個資源：config://app, help://guide, status://health
- 完整的參數驗證和錯誤處理

### 測試用例範例
1. `calculate("add", 5, 3)` → "5 add 3 = 8"
2. `text-transform("hello world", "uppercase")` → "HELLO WORLD"
3. `timestamp("current", undefined, "iso")` → 當前ISO時間戳
4. `calculate("divide", 10, 0)` → 除零錯誤

## 💡 提示

1. **參數驗證**: 使用Zod進行嚴格的參數驗證
2. **錯誤處理**: 使用 `throw new Error()` 處理各種錯誤情況
3. **文字處理**: 
   - `capitalize`: 使用 `split(' ')` 和 `map()` 處理每個單詞
   - `word-count`: 使用 `split(/\s+/)` 分割單詞並過濾空字符串
4. **時間處理**: 
   - Unix時間戳需要乘以1000轉換為毫秒
   - 使用 `new Date()` 的各種方法進行格式化
5. **Math操作**: 使用 switch 語句處理不同運算類型
6. **類型安全**: 確保所有參數都有正確的TypeScript類型

## 📚 參考資料

- 查看 `solutions/03-basic-tools/` 中的完整實作範例
- 參考 `mcp-typescript-sdk.md` 中的 Tools 章節
- 了解 Zod 的參數驗證語法
- JavaScript 的數學運算和字符串處理方法