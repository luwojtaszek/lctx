# Init Workflow & Config Migration System

## Overview

Implement two features:
1. **Init workflow**: First-run experience when user runs `lctx` without existing config
2. **Config migration system**: Smart handling of config updates while preserving user customizations

### Design Decisions
- **Agent presets**: claude-code only (keep simple, add more later if needed)
- **Migration mode**: Automatic on load with backup and user notification
- **Update strategy**: Only update fields if they match old default value (preserve customizations)

---

## Part 1: Init Workflow

### User Experience

When user runs `lctx` for the first time (no config exists):

```
Welcome to lctx!

Let's set up your configuration.

? Select your default AI agent:
  > claude-code (Claude Code CLI)
    custom (Configure manually)

Configuration created at:
  Config:   ~/.config/lctx/config.json
  Sources:  ~/.config/lctx/sources/

Next steps:
  - Add a source: lctx (interactive) or lctx add <url>
  - Run lctx to manage sources and ask questions
```

### Implementation

**New files:**
- `apps/cli/src/components/InitScreen.tsx` - React/Ink init wizard component

**Modified files:**
- `apps/cli/src/index.ts` - Check for first-run before launching App
- `apps/cli/src/components/App.tsx` - Add init screen to navigation
- `packages/core/src/config-manager/default-config.json` - Add configVersion field

### Agent Preset

Single preset for now (claude-code), embedded in InitScreen component. Can extract to separate files later if more agents added.

---

## Part 2: Config Migration System

### Recommended Approach: Hybrid (Version + Schema Defaults)

**Why this approach:**
- Version field enables explicit migrations for breaking changes
- Schema defaults handle additive changes automatically
- Backups before migration enable rollback
- Clear audit trail of what changed

### Config Version Strategy

```json
{
  "configVersion": 1,
  "sourcesDirectory": "~/.config/lctx/sources",
  ...
}
```

**Version bump rules:**
- Patch: No version bump (additive fields with defaults)
- Minor: Version bump + migration (field rename, default value change)
- Major: Version bump + migration + deprecation warning

### Migration Flow

```
Load config
    │
    ▼
Check configVersion
    │
    ├─ Missing/Old version ──► Backup ──► Run migrations ──► Save ──► Notify user
    │
    ▼
Apply schema defaults (fills new fields)
    │
    ▼
Return resolved config
```

**User notification** (stderr so it doesn't interfere with stdout):
```
[lctx] Config migrated from v0 to v1. Backup saved at ~/.config/lctx/config.backup.v0.json
```

### Migration Registry

```typescript
// packages/core/src/config-manager/migrations/
interface Migration {
  fromVersion: number;
  toVersion: number;
  description: string;
  migrate: (config: unknown) => unknown;
}

// Example migration for chat command update
{
  fromVersion: 0,
  toVersion: 1,
  description: "Add MCP config support to chat command",
  migrate: (config) => {
    // Only update if user has old default value
    if (config.agents?.["claude-code"]?.commands?.chat === "claude") {
      config.agents["claude-code"].commands.chat =
        "claude --strict-mcp-config --mcp-config {mcp_config_file}";
    }
    config.configVersion = 1;
    return config;
  }
}
```

### Backup Strategy

Before any migration:
```
~/.config/lctx/
├── config.json                    # Current
├── config.backup.v0.1703xyz.json  # Before v0→v1 migration
```

### Migration File Naming

Migration files use simple sequential naming: `v0-to-v1.ts`, `v1-to-v2.ts`, etc.

A helper script ensures correct versioning:
```bash
# Usage: ./scripts/create-migration.sh "Add MCP config support"
# Creates: packages/core/src/config-manager/migrations/v1-to-v2.ts
```

The script:
1. Scans existing migrations to find the highest version
2. Creates new file with proper boilerplate
3. Updates `CURRENT_CONFIG_VERSION` in `index.ts`

### Implementation Files

**New files:**
- `packages/core/src/config-manager/migrations/index.ts` - Migration registry & runner
- `packages/core/src/config-manager/migrations/v0-to-v1.ts` - First migration
- `scripts/create-migration.sh` - Helper script to create new migrations

**Modified files:**
- `packages/core/src/config-manager/config-manager.ts` - Add migration logic to load()
- `packages/core/src/shared/schemas/config.schema.ts` - Add configVersion field
- `packages/core/src/shared/types/config.ts` - Add configVersion to type
- `packages/core/src/config-manager/default-config.json` - Set configVersion: 1

---

## Implementation Steps

### Step 1: Add Config Versioning (Core)
1. Add `configVersion: number` to `config.schema.ts` with `.default(1)`
2. Add `configVersion` to `LctxConfig` type in `config.ts`
3. Update `default-config.json` with `"configVersion": 1`

### Step 2: Create Migration Infrastructure (Core)
1. Create `packages/core/src/config-manager/migrations/index.ts`:
   - Define `Migration` interface
   - Export `runMigrations(config, currentVersion)` function
   - Export `CURRENT_CONFIG_VERSION` constant
2. Create `packages/core/src/config-manager/migrations/v0-to-v1.ts`:
   - Migration that updates `chat` command only if value equals `"claude"`
3. Create `scripts/create-migration.sh`:
   - Parse existing migration files to find highest version
   - Generate new migration file with boilerplate
   - Update `CURRENT_CONFIG_VERSION` in index.ts

### Step 3: Integrate Migrations into ConfigManager
1. Modify `FileConfigManager.load()`:
   - After parsing JSON, check `configVersion` (default to 0 if missing)
   - If version < CURRENT_CONFIG_VERSION:
     - Call `backup()` method
     - Run migrations
     - Save migrated config
     - Log migration notice to stderr
   - Apply schema defaults via Zod parse
2. Add `backup(configPath, version)` private method

### Step 4: Add First-Run Detection (CLI)
1. Add `configExists()` method to ConfigManager interface
2. Modify `apps/cli/src/index.ts`:
   - Check if config exists before launching App
   - If not, render InitScreen instead of App

### Step 5: Create InitScreen Component
1. Create `apps/cli/src/components/InitScreen.tsx`:
   - Welcome message with logo
   - Agent selection (claude-code / custom)
   - Display created paths
   - Show next steps
   - On complete: create config and transition to main App

### Step 6: Write Tests
1. Unit tests for migration runner
2. Test v0→v1 migration with various configs
3. Test first-run detection logic

---

## Critical Files

### Core Package
- `packages/core/src/config-manager/config-manager.ts`
- `packages/core/src/config-manager/default-config.json`
- `packages/core/src/shared/schemas/config.schema.ts`
- `packages/core/src/shared/types/config.ts`

### CLI App
- `apps/cli/src/index.ts`
- `apps/cli/src/components/App.tsx`

### New Files
- `packages/core/src/config-manager/migrations/index.ts`
- `packages/core/src/config-manager/migrations/v0-to-v1.ts`
- `scripts/create-migration.sh`
- `apps/cli/src/components/InitScreen.tsx`

---

## Testing Strategy

1. **Unit tests for migration runner**: Test each migration with various config states
2. **Integration test for init flow**: Test first-run detection and config creation
3. **Edge cases**: Missing fields, malformed config, version 0 (no version field)
