## 1. Implementation
- [x] 1.1 Create `packages/core/src/config/config-manager.ts` with ConfigManager class
- [x] 1.2 Create `packages/core/src/config/index.ts` with re-exports
- [x] 1.3 Implement `ConfigManager.load()` - load config from `~/.config/lctx/config.json`
- [x] 1.4 Implement `ConfigManager.save()` - persist config to disk
- [x] 1.5 Implement default config creation when config file is missing
- [x] 1.6 Add Zod schema for runtime validation of config structure
- [x] 1.7 Update `packages/core/src/index.ts` to export ConfigManager

## 2. Validation
- [x] 2.1 Write tests for load/save/default behavior
- [x] 2.2 Run typecheck to verify types compile correctly
- [x] 2.3 Run lint to ensure code quality
- [x] 2.4 Run `openspec validate add-config-manager --strict`
