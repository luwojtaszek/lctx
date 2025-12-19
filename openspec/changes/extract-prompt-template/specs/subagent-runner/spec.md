# Spec Delta: subagent-runner

## ADDED Requirements

### Requirement: Prompt Template Loading

The SubagentRunner SHALL load prompt templates from a user-configurable file with auto-creation and validation.

#### Scenario: Load existing template

- **GIVEN** `~/.config/lctx/prompt_template.md` exists with valid content
- **WHEN** SubagentRunner prepares for ask()
- **THEN** uses the user's template content for prompt generation

#### Scenario: Auto-create template when missing

- **GIVEN** `~/.config/lctx/prompt_template.md` does not exist
- **WHEN** SubagentRunner prepares for ask()
- **THEN** creates `prompt_template.md` from `default_prompt_template.md` bundled in the package
- **AND** uses the newly created template for prompt generation

#### Scenario: Template path resolution

- **GIVEN** config is stored at `~/.config/lctx/config.json`
- **WHEN** SubagentRunner resolves the template path
- **THEN** uses `~/.config/lctx/prompt_template.md` (same directory as config)

### Requirement: Prompt Template Validation

The SubagentRunner SHALL validate that prompt templates contain required placeholders.

#### Scenario: Valid template with all placeholders

- **GIVEN** template contains `${question}` and `${sourcesList}` placeholders
- **WHEN** template is loaded
- **THEN** validation passes and template is used

#### Scenario: Missing question placeholder

- **GIVEN** template does not contain `${question}` placeholder
- **WHEN** template is loaded
- **THEN** throws error: "Invalid prompt template: missing required placeholder \${question}"

#### Scenario: Missing sourcesList placeholder

- **GIVEN** template does not contain `${sourcesList}` placeholder
- **WHEN** template is loaded
- **THEN** throws error: "Invalid prompt template: missing required placeholder \${sourcesList}"

#### Scenario: Missing both placeholders

- **GIVEN** template contains neither `${question}` nor `${sourcesList}`
- **WHEN** template is loaded
- **THEN** throws error listing both missing placeholders

### Requirement: Default Prompt Template

The package SHALL include a default prompt template file at `packages/core/src/subagent-runner/default_prompt_template.md`.

#### Scenario: Default template content

- **GIVEN** the default template file
- **THEN** it contains:
  - A `# Question` section with `${question}` placeholder
  - An `# Available Sources` section with `${sourcesList}` placeholder
  - Instructions for using Glob, Grep, and Read tools

#### Scenario: Default template is valid

- **GIVEN** the default template file
- **WHEN** validated
- **THEN** passes validation (contains both required placeholders)

## MODIFIED Requirements

### Requirement: Prompt File Generation

The SubagentRunner SHALL write a prompt.md file by substituting placeholders in the loaded template.

#### Scenario: Generate prompt file for ask

- **GIVEN** question is "How do I create a tool?" and sources are ['langchain', 'langgraph']
- **AND** template contains `${question}` and `${sourcesList}` placeholders
- **WHEN** ask() prepares the temp directory
- **THEN** writes `/tmp/lctx-{uuid}/prompt.md` with:
  - `${question}` replaced with "How do I create a tool?"
  - `${sourcesList}` replaced with formatted source list (e.g., "- ./langchain/\n- ./langgraph/")

#### Scenario: Preserve template structure

- **GIVEN** user has customized the template with additional sections
- **WHEN** prompt file is generated
- **THEN** all custom content is preserved, only placeholders are substituted
