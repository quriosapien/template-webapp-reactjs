# template-webapp-react-ts7

A production-grade React 19 + TypeScript 7 webapp template: Vite for dev/build,
React Router for routing, Zustand for state, JWT authentication with
refresh-token rotation, an MSW-mocked auth API (with a one-flip switch to a
real backend), and Tailwind CSS v4 for styling.

## Toolchain

| Tool | Purpose |
| --- | --- |
| [tsgo](https://github.com/microsoft/typescript-go) (`@typescript/native-preview`) | TypeScript 7 typechecking (`npm run typecheck`) |
| [Biome](https://biomejs.dev) | Linting and formatting — no ESLint, no Prettier |
| [Vite](https://vitejs.dev) | Dev server and production build |
| [Vitest](https://vitest.dev) + [React Testing Library](https://testing-library.com/react) + [MSW](https://mswjs.io) | Unit and component tests, with a mocked network layer |
| [lefthook](https://github.com/evilmartians/lefthook) | Git hooks (pre-commit lint) |
| [Tailwind CSS v4](https://tailwindcss.com) | Utility-first styling via `@tailwindcss/vite` |

## Requirements

- Node.js >= 26 (see `.nvmrc`; run `nvm use`)

## Getting started

```bash
nvm use
npm install
cp .env.example .env.local
npm run dev
```

Open the printed URL and sign in with the demo credentials
(`demo@example.com` / `password123`) — served by MSW, no backend required.

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server |
| `npm run build` | Typecheck, then build for production |
| `npm run preview` | Preview the production build locally |
| `npm run typecheck` | Run `tsgo --noEmit` |
| `npm run lint` | Check lint/format issues with Biome |
| `npm run lint:fix` | Fix lint/format issues with Biome |
| `npm run lint:ci` | Biome check in CI mode (no writes) |
| `npm run format` | Format files with Biome |
| `npm test` | Run the test suite once |
| `npm run test:watch` | Run the test suite in watch mode |
| `npm run prepare` | Install git hooks (runs automatically after `npm install`) |

## Environment configuration

Vite loads `.env` / `.env.<mode>` natively — there is no `dotenv` dependency.
`src/config/env.ts` reads `import.meta.env`, validates it with Zod, and
exports a frozen, typed `config` object; **nothing else in the codebase reads
`import.meta.env` directly**.

- Only `.env.example` is committed. Copy it to `.env.local` (gitignored) to
  get started, or to `.env.<mode>` (e.g. `.env.staging`) for a named mode —
  `vite build --mode staging` loads `.env.staging` automatically.
- `VITE_*` variables are exposed to the browser bundle — never put secrets in
  them.
- `DEV_PROXY` and `DEV_PROXY_TARGET` are read only by `vite.config.ts` in
  Node, and never reach the browser.

## Project structure

```
src/
  api/          # httpRequest client + typed API modules (*.api.ts)
  components/   # shared components (*.component.tsx)
  config/       # Zod-validated env config — the only reader of import.meta.env
  mocks/        # MSW request handlers, node server, browser worker
  pages/        # route-level components (*.page.tsx)
  stores/       # Zustand stores (*.store.ts)
  test/         # Vitest setup file
  types/        # shared TypeScript types (*.types.ts)
  utils/        # framework-agnostic helpers (*.util.ts)
  assets/       # images processed by Vite (hashed, optimized)
  styles/       # global CSS (Tailwind entrypoint)
public/         # served verbatim, unprocessed
```

## Auth flow

1. **Login** — `LoginPage` calls `useAuthStore.login()`, which posts to
   `/api/auth/login` and receives a user + token pair.
2. **Token storage** — the access token lives in memory only (cleared on
   reload); the refresh token persists in `localStorage` so a session
   survives a reload.
3. **Authenticated requests** — `httpRequest` attaches
   `Authorization: Bearer <accessToken>` to every call unless `skipAuth` is
   set.
4. **401 → refresh → retry** — on a 401, the client single-flights a call to
   `/api/auth/refresh` (concurrent 401s share one refresh, not one each),
   stores the rotated pair, and retries the original request once.
5. **Refresh failure → logout** — if the refresh fails (expired/invalid
   refresh token), tokens are cleared and the caller receives an `HttpError`;
   `RequireAuth` redirects to `/login`.
6. **Bootstrap on reload** — `main.tsx` calls `useAuthStore.bootstrap()` on
   load, which calls `/api/auth/me`. Since the in-memory access token is gone
   after a reload, this legitimately 401s once and transparently refreshes —
   restoring the session from the persisted refresh token alone.

> **Production note:** `localStorage` for the refresh token is a pragmatic
> default for a template that must run against a mock API with zero backend
> setup. In production, prefer an httpOnly + Secure cookie set by the backend
> instead (see the comment in `src/utils/token-storage.util.ts`).

## Mock API vs. real backend

By default (`VITE_USE_MSW=true`), `src/mocks/browser.ts` intercepts requests
in the browser during `npm run dev` — no backend needed. To point at a real
backend instead:

```bash
# .env.local
VITE_USE_MSW=false
DEV_PROXY=true
DEV_PROXY_TARGET=http://localhost:3000
```

`DEV_PROXY=true` makes `vite.config.ts` proxy `/api/*` to `DEV_PROXY_TARGET`.
Your backend must implement this contract:

| Method | Path | Request | Response |
| --- | --- | --- | --- |
| `POST` | `/api/auth/login` | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| `POST` | `/api/auth/refresh` | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `POST` | `/api/auth/logout` | — (bearer token) | `204 No Content` |
| `GET` | `/api/auth/me` | — (bearer token) | `user` |

## `public/` vs. `src/assets/`

- `public/` is served verbatim at the site root — use it for files that must
  keep an exact name/path (e.g. `robots.txt`, `mockServiceWorker.js`).
- `src/assets/` is processed by Vite — imported files are hashed for cache
  busting and images are optimized by `vite-plugin-image-optimizer`.

## File suffix convention

Files are kebab-case with a role suffix, imported exclusively via the `@/`
alias (never long relative paths):

| Suffix | Role |
| --- | --- |
| `*.page.tsx` | Route-level component |
| `*.component.tsx` | Shared/reusable component |
| `*.store.ts` | Zustand store |
| `*.api.ts` | Typed API module |
| `*.client.ts` | Low-level network client |
| `*.util.ts` | Framework-agnostic helper |
| `*.types.ts` | Shared TypeScript types |
| `*.test.ts(x)` | Test, colocated next to the unit under test |

## Code style consistency

Three layers keep the codebase consistent, mirroring `template-webserver-ts7`:

1. **Editor** — `.vscode/settings.json` sets Biome as the default formatter
   with format-on-save; `.vscode/extensions.json` recommends the Biome
   extension.
2. **Pre-commit** — `lefthook.yml` runs `biome check --write` on staged files
   before every commit.
3. **CI backstop** — `npm run lint:ci` runs Biome in check-only mode (no
   writes), catching anything that slipped past the first two layers.
