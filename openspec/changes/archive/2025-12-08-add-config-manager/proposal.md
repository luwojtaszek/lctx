# Change: Add Config Manager

## Why
The core engine needs a configuration management system to persist and load sources and agent configurations from disk, enabling users to maintain their lctx setup across sessions.

## What Changes
- Add `ConfigManager` class with `load()`, `save()`, and default config creation
- Config stored at `~/.config/lctx/config.json`
- Handle path expansion for `~` in directory paths
- Use Zod for runtime schema validation

## Impact
- Affected specs: config-manager (new capability)
- Affected code: `packages/core/src/config/`
