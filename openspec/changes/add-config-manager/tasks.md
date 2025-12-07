## 1. Implementation
- [ ] 1.1 Create `packages/core/src/config/config-manager.ts` with ConfigManager class
- [ ] 1.2 Create `packages/core/src/config/index.ts` with re-exports
- [ ] 1.3 Implement `ConfigManager.load()` - load config from `~/.config/lctx/config.json`
- [ ] 1.4 Implement `ConfigManager.save()` - persist config to disk
- [ ] 1.5 Implement default config creation when config file is missing
- [ ] 1.6 Add Zod schema for runtime validation of config structure
- [ ] 1.7 Update `packages/core/src/index.ts` to export ConfigManager

## 2. Validation
- [ ] 2.1 Write tests for load/save/default behavior
- [ ] 2.2 Run typecheck to verify types compile correctly
- [ ] 2.3 Run lint to ensure code quality
- [ ] 2.4 Run `openspec validate add-config-manager --strict`
