# CodeSprint Typing Trainer

CodeSprint is a local-first coding typing trainer that helps developers practice real syntax, track speed and accuracy, and unlock progressive difficulty tiers.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/codesprint-typing/src/App.tsx` — the practice experience, local persistence, seeded drills, progress, library, and workspace views.
- `artifacts/codesprint-typing/src/index.css` — the app theme, editor-inspired surfaces, responsive layout, and motion.
- `artifacts/codesprint-typing/.replit-artifact/artifact.toml` — web artifact routing and workflow metadata.
- `artifacts/api-server` — shared API scaffold retained for future server-backed features; the first CodeSprint build is local-first.

## Architecture decisions

- The first build is intentionally local-first: runs, custom snippets, credits, unlocked tiers, and theme preferences use browser storage.
- Code drills are seeded in the frontend so the practice loop works immediately without an account or network dependency.
- The app uses a responsive single-page shell with section navigation rather than separate server routes.

## Product

- Practice real JavaScript, TypeScript, React, shell, SQL, and Python syntax across Small, Medium, Hard, Advanced, and Legendary tiers.
- Measure WPM, CPM, accuracy, elapsed time, errors, points, and credits for each completed run.
- Add, search, filter, select, and delete personal code snippets locally.
- Review run history and progression insights, and customize between multiple palettes and typing preferences.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
