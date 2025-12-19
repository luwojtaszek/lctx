# Change: Extract Prompt Template

## Why

The prompt used by SubagentRunner is currently hardcoded in `writePromptFile()`. Users cannot customize the instructions given to subagents without modifying source code. This limits flexibility for different use cases and agent preferences.

## What Changes

- Extract hardcoded prompt from `subagent-runner.ts` to a `default_prompt_template.md` file in the repository
- Load prompt from user-configurable `prompt_template.md` file stored next to `config.json` (at `~/.config/lctx/prompt_template.md`)
- Auto-create `prompt_template.md` from default template when missing
- Validate template contains required `${sourcesList}` and `${question}` placeholders
- Fail with clear error if template validation fails

## Impact

- **Affected specs**: `subagent-runner`
- **Affected code**:
  - `packages/core/src/subagent-runner/subagent-runner.ts` - Template loading and validation
  - `packages/core/src/subagent-runner/default_prompt_template.md` - New default template file
  - `packages/core/src/config-manager/config-manager.ts` - Expose config directory path
