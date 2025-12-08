# Tasks: Add Subagent Runner

## 1. Module Structure
- [x] 1.1 Create `packages/core/src/subagent-runner/` directory
- [x] 1.2 Create `subagent-runner.ts` with SubagentRunner interface and implementation
- [x] 1.3 Create `index.ts` with exports

## 2. Temp Directory Setup
- [x] 2.1 Implement `createTempDirectory()` - creates `/tmp/lctx-{uuid}/`
- [x] 2.2 Implement `writeEmptyMcpConfigs()` - writes all empty config files
- [x] 2.3 Implement `createSourceSymlinks()` - symlinks requested sources
- [x] 2.4 Implement `writePromptFile()` - generates prompt.md

## 3. Execution Methods
- [x] 3.1 Implement `ask()` method with command interpolation and output capture
- [x] 3.2 Implement `chat()` method with stdio inheritance for interactive mode
- [x] 3.3 Add cleanup logic in finally blocks

## 4. Integration
- [x] 4.1 Export SubagentRunner from `packages/core/src/index.ts`

## 5. Testing
- [x] 5.1 Write unit tests for temp directory creation
- [x] 5.2 Write unit tests for MCP config writing
- [x] 5.3 Write unit tests for symlink creation
- [x] 5.4 Write unit tests for prompt file generation
- [x] 5.5 Write integration test for ask() flow (mock agent)
