# Learnix Database

This folder contains the database schema and seed data for the Learnix online learning platform.

## Prerequisites

- PostgreSQL 18+ (or compatible version)
- Docker (optional, for containerized setup)

## Files

| File         | Description                                                                     |
| ------------ | ------------------------------------------------------------------------------- |
| `schema.sql` | Complete database schema with all tables, enums, indexes, and constraints       |
| `seed.sql`   | Comprehensive seed data with 5 complete courses, quizzes, and user interactions |

## Quick Start (Using NestJS Scripts)

```bash
cd apps/api
pnpm db:reset
pnpm db:seed
```

## Evaluation Accounts

Use these accounts to test the platform. **Password for all: `Password@123`**

| Email                    | Password     | Role       |
| ------------------------ | ------------ | ---------- |
| <admin@learnix.edu>      | Password@123 | Admin      |
| <instructor@learnix.edu> | Password@123 | Instructor |
| <student@learnix.edu>    | Password@123 | Student    |

## Connection Configuration

Set these environment variables in `apps/api/.env`:

```env
# Local Development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=postgres
DB_NAME=learnix
DB_SSL=false

# Or use DATABASE_URL
DATABASE_URL=postgresql://user:password@host:5432/learnix
```

## Schema Overview

```text
users                 # User accounts (admin, instructor, student)
  └── external_auth   # OAuth providers (Google, GitHub)

courses               # Course catalog
  └── course_sections # Course sections/modules
      └── lessons     # Individual lessons
          └── lesson_resources  # Attachments/links

enrollments          # Student-course relationships
quizzes              # Course quizzes
  └── questions      # Quiz questions
quiz_submissions     # Student quiz attempts
payments             # Course purchases
notifications        # User notifications
```

## Reset Database

To completely reset the database:

```bash
cd apps/api
pnpm db:reset
pnpm db:seed
```
