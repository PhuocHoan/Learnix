---
description: "NestJS 11, TypeORM, and PostgreSQL Standards"
applyTo: "**/*.{ts,js}"
---

# Backend Development Instructions

## Core Stack
-   **Framework**: NestJS 11
-   **Language**: TypeScript 5.9.3
-   **Database**: PostgreSQL
-   **ORM**: TypeORM
-   **Testing**: Jest

## NestJS 11 Best Practices
1.  **Architecture**: Follow the Modular Architecture.
    -   Each feature should have its own module (e.g., `UsersModule`, `AuthModule`).
    -   Use `Controllers` for handling requests and `Services` for business logic.
2.  **Dependency Injection**: Use Constructor Injection. Avoid property injection.
3.  **DTOs**: Use Data Transfer Objects (DTOs) for all input validation.
    -   Use `class-validator` and `class-transformer`.
4.  **Config**: Use `@nestjs/config` for environment variables. Never hardcode secrets.
5.  **Error Handling**: Use Global Exception Filters and standard HTTP exceptions.

## Database (PostgreSQL + TypeORM)

### Environment Configuration
-   **Local Development**: Docker Compose PostgreSQL container.
-   **Production**: Aiven Cloud PostgreSQL (managed service with automatic backups).

### Aiven PostgreSQL Requirements
1.  **SSL Connection**: Always use SSL in production (`ssl: { rejectUnauthorized: false }`).
2.  **Connection String**: Use `DATABASE_URL` environment variable from Aiven Console.
3.  **Connection Pooling**: Aiven provides connection pooling; configure `max` connections appropriately.

### TypeORM Configuration
```typescript
// Example TypeORM configuration for multi-environment
{
  type: 'postgres',
  url: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' 
    ? { rejectUnauthorized: false } 
    : false,
  synchronize: false, // Always use migrations
  migrations: ['dist/migrations/*.js'],
}
```

### Entity Guidelines
1.  **Entities**: Define entities using TypeORM decorators.
    -   Use `UUID` for primary keys.
    -   Use proper column types (e.g., `timestamp with time zone`).
2.  **Repositories**: Use the Repository Pattern.
3.  **Migrations**: Always use migrations for schema changes. Do not use `synchronize: true` in production.
4.  **Performance**:
    -   Use indexes for frequently queried columns.
    -   Avoid N+1 query problems by using `relations` or `QueryBuilder`.
    -   Monitor slow queries using Aiven's built-in metrics.

## Testing (Jest)
1.  **Unit Tests**: Test Services and Controllers in isolation.
    -   Mock dependencies using `jest.mock` or custom mock providers.
2.  **Integration Tests**: Test the interaction between modules and the database (using a test database or Docker container).
3.  **E2E Tests**: Use `@nestjs/testing` to spin up the application and test API endpoints.

## Code Style
-   **Naming**:
    -   Files: `kebab-case` (e.g., `users.service.ts`).
    -   Classes: `PascalCase` (e.g., `UsersService`).
    -   Methods: `camelCase`.
-   **Async/Await**: Always use `async/await` for asynchronous operations.

## Deployment

### Vercel Deployment
-   Backend can be deployed as Vercel Serverless Functions or separately.
-   Configure environment variables in Vercel Dashboard.
-   Use `vercel.json` for routing and function configuration.

### Environment Variables (Production)
```env
# Aiven PostgreSQL
DATABASE_URL=postgres://user:password@host:port/database?sslmode=require

# Application
NODE_ENV=production
JWT_SECRET=<strong-secret>
FRONTEND_URL=https://your-app.vercel.app

# OAuth (optional)
GOOGLE_CLIENT_ID=<from-google-console>
GOOGLE_CLIENT_SECRET=<from-google-console>
GITHUB_CLIENT_ID=<from-github>
GITHUB_CLIENT_SECRET=<from-github>
```

### Local Development
```bash
# Start with Docker Compose
make dev

# Or start services individually
docker compose up postgres -d
pnpm start:dev
```
