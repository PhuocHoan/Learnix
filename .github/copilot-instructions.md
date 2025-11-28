# Learnix Project Instructions

You are an expert Full Stack Developer working on **Learnix**, a modern web application.

## Project Structure & Tech Stack

- **Monorepo**:
  - `frontend/`: **React 19**, Vite 7, Tailwind CSS v4, TanStack Query v5.
  - `backend/`: **NestJS 11**, TypeORM, PostgreSQL.
- **Language**: **TypeScript 5.9+** (Strict Mode), **ES2025**.

## Deployment Environments

- **Local Development**: Docker Compose with PostgreSQL container.
- **Production**:
  - **Frontend**: Vercel (Static hosting with Edge Functions).
  - **Backend**: Vercel Serverless Functions or separate deployment.
  - **Database**: Aiven Cloud PostgreSQL (managed, SSL required).

## Critical Workflows

1.  **Test-Driven Development (TDD)**:
    - **Mandatory**: Write failing tests _before_ implementation.
    - **Frontend**: Use `vitest` and `@testing-library/react`.
    - **Backend**: Use `jest` for unit/integration tests.
    - **E2E**: Use `playwright` for critical user flows.
2.  **Planning**:
    - Before complex tasks, use the **Architect Agent** or `plan-feature.prompt.md` to design the solution.
    - Break down features into: Database -> Backend API -> Frontend UI.
3.  **Post-Implementation Verification (MANDATORY)**:
    - After **every** implementation, run the verification steps below.
    - **Never** consider an implementation complete until all steps pass.

## Post-Implementation Verification

After completing any code changes, you **MUST** run this command from the monorepo root:

```bash
pnpm precommit
```

This runs: `format` → `lint` → `typecheck` → `test` → `build`

**Never consider an implementation complete until `pnpm precommit` passes.**

## Detailed Standards (Must Read)

Refer to these files for specific coding rules:

- **Frontend**: `.github/instructions/frontend.instructions.md` (React 19 features, A11y, Tailwind v4).
- **Backend**: `.github/instructions/backend.instructions.md` (NestJS modules, DTOs, TypeORM).
- **Common**: `.github/instructions/common.instructions.md` (Security, Performance, Git).1
- **E2E**: `.github/instructions/e2e.instructions.md` (Playwright patterns).

## Project-Specific Conventions

- **Frontend**:
  - **Imports**: Use `@/` alias for `src/` (e.g., `import { Button } from "@/components/ui/button"`).
  - **Styling**: Use `cn()` utility for conditional classes. Tailwind v4 is configured via Vite plugin.
  - **React**: React Compiler is enabled in `vite.config.ts`. Do not manually memoize.
- **Backend**:
  - **Architecture**: Strict Modular Architecture. Use DTOs with `class-validator`.
  - **Database**: Use TypeORM migrations. No `synchronize: true` in production.
  - **Production DB**: Aiven PostgreSQL requires SSL (`ssl: { rejectUnauthorized: false }`).

## Environment-Specific Commands

### Local Development (Docker)

```bash
# Start all services with Docker Compose
make dev              # Development mode with hot reload
make up               # Production-like containers
docker compose logs   # View logs
```

### Database

```bash
# Local: Docker PostgreSQL
make db               # Start only database

# Production: Aiven PostgreSQL
# Connection string from Aiven Console (requires SSL)
```

## Useful Commands

- **Frontend**: `pnpm dev`, `pnpm test` (Vitest), `pnpm build`.
- **Backend**: `pnpm start:dev`, `pnpm test` (Jest), `pnpm test:e2e`.
