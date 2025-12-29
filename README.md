# Learnix

Online learning platform built with React 19, NestJS 11, and Turborepo.

## Project Status

**Final Release (Week 5)** - Feature Complete

- **Auth**: Login, Signup, Google OAuth, Role-based Access (Guest/Student/Instructor/Admin)
- **Guest**: Browse, Search, Filter, Sort, Course Details (Locked Content)
- **Student**: Dashboard, Enrollment, Lesson Viewer (Text/Video), Progress Tracking, Instant Quizzes
- **Instructor**: Dashboard, Course/Lesson Management, Manual & AI-Generated Quizzes
- **Admin**: User Management, Course Moderation, System Statistics
- **Advanced**: Embedded IDE (Python/JavaScript) for coding lessons

## App URL

- **Github Repo**: <https://github.com/PhuocHoan/Learnix>
- **Vercel**: <https://learnix-teal.vercel.app>

## Structure

```text
apps/web/   # React + Vite frontend
apps/api/   # NestJS backend
e2e/        # Playwright tests
api/        # Vercel serverless adapter
```

## Quick Start

### Prerequisites

- Node.js >= 22
- pnpm >= 10
- Docker (for database)

### Setup

1. **Install Dependencies**

   ```bash
   pnpm install
   ```

2. **Environment Variables**
   Copy `.env.example` to `.env` in `apps/web` and `apps/api`.

   ```bash
   cp apps/web/.env.example apps/web/.env
   cp apps/api/.env.example apps/api/.env
   ```

3. **Start Database**

   ```bash
   make db
   ```

4. **Start Development Servers**

   ```bash
   make dev
   # Web: http://localhost:5173
   # API: http://localhost:3000
   ```

## Quality Gates & Testing

This project enforces strict quality gates. All checks must pass with zero errors and zero warnings.

```bash
# Run all pre-commit checks (Format, Lint, Typecheck, Unit Tests)
make pre

# Run End-to-End Tests (Playwright)
make e2e

# Build all packages
make build
```

### Individual Commands

```bash
pnpm dev            # Development mode
pnpm build          # Build for production
pnpm test           # Unit/Integration tests (Vitest/Jest)
pnpm test:e2e       # E2E tests (Playwright)
pnpm lint           # Lint (ESLint)
pnpm typecheck      # TypeScript check
pnpm format         # Formatter (Prettier)
```

## Deployment

- **Frontend**: Automatically deployed to Vercel on push to `main`.
- **Backend**: Deployed as Serverless Functions on Vercel.
- **Database**: Uses Aiven Cloud PostgreSQL.

## Tech Stack

| Frontend       | Backend                 | DevOps         |
| -------------- | ----------------------- | -------------- |
| React 19       | NestJS 11               | Turborepo 2.6  |
| Vite 7         | TypeORM + PostgreSQL    | GitHub Actions |
| TailwindCSS 4  | Passport.js (JWT/OAuth) | Playwright     |
| TanStack Query | Gemini AI (Quizzes)     | Vercel         |
| CodeMirror 6   | Piston API (IDE)        | Docker         |

## License

UNLICENSED
