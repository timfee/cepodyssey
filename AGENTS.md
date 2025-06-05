# Developer Guide

- Use **pnpm** for all scripts. Common commands:
  - `pnpm dev` – start the app
  - `pnpm test` – run Jest tests
  - `pnpm lint` – run ESLint
  - `pnpm format` – run Prettier
  - `pnpm type-check` – run TypeScript checks
- Always run `pnpm lint && pnpm test` before committing.
- Prefer named exports and include TSDoc comments for all exported
  functions, classes and types. Keep comments short and focused on
  intent; avoid explaining React or Next.js basics.
- When new standards or workflows emerge, update these AGENTS files so
  future runs stay in sync. Only update when guidance meaningfully
  changes.
