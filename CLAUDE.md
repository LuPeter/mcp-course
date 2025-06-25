# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an MCP (Model Context Protocol) learning course repository with a three-tier educational architecture: skeleton exercises for students, complete solutions for reference, and comprehensive tests for validation.

## Architecture Overview

### Three-Tier Educational Structure

**exercises/** - Skeleton code with TODO comments for student implementation
**solutions/** - Complete working implementations serving as reference answers  
**tests/** - Test suites designed against complete implementations to validate student work

This separation ensures students learn through active implementation while having validation mechanisms and reference materials.

### MCP Server Development Pattern

All exercises follow the standard MCP server pattern:
```typescript
const server = new McpServer({ name: "server-name", version: "1.0.0" });
server.registerTool/Resource/Prompt(...);
const transport = new StdioServerTransport();
await server.connect(transport);
```

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

1. **Create complete solution first** in `solutions/XX-name/`
2. **Create skeleton version** in `exercises/XX-name/` with:
   - Basic structure and imports
   - TODO comments marking implementation points
   - Helpful hints in comments
   - Intentional compilation errors to guide learning
3. **Write comprehensive tests** in `tests/XX-name/` based on complete solution
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
This is intentional - compilation errors guide students to required implementations. The error messages act as learning prompts.

### Test Failures on Skeleton Code
Expected behavior - tests are designed for complete implementations. Students should use test failures to understand requirements.

### Shared Test Utilities
The `shared/test-utils/` contains MCP testing utilities but may have API compatibility issues with current SDK versions. Focus on exercise-specific tests which use direct process spawning.

## Performance Requirements

- Tool calls: < 100ms response time
- Memory usage: < 100MB during normal operation  
- Startup time: < 2 seconds
- Concurrent connections: Support minimum 10 simultaneous connections

## MCP Protocol Specifics

All servers must support:
- JSON-RPC 2.0 protocol
- MCP protocol version "2024-11-05"
- Standard capability negotiation
- Proper error responses with structured error objects

Response formats follow MCP specifications with content arrays containing typed objects (text, image, resource, etc.).