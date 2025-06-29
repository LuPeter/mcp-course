# Gemini Agent Instructions

This document provides instructions for the Gemini AI agent to effectively assist with the development of the MCP course exercises.

## 📖 Repository Overview

This repository contains a series of exercises for a course on building applications using the MCP TypeScript SDK. The course progresses from a simple "Hello, World!" server to a production-ready application.

The project is structured into a three-tier educational architecture:
- **/exercises**: Skeleton code with `TODO` comments and intentional errors for the student to fix. **Compilation errors and test failures are expected here.**
- **/solutions**: The completed, correct solution for each exercise, serving as a reference.
- **/tests**: The test suite used to validate the student's implementation in the `/exercises` directory.

The complete MCP TypeScript SDK documentation is available in `mcp-typescript-sdk.md` in the root directory.

## 🚨 CRITICAL: Guiding Principle

**Your primary directive is to understand and follow the educational design of this repository.**

The code in the `exercises/` directory is **intentionally incomplete and contains errors**. These errors and the resulting test failures are part of the learning process for the student.

- **DO NOT** "fix" the code in `exercises/` to make it complete unless specifically asked to work on a particular exercise.
- **DO** recognize that compilation errors and failing tests for `exercises/` are the **normal, expected state**.
- **DO** use the code in `solutions/` as the ground truth and reference for correct implementation.
- **DO** understand that tests in `tests/` are written to validate the `exercises/` code *after* a student has completed it. They will fail on the initial skeleton code.

## 🛠️ Development Workflow

### Building the Code
The project uses TypeScript. To compile the TypeScript code, run:
```bash
npm run build
```
The compiled output will be in the `dist` directory.

### Linting
The project uses ESLint for code quality. To check for linting errors, run:
```bash
npm run lint
```

### Running Tests
The project uses Jest for testing. Tests are designed to be run against the student's code in the `exercises` directory.

**Run all tests:**
```bash
npm test
```

**Run tests for a specific exercise:**
```bash
# General format
npm test -- tests/<exercise-directory-name>

# Or use the shortcuts from package.json (e.g., for exercise 01)
npm run test:01
```

### Running an Exercise Server
You can run the development server for a specific exercise using:
```bash
# e.g., for exercise 01
npm run dev:01
```

## 🏗️ Architecture In-Depth

### `exercises/` - The Student's Workspace
This is the starting point for each exercise. The code is a "skeleton" designed to guide learning:
- **Placeholders**: Contains values like `FILL_IN_SERVER_NAME` that need to be replaced.
- **TODO Comments**: Extensive comments explain what needs to be implemented.
- **Intentional Errors**: Code may have missing implementations (`throw new Error('TODO: ...')`), incorrect types, or other errors that the student must fix. The TypeScript compiler errors are a key part of the learning path.

### `solutions/` - The Reference Implementation
This directory contains the complete, working, and correct implementation for each exercise. Use this as the "answer key" to understand the expected final state of any given exercise.

### `tests/` - The Validation Framework
The tests are written to check the correctness of the code in `exercises/`.
- Tests will **fail** by default on the skeleton code.
- As a student (or you, if instructed) completes the `TODOs` in an exercise, the corresponding tests will begin to pass.
- Test failures provide the feedback and requirements for the student.

## ✍️ Key Conventions & Patterns

### MCP Server Pattern
Most servers in the exercises will follow this basic pattern. Refer to `mcp-typescript-sdk.md` for more advanced usage.
```typescript
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

const server = new McpServer({ name: "server-name", version: "1.0.0" });

// Example Tool
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

### File Structure
- Adhere to the existing `exercises`, `solutions`, and `tests` structure.
- Test files should be named `*.test.ts`.
- Follow the TypeScript and ESLint rules defined in `tsconfig.json` and `.eslintrc.js`.

## 🆕 Workflow for Creating New Exercises

When creating a new exercise, follow this specific workflow to maintain the educational integrity of the project:

1.  **Implement the Solution First**: Create the complete, working solution in the `solutions/XX-new-exercise/` directory. Ensure it is fully tested and functional.
2.  **Create the Skeleton**: Work backwards from the solution to create the skeleton version in `exercises/XX-new-exercise/`. Remove key implementation details, replace them with `TODO` comments, and introduce intentional errors or placeholders to guide the student.
3.  **Write the Tests**: Create the test suite in `tests/XX-new-exercise/`. The tests should validate the behavior of the *completed solution*.
4.  **Write Documentation**: Create the `README.md` and `hints.md` for the exercise.