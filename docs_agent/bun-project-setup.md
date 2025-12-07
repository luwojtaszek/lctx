# Bun Project Setup

One-time setup guide for TypeScript + Bun projects with type safety, linting, and pre-commit hooks.

## Quick Setup

```bash
bun add zod @t3-oss/env-core
bun add -d @biomejs/biome lefthook
bunx biome init && bunx lefthook install
```

## tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ESNext",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "types": ["bun-types"],
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "exactOptionalPropertyTypes": true,
    "skipLibCheck": true,
    "noEmit": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

## biome.json

```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "organizeImports": { "enabled": true },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noExcessiveCognitiveComplexity": { "level": "warn", "options": { "maxAllowedComplexity": 15 } }
      },
      "correctness": {
        "noUnusedImports": "error",
        "noUnusedVariables": "error"
      },
      "style": {
        "useConst": "error",
        "useImportType": "error"
      },
      "suspicious": {
        "noExplicitAny": "error"
      }
    }
  },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "trailingCommas": "es5",
      "semicolons": "always"
    }
  }
}
```

## lefthook.yml

```yaml
pre-commit:
  parallel: true
  commands:
    biome-check:
      glob: "*.{js,ts,jsx,tsx,json}"
      run: bunx biome check --staged --write --no-errors-on-unmatched
      stage_fixed: true
    typecheck:
      glob: "*.{ts,tsx}"
      run: bun run typecheck
```

## package.json scripts

```json
{
  "scripts": {
    "dev": "bun run --watch src/index.ts",
    "typecheck": "tsc --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "test": "bun test",
    "prepare": "lefthook install"
  }
}
```

## Schema Validation (Zod)

```typescript
// src/schemas/user.ts
import { z } from 'zod';

export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100),
  role: z.enum(['admin', 'user']).default('user'),
});

export type User = z.infer<typeof UserSchema>;

// Usage: UserSchema.parse(data) validates and returns typed data
```

## Environment Variables

```typescript
// src/env.ts
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().default(3000),
    DATABASE_URL: z.string().url(),
    API_KEY: z.string().min(1),
  },
  runtimeEnv: process.env,
  onValidationError: (error) => {
    console.error('Invalid environment variables:', error.flatten().fieldErrors);
    process.exit(1);
  },
});

// Usage: env.PORT is typed as number
```
