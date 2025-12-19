# Tasks: Extract Prompt Template

## 1. Create Default Template

- [ ] 1.1 Create `packages/core/src/subagent-runner/default_prompt_template.md` with extracted prompt
- [ ] 1.2 Define placeholder syntax: `${question}` and `${sourcesList}`

## 2. Implement Template Loading

- [ ] 2.1 Add `getConfigDirectory()` method to ConfigManager interface
- [ ] 2.2 Create `PromptTemplateLoader` class in subagent-runner module
- [ ] 2.3 Implement template file path resolution (`~/.config/lctx/prompt_template.md`)
- [ ] 2.4 Implement template loading with auto-creation from default when missing
- [ ] 2.5 Implement placeholder validation (must contain `${sourcesList}` and `${question}`)
- [ ] 2.6 Throw descriptive error when validation fails

## 3. Integrate with SubagentRunner

- [ ] 3.1 Inject PromptTemplateLoader into SubagentRunner constructor
- [ ] 3.2 Update `writePromptFile()` to use loaded template with placeholder substitution
- [ ] 3.3 Update module.ts to create and inject PromptTemplateLoader

## 4. Update Spec and Tests

- [ ] 4.1 Update subagent-runner spec with new requirements
- [ ] 4.2 Add unit tests for PromptTemplateLoader
- [ ] 4.3 Add integration tests for template auto-creation
- [ ] 4.4 Add tests for validation failure scenarios

## 5. Verification

- [ ] 5.1 Run `./scripts/agent_checks.sh` to verify all checks pass
