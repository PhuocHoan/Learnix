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

## Demo Accounts (Evaluator)

Use these accounts to evaluate the platform in different roles. **Password for all: `Password@123`**

| Role       | Email                    | Features to Test                                              |
| ---------- | ------------------------ | ------------------------------------------------------------- |
| Admin      | `admin@learnix.edu`      | Course moderation, user management, system stats              |
| Instructor | `instructor@learnix.edu` | Create courses, manage lessons, generate AI quizzes           |
| Student    | `student@learnix.edu`    | Enroll in courses, watch lessons, use Embedded IDE, quizzes   |

## Project Structure

```text
├── apps/
│   ├── web/           # Frontend (React 19 + Vite)
│   └── api/           # Backend (NestJS 11)
├── database/          # Database migrations & seed data
│   ├── schema.sql     # Complete PostgreSQL schema
│   ├── seed.sql       # Sample data for development
│   └── README.md      # Database import instructions
├── api/               # Vercel serverless adapter
├── e2e/               # End-to-end tests (Playwright)
├── docker-compose.yml # Local development containers
└── Makefile           # Common development commands
```

### Folder Details

| Folder     | Description                                                         |
| ---------- | ------------------------------------------------------------------- |
| `apps/web` | React frontend with Vite, TailwindCSS, TanStack Query, CodeMirror   |
| `apps/api` | NestJS backend with TypeORM, Passport.js, WebSockets, Gemini AI     |
| `database` | PostgreSQL schema and seed data with import instructions            |
| `api`      | Vercel serverless function adapter for backend deployment           |
| `e2e`      | Playwright E2E tests for critical user flows                        |

## Quick Start for Evaluators (Docker - Recommended)

If you are a lecturer or evaluator, the easiest way to launch the **entire platform** (Frontend, Backend, and Database) is using Docker.

### Prerequisites (Docker Setup)

- Docker & Docker Compose installed

### Launch Stack

```bash
# Start all services (PostgreSQL, NestJS API, React Frontend)
docker compose up -d --build
```

### Initialize & Seed Database

Wait about 10 seconds for the containers to be ready, then run:

```bash
# This reset script will apply the schema and comprehensive seed data
docker exec -it learnix-backend pnpm --filter @repo/api db:reset
docker exec -it learnix-backend pnpm --filter @repo/api db:seed
```

### Access URLs

- **Frontend (Student/Instructor/Admin Portal)**: [http://localhost:5173](http://localhost:5173)
- **Backend API Documentation**: [http://localhost:3000/api](http://localhost:3000/api)

---

## Setup for Developers (Local Development)

If you want to contribute to the code, use the following steps to run services locally.

### Prerequisites (Local Setup)

- Node.js >= 24, pnpm >= 10
- PostgreSQL (Local or Docker)

### Initial Setup

```bash
pnpm install
cp apps/web/.env.example apps/web/.env
cp apps/api/.env.example apps/api/.env
```

### Start Database

If using the provided Docker PostgreSQL:

```bash
docker compose up -d postgres
# Then reset and seed (using local node)
cd apps/api
pnpm db:reset
pnpm db:seed
```

### Run Development Servers

```bash
# From project root
pnpm dev
```

- Frontend: [http://localhost:5173](http://localhost:5173)
- API: [http://localhost:3000](http://localhost:3000)

---

## Evaluation Accounts

**Password for all: `Password@123`**

| Role       | Email                    | Key Features                                          |
| ---------- | ------------------------ | ----------------------------------------------------- |
| Admin      | `admin@learnix.edu`      | Course moderation, user management, system stats      |
| Instructor | `instructor@learnix.edu` | Dashboard, course/lesson creation, AI quiz generation |
| Student    | `student@learnix.edu`    | Enrollment, learning viewer, embedded IDE, quizzes    |

---

## Tech Stack

- **Frontend**: React 19, Vite 7, TailwindCSS 4, TanStack Query, CodeMirror 6
- **Backend**: NestJS 11, TypeORM, PostgreSQL, Passport.js (JWT/OAuth), Gemini AI
- **DevOps**: Turborepo 2.7, Docker, GitHub Actions, Vercel

For detailed database details, see [database/README.md](database/README.md).
