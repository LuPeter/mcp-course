import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { 
  ListResourcesResult,
  ListToolsResult,
  ListPromptsResult,
  CallToolResult,
  GetPromptResult,
  ReadResourceResult
} from '@modelcontextprotocol/sdk/types.js';

export interface McpTestClientOptions {
  timeout?: number;
  retries?: number;
  debug?: boolean;
}

export interface McpTestServerOptions {
  name: string;
  version: string;
  timeout?: number;
  debug?: boolean;
}

export interface TestConnection {
  client: Client;
  server: McpServer;
  cleanup: () => Promise<void>;
}

export interface TestResult<T = any> {
  success: boolean;
  data?: T;
  error?: Error;
  duration: number;
}

export interface PerformanceMetrics {
  startupTime: number;
  averageResponseTime: number;
  memoryUsage: NodeJS.MemoryUsage;
  operationCount: number;
}

// Test utilities interface
export interface McpTestUtils {
  // Connection management
  createTestConnection(
    serverFactory: () => McpServer,
    clientOptions?: McpTestClientOptions
  ): Promise<TestConnection>;
  
  // Resource testing
  testResourceExists(client: Client, uri: string): Promise<TestResult<boolean>>;
  testResourceContent(client: Client, uri: string): Promise<TestResult<ReadResourceResult>>;
  testAllResources(client: Client): Promise<TestResult<ListResourcesResult>>;
  
  // Tool testing
  testToolExists(client: Client, toolName: string): Promise<TestResult<boolean>>;
  testToolCall(client: Client, toolName: string, args?: any): Promise<TestResult<CallToolResult>>;
  testAllTools(client: Client): Promise<TestResult<ListToolsResult>>;
  
  // Prompt testing
  testPromptExists(client: Client, promptName: string): Promise<TestResult<boolean>>;
  testPrompt(client: Client, promptName: string, args?: any): Promise<TestResult<GetPromptResult>>;
  testAllPrompts(client: Client): Promise<TestResult<ListPromptsResult>>;
  
  // Performance testing
  measurePerformance(fn: () => Promise<void>, iterations?: number): Promise<PerformanceMetrics>;
  
  // Error testing
  expectError<T>(fn: () => Promise<T>, errorType?: string): Promise<TestResult<Error>>;
  
  // Timeout utilities
  withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T>;
  
  // Retry utilities
  withRetry<T>(fn: () => Promise<T>, maxRetries: number, delay?: number): Promise<T>;
}