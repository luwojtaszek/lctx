# Monorepo Structure: TypeScript + Bun + Turborepo

## Core Concepts

- **`apps/`** - Deployable applications (CLI, servers). Each app is built and published independently.
- **`packages/`** - Shared libraries. Not deployed alone, used as dependencies by apps.

## Directory Structure

```
<project>/
├── apps/
│   └── <app>/                    # Deployable application
│       ├── src/
│       │   ├── commands/         # CLI commands (if applicable)
│       │   └── index.ts          # Entry point
│       ├── tests/
│       ├── package.json
│       └── tsconfig.json
│
├── packages/
│   └── <package>/                # Shared library
│       ├── src/
│       │   ├── <module>/         # Feature module
│       │   │   ├── <module>.ts   # Main implementation
│       │   │   └── index.ts      # Barrel export
│       │   ├── shared/           # Cross-cutting concerns
│       │   │   ├── types/
│       │   │   ├── schemas/
│       │   │   └── utils/
│       │   └── index.ts          # Package barrel export
│       ├── tests/
│       │   ├── unit/             # Unit tests, mirror src/ structure
│       │   ├── shared/           # Test utilities and helpers
│       │   └── fixtures/         # Test data and mocks
│       ├── package.json
│       └── tsconfig.json
│
├── turbo.json
├── package.json                  # Root: workspaces + bin
└── tsconfig.json
```

## Apps

Deployable applications. Each app is standalone and can be built/deployed independently.

**What goes here:**
- CLI entry points and command handlers
- Server applications
- User-facing interfaces

**Internal structure:**
```
apps/<app>/
├── src/
│   ├── commands/        # One file per CLI command
│   └── index.ts         # Entry point, command routing
└── tests/
```

## Packages

Shared libraries used by apps. Not deployed independently.

**What goes here:**
- Business logic and domain models
- Shared types and validation schemas
- Protocol implementations (e.g., MCP servers)
- Utilities and helpers

**Internal structure:**
```
packages/<package>/
├── src/
│   ├── <module>/              # Feature module
│   │   ├── <module>.ts        # Main implementation
│   │   └── index.ts           # Barrel export
│   ├── shared/                # Cross-cutting concerns
│   │   ├── types/             # Shared TypeScript types
│   │   ├── schemas/           # Validation schemas (Zod)
│   │   └── utils/             # Shared utilities
│   └── index.ts               # Package barrel export
├── tests/
│   ├── unit/                  # Unit tests
│   ├── shared/                # Test utilities
│   └── fixtures/              # Test data
├── package.json
└── tsconfig.json
```

## Dependency Flow

```
apps/<app>
  └── @<project>/<package-b>
  └── @<project>/<package-a>

packages/<package-b>
  └── @<project>/<package-a>

packages/<package-a>
  └── (external deps only)
```

**Rule:** Dependencies flow downward. Lower-level packages have no internal deps, higher-level packages depend on lower ones, apps depend on packages.

## Root Configuration

**package.json:**
```json
{
  "name": "<project>",
  "bin": {
    "<cli-name>": "apps/<app>/src/index.ts"
  },
  "workspaces": [
    "apps/*",
    "packages/*"
  ]
}
```

**turbo.json:**
```json
{
  "tasks": {
    "typecheck": {
      "dependsOn": ["^typecheck"]
    },
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["^build"]
    }
  }
}
```
