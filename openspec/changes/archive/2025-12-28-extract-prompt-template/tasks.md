# Tasks: Extract Prompt Template

## 1. Create Default Template

- [x] 1.1 Create `packages/core/src/subagent-runner/default_prompt_template.md` with extracted prompt
- [x] 1.2 Define placeholder syntax: `${question}` and `${sourcesList}`

## 2. Implement Template Loading

- [x] 2.1 Add `getConfigDirectory()` method to ConfigManager interface
- [x] 2.2 Create `PromptTemplateLoader` class in subagent-runner module
- [x] 2.3 Implement template file path resolution (`~/.config/lctx/prompt_template.md`)
- [x] 2.4 Implement template loading with auto-creation from default when missing
- [x] 2.5 Implement placeholder validation (must contain `${sourcesList}` and `${question}`)
- [x] 2.6 Throw descriptive error when validation fails

## 3. Integrate with SubagentRunner

- [x] 3.1 Inject PromptTemplateLoader into SubagentRunner constructor
- [x] 3.2 Update `writePromptFile()` to use loaded template with placeholder substitution
- [x] 3.3 Update module.ts to create and inject PromptTemplateLoader

## 4. Update Spec and Tests

- [x] 4.1 Update subagent-runner spec with new requirements
- [x] 4.2 Add unit tests for PromptTemplateLoader
- [x] 4.3 Add integration tests for template auto-creation
- [x] 4.4 Add tests for validation failure scenarios

## 5. Verification

- [x] 5.1 Run `./scripts/agent_checks.sh` to verify all checks pass
