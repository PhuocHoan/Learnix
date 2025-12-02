---
description: 'React 19, Tailwind v4, and Accessibility Standards'
applyTo: '**/*.{tsx,jsx,ts,js,css}'
---

# Frontend Development Instructions

## Core Stack

- **Framework**: React 19
- **Build Tool**: Vite 7
- **Language**: TypeScript 5.9.3
- **Styling**: Tailwind CSS v4
- **State Management**: TanStack Query v5 (Server State), React Context/Hooks (Client State)
- **Testing**: Vitest + React Testing Library

## React 19 Best Practices

1.  **React Compiler**: Assume the React Compiler is enabled.
    - **Do NOT** manually use `useMemo` or `useCallback` unless specifically optimizing for a known bottleneck or referential equality requirement that the compiler might miss.
2.  **Hooks**:
    - Use the `use` API for consuming promises and context.
    - Use `useActionState` for form actions.
    - Use `useOptimistic` for optimistic UI updates.
3.  **Server Components**: If using RSCs (e.g., in a future Next.js migration or if configured), prefer fetching data on the server. For this Vite SPA, use TanStack Query for data fetching.
4.  **Components**:
    - Use Functional Components with TypeScript interfaces for props.
    - Keep components small and focused (Single Responsibility Principle).
    - Colocate tests with components (e.g., `Button.tsx`, `Button.test.tsx`).

## Tailwind CSS v4

1.  **CSS-First**: Use the new CSS-first configuration approach.
2.  **Utility-First**: Prefer utility classes over custom CSS.
3.  **Shadcn UI**: Use Shadcn UI components as the base for the design system. Customize via `tailwind.config.js` (or CSS variables in v4).
4.  **Responsive**: Use mobile-first responsive design (`sm:`, `md:`, `lg:`).

## Accessibility (A11y)

1.  **Standards**: WCAG 2.2 Level AA.
2.  **Semantics**: Use semantic HTML (`<nav>`, `<main>`, `<article>`, `<button>`).
3.  **Keyboard**: Ensure all interactive elements are keyboard accessible.
4.  **ARIA**: Use ARIA attributes only when semantic HTML is insufficient.
5.  **Testing**: Use `axe-core` or similar tools in tests to verify accessibility.

## Testing (Vitest)

1.  **Unit Tests**: Test individual components and hooks.
2.  **Integration Tests**: Test interactions between components.
3.  **Mocking**: Mock external API calls using MSW (Mock Service Worker) or Vitest mocks.
4.  **Snapshot**: Use snapshots sparingly; prefer asserting on specific DOM elements and text.

## Code Style

- **Naming**: PascalCase for components, camelCase for functions/variables.
- **Exports**: Use named exports for components.
- **Imports**: Use absolute imports (configured in `tsconfig.json`).

## Deployment

### Vercel Deployment

- Frontend is deployed to Vercel as a static site.
- Automatic deployments on push to `main` branch.
- Preview deployments for Pull Requests.

### Build Configuration

```json
// vercel.json
{
  "buildCommand": "pnpm build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### Environment Variables (Vercel Dashboard)

```env
VITE_API_URL=https://api.your-domain.com
VITE_GOOGLE_CLIENT_ID=<google-oauth-client-id>
VITE_GITHUB_CLIENT_ID=<github-oauth-client-id>
```

### Local Development

```bash
# With Docker Compose (recommended)
make dev

# Or standalone
pnpm dev
```
