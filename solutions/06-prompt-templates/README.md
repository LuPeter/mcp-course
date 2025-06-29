# 練習 6: 提示模板系統 - 解答

## 概述
本練習展示如何實作MCP提示模板系統，提供可重用、參數化的提示模板，幫助用戶生成結構化的提示內容。

## 實作的功能

### 繼承的功能 (練習 1-5)
- **Echo 工具**: 基本的訊息回顯功能
- **靜態資源**: 服務器配置和幫助資訊
- **基本工具**: 計算機、文字轉換、時間戳
- **文件操作工具**: 文件讀寫功能
- **HTTP 模擬工具**: 網路請求模擬
- **數據處理工具**: JSON 數據處理

### 新增的提示模板

#### 1. 代碼審查模板 (`code-review`)
```typescript
// 用法示例
{
  "prompt": "code-review",
  "arguments": {
    "language": "TypeScript",
    "codeContext": "MCP server implementation",
    "focusAreas": ["security", "performance", "maintainability"],
    "severity": "high"
  }
}
```

**功能特點**:
- 支援多種程式語言
- 可自訂審查重點領域
- 三種嚴重程度級別（low, medium, high）
- 生成結構化的審查指導

**生成的提示包含**:
- 整體評估指導
- 特定問題檢查
- 最佳實踐驗證
- 具體建議要求
- 評分標準

#### 2. 文檔生成模板 (`documentation`)
```typescript
// 用法示例
{
  "prompt": "documentation",
  "arguments": {
    "type": "api",
    "name": "getUserProfile",
    "description": "Retrieves user profile information",
    "includeExamples": true,
    "targetAudience": "developer"
  }
}
```

**功能特點**:
- 支援多種文檔類型（API、函數、類別、模組、README）
- 針對不同受眾優化（開發者、用戶、管理員）
- 可選擇是否包含使用範例
- 生成完整的文檔結構

**文檔模板包含**:
- 概述和用途說明
- 語法和簽名
- 參數說明
- 返回值描述
- 錯誤處理
- 使用範例
- 注意事項

#### 3. 錯誤報告模板 (`bug-report`)
```typescript
// 用法示例
{
  "prompt": "bug-report",
  "arguments": {
    "severity": "high",
    "component": "user authentication",
    "environment": "production",
    "reproducible": true,
    "userImpact": "Users cannot log in to the system"
  }
}
```

**功能特點**:
- 四種嚴重程度級別（critical, high, medium, low）
- 自動優先級映射
- 可重現性標記
- 用戶影響描述
- 結構化報告格式

**錯誤報告包含**:
- 問題描述和摘要
- 重現步驟
- 實際結果 vs 預期結果
- 環境資訊
- 錯誤日誌
- 解決方案建議

#### 4. 會議總結模板 (`meeting-summary`)
```typescript
// 用法示例
{
  "prompt": "meeting-summary",
  "arguments": {
    "meetingType": "retrospective",
    "duration": 60,
    "attendees": ["Alice", "Bob", "Charlie"],
    "includeActionItems": true,
    "includeDecisions": true
  }
}
```

**功能特點**:
- 支援多種會議類型（standup, planning, retrospective, review, general）
- 自動生成針對性的會議重點
- 可選操作項目和決定記錄
- 參與者名單管理
- 時間長度記錄

**會議總結包含**:
- 會議概述和目標
- 關鍵討論點
- 進度更新
- 問題和挑戰
- 決定事項
- 操作項目
- 後續步驟

## 提示模板設計原則

### 1. 參數化設計
- **必要參數**: 核心資訊，如語言、類型、嚴重程度
- **可選參數**: 增強功能，如受眾、範例、特殊要求
- **預設值**: 提供合理的預設值，簡化使用

### 2. 結構化輸出
- **一致的格式**: 所有模板遵循相似的結構
- **清晰的章節**: 使用標題和編號組織內容
- **可操作性**: 提供具體、可執行的指導

### 3. 上下文感知
- **類型特定**: 根據類型提供相關的指導
- **受眾導向**: 針對不同受眾調整語言和重點
- **嚴重程度**: 根據重要性調整詳細程度

### 4. 可擴展性
- **模組化設計**: 每個模板獨立且可重用
- **參數驗證**: 使用 Zod 進行嚴格的輸入驗證
- **錯誤處理**: 提供清晰的錯誤信息

## MCP 提示協議實作

### 提示註冊
```typescript
server.registerPrompt(
  'prompt-name',
  {
    title: 'Human-readable title',
    description: 'Detailed description',
    inputSchema: { /* Zod schema */ }
  },
  async (args) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: 'Generated prompt content'
        }
      }
    ]
  })
);
```

### 消息格式
- **role**: 'user', 'assistant', 'system'
- **content**: 結構化內容物件
- **type**: 'text', 'image', 等內容類型

### 參數驗證
使用 Zod schema 確保：
- 類型安全
- 必要參數檢查
- 範圍限制（如 enum 值）
- 預設值設定

## 使用範例

### 代碼審查流程
1. 開發者提交代碼
2. 使用 `code-review` 模板生成審查提示
3. 審查者使用生成的提示進行結構化審查
4. 產出一致格式的審查報告

### 文檔生成流程
1. 識別需要文檔的組件
2. 使用 `documentation` 模板
3. 指定類型和受眾
4. 生成完整的文檔結構
5. 填入具體內容

### 錯誤報告流程
1. 發現問題時使用 `bug-report` 模板
2. 設定嚴重程度和組件
3. 生成結構化報告格式
4. 填入具體錯誤資訊
5. 追蹤和解決

### 會議管理流程
1. 會議後使用 `meeting-summary` 模板
2. 指定會議類型和參與者
3. 生成標準化總結格式
4. 記錄討論點和行動項目
5. 分發給利害關係人

## 性能和最佳實踐

### 模板優化
- **快取常用模板**: 減少重複計算
- **參數驗證**: 提早發現錯誤
- **內容生成**: 最佳化字串操作

### 可維護性
- **模組化設計**: 每個模板獨立
- **一致的介面**: 統一的參數模式
- **完整的測試**: 覆蓋所有使用情境

### 安全性
- **輸入清理**: 防止注入攻擊
- **參數驗證**: 確保資料完整性
- **權限控制**: 適當的存取限制

## 測試策略

### 單元測試
- 模板參數驗證
- 內容生成正確性
- 錯誤處理機制

### 整合測試
- MCP 協議合規性
- 完整的請求-響應循環
- 多種參數組合

### 用戶驗收測試
- 實際使用場景
- 生成內容品質
- 用戶體驗評估

## 下一步
完成本練習後，你將掌握 MCP 提示模板系統的設計和實作，可以進入練習 7：整合功能服務器的學習。