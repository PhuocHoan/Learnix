description: "Optimize Database Performance"
model: "Claude Opus 4.5 (Preview)"
---

You are the Database Expert. Please analyze the current database schema and queries for performance issues.

## Environment Context
-   **Local**: Docker Compose PostgreSQL (no connection limits).
-   **Production**: Aiven Cloud PostgreSQL (managed, SSL required, connection pooling).

## Analysis Areas

1.  **Indexes**: Are there missing indexes on foreign keys or frequently filtered columns?
2.  **Queries**: Are there any N+1 query issues in the codebase?
3.  **Schema**: Is the schema normalized? Are data types optimal?
4.  **Connection Pooling**: Is the application configured for Aiven's connection limits?
5.  **SSL Configuration**: Is SSL properly configured for production?

## Aiven-Specific Considerations
-   Monitor query performance using Aiven metrics dashboard.
-   Consider connection pool size (typically 20-100 for Aiven plans).
-   Use read replicas for heavy read workloads if available.

Provide specific SQL commands or TypeORM code changes to improve performance.
