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

### Prerequisites

- pnpm

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

### Run Unit Test (Backend)

```bash
cd backend
pnpm test 
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

## Authentication

Authentication Strategy: Secure HTTP-Only Cookies

Design

- Token types
	- Access token: short-lived JWT containing minimal user claims (sub, email, role, iat, exp and optional scopes). Stored in an HttpOnly cookie (example name: `access_token`).
	- Refresh token: longer-lived token used to obtain new access tokens. Can be implemented as a JWT stored in an HttpOnly cookie (`refresh_token`) or as a server-side session identifier. Refresh token rotation is recommended for improved security.

- Storage and cookie settings
	- Both tokens are stored in HttpOnly cookies (inaccessible to JS). Cookies should be set with Secure when running in production and SameSite=Lax to reduce CSRF attack surface.
	- Typical cookie options: `httpOnly: true`, `secure: process.env.NODE_ENV === 'production'`, `sameSite: 'lax'`, `path: '/'`, and an appropriate `maxAge`.
	- When the API is on a different origin/subdomain, the frontend must request credentials (fetch/axios with `credentials: 'include'`) and the server must enable CORS with `credentials: true` and the allowed origin.

- JWT payload shape (example)

```json
{
	"sub": "<userId>",
	"email": "user@example.com",
	"role": "instructor",        // one of: student|instructor|admin
	"scopes": ["quizzes:read","courses:write"], // optional, for fine-grained permissions
	"iat": 1690000000,
	"exp": 1690000900
}
```

- Refresh flow & revocation
	- Access tokens should be short-lived (minutes). The client can call a `/auth/refresh` endpoint which returns a new access token set via an HttpOnly cookie.
	- To support immediate logout/revocation, consider storing a token version or a refresh token blacklist in the database, or use server-side sessions for refresh tokens.

- CSRF considerations
	- Because cookies are sent automatically by browsers, CSRF is a concern. SameSite=Lax provides reasonable protection for many apps, but for sensitive endpoints you should also:
		- Validate the `Origin`/`Referer` headers, and/or
		- Use double-submit CSRF tokens (store a CSRF token in a non-HttpOnly cookie or as a header and validate it on the server), and/or
		- Require `Content-Type: application/json` for state-changing endpoints and validate origins.

- HttpOnly cookies vs localStorage
	- Pros (cookies): protected from XSS because JS cannot read HttpOnly cookies; browser automatically sends them with requests; easier UX for automatic transmission.
	- Cons (cookies): susceptible to CSRF if not mitigated; more configuration required for CORS and cross-origin cookies; slightly more complex deployment when API is on a different domain.

- Stateless JWTs vs server-side sessions
	- Stateless JWTs: scalable (no server-side session store), simpler horizontal scaling. Harder to revoke (requires short lifetimes + refresh + rotation or token blacklist/versioning).
	- Server-side sessions: easier revocation and session management, but require a session store (Redis/DB) and more infrastructure.

- Refresh tokens in cookie vs in DB
	- Cookie-stored refresh tokens with rotation are a common approach and keep the frontend simple.
	- Server-side refresh tokens (session IDs) make revocation straightforward but add state and operational complexity.

## Authorization

Access control is enforced at two levels: the Client (for User Experience) and the Server (for Data Security).

1. Client-Side Authorization (UX)

The frontend restricts navigation and hides UI elements based on the user's role (student, instructor, admin). This prevents users from seeing pages they cannot access, though it does not secure the data itself.

		- Route Guards: We use a `ProtectedRoute` wrapper that checks the user's role before rendering a page.

		```tsx
		// src-frontend/App.tsx
		<Route 
			path="/admin" 
			element={
				<ProtectedRoute allowedRoles={['admin']}>
					<AdminDashboardPage />
				</ProtectedRoute>
			} 
		/>
		```

		- UI Hiding: Components like the Sidebar conditionally render links.

		```tsx
		// src-frontend/components/layout/sidebar.tsx
		{user?.role === 'instructor' && (
			<Link to="/instructor/quiz-generator">Quiz Generator</Link>
		)}
		```

2. Server-Side Authorization (Enforcement)

True security is enforced on the backend using NestJS Guards. Even if a user bypasses the frontend UI, the API will reject unauthorized requests.

		- Authentication Guard: `JwtAuthGuard` verifies the validity of the JWT in the cookie.

		- Role Guard: `RolesGuard` compares the user's role against the required roles defined in metadata.

Implementation example:

```ts
// src/admin/admin.controller.ts
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard) // 1. Verify Token, 2. Verify Role
@Roles(UserRole.ADMIN)               // 3. Define Required Role
export class AdminController {
	@Get('users')
	getAllUsers() {
		// Only admins can reach this code
		return this.usersService.findAll();
	}
}
```
### How roles are represented

- Roles
	- Simple, coarse-grained categories (e.g., `student`, `instructor`, `admin`) represented as a `role` claim on the JWT (string or enum). Roles are convenient for UI-level access control and for grouping permissions.

### Authorization Enforcement

- Frontend: the app fetches a `/me` or `/auth/profile` endpoint (cookies included) to get the current user's profile and role/scopes. UI components and route guards consult that profile to decide what to render.

- Backend: request flow is guarded by `JwtAuthGuard` (validates the cookie JWT, attaches `req.user`) followed by `RolesGuard` and/or a `ScopesGuard` that check metadata provided by route decorators (e.g., `@Roles(...)`, `@Scopes(...)`).

### Other Design Choice

- Roles vs scopes
	- Roles are simpler and map well to UI changes (e.g., menus). Scopes allow fine-grained control. A hybrid approach works well: use roles for screen-level authorization and scopes for sensitive API actions.

## License

UNLICENSED
