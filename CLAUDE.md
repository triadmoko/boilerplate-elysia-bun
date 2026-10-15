# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
bun run dev              # Hot-reload server (src/main.ts)
bun test                 # All tests (usecase unit tests + HTTP integration test, no DB needed)
bun test <path>          # Single test file
bun run typecheck        # tsc --noEmit (TypeScript 7)

docker compose up -d mysql   # Local MySQL 8.4
bun run db:generate      # Generate SQL migration in ./migrations after changing a Drizzle schema
bun run db:migrate       # Apply migrations (uses drizzle-orm migrator, no drizzle-kit needed)
bun run db:studio        # Drizzle Studio
```

Env is loaded automatically by Bun from `.env` (see `.env.example`). `JWT_SECRET` must be ≥ 32 chars or startup fails.

## Architecture Overview

**Clean Architecture** with **feature-based modules**, mirroring the team's Go projects (e.g. `../api-billing-underground`). Each feature owns its handlers, DTOs and use cases; domain entities, repository interfaces and their implementations are shared.

### Dependency Flow

```
src/main.ts
  └─> app/container.ts (buildContainer: repositories, services, middlewares)
  └─> app/app.ts (createApp: global middleware, OpenAPI, /health, features under /api/v1)
       └─> features/<name>/module.ts        (DI wiring → Feature)
            └─> delivery/http/handler        (Elysia routes, depends on usecase interface)
                 └─> usecase                 (business logic, depends ONLY on shared/domain)
                      └─> shared/domain      (entities, repository interfaces, service ports, errors)
                           ↑ implemented by shared/infrastructure (Drizzle) and pkg/ (jwt, bcrypt)
```

**Key rule**: `usecase` and `shared/domain` must never import Elysia, Drizzle, `jose` or anything from `infrastructure`/`delivery`. Use cases receive interfaces (`UserRepository`, `PasswordHasher`, `TokenService`) via constructor.

### Feature Module Pattern

Each feature exports `createXModule(container: Container): Feature` (`src/types/feature.ts`: `{ name, routes }`).

```
src/features/myfeature/
├── module.ts                         # instantiate usecase + handler from Container
├── delivery/http/handler/*.handler.ts   # new Elysia({ prefix, detail: { tags } })
├── delivery/http/dto/*.dto.ts            # `t.*` schemas (validation + OpenAPI)
└── usecase/{*.usecase.ts, *.usecase.test.ts}   # interface + Impl class
```

**To add a new feature:**
1. Add entity in `shared/domain/entity/`, repository interface in `shared/domain/repository/`
2. Add Drizzle table in `shared/infrastructure/database/schema/` (relative imports only — drizzle-kit loads these files) and export it from `schema/index.ts`; run `bun run db:generate`
3. Implement the repository in `shared/infrastructure/repository/` and add it to `Container` + `buildContainer` in `src/app/container.ts`
4. Write usecase interface + impl, then handler + DTOs, then `module.ts`
5. Register the module in the `features` array in `src/app/app.ts`
6. Add an in-memory fake to `shared/testing/fakes.ts` and include it in `createTestContainer`

See `src/features/user/` for the reference CRUD implementation.

### Shared Components

- `shared/domain/errors/app-error.ts` — throw `NotFoundError`, `ConflictError`, `UnauthorizedError`, `ForbiddenError`, `BadRequestError` from use cases; `middleware/error.handler.ts` maps them to HTTP status + `{ success: false, message, code }`. Validation errors → 422 `VALIDATION_ERROR`.
- `shared/delivery/http/response` — always return `ok(data, message?)` or `paginated(items, meta)` from handlers.
- `shared/delivery/http/middleware/auth.middleware.ts` — Elysia macros: `auth: true` (valid Bearer JWT, injects `user: TokenPayload`) and `roles: ['admin']` (auth + role check). Both add `bearerAuth` security to OpenAPI. Handlers must `.use(auth)` (the instance from `container.middlewares.auth`) to get the macros.
- `pkg/pagination.ts` — `resolvePagination` (clamps page/limit, max 100) and `buildPaginationMeta`.
- `pkg/logger` — JSON line logger; level from `LOG_LEVEL`.

### Testing

- Use cases are tested with fakes from `src/shared/testing/fakes.ts` (`InMemoryUserRepository`, `FakePasswordHasher`, `FakeTokenService`).
- `src/app/app.test.ts` exercises the full HTTP stack via `app.handle(new Request(...))` using `createTestContainer()` — no MySQL required.
- Always `await expect(promise).rejects...`.

### Conventions

- Path alias `@/*` → `src/*` (except inside `database/schema/`).
- Emails are normalized (trim + lowercase) in use cases; entities exposed to clients go through `toPublicUser` (strips `password`).
- Responses are versioned under `/api/v1`; OpenAPI UI at `/openapi`, JSON at `/openapi/json`.
- Docker image runs `db:migrate` before `start`.
