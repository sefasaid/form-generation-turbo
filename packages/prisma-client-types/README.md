# Prisma Client Types Generator

Custom Prisma generator that generates TypeScript types for client-side usage.

## Usage

Add to your `schema.prisma`:

```prisma
generator clientTypes {
  provider = "../packages/prisma-client-types/generator.js"
  output   = "../../apps/frontend/src/app/_types/generated"
}
```

Then run:

```bash
npx prisma generate
```

## Output

The generator creates:
- Individual TypeScript interface files for each model (e.g., `Form.ts`)
- An `enums.ts` file with all enum definitions
- An `index.ts` file that exports everything

## Features

- ✅ Generates TypeScript interfaces from Prisma models
- ✅ Handles all Prisma scalar types
- ✅ Generates enum types
- ✅ Handles relations (optional)
- ✅ Properly maps DateTime to `Date | string` for JSON compatibility
- ✅ Maps Json fields to `any` type
