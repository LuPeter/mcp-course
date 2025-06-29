# 練習 6: 提示模板系統 - 提示和指導

## 開發提示

### 🎯 開始之前
1. **理解提示工程**: 掌握有效提示的構成要素
2. **模板設計思維**: 考慮重用性和參數化
3. **用戶場景分析**: 理解不同模板的使用情境

### 🔧 實作提示

#### 服務器初始化
```typescript
const server = new McpServer({
  name: 'prompt-templates-server', // 替換 FILL_IN_SERVER_NAME
  version: '1.0.0' // 替換 FILL_IN_VERSION
});
```

#### 提示註冊基本模式
```typescript
server.registerPrompt(
  'prompt-name',
  {
    title: 'Prompt Title',
    description: 'What this prompt does',
    inputSchema: {
      parameter: z.string().describe('Parameter description')
    }
  },
  async ({ parameter }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Generated prompt content using ${parameter}`
        }
      }
    ]
  })
);
```

### 🛠️ 提示模板實作指導

#### 1. 代碼審查模板實作
```typescript
server.registerPrompt(
  'code-review',
  {
    title: 'Code Review Template',
    description: 'Generate a structured code review prompt',
    inputSchema: {
      language: z.string().describe('Programming language of the code'),
      codeContext: z.string().describe('Context or purpose of the code'),
      focusAreas: z.array(z.string()).optional().describe('Specific areas to focus on (performance, security, readability, etc.)'),
      severity: z.enum(['low', 'medium', 'high']).optional().default('medium').describe('Review severity level')
    }
  },
  async ({ language, codeContext, focusAreas = [], severity = 'medium' }) => {
    // 根據焦點領域生成內容
    const focusText = focusAreas.length > 0 
      ? `\n\n**Focus Areas:**\n${focusAreas.map(area => `- ${area}`).join('\n')}`
      : '';
    
    // 根據嚴重程度設定指導
    const severityInstructions = {
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
            text: `Please perform a ${severity}-level code review for the following ${language} code.

**Context:** ${codeContext}${focusText}

**Review Instructions:**
${severityInstructions[severity]}

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
```

#### 2. 文檔生成模板實作
```typescript
server.registerPrompt(
  'documentation',
  {
    title: 'Documentation Template',
    description: 'Generate documentation for code or APIs',
    inputSchema: {
      type: z.enum(['api', 'function', 'class', 'module', 'readme']).describe('Type of documentation to generate'),
      name: z.string().describe('Name of the item to document'),
      description: z.string().optional().describe('Brief description of the item'),
      includeExamples: z.boolean().optional().default(true).describe('Whether to include usage examples'),
      targetAudience: z.enum(['developer', 'user', 'admin']).optional().default('developer').describe('Target audience for the documentation')
    }
  },
  async ({ type, name, description = '', includeExamples = true, targetAudience = 'developer' }) => {
    // 根據是否包含範例調整內容
    const exampleSection = includeExamples 
      ? '\n\n**Usage Examples:**\nPlease provide practical examples showing how to use this effectively.'
      : '';
    
    // 根據受眾調整指導語言
    const audienceInstructions = {
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

${description ? `**Description:** ${description}\n` : ''}**Target Audience:** ${targetAudience}

**Documentation Guidelines:**
${audienceInstructions[targetAudience]}

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
```

#### 3. 錯誤報告模板實作
```typescript
server.registerPrompt(
  'bug-report',
  {
    title: 'Bug Report Template',
    description: 'Generate a structured bug report template',
    inputSchema: {
      severity: z.enum(['critical', 'high', 'medium', 'low']).describe('Bug severity level'),
      component: z.string().describe('Component or module where the bug occurs'),
      environment: z.string().optional().describe('Environment where the bug was found'),
      reproducible: z.boolean().optional().default(true).describe('Whether the bug is reproducible'),
      userImpact: z.string().optional().describe('How this affects users')
    }
  },
  async ({ severity, component, environment = 'not specified', reproducible = true, userImpact = '' }) => {
    // 嚴重程度到優先級的映射
    const priorityMap = {
      critical: 'P0 - System down, blocking all users',
      high: 'P1 - Major functionality broken, affecting many users',
      medium: 'P2 - Important feature not working correctly',
      low: 'P3 - Minor issue, workaround available'
    };

    // 可選的用戶影響章節
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

**Severity:** ${severity.toUpperCase()} (${priorityMap[severity]})
**Component:** ${component}
**Environment:** ${environment}
**Reproducible:** ${reproducible ? 'Yes' : 'No'}${impactSection}

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
```

#### 4. 會議總結模板實作
```typescript
server.registerPrompt(
  'meeting-summary',
  {
    title: 'Meeting Summary Template',
    description: 'Generate meeting summary and action items',
    inputSchema: {
      meetingType: z.enum(['standup', 'planning', 'retrospective', 'review', 'general']).describe('Type of meeting'),
      duration: z.number().optional().describe('Meeting duration in minutes'),
      attendees: z.array(z.string()).optional().describe('List of attendee names'),
      includeActionItems: z.boolean().optional().default(true).describe('Whether to include action items section'),
      includeDecisions: z.boolean().optional().default(true).describe('Whether to include decisions made')
    }
  },
  async ({ meetingType, duration, attendees = [], includeActionItems = true, includeDecisions = true }) => {
    // 格式化時間和參與者資訊
    const durationText = duration ? ` (${duration} minutes)` : '';
    const attendeeList = attendees.length > 0 
      ? `\n**Attendees:** ${attendees.join(', ')}\n`
      : '';

    // 可選章節
    const actionItemsSection = includeActionItems 
      ? '\n6. **Action Items**\n   - [ ] Action item 1 (Owner: [Name], Due: [Date])\n   - [ ] Action item 2 (Owner: [Name], Due: [Date])'
      : '';

    const decisionsSection = includeDecisions 
      ? '\n5. **Decisions Made**\n   - Decision 1: [Description and rationale]\n   - Decision 2: [Description and rationale]'
      : '';

    // 根據會議類型提供指導
    const meetingTypeTemplates = {
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

${attendeeList}**Meeting Focus:** ${meetingTypeTemplates[meetingType]}

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
```

### 🐛 常見問題和解決方案

#### 問題1: 參數驗證失敗
**症狀**: Zod 驗證錯誤
**解決方案**:
```typescript
// 確保使用正確的 Zod 類型
inputSchema: {
  severity: z.enum(['low', 'medium', 'high']).describe('Severity level'),
  optionalField: z.string().optional().describe('Optional parameter')
}
```

#### 問題2: 消息格式錯誤
**症狀**: MCP 協議錯誤
**解決方案**:
```typescript
// 確保消息格式符合標準
return {
  messages: [
    {
      role: 'user',  // 必須是有效的角色
      content: {
        type: 'text',  // 必須指定內容類型
        text: 'Generated content'  // 實際內容
      }
    }
  ]
};
```

#### 問題3: 條件邏輯複雜
**症狀**: 難以維護的嵌套條件
**解決方案**:
```typescript
// 使用映射物件簡化條件邏輯
const severityInstructions = {
  low: 'Basic review...',
  medium: 'Thorough review...',
  high: 'Comprehensive review...'
};

const instruction = severityInstructions[severity];
```

### 💡 設計模式和最佳實踐

#### 模板化內容生成
```typescript
function generateSection(title: string, content: string, optional: boolean = false): string {
  if (optional && !content) return '';
  return `\n\n**${title}**\n${content}`;
}

// 使用
const focusSection = generateSection(
  'Focus Areas', 
  focusAreas.map(area => `- ${area}`).join('\n'),
  focusAreas.length === 0
);
```

#### 參數預設值策略
```typescript
// 在 schema 中設定預設值
inputSchema: {
  severity: z.enum(['low', 'medium', 'high']).optional().default('medium'),
  includeExamples: z.boolean().optional().default(true)
}

// 或在函數參數中設定
async ({ severity = 'medium', includeExamples = true }) => {
  // 實作邏輯
}
```

#### 內容結構化
```typescript
function createStructuredPrompt(sections: Array<{title: string, content: string}>) {
  return sections
    .filter(section => section.content.trim())
    .map((section, index) => `${index + 1}. **${section.title}**\n   ${section.content}`)
    .join('\n\n');
}
```

### 🔍 除錯指導

#### 檢查提示註冊
```typescript
// 添加日誌確認註冊成功
console.error(`Registered prompt: ${promptName}`);
```

#### 驗證參數處理
```typescript
// 在提示函數開始處添加日誌
async (args) => {
  console.error(`Prompt called with args:`, JSON.stringify(args, null, 2));
  // 提示生成邏輯
}
```

#### 測試消息格式
```typescript
// 驗證返回的消息格式
const result = {
  messages: [/* ... */]
};
console.error('Generated prompt:', JSON.stringify(result, null, 2));
return result;
```

### 📝 測試策略

#### 單元測試模式
1. 測試基本參數組合
2. 測試可選參數
3. 測試邊界條件
4. 測試錯誤情況

#### 整合測試
```bash
# 測試提示列表
npm run build
echo '{"jsonrpc":"2.0","id":1,"method":"prompts/list","params":{}}' | node dist/exercises/06-prompt-templates/server.js

# 測試特定提示
echo '{"jsonrpc":"2.0","id":2,"method":"prompts/get","params":{"name":"code-review","arguments":{"language":"JavaScript","codeContext":"API function"}}}' | node dist/exercises/06-prompt-templates/server.js
```

### 🚀 進階技巧

#### 動態內容生成
```typescript
// 根據上下文動態調整提示結構
function adaptPromptToContext(type: string, context: string): string {
  const adaptations = {
    'api': 'Focus on endpoint design and error handling.',
    'function': 'Emphasize parameter validation and return types.',
    'class': 'Cover inheritance patterns and method design.'
  };
  
  return adaptations[type] || 'Provide comprehensive documentation.';
}
```

#### 內容本地化
```typescript
// 支援多語言提示（如果需要）
const translations = {
  en: {
    severity: 'Severity',
    description: 'Description'
  },
  'zh-TW': {
    severity: '嚴重程度',
    description: '描述'
  }
};
```

#### 提示鏈接
```typescript
// 設計可以連接的提示模板
async function generateLinkedPrompt(basePrompt: string, enhancement: string) {
  return {
    messages: [
      { role: 'user', content: { type: 'text', text: basePrompt } },
      { role: 'assistant', content: { type: 'text', text: '[Previous response]' } },
      { role: 'user', content: { type: 'text', text: enhancement } }
    ]
  };
}
```

## 進階提示

### 效能優化
- 預計算常用的提示片段
- 快取複雜的格式化邏輯
- 最佳化字串操作

### 可維護性
- 將大型提示分解為可重用的片段
- 使用一致的命名約定
- 添加完整的類型定義

### 用戶體驗
- 提供清晰的錯誤訊息
- 設計直觀的參數名稱
- 包含有用的範例和預設值

## 下一步
完成本練習後，你將掌握 MCP 提示模板系統的設計和實作，可以進入練習 7：整合功能服務器的學習。