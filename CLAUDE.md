# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an MCP (Model Context Protocol) learning course repository with a three-tier educational architecture: skeleton exercises for students, complete solutions for reference, and comprehensive tests for validation.

**📖 MCP SDK Documentation**: The complete MCP TypeScript SDK documentation is available in `mcp-typescript-sdk.md` in the root directory. This file contains all the official examples, API references, and implementation patterns you need for MCP development.

## Architecture Overview

### Three-Tier Educational Structure

**🎯 exercises/** - Skeleton code with TODO comments for student implementation
- Contains intentionally incomplete code with compilation errors
- Students fill in the TODOs to learn MCP concepts step-by-step
- **Compilation errors and test failures are expected and normal**

**✅ solutions/** - Complete working implementations serving as reference answers
- Contains fully functional MCP servers for each exercise
- Used as the reference implementation for tests
- Students can compare their work against these complete solutions

**🧪 tests/** - Test suites designed to validate student implementations
- Tests run against the student's `exercises/` code to check correctness
- Students use test failures as learning feedback to improve their implementation
- Tests expect the same functionality as found in `solutions/`
- **Purpose: Help students learn by providing immediate feedback on their code**

This separation ensures students learn through active implementation while having validation mechanisms and reference materials.

### MCP Server Development Pattern

All exercises follow the standard MCP server pattern:
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({ name: "server-name", version: "1.0.0" });

// Tool with inputSchema validation
server.registerTool(
  'tool-name',
  {
    title: 'Tool Title',
    description: 'Tool description',
    inputSchema: { param: z.string() }
  },
  async ({ param }) => ({
    content: [{ type: 'text', text: `Result: ${param}` }]
  })
);

const transport = new StdioServerTransport();
await server.connect(transport);
```

**Important: Parameter Handling**
- Tool handlers receive destructured parameters directly: `async ({ param }) => {}`
- Always define `inputSchema` with Zod for automatic validation
- MCP SDK validates parameters before calling your handler
- Import `z` from 'zod' for schema definition

The course progresses through:
- Basic tools (echo functionality)
- Static resources (configuration, help data)
- Dynamic resources (parameterized URIs)
- Complex tools (async operations, error handling)
- Prompt templates
- HTTP transports
- Production applications

## Common Development Commands

### Build and Development
```bash
npm run build                 # Compile TypeScript
npm run dev                   # Watch mode compilation
npm run lint                  # Run ESLint
npm run lint:fix              # Auto-fix lint issues
tsc --noEmit                  # Type check without compilation
```

### Testing
```bash
npm test                      # Run all tests
npm run test:01               # Test specific exercise (01-10)
npm run test:cumulative:05    # Test exercises 1-5 progressively
npm run test:coverage         # Generate coverage report
npm run test:performance      # Run performance benchmarks
```

### Exercise Development
```bash
npm run dev:01                # Run exercise 01 server
npm run dev:02                # Run exercise 02 server
# ... up to dev:10
```

### Manual Testing
```bash
# Test with MCP Inspector
npx @modelcontextprotocol/inspector node dist/exercises/01-hello-world/server.js

# Manual JSON-RPC testing
echo '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{...}}' | node dist/exercises/XX/server.js
```

## Development Workflow for New Exercises

⚠️ **Important**: When developing new exercises, always start with the complete solution and work backwards to create the learning experience.

1. **Create complete solution first** in `solutions/XX-name/`
   - Refer to `mcp-typescript-sdk.md` for correct MCP patterns
   - Ensure it follows the established MCP server pattern
   - Test the solution thoroughly before proceeding

2. **Create skeleton version** in `exercises/XX-name/` with:
   - Basic structure and imports
   - TODO comments marking implementation points  
   - Helpful hints in comments
   - **Intentional compilation errors to guide learning**
   - Empty parameter lists, missing return statements, etc.

3. **Write comprehensive tests** in `tests/XX-name/` based on complete solution
   - Tests should validate that student implementation matches solution behavior
   - Tests serve as both validation and learning specification
   - Include error cases to teach proper error handling

4. **Create learning materials**:
   - `README.md` with step-by-step implementation guide
   - `hints.md` with code snippets and tips

## MCP Core Concepts Implementation

### Resources (GET-like operations)
```typescript
server.registerResource(name, uri, metadata, handler);
// Static: fixed URI, static content
// Dynamic: ResourceTemplate with URI parameters
```

### Tools (POST-like operations)  
```typescript
server.registerTool(name, metadata, handler);
// Handler receives args and returns content array
// Should include proper error handling and validation
```

### Transports
- **stdio**: Command-line integration, used in all basic exercises
- **Streamable HTTP**: Remote servers with session management (advanced exercises)

## Test Architecture

Tests are designed assuming complete implementations and use child process spawning to test actual MCP servers via stdio. Key patterns:

- **Smoke tests**: Basic startup and initialization
- **Integration tests**: Full request/response cycles
- **Error handling tests**: Invalid inputs and edge cases

Tests expect specific server names, tool names, and response formats as defined in each exercise's requirements.

## Common Issues and Solutions

### TypeScript Compilation Errors in Skeleton Code
**This is intentional and expected!** Compilation errors guide students to required implementations. The error messages act as learning prompts. Students should:
1. Read the error messages carefully
2. Fill in the TODO comments to resolve errors
3. Compare with `solutions/` if stuck

### Test Failures on Skeleton Code  
**This is normal learning behavior!** Tests are designed for complete implementations. Students should:
1. Run tests to see what functionality is expected
2. Use test failures as requirements specification
3. Implement features until tests pass
4. Tests are educational tools, not problems to avoid

### Repository Architecture Confusion
Remember: `exercises/` contains incomplete student code, `solutions/` contains working answers. When debugging or understanding expected behavior, always check `solutions/` first.

### Shared Test Utilities
The `shared/test-utils/` contains MCP testing utilities but has import path issues (uses .js extensions in .ts files). Exercise-specific tests use direct child process spawning which is more reliable. Tests run with 10-second timeout and max 4 workers.

## Performance Requirements

- Tool calls: < 100ms response time
- Memory usage: < 100MB during normal operation  
- Startup time: < 2 seconds
- Concurrent connections: Support minimum 10 simultaneous connections

## TypeScript Configuration

The project uses path mapping for clean imports:
- `@shared/*` → `./shared/*` (test utilities)
- `@exercises/*` → `./exercises/*` (skeleton code)
- `@tests/*` → `./tests/*` (test suites)

Compilation excludes `shared/test-utils` due to import path conflicts.

## MCP Protocol Specifics

All servers must support:
- JSON-RPC 2.0 protocol
- MCP protocol version "2024-11-05"
- Standard capability negotiation
- Proper error responses with structured error objects

Response formats follow MCP specifications with content arrays containing typed objects (text, image, resource, etc.).