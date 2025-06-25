# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an MCP (Model Context Protocol) learning course repository containing reference documentation and materials for understanding MCP implementation with TypeScript SDK.

## Key Files

- `mcp-typescript-sdk.md` - Comprehensive MCP TypeScript SDK documentation and examples
- `llms-full.txt` - List of MCP-compatible clients and their feature support matrix

## 技術需求

### 開發環境
- Node.js 18+
- TypeScript 5+ 
- Jest 測試框架
- VS Code (建議)

### MCP 核心概念
- **Resources**: 數據暴露端點 (類似 REST API 的 GET)
- **Tools**: 有副作用的操作端點 (類似 REST API 的 POST)
- **Prompts**: 可重用的 LLM 互動模板
- **Completions**: 參數自動完成支援

### 傳輸類型
- **stdio**: 命令列工具和直接整合
- **Streamable HTTP**: 遠端服務器與會話管理
- **SSE** (已棄用): 舊版 HTTP+SSE 傳輸

### 服務器架構模式
- 高階 `McpServer` 類別用於標準實作
- 低階 `Server` 類別用於自定義控制
- 動態服務器功能 (運行時新增/移除工具)
- 有狀態服務器的會話管理
- 簡單用例的無狀態服務器模式

## Common MCP Server Structure

```typescript
const server = new McpServer({
  name: "server-name",
  version: "1.0.0"
});

// Register resources, tools, and prompts
server.registerResource(...);
server.registerTool(...);
server.registerPrompt(...);

// Connect transport
const transport = new StdioServerTransport();
await server.connect(transport);
```

## 課程架構

### 學習路徑 (10個練習)
1. **基礎階段** (練習 1-3): Hello World → 靜態資源 → 基礎工具
2. **進階階段** (練習 4-6): 動態資源 → 複雜工具 → 提示模板  
3. **整合階段** (練習 7-8): 功能整合 → HTTP 傳輸
4. **生產階段** (練習 9-10): 動態功能 → 完整應用

### 練習特性
- **循序漸進**: 每個練習都基於前面的功能擴展
- **完整測試**: 包含單元測試、功能測試、性能測試
- **實用導向**: 從簡單 echo 到生產級應用
- **多元化**: 涵蓋 stdio、HTTP 傳輸和動態功能

## 開發環境設置

### 專案初始化 (目前需要)
```bash
npm init -y
npm install --save-dev typescript @types/node jest ts-jest @types/jest
npm install @modelcontextprotocol/sdk
npx tsc --init
```

### 重要建議
⚠️ **專案狀態**: 目前僅包含規劃文檔，實際程式碼和測試需要建立
- 先建立 package.json 和基本專案結構
- 建立 exercises/ 和 tests/ 目錄
- 設定 TypeScript 和 Jest 配置

## 練習結構與測試

### 測試命令 (規劃中)
```bash
npm test                    # 執行所有測試
npm run test:01            # 測試特定練習 (01)
npm run test:cumulative:05 # 累積測試 (練習 1-5)
npm run test:coverage      # 生成測試覆蓋率報告
npm run test:performance   # 性能測試
npm run dev:01             # 運行練習 01 開發模式
npm run build              # 編譯 TypeScript
npm run lint               # 程式碼檢查
```

### 目錄結構 (規劃中)
```
/
├── exercises/
│   ├── 01-hello-world/
│   ├── 02-static-resources/
│   └── ...
├── tests/
│   ├── utils/
│   ├── 01-hello-world/
│   └── ...
├── shared/
│   └── test-utils/
└── docs/
```

### 測試架構
- **測試框架**: Jest with TypeScript
- **MCP 測試工具**: 自定義 `McpTestClient` 和 `McpTestServer`
- **測試層級**: 冒煙測試 → 單元測試 → 功能測試 → 整合測試

### 練習進展模式
1. **累積式測試**: 每個練習都包含前面練習的所有功能測試
2. **隔離測試**: 每個練習可獨立測試新增功能
3. **性能驗證**: 重要功能包含性能基準測試

### 開發工具
- 使用 [MCP Inspector](https://github.com/modelcontextprotocol/inspector) 進行手動測試
- VS Code 建議安裝 TypeScript 和 Jest 擴展

## 常用 MCP 工具類
建議建立共用工具類於 `shared/` 目錄:

### McpTestClient 
專門用於測試的 MCP 客戶端包裝器，提供:
- 簡化的連接和斷開方法
- 超時控制和錯誤處理
- 批量測試工具

### McpTestServer
專門用於測試的伺服器管理工具，提供:
- 程序生命週期管理
- 連接狀態檢查
- 自動重啟功能

## 效能要求
- 單個工具呼叫: < 100ms
- 並發處理: 支援至少 10 個同時連接
- 記憶體使用: 正常運行 < 100MB
- 啟動時間: < 2 秒

## 故障排除指南
### 常見問題
1. **stdio 連接失敗**: 檢查程序路徑和權限
2. **工具呼叫超時**: 增加超時設定或優化工具邏輯
3. **測試不穩定**: 確保每個測試獨立且能重複執行
4. **TypeScript 錯誤**: 檢查 MCP SDK 類型定義是否正確

### 除錯技巧
- 使用 MCP Inspector 檢查服務器狀態
- 啟用詳細日誌記錄
- 檢查 JSON-RPC 消息格式