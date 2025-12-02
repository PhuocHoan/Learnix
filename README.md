# Learnix

Modern learning management platform with AI-powered quiz generation.

## Tech Stack

| Layer    | Technologies                                       |
| -------- | -------------------------------------------------- |
| Frontend | React 19, Vite 7, Tailwind CSS v4, TanStack Query  |
| Backend  | NestJS 11, TypeORM, PostgreSQL                     |
| Testing  | Vitest, Jest, Playwright                           |
| Build    | SWC (backend), esbuild (frontend), pnpm workspaces |

## Quick Start

```bash
# 1. Clone and install
pnpm install

# 2. Start database
make db

# 3. Configure environment
cp backend/.env.example backend/.env
# Edit backend/.env with your credentials

# 4. Start development
cd backend && pnpm dev        # Terminal 1: API on :3000
cd frontend && pnpm dev        # Terminal 2: App on :5173
```

## Make Commands

```bash
make up      # Start all services (Docker)
make db      # Start PostgreSQL only
make down    # Stop all services
make logs    # View logs
make clean   # Remove containers and volumes
make pre     # Run pre-commit checks
make e2e     # Run E2E tests
```

## Development Commands

```bash
# Root (monorepo)
pnpm format       # Format all files
pnpm lint         # Lint frontend + backend
pnpm typecheck    # TypeScript checks
pnpm test         # Unit tests (Vitest + Jest)
pnpm test:e2e     # E2E tests (Playwright)
pnpm build        # Build both packages
pnpm precommit    # Run all checks

# Frontend
cd frontend
pnpm dev          # Start dev server
pnpm test         # Run Vitest
pnpm build        # Production build

# Backend
cd backend
pnpm start:dev    # Start with hot reload
pnpm test         # Run Jest
pnpm build        # Production build (SWC)
```

## Test Accounts

| Role       | Email                       | Password |
| ---------- | --------------------------- | -------- |
| Student    | <user@user.com>             | 123456   |
| Instructor | <instructor@instructor.com> | 123456   |
| Admin      | <admin@admin.com>           | 123456   |

## Deployment

- **Frontend**: Vercel (static)
- **Backend**: Vercel Serverless
- **Database**: Aiven PostgreSQL (production) with `DB_SSL=true`

## CI/CD

| Workflow | Trigger           | Checks                               |
| -------- | ----------------- | ------------------------------------ |
| CI       | Push/PR to `main` | Format, lint, typecheck, test, build |
| Security | PR + Weekly       | Dependency audit, CodeQL             |

## License

UNLICENSED
