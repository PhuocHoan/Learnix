```prompt
description: "Generate a conventional commit message for staged changes"
model: "Claude Opus 4.5 (Preview)"

---

You are a Git expert. Please analyze the staged changes and generate a well-structured conventional commit message following the Learnix project standards.

## Commit Message Format

<type>(<scope>): <subject>

<body>

<footer>

## Commit Types

| Type       | Description                                             | Example                                    |
| ---------- | ------------------------------------------------------- | ------------------------------------------ |
| `feat`     | New feature for the user                                | `feat(auth): add Google OAuth login`       |
| `fix`      | Bug fix                                                 | `fix(quizzes): resolve null pointer error` |
| `docs`     | Documentation only changes                              | `docs(readme): update installation steps`  |
| `style`    | Code style (formatting, semicolons, etc.)               | `style(frontend): format with Prettier`    |
| `refactor` | Code change that neither fixes a bug nor adds a feature | `refactor(api): simplify error handling`   |
| `perf`     | Performance improvement                                 | `perf(db): add index on user_id column`    |
| `test`     | Adding or updating tests                                | `test(auth): add login unit tests`         |
| `build`    | Build system or external dependencies                   | `build(deps): upgrade NestJS to v11`       |
| `ci`       | CI/CD configuration changes                             | `ci(github): add test caching`             |
| `chore`    | Other changes that don't modify src or test files       | `chore: update .gitignore`                 |
| `revert`   | Reverts a previous commit                               | `revert: feat(auth): add Google OAuth`     |

## Scopes (Learnix-Specific)

| Scope       | Description                        |
| ----------- | ---------------------------------- |
| `frontend`  | React/Vite frontend changes        |
| `backend`   | NestJS backend changes             |
| `auth`      | Authentication module              |
| `users`     | Users module                       |
| `quizzes`   | Quizzes module                     |
| `admin`     | Admin module                       |
| `dashboard` | Dashboard module                   |
| `db`        | Database/TypeORM changes           |
| `api`       | API endpoints                      |
| `ui`        | UI components (Tailwind)           |
| `deps`      | Dependencies                       |
| `config`    | Configuration files                |
| `docker`    | Docker/containerization            |
| `ci`        | CI/CD pipelines                    |
| `e2e`       | End-to-end tests                   |

## Rules

1. **Subject Line**:
   - Use imperative mood ("add" not "added" or "adds")
   - No capitalization of first letter (lowercase)
   - No period at the end
   - Maximum 50 characters

2. **Body** (optional but recommended for complex changes):
   - Explain _what_ and _why_, not _how_
   - Wrap at 72 characters
   - Use bullet points for multiple changes

3. **Footer** (optional):
   - Reference issues: `Closes #123` or `Fixes #456`
   - Breaking changes: `BREAKING CHANGE: <description>`

## Examples

### Simple Feature

feat(auth): add GitHub OAuth login

### Feature with Body

feat(quizzes): implement quiz timer functionality

- Add countdown timer component with pause/resume
- Store remaining time in local storage for recovery
- Display warning when 5 minutes remaining

Closes #42

### Bug Fix

fix(frontend): resolve hydration mismatch on dashboard

The server was rendering with UTC timezone while client
used local timezone causing React hydration errors.

Fixes #78

### Breaking Change

feat(api)!: change authentication response format

BREAKING CHANGE: The login endpoint now returns a nested
user object instead of flat properties.

Before: { id, email, token }
After: { user: { id, email }, token }

### Multi-Scope Changes

feat(frontend,backend): add user profile picture upload

Frontend:
- Add file upload component with drag-and-drop
- Display avatar in header and profile page

Backend:
- Add /users/avatar endpoint for file upload
- Integrate with S3 for storage

Closes #55

## Analysis Steps

1. Review all staged changes using `git diff --staged`
2. Identify the primary type of change
3. Determine the appropriate scope(s)
4. Write a concise subject line
5. Add body if the change is non-trivial
6. Reference any related issues
7. **Check if README.md needs updating** (new features, commands, config changes)

## Pre-Commit Checklist

Before generating the commit message, verify:

- [ ] Is README.md updated if the change affects setup, commands, or features?
- [ ] Are obsolete README sections removed if functionality was deprecated?
- [ ] Are version numbers updated if dependencies changed significantly?

## Output

Provide the commit message in a code block, ready to be used with `git commit -m`.

If the changes are too large or unrelated, suggest splitting into multiple commits.
```
