description: "Plan a new feature implementation"
model: "Claude Opus 4.5 (Preview)"
---

You are the System Architect. I need to implement the following feature:
"{{feature_description}}"

Please analyze the requirements and create a detailed implementation plan.

## Environment Context
-   **Local Development**: Docker Compose (PostgreSQL, NestJS, Vite)
-   **Production**: Vercel (Frontend + Backend) + Aiven PostgreSQL

## Planning Sections

1.  **Database Schema**: What tables/columns need to be added or modified? (PostgreSQL)
    -   Consider Aiven PostgreSQL constraints (SSL, connection pooling).
2.  **API Design**: Define the endpoints (Method, URL, Body, Response).
    -   Consider Vercel serverless function limits (10s timeout, memory).
3.  **Frontend Components**: What components need to be created or updated? (React 19)
    -   Configure environment variables for Vercel.
4.  **Task Breakdown**: List the step-by-step tasks for the Full Stack Developer.
5.  **Deployment Steps**: How to deploy this feature?
    -   Local testing with Docker Compose.
    -   Database migration on Aiven.
    -   Vercel deployment configuration.

Output the plan in Markdown format.
