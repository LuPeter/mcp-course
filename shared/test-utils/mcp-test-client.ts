import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ChildProcess, spawn } from 'child_process';
import {
  McpTestClientOptions,
  TestResult,
  PerformanceMetrics
} from './types.js';

export class McpTestClient {
  private client: Client | null = null;
  private transport: StdioClientTransport | null = null;
  private process: ChildProcess | null = null;
  private options: Required<McpTestClientOptions>;
  
  constructor(options: McpTestClientOptions = {}) {
    this.options = {
      timeout: options.timeout ?? 5000,
      retries: options.retries ?? 3,
      debug: options.debug ?? false
    };
  }

  async connect(serverCommand: string, serverArgs: string[] = []): Promise<Client> {
    if (this.client) {
      throw new Error('Client already connected');
    }

    try {
      // Start server process
      this.process = spawn(serverCommand, serverArgs, {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      if (!this.process.stdin || !this.process.stdout) {
        throw new Error('Failed to create server process stdio streams');
      }

      // Create transport
      this.transport = new StdioClientTransport({
        command: serverCommand,
        args: serverArgs
      });

      // Create client
      this.client = new Client({
        name: 'mcp-test-client',
        version: '1.0.0'
      }, {
        capabilities: {}
      });

      // Connect
      await this.client.connect(this.transport);
      
      if (this.options.debug) {
        console.log('MCP Test Client connected successfully');
      }

      return this.client;
    } catch (error) {
      await this.cleanup();
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    await this.cleanup();
  }

  private async cleanup(): Promise<void> {
    if (this.client) {
      try {
        await this.client.close();
      } catch (error) {
        if (this.options.debug) {
          console.error('Error closing client:', error);
        }
      }
      this.client = null;
    }

    if (this.transport) {
      try {
        await this.transport.close();
      } catch (error) {
        if (this.options.debug) {
          console.error('Error closing transport:', error);
        }
      }
      this.transport = null;
    }

    if (this.process) {
      try {
        this.process.kill('SIGTERM');
        // Wait a bit for graceful shutdown
        await new Promise(resolve => setTimeout(resolve, 100));
        if (!this.process?.killed) {
          this.process?.kill('SIGKILL');
        }
      } catch (error) {
        if (this.options.debug) {
          console.error('Error killing process:', error);
        }
      }
      this.process = null;
    }
  }

  async withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
    const timeout = timeoutMs ?? this.options.timeout;
    
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout);
      })
    ]);
  }

  async withRetry<T>(fn: () => Promise<T>, maxRetries?: number): Promise<T> {
    const retries = maxRetries ?? this.options.retries;
    let lastError: Error | null = null;

    for (let i = 0; i <= retries; i++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;
        if (i < retries) {
          // Exponential backoff
          const delay = Math.min(1000 * Math.pow(2, i), 5000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error('Max retries exceeded');
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
    expectedErrorType?: string
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
      
      if (expectedErrorType && !err.message.includes(expectedErrorType)) {
        return {
          success: false,
          error: new Error(`Expected error type '${expectedErrorType}', got: ${err.message}`),
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

  getClient(): Client {
    if (!this.client) {
      throw new Error('Client not connected. Call connect() first.');
    }
    return this.client;
  }

  isConnected(): boolean {
    return this.client !== null && this.transport !== null;
  }
}