# config-manager Specification

## Purpose
TBD - created by archiving change add-config-manager. Update Purpose after archive.
## Requirements
### Requirement: Config Loading
The ConfigManager SHALL load configuration from `~/.config/lctx/config.json` and return a validated `LctxConfig` object.

#### Scenario: Load existing config
- **WHEN** a valid config file exists at `~/.config/lctx/config.json`
- **THEN** ConfigManager.load() returns the parsed and validated LctxConfig

#### Scenario: Load with path expansion
- **WHEN** the config contains paths with `~` (e.g., `~/projects`)
- **THEN** the paths are expanded to absolute paths using the user's home directory

### Requirement: Config Saving
The ConfigManager SHALL persist the current configuration to `~/.config/lctx/config.json`.

#### Scenario: Save config to disk
- **WHEN** ConfigManager.save(config) is called with a valid LctxConfig
- **THEN** the config is written to `~/.config/lctx/config.json` as formatted JSON

#### Scenario: Create parent directories
- **WHEN** the config directory `~/.config/lctx/` does not exist
- **THEN** ConfigManager.save() creates the directory before writing the file

### Requirement: Default Config Creation
The ConfigManager SHALL create a default configuration when no config file exists.

#### Scenario: First-time initialization
- **WHEN** ConfigManager.load() is called and no config file exists
- **THEN** a default config is created with:
  - `sourcesDirectory`: `~/.config/lctx/sources`
  - `sources`: empty array
  - `agents`: default agent configurations for claude-code
  - `defaultAgent`: `claude-code`

#### Scenario: Default agent configuration
- **WHEN** default config is created
- **THEN** the claude-code agent has commands `{ chat: "claude", ask: "claude -p {prompt_file}" }`

### Requirement: Config Schema Validation
The ConfigManager SHALL validate loaded configuration against the LctxConfig schema using Zod.

#### Scenario: Valid config passes validation
- **WHEN** a config file matches the LctxConfig schema
- **THEN** ConfigManager.load() returns the validated config without errors

#### Scenario: Invalid config throws error
- **WHEN** a config file has missing required fields or invalid types
- **THEN** ConfigManager.load() throws a descriptive validation error

