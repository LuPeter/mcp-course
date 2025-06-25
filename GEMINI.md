# Gemini Agent Instructions

This document provides instructions for the Gemini AI agent to effectively assist with the development of the MCP course exercises.

## Project Overview

This repository contains a series of exercises for a course on building applications using the MCP TypeScript SDK. The course progresses from a simple "Hello, World!" server to a production-ready application.

The project is structured into three main parts:
- `/exercises`: The starting point for each exercise for the student.
- `/solutions`: The completed solution for each exercise.
- `/tests`: The test suite used to verify the correctness of each exercise.

## Development Workflow

### Running Tests

The project uses Jest for testing. To run tests for a specific exercise, use the following command, replacing `<exercise-directory-name>` with the folder name (e.g., `01-hello-world`):

```bash
npm test -- tests/<exercise-directory-name>
```

To run all tests:
```bash
npm test
```

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

## Key Conventions

- **File Structure:** Adhere to the existing `exercises`, `solutions`, and `tests` structure.
- **Testing:** All new features or bug fixes should be accompanied by corresponding tests in the `tests` directory. Test files should be named `*.test.ts`.
- **Coding Style:** Follow the TypeScript and ESLint rules defined in `tsconfig.json` and `.eslintrc.js`.
