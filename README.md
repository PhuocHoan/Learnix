# Learnix

Online learning platform built with React, NestJS, and Turborepo.

## Structure

```
apps/web/   # React + Vite frontend
apps/api/   # NestJS backend
e2e/        # Playwright tests
api/        # Vercel serverless adapter
```

## Quick Start

```bash
pnpm install        # Install dependencies
make db             # Start PostgreSQL
pnpm dev            # Start dev servers (web:5173, api:3000)
```

## Scripts

```bash
pnpm dev            # Development
pnpm build          # Build all
pnpm test           # Unit tests
pnpm test:e2e       # E2E tests
pnpm lint           # Lint
pnpm typecheck      # Type check
pnpm precommit      # Full checks
```

## Tech Stack

| Frontend | Backend | DevOps |
|----------|---------|--------|
| React 19 | NestJS 11 | Turborepo 2.6 |
| Vite 7 | TypeORM + PostgreSQL | GitHub Actions |
| TailwindCSS 4 | Passport.js (JWT/OAuth) | Playwright |
| TanStack Query | Cloudinary | Vercel |

## Environment

Copy `.env.example` to `.env` in each app:

- `apps/web/.env` - Frontend config
- `apps/api/.env` - Backend config (DB, JWT, OAuth, etc.)

## License

UNLICENSED
