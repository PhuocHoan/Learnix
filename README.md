# Learnix

Modern web application for learning management.

## Tech Stack

- **Frontend**: React 19 + Vite 7 + Tailwind CSS v4
- **Backend**: NestJS 11 + TypeORM + PostgreSQL
- **Language**: TypeScript 5.9+

## Quick Start with Docker

### Prerequisites

- Docker & Docker Compose
- Make (optional, for convenience)

### Setup

1. **Configure environment variables:**

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your database credentials and API keys

# Frontend
cp frontend/.env.example frontend/.env
# Edit frontend/.env if needed (default: http://localhost:3000)
```

2. **Start all services:**

```bash
make up
# or
docker compose up
```

This starts:
- **PostgreSQL** on `localhost:5432` (uses credentials from `backend/.env`)
- **Backend API** on `localhost:3000` (hot reload enabled)
- **Frontend** on `localhost:5173` (hot reload enabled)

3. **Or start only PostgreSQL** (if you want to run backend/frontend locally):

```bash
make db
# or
docker compose up postgres
```

### Available Commands

```bash
make help      # Show all commands
make up        # Start all services
make db        # Start only PostgreSQL
make down      # Stop all services
make logs      # View logs
make clean     # Remove containers and volumes
```

## Local Development (without Docker)

### Backend

```bash
cd backend
pnpm install
pnpm start:dev
```

### Frontend

```bash
cd frontend
pnpm install
pnpm dev
```

## Production Deployment

### Database

- **Local**: Docker PostgreSQL
- **Production**: Aiven Cloud PostgreSQL with SSL

Set `DB_SSL=true` in production environment variables.

### Hosting

- **Frontend**: Vercel (static hosting)
- **Backend**: Vercel Serverless Functions

Configure environment variables in Vercel Dashboard with Aiven PostgreSQL credentials.

## CI/CD Pipeline

This project uses GitHub Actions for continuous integration and deployment.

### Workflows

| Workflow | Trigger | Description |
|----------|---------|-------------|
| **CI** | Push/PR to `main`, `develop` | Lint, test, build both frontend and backend |
| **Deploy** | Push to `main` | Deploy to Vercel (frontend + backend) |
| **Security** | PR + Weekly schedule | Dependency review, CodeQL analysis, npm audit |

### Required GitHub Secrets

Configure these in your repository settings (Settings → Secrets and variables → Actions):

| Secret | Description |
|--------|-------------|
| `VERCEL_TOKEN` | Vercel API token (Account Settings → Tokens) |
| `VERCEL_ORG_ID` | Vercel Organization ID (Project Settings → General) |
| `VERCEL_PROJECT_ID_FRONTEND` | Vercel Project ID for frontend |
| `VERCEL_PROJECT_ID_BACKEND` | Vercel Project ID for backend |

### Branch Protection (Recommended)

Enable branch protection on `main` with:
- Require status checks: `CI Status`
- Require branches to be up to date

## License

UNLICENSED
