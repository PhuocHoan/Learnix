# Learnix - Online Learning Platform

A modern online learning platform built with React, NestJS, and TypeScript in a Turborepo monorepo architecture.

## 🏗️ Project Structure

```
Learnix/
├── apps/
│   ├── web/                 # React + Vite frontend
│   └── api/                 # NestJS backend
├── packages/
│   ├── ui/                  # Shared UI components (shadcn/ui)
│   ├── shared/              # Shared utilities and types
│   ├── eslint-config/       # Shared ESLint configurations
│   └── typescript-config/   # Shared TypeScript configurations
├── e2e/                     # Playwright E2E tests
├── api/                     # Vercel serverless adapter
└── Context/                 # Project documentation
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- pnpm 10.24.0+
- Docker (for local database)

### Installation

```bash
# Install dependencies
pnpm install

# Start PostgreSQL database
make db

# Start development servers
pnpm dev
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:3000`.

## 📦 Available Scripts

| Command          | Description                    |
| ---------------- | ------------------------------ |
| `pnpm dev`       | Start all development servers  |
| `pnpm build`     | Build all packages and apps    |
| `pnpm lint`      | Run ESLint across all packages |
| `pnpm typecheck` | Run TypeScript type checking   |
| `pnpm test`      | Run all unit tests             |
| `pnpm test:e2e`  | Run Playwright E2E tests       |
| `pnpm format`    | Format code with Prettier      |
| `pnpm precommit` | Run full pre-commit checks     |

### Makefile Commands

| Command      | Description               |
| ------------ | ------------------------- |
| `make up`    | Start all Docker services |
| `make down`  | Stop all Docker services  |
| `make db`    | Start PostgreSQL only     |
| `make logs`  | View Docker logs          |
| `make clean` | Stop and remove volumes   |
| `make pre`   | Run pre-commit checks     |
| `make e2e`   | Run E2E tests             |

## 🛠️ Tech Stack

### Frontend (`apps/web`)

- **React 19** with React Compiler
- **Vite 7** for fast development
- **TailwindCSS 4** for styling
- **React Router v7** for routing
- **TanStack Query v5** for data fetching
- **Zod v4** for validation
- **React Hook Form v7** for forms
- **shadcn/ui** for UI components
- **Vitest** for unit testing

### Backend (`apps/api`)

- **NestJS 11** framework
- **TypeORM** with PostgreSQL
- **Passport.js** for authentication (JWT, Google, GitHub OAuth)
- **class-validator** for DTO validation
- **Cloudinary** for image uploads
- **Google GenAI** for AI features
- **Jest** for unit testing

### DevOps

- **Turborepo 2.6.1** for monorepo management
- **GitHub Actions** for CI/CD
- **Playwright** for E2E testing
- **Husky** + **lint-staged** for pre-commit hooks
- **Docker Compose** for local development
- **Vercel** for deployment

## 📁 Package Details

### `@repo/ui`

Shared UI components built with Radix UI and styled with Tailwind CSS.

```tsx
import { Button, Card, Dialog } from '@repo/ui';
```

### `@repo/shared`

Shared utilities and types used across frontend and backend.

```tsx
import { formatDate, formatRelativeTime } from '@repo/shared';
```

### `@repo/eslint-config`

Shared ESLint configurations:

- `@repo/eslint-config/base` - Base TypeScript config
- `@repo/eslint-config/react` - React + Vite config
- `@repo/eslint-config/nest` - NestJS config

### `@repo/typescript-config`

Shared TypeScript configurations:

- `@repo/typescript-config/base.json` - Base config
- `@repo/typescript-config/react.json` - React config
- `@repo/typescript-config/nest.json` - NestJS config

## 🔧 Environment Variables

### Frontend (`apps/web/.env`)

```env
VITE_API_URL=http://localhost:3000
```

### Backend (`apps/api/.env`)

```env
# Database
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/learnix

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRATION=7d

# OAuth
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email
MAIL_HOST=smtp.example.com
MAIL_USER=your-email
MAIL_PASS=your-password

# Google GenAI
GEMINI_API_KEY=your-gemini-api-key
```

## 🧪 Testing

### Unit Tests

```bash
# Run all unit tests
pnpm test

# Run tests in watch mode
pnpm --filter @repo/web test:watch
pnpm --filter @repo/api test:watch

# Run tests with coverage
pnpm --filter @repo/api test:cov
```

### E2E Tests

```bash
# Run E2E tests
pnpm test:e2e

# Run with UI
pnpm test:e2e:ui

# Run headed (see browser)
pnpm test:e2e:headed
```

## 📤 Deployment

The project is configured for Vercel deployment:

1. Connect your GitHub repository to Vercel
2. Set up environment variables in Vercel dashboard
3. Deploy automatically on push to main

The `vercel.json` configures:

- Frontend static files from `apps/web/dist`
- API serverless functions from `api/`

## 🤝 Contributing

1. Create a feature branch from `main`
2. Make your changes
3. Run `pnpm precommit` to ensure all checks pass
4. Submit a pull request

### Pre-commit Checks

The project uses Husky and lint-staged to run:

- Prettier formatting
- ESLint for frontend and backend
- TypeScript type checking
- Unit tests
- Build verification

## 📄 License

This project is licensed under the UNLICENSED license.
