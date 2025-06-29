# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

This is an MCP (Model Context Protocol) learning course repository with a three-tier educational architecture: skeleton exercises for students, complete solutions for reference, and comprehensive tests for validation.

**📖 MCP SDK Documentation**: The complete MCP TypeScript SDK documentation is available in `mcp-typescript-sdk.md` in the root directory. This file contains all the official examples, API references, and implementation patterns you need for MCP development.

## 🚨 IMPORTANT: Follow Project Guidelines

**CRITICAL**: Before making any changes to this repository, you MUST read and follow these essential documentation files:

1. **📋 COURSE_OUTLINE.md** - Overall course structure and learning path
2. **🎯 MCP_EXERCISES_PLAN.md** - Detailed exercise specifications and requirements  
3. **🏗️ PROJECT_STRUCTURE.md** - Repository organization and development workflow
4. **📚 EXERCISE_STRUCTURE.md** - How exercises should be structured and organized
5. **🧪 TEST_FRAMEWORK.md** - Testing standards and methodology

**DO NOT**:
- Create new exercises without following the established patterns in these documents
- Change exercise numbering or order without checking MCP_EXERCISES_PLAN.md
- Modify the three-tier architecture (exercises/solutions/tests) described in PROJECT_STRUCTURE.md
- Skip the proper development workflow outlined in the documentation

**ALWAYS**:
- Check MCP_EXERCISES_PLAN.md for the correct exercise sequence and content
- Follow the educational methodology described in PROJECT_STRUCTURE.md
- Ensure new exercises follow the structure outlined in EXERCISE_STRUCTURE.md
- Implement tests according to TEST_FRAMEWORK.md standards
- Maintain consistency with the course progression in COURSE_OUTLINE.md

## Architecture Overview

### Three-Tier Educational Structure

**🎯 exercises/** - Skeleton code with TODO comments for student implementation
- Contains intentionally incomplete code with compilation errors
- Uses placeholder values (e.g., `FILL_IN_SERVER_NAME`) and deliberate errors (`throw new Error('TODO: Implement...')`)
- Students fill in the TODOs to learn MCP concepts step-by-step
- **Compilation errors and test failures are expected and normal** - they guide the learning process

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

### Skeleton Code Design Philosophy

The skeleton code in `exercises/` is deliberately designed to guide learning through error-driven development:

**🎯 Placeholder Strategy**:
- Use meaningful placeholders like `FILL_IN_SERVER_NAME` instead of empty strings
- Throw explicit errors: `throw new Error('TODO: Implement main function')`
- Provide complete code structure with commented-out implementations

**📝 Comment-Driven Learning**:
- Extensive TODO comments explain what needs to be implemented
- Code examples provided in comments for reference
- Progressive hints from basic structure to detailed implementation

**🔧 Compilation-Guided Development**:
- Skeleton code compiles successfully but fails at runtime with clear error messages
- Students learn by resolving TODO errors step by step
- Test failures provide immediate feedback on implementation correctness

**Example skeleton pattern**:
```typescript
const server = new McpServer({
  name: 'FILL_IN_SERVER_NAME', // TODO: Replace with 'actual-server-name'
  version: 'FILL_IN_VERSION'   // TODO: Replace with '1.0.0'
});

// TODO: Register tools
// server.registerTool('tool-name', config, handler);

async function main() {
  try {
    // TODO: Implement server startup
    // const transport = new StdioServerTransport();
    // await server.connect(transport);
    
    throw new Error('TODO: Implement main function');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}
```

This approach ensures students understand both the structure and the functionality they need to implement.

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
- Basic echo functionality (hello world)
- Static resources (configuration, help data)  
- Basic tools (calculate, text-transform, timestamp)
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
npm test                      # Run all tests (expect failures on incomplete exercises)
npm run test:01               # Test specific exercise (01-10) against exercises/ code
npm run test:cumulative:05    # Test exercises 1-5 progressively
npm run test:coverage         # Generate coverage report  
npm run test:performance      # Run performance benchmarks
```

**Note**: Tests run against `exercises/` code and will fail until students complete implementations. This is intended behavior for learning.

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

**📋 MUST READ FIRST**: Before creating any new exercise, carefully review:
- **MCP_EXERCISES_PLAN.md** for the specific exercise requirements and learning objectives
- **EXERCISE_STRUCTURE.md** for the correct file organization and naming
- **PROJECT_STRUCTURE.md** for the development workflow
- **TEST_FRAMEWORK.md** for testing standards

1. **Create complete solution first** in `solutions/XX-name/`
   - Refer to `mcp-typescript-sdk.md` for correct MCP patterns
   - Follow the exact specifications in MCP_EXERCISES_PLAN.md
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

⚠️ **Important**: Tests are designed to validate student implementations in `exercises/` and **will fail until students complete the exercises**. This is the intended learning behavior.

Tests use child process spawning to test actual MCP servers via stdio against the student's `exercises/` code. Key patterns:

- **Smoke tests**: Basic startup and initialization
- **Integration tests**: Full request/response cycles  
- **Error handling tests**: Invalid inputs and edge cases

**Test Failure is Normal**: When students first run tests, they should expect failures. These failures serve as:
1. **Requirements specification** - Tests show what functionality is expected
2. **Learning feedback** - Failed assertions guide implementation
3. **Progress tracking** - Passing tests indicate successful completion

Tests expect specific server names, tool names, and response formats as defined in each exercise's requirements. Students should implement features in `exercises/` until all tests pass.

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

---

## 📚 Documentation Compliance Reminder

**CRITICAL REMINDER**: This repository has comprehensive documentation that MUST be followed for consistency and quality:

### Essential Documents (READ BEFORE ANY WORK):
1. **COURSE_OUTLINE.md** - Master course structure
2. **MCP_EXERCISES_PLAN.md** - Detailed exercise specifications  
3. **PROJECT_STRUCTURE.md** - Repository organization and workflow
4. **EXERCISE_STRUCTURE.md** - Exercise file structure standards
5. **TEST_FRAMEWORK.md** - Testing methodology and standards

### Quick Reference:
- **Exercise numbering**: Follow MCP_EXERCISES_PLAN.md exactly
- **File structure**: Follow EXERCISE_STRUCTURE.md patterns
- **Development workflow**: Follow PROJECT_STRUCTURE.md methodology
- **Testing standards**: Follow TEST_FRAMEWORK.md specifications
- **Course progression**: Follow COURSE_OUTLINE.md learning path

**When in doubt, always refer to these documents first before making changes.**