import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import {
  TestResult,
  PerformanceMetrics,
  McpTestUtils,
  TestConnection,
  McpTestClientOptions
} from './types.js';
import { McpTestClient } from './mcp-test-client.js';
import { McpTestServer } from './mcp-test-server.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

class TestUtilsImpl implements McpTestUtils {
  async createTestConnection(
    serverFactory: () => McpServer,
    clientOptions?: McpTestClientOptions
  ): Promise<TestConnection> {
    const server = serverFactory();
    const client = new McpTestClient(clientOptions);
    
    // For this implementation, we'll need to set up proper connection
    // This is a simplified version - in practice, you'd need proper transport setup
    throw new Error('createTestConnection not fully implemented - use McpTestClient and McpTestServer directly');
  }

  async testResourceExists(client: Client, uri: string): Promise<TestResult<boolean>> {
    const startTime = Date.now();
    
    try {
      const result = await client.request({ method: 'resources/list', params: {} });
      const exists = (result as any).resources?.some((r: any) => r.uri === uri) ?? false;
      
      return {
        success: true,
        data: exists,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }

  async testResourceContent(client: Client, uri: string): Promise<TestResult<any>> {
    const startTime = Date.now();
    
    try {
      const result = await client.request({ method: 'resources/read', params: { uri } });
      
      return {
        success: true,
        data: result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }

  async testAllResources(client: Client): Promise<TestResult<any>> {
    const startTime = Date.now();
    
    try {
      const result = await client.request({ method: 'resources/list', params: {} });
      
      return {
        success: true,
        data: result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }

  async testToolExists(client: Client, toolName: string): Promise<TestResult<boolean>> {
    const startTime = Date.now();
    
    try {
      const result = await client.request({ method: 'tools/list', params: {} });
      const exists = (result as any).tools?.some((t: any) => t.name === toolName) ?? false;
      
      return {
        success: true,
        data: exists,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }

  async testToolCall(client: Client, toolName: string, args?: any): Promise<TestResult<any>> {
    const startTime = Date.now();
    
    try {
      const result = await client.request({ 
        method: 'tools/call', 
        params: {
          name: toolName,
          arguments: args || {}
        }
      });
      
      return {
        success: true,
        data: result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }

  async testAllTools(client: Client): Promise<TestResult<any>> {
    const startTime = Date.now();
    
    try {
      const result = await client.request({ method: 'tools/list', params: {} });
      
      return {
        success: true,
        data: result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }

  async testPromptExists(client: Client, promptName: string): Promise<TestResult<boolean>> {
    const startTime = Date.now();
    
    try {
      const result = await client.request({ method: 'prompts/list', params: {} });
      const exists = (result as any).prompts?.some((p: any) => p.name === promptName) ?? false;
      
      return {
        success: true,
        data: exists,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }

  async testPrompt(client: Client, promptName: string, args?: any): Promise<TestResult<any>> {
    const startTime = Date.now();
    
    try {
      const result = await client.request({ 
        method: 'prompts/get', 
        params: {
          name: promptName,
          arguments: args || {}
        }
      });
      
      return {
        success: true,
        data: result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }

  async testAllPrompts(client: Client): Promise<TestResult<any>> {
    const startTime = Date.now();
    
    try {
      const result = await client.request({ method: 'prompts/list', params: {} });
      
      return {
        success: true,
        data: result,
        duration: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error as Error,
        duration: Date.now() - startTime
      };
    }
  }

  async measurePerformance(
    fn: () => Promise<void>, 
    iterations: number = 10
  ): Promise<PerformanceMetrics> {
    const startMemory = process.memoryUsage();
    const startTime = Date.now();
    
    const durations: number[] = [];
    
    for (let i = 0; i < iterations; i++) {
      const operationStart = Date.now();
      await fn();
      const operationEnd = Date.now();
      durations.push(operationEnd - operationStart);
    }

    const endTime = Date.now();
    const endMemory = process.memoryUsage();

    return {
      startupTime: endTime - startTime,
      averageResponseTime: durations.reduce((a, b) => a + b, 0) / durations.length,
      memoryUsage: {
        rss: endMemory.rss - startMemory.rss,
        heapTotal: endMemory.heapTotal - startMemory.heapTotal,
        heapUsed: endMemory.heapUsed - startMemory.heapUsed,
        external: endMemory.external - startMemory.external,
        arrayBuffers: endMemory.arrayBuffers - startMemory.arrayBuffers
      },
      operationCount: iterations
    };
  }

  async expectError<T>(
    fn: () => Promise<T>, 
    errorType?: string
  ): Promise<TestResult<Error>> {
    const startTime = Date.now();
    
    try {
      await fn();
      return {
        success: false,
        error: new Error('Expected function to throw an error, but it succeeded'),
        duration: Date.now() - startTime
      };
    } catch (error) {
      const err = error as Error;
      const duration = Date.now() - startTime;
      
      if (errorType && !err.message.includes(errorType)) {
        return {
          success: false,
          error: new Error(`Expected error type '${errorType}', got: ${err.message}`),
          duration
        };
      }
      
      return {
        success: true,
        data: err,
        duration
      };
    }
  }

  async withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeoutMs}ms`)), timeoutMs);
      })
    ]);
  }

  async withRetry<T>(
    fn: () => Promise<T>, 
    maxRetries: number, 
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i <= maxRetries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
  }
}

// Export singleton instance
export const testUtils = new TestUtilsImpl();

// Export classes for direct use
export { McpTestClient, McpTestServer };

// Helper functions
export async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export function createMockData(size: number = 100): any[] {
  return Array.from({ length: size }, (_, i) => ({
    id: i + 1,
    name: `Item ${i + 1}`,
    value: Math.random() * 100,
    timestamp: new Date().toISOString()
  }));
}

export function assertTestResult<T>(
  result: TestResult<T>, 
  expectedSuccess: boolean = true
): void {
  if (result.success !== expectedSuccess) {
    const message = expectedSuccess 
      ? `Test expected to succeed but failed: ${result.error?.message}`
      : `Test expected to fail but succeeded`;
    throw new Error(message);
  }
}