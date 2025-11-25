---
description: "Common Standards: TypeScript, Security, Performance, and DevOps"
applyTo: "**"
---

# Common Development Instructions

## TypeScript 5.9+ Standards
1.  **Strict Mode**: Always enable `strict: true` in `tsconfig.json`.
2.  **Types**: Avoid `any`. Use `unknown` if the type is truly not known, and narrow it down.
3.  **Interfaces vs Types**: Prefer `interface` for object definitions and `type` for unions/intersections.
4.  **Modern Features**: Use optional chaining (`?.`), nullish coalescing (`??`), and other ES2025 features.

## Security (OWASP Top 10)
1.  **Injection**: Use parameterized queries (TypeORM handles this) and validate all inputs.
2.  **Authentication**: Use strong password hashing (Argon2/Bcrypt) and secure session management.
3.  **Sensitive Data**: Never commit secrets to Git. Use `.env` files.
4.  **Dependencies**: Regularly audit dependencies (`npm audit` / `pnpm audit`).

## Performance Optimization
1.  **Frontend**:
    -   Lazy load routes and heavy components.
    -   Optimize images (WebP/AVIF).
    -   Minimize bundle size.
2.  **Backend**:
    -   Cache expensive operations (Redis).
    -   Optimize database queries (Indexing).
    -   Use asynchronous I/O.

## Code Commenting
-   **Self-Explanatory Code**: Write code that explains *what* it does.
-   **Why, Not What**: Comments should explain *why* a decision was made, not what the code is doing.
-   **JSDoc**: Use JSDoc for public APIs and complex functions.

## DevOps & CI/CD

### Deployment Environments
1.  **Local Development**:
    -   Use Docker Compose for all services (frontend, backend, PostgreSQL).
    -   Hot reload enabled for both frontend and backend.
    -   Commands: `make dev`, `docker compose up`.
2.  **Production**:
    -   **Frontend**: Vercel (automatic deployments from `main` branch).
    -   **Backend**: Vercel Serverless Functions or dedicated server.
    -   **Database**: Aiven Cloud PostgreSQL (SSL required).

### Docker (Local Development)
1.  **Docker Compose**:
    -   Use `docker-compose.yml` for production-like setup.
    -   Use `docker-compose.dev.yml` for development with hot reload.
2.  **Multi-stage builds**: For smaller images (if building for self-hosting).
3.  **Security**: Don't run containers as root.

### Vercel (Production)
1.  **Environment Variables**: Configure in Vercel Dashboard (not in code).
2.  **Preview Deployments**: Automatic for Pull Requests.
3.  **Edge Functions**: Use for dynamic API routes if needed.

### GitHub Actions
1.  **CI Pipeline**:
    -   Run linting and tests on every Pull Request.
    -   Cache dependencies to speed up builds.
2.  **CD Pipeline**:
    -   Vercel handles automatic deployments.
    -   Use GitHub Actions for database migrations (Aiven).

## Git Workflow
-   **Commits**: Use conventional commits (e.g., `feat: add user login`, `fix: resolve null pointer`).
-   **Branches**: Use feature branches (`feat/user-login`) and merge into `main` via PR.
