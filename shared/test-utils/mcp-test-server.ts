import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { McpTestServerOptions, TestResult } from './types.js';

export class McpTestServer {
  private server: McpServer;
  private transport: StdioServerTransport | null = null;
  private isRunning = false;
  private options: Required<McpTestServerOptions>;

  constructor(options: McpTestServerOptions) {
    this.options = {
      name: options.name,
      version: options.version,
      timeout: options.timeout ?? 5000,
      debug: options.debug ?? false
    };

    this.server = new McpServer({
      name: this.options.name,
      version: this.options.version
    }, {
      capabilities: {
        resources: {},
        tools: {},
        prompts: {}
      }
    });
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      throw new Error('Server already running');
    }

    try {
      // Create stdio transport
      this.transport = new StdioServerTransport();
      
      // Connect server to transport
      await this.server.connect(this.transport);
      
      this.isRunning = true;
      
      if (this.options.debug) {
        console.log(`MCP Test Server '${this.options.name}' started successfully`);
      }
    } catch (error) {
      await this.stop();
      throw error;
    }
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      return;
    }

    try {
      if (this.server) {
        await this.server.close();
      }
      
      if (this.transport) {
        await this.transport.close();
        this.transport = null;
      }
      
      this.isRunning = false;
      
      if (this.options.debug) {
        console.log(`MCP Test Server '${this.options.name}' stopped`);
      }
    } catch (error) {
      if (this.options.debug) {
        console.error('Error stopping server:', error);
      }
    }
  }

  getServer(): McpServer {
    return this.server;
  }

  isServerRunning(): boolean {
    return this.isRunning;
  }

  async withTimeout<T>(promise: Promise<T>, timeoutMs?: number): Promise<T> {
    const timeout = timeoutMs ?? this.options.timeout;
    
    return Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error(`Server operation timed out after ${timeout}ms`)), timeout);
      })
    ]);
  }

  async testServerHealth(): Promise<TestResult<boolean>> {
    const startTime = Date.now();
    
    try {
      if (!this.isRunning) {
        throw new Error('Server not running');
      }
      
      // Simple health check - server should be responsive
      await this.withTimeout(Promise.resolve(), 100);
      
      return {
        success: true,
        data: true,
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

  // Helper methods for registering test functionality
  registerTestResource(uri: string, content: any, mimeType?: string): void {
    this.server.registerResource(
      uri.split('/').pop() || uri,
      uri,
      {
        title: uri.split('/').pop() || uri,
        description: `Test resource: ${uri}`,
        mimeType: mimeType ?? 'text/plain'
      },
      async () => ({
        contents: [{
          uri,
          mimeType: mimeType ?? 'text/plain',
          text: typeof content === 'string' ? content : JSON.stringify(content, null, 2)
        }]
      })
    );
  }

  registerTestTool(
    name: string, 
    description: string,
    handler: (args: any) => Promise<any>,
    inputSchema?: any
  ): void {
    this.server.registerTool(
      name,
      {
        title: name,
        description,
        inputSchema: inputSchema || {
          type: 'object',
          properties: {},
          required: []
        }
      },
      async (args) => {
        try {
          const result = await handler(args || {});
          return {
            content: [{
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2)
            }]
          };
        } catch (error) {
          return {
            content: [{
              type: 'text',
              text: `Error: ${(error as Error).message}`
            }],
            isError: true
          };
        }
      }
    );
  }

  registerTestPrompt(
    name: string,
    description: string,
    handler: (args: any) => Promise<string>,
    argumentsSchema?: any
  ): void {
    this.server.registerPrompt(
      name,
      {
        title: name,
        description,
        arguments: argumentsSchema ? argumentsSchema.properties : {}
      },
      async (args) => {
        const result = await handler(args || {});
        return {
          messages: [{
            role: 'user',
            content: {
              type: 'text',
              text: result
            }
          }]
        };
      }
    );
  }
}