---
description: 'Testing & Quality Gates: make pre/build/e2e'
applyTo: '**'
---

# Testing & Quality Gates Instructions

## Required Quality Gates

This repository’s minimum quality bar is:

- `make pre` (format + lint + typecheck + unit/integration tests)
- `make build` (Turbo build)
- `make e2e` (Playwright end-to-end tests)

All three must run **successfully** with **zero errors and zero warnings**.

## Do Not Hide Failures

When fixing CI/test issues:

- Do **not** skip tests: no `test.skip`, `it.skip`, `describe.skip`, Playwright `test.skip()`, or conditional skipping to “get green”.
- Do **not** suppress diagnostics: no `eslint-disable` comments, no `@ts-ignore`, no `// @ts-expect-error` unless the error is truly unavoidable and explicitly justified by product requirements.
- Do **not** downgrade checks: no loosening ESLint/TypeScript rules just to pass, unless there is a clear, repo-wide rationale.
- Do **not** mute warnings: do not add flags like `--silent` to hide output.

Fix the root cause instead.

## Warnings Are Treated As Failures

- ESLint must run with `--max-warnings=0` (preferably enforced in the package `lint` script or ESLint config).
- TypeScript must run in strict mode (already required) and pass without diagnostics.
- Tests must pass without runtime warnings (React act warnings, deprecations, unhandled rejections, Playwright timeouts, etc.).

## Playwright (E2E)

- Tests must be deterministic and resilient: use `getByRole` / `getByLabel` locators and web-first assertions.
- Never use `page.waitForTimeout` to “stabilize” tests.
- If E2E requires services to be running, start them explicitly (e.g., `pnpm dev` or Docker Compose as documented) rather than adding sleeps.

## Prettier & Formatting

- `make pre` runs `pnpm format` (write-mode). Any formatting changes are expected; do not replace it with check-only.
- If formatting churn is excessive, fix the underlying config or conflicting formatters.

## What To Run Before Finishing Work

- If any change may affect build, lint, typecheck, tests, or dependencies, run:
  - `make pre`
  - `make build`
  - `make e2e`

Only omit a command if the user explicitly requests not to run it.
