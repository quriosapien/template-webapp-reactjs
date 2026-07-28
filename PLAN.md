# template-webapp-react-ts7 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A production-grade React 19 + TypeScript 7 webapp template with Vite 7, React Router v7, Zustand, JWT auth with refresh-token rotation, MSW-mocked API (with a ready dev-proxy switch), Tailwind CSS v4, and Vitest unit tests — mirroring the conventions of `template-webserver-ts7`.

**Architecture:** Role-grouped `src/` layout with kebab-case role-suffixed files (`*.page.tsx`, `*.store.ts`, `*.api.ts`, `*.util.ts`, `*.types.ts`, `*.test.ts(x)`), all imports via the `@/` alias. Env is read ONLY in `src/config/env.ts` (Vite-native `.env` loading + Zod validation → frozen typed `config`). Auth: access token in memory, refresh token in `localStorage`, a fetch-based HTTP client that single-flight-refreshes on 401 and retries once. MSW fakes the auth API in dev and in tests; a Vite dev proxy can replace it with one env flip.

**Tech Stack:** Node 26 (ESM only), TypeScript 7 (tsgo for typecheck), Vite 7, React 19, React Router v7 (declarative mode), Zustand 5, Zod 4, Tailwind CSS v4 (`@tailwindcss/vite`), MSW 2, Vitest 4 + React Testing Library + jsdom, Biome 2, lefthook.

## Global Constraints

- **Node.js >= 26**: `.nvmrc` contains `26`; `package.json` has `"engines": { "node": ">=26" }`.
- **ESM strictly**: `"type": "module"` in package.json; no `require`.
- **TypeScript 7**: devDeps `typescript@^7` and `@typescript/native-preview` (tsgo); `typecheck` script is `tsgo --noEmit`.
- **No dotenv package**: Vite loads `.env` / `.env.<mode>` natively. Nothing outside `src/config/env.ts` reads `import.meta.env`.
- **No axios**: native `fetch` only.
- **Biome only** for lint + format (no ESLint, no Prettier). Config copied from template-webserver-ts7.
- **File naming**: kebab-case with role suffixes: `*.page.tsx`, `*.component.tsx`, `*.store.ts`, `*.api.ts`, `*.client.ts`, `*.util.ts`, `*.types.ts`, `*.constant.ts`, `*.test.ts(x)`.
- **Imports**: always the `@/` alias for `src/` (never long relative paths).
- **Tests**: colocated next to the unit under test.
- **Token policy**: access token in memory only; refresh token in `localStorage` with a code comment noting production should prefer httpOnly cookies.
- **`public/`** = served verbatim; **`src/assets/`** = processed by Vite (hashed + optimized).
- Commit after every task. Working directory for all commands is the template root (the folder containing this PLAN.md).

---

### Task 1: Project scaffold — toolchain, configs, and a booting app shell

**Files:**
- Create: `.nvmrc`, `.gitignore`, `package.json`, `tsconfig.json`, `biome.json`, `lefthook.yml`, `vite.config.ts`, `index.html`, `.env.example`, `.env.local`, `.vscode/settings.json`, `.vscode/extensions.json`, `src/main.tsx`, `src/app.tsx`, `src/styles/index.css`, `src/types/vite-env.d.ts`, `public/robots.txt`, `src/assets/logo.svg`

**Interfaces:**
- Consumes: nothing (first task).
- Produces: a building/running Vite app; `@/` alias; npm scripts `dev|build|preview|typecheck|lint|lint:fix|lint:ci|format|test|test:watch|prepare` that every later task relies on.

- [ ] **Step 1: Init git and Node version pin**

```bash
git init
printf '26\n' > .nvmrc
```

- [ ] **Step 2: Write `.gitignore`**

```gitignore
# Dependencies
node_modules/

# Build output
dist/

# Test/coverage output
coverage/

# Logs
logs/
*.log
npm-debug.log*

# Environment files — keep only .env.example committed
.env
.env.local
.env.development
.env.test
.env.staging
.env.production

# Editor / OS
.DS_Store
*.swp
.idea/
```

- [ ] **Step 3: Write base `package.json`** (deps are installed in Step 8 so npm resolves current versions)

```json
{
  "name": "template-webapp-react-ts7",
  "version": "0.1.0",
  "description": "Production-grade React + TypeScript webapp template (Vite, React Router, Zustand, JWT auth, MSW).",
  "type": "module",
  "private": true,
  "engines": {
    "node": ">=26"
  },
  "scripts": {
    "dev": "vite",
    "build": "npm run typecheck && vite build",
    "preview": "vite preview",
    "typecheck": "tsgo --noEmit",
    "lint": "biome check .",
    "lint:fix": "biome check --write .",
    "lint:ci": "biome ci .",
    "format": "biome format --write .",
    "test": "vitest run",
    "test:watch": "vitest",
    "prepare": "lefthook install"
  }
}
```

- [ ] **Step 4: Write `tsconfig.json`** (backend template's strict flags + DOM/JSX)

```json
{
  "compilerOptions": {
    "target": "ES2023",
    "lib": ["ES2023", "DOM", "DOM.Iterable"],
    "module": "Preserve",
    "moduleResolution": "Bundler",
    "jsx": "react-jsx",
    "paths": {
      "@/*": ["./src/*"]
    },
    "types": ["vite/client", "node"],
    "strict": true,
    "noImplicitOverride": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "esModuleInterop": true,
    "forceConsistentCasingInFileNames": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true
  },
  "include": ["src", "vite.config.ts", "vitest.config.ts"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 5: Write `biome.json`** (verbatim from template-webserver-ts7 — org-wide style)

```json
{
  "$schema": "https://biomejs.dev/schemas/2.5.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignoreUnknown": true,
    "includes": ["**", "!**/dist", "!**/node_modules", "!**/coverage", "!**/public/mockServiceWorker.js"]
  },
  "assist": { "actions": { "source": { "organizeImports": "on" } } },
  "formatter": {
    "enabled": true,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineWidth": 100,
    "lineEnding": "lf"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "preset": "recommended",
      "style": {
        "noNonNullAssertion": "off",
        "useImportType": "error"
      },
      "suspicious": {
        "noConsole": "warn"
      }
    }
  },
  "javascript": {
    "formatter": {
      "quoteStyle": "single",
      "semicolons": "always",
      "trailingCommas": "all",
      "arrowParentheses": "always"
    }
  }
}
```

Note: if the installed Biome major rejects `"preset": "recommended"`, use `"recommended": true` instead — keep whatever the backend template's installed Biome accepts.

- [ ] **Step 6: Write `lefthook.yml`** (backend's, with `css` added to the glob)

```yaml
# Git hooks managed by lefthook (Go binary — fast, no Node startup cost).
# Installed automatically via the "prepare" npm script on `npm install`.
pre-commit:
  parallel: true
  commands:
    biome:
      glob: '*.{js,ts,jsx,tsx,json,jsonc,css}'
      run: npx biome check --write --no-errors-on-unmatched {staged_files}
      stage_fixed: true
```

- [ ] **Step 7: Write `.vscode/settings.json` and `.vscode/extensions.json`**

`.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "biomejs.biome",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.biome": "explicit"
  },
  "[javascript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescript]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[typescriptreact]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[json]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "[jsonc]": {
    "editor.defaultFormatter": "biomejs.biome"
  },
  "typescript.tsdk": "node_modules/typescript/lib"
}
```

`.vscode/extensions.json`:

```json
{
  "recommendations": ["biomejs.biome"]
}
```

- [ ] **Step 8: Install dependencies** (unpinned so npm resolves latest; verify majors after)

```bash
npm install react react-dom react-router zustand zod
npm install -D typescript @typescript/native-preview @types/node @types/react @types/react-dom \
  vite @vitejs/plugin-react tailwindcss @tailwindcss/vite \
  vite-plugin-image-optimizer sharp svgo \
  vitest jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event msw \
  @biomejs/biome lefthook
```

Expected majors (sanity-check `package.json` after install): react 19, react-router 7, zustand 5, zod 4, typescript 7, vite ≥7, vitest ≥4, msw 2, tailwindcss 4, @biomejs/biome 2. If any engine warnings mention Node 26, they are safe to ignore.

- [ ] **Step 9: Write `vite.config.ts`** (Tailwind, image optimizer, `@/` alias, opt-in dev proxy)

```ts
import { fileURLToPath } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer';

export default defineConfig(({ mode }) => {
  // Node context: read all vars (no VITE_ filter) — DEV_PROXY* stay server-side only.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [react(), tailwindcss(), ViteImageOptimizer()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server:
      env.DEV_PROXY === 'true'
        ? {
            proxy: {
              '/api': {
                target: env.DEV_PROXY_TARGET ?? 'http://localhost:3000',
                changeOrigin: true,
              },
            },
          }
        : undefined,
  };
});
```

- [ ] **Step 10: Write env files**

`.env.example` (the only committed env file):

```bash
# Client-side (exposed to the browser — never put secrets in VITE_* vars)
VITE_APP_NAME=template-webapp-react-ts7
VITE_API_BASE_URL=/api
VITE_USE_MSW=true

# Dev-server-only (read by vite.config.ts in Node; NOT exposed to the browser)
# Flip DEV_PROXY=true and VITE_USE_MSW=false to hit a real backend instead of MSW.
DEV_PROXY=false
DEV_PROXY_TARGET=http://localhost:3000
```

```bash
cp .env.example .env.local
```

- [ ] **Step 11: Write the app shell**

`index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>template-webapp-react-ts7</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
```

`src/styles/index.css`:

```css
@import 'tailwindcss';
```

`src/types/vite-env.d.ts` (typed `import.meta.env`; optional strings because Zod validates in Task 2):

```ts
interface ImportMetaEnv {
  readonly VITE_APP_NAME?: string;
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_USE_MSW?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
```

`src/app.tsx` (placeholder — replaced by the router in Task 8):

```tsx
export function App() {
  return <h1 className="p-8 text-2xl font-bold">template-webapp-react-ts7</h1>;
}
```

`src/main.tsx` (placeholder — replaced in Task 9):

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app';
import '@/styles/index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

`public/robots.txt` (proves the served-verbatim folder):

```
User-agent: *
Allow: /
```

`src/assets/logo.svg` (proves the processed-assets pipeline; used by the Home page in Task 8):

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <circle cx="32" cy="32" r="28" fill="#4f46e5" />
  <text x="32" y="41" font-size="26" text-anchor="middle" fill="#ffffff" font-family="sans-serif">R</text>
</svg>
```

- [ ] **Step 12: Verify the scaffold**

```bash
npm run typecheck
npm run lint:fix
npm run build
```

Expected: all succeed; `dist/` contains `index.html` and hashed assets. Then verify the built app serves:

```bash
npm run preview -- --port 4173 &
PREVIEW_PID=$!
sleep 2
curl -s http://localhost:4173/ | grep -q '<div id="root">' && echo PREVIEW_OK
kill $PREVIEW_PID
```

Expected: `PREVIEW_OK`.

- [ ] **Step 13: Commit**

```bash
git add -A
git commit -m "chore: scaffold Vite + React 19 + TS7 template (Biome, lefthook, Tailwind v4)"
```

---

### Task 2: Zod-validated env config

**Files:**
- Create: `src/config/env.ts`, `src/config/index.ts`, `vitest.config.ts`, `src/config/env.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `parseEnv(raw: Record<string, unknown>): Config` (exported for tests) and `config: Config` — frozen object with `VITE_APP_NAME: string`, `VITE_API_BASE_URL: string`, `VITE_USE_MSW: boolean`. Every later task imports `config` from `@/config` and NEVER touches `import.meta.env`.

- [ ] **Step 1: Write `vitest.config.ts`** (needed to run any test; MSW setup file is added in Task 5)

```ts
import { fileURLToPath } from 'node:url';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.test.{ts,tsx}'],
    // Node's fetch (used by Vitest even under jsdom) rejects relative URLs, so
    // tests need an absolute API base. MSW handlers use `*/api/...` wildcards
    // so they match both this absolute base and the browser's relative `/api`.
    env: {
      VITE_API_BASE_URL: 'http://localhost/api',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.test.*', 'src/**/*.types.ts', 'src/**/*.d.ts', 'src/mocks/**', 'src/test/**'],
    },
  },
});
```

- [ ] **Step 2: Write the failing test** — `src/config/env.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { parseEnv } from './env';

describe('parseEnv', () => {
  it('applies defaults when optional vars are missing', () => {
    const config = parseEnv({});
    expect(config.VITE_APP_NAME).toBe('template-webapp-react-ts7');
    expect(config.VITE_API_BASE_URL).toBe('/api');
    expect(config.VITE_USE_MSW).toBe(false);
  });

  it('coerces boolean strings', () => {
    const config = parseEnv({ VITE_USE_MSW: 'true' });
    expect(config.VITE_USE_MSW).toBe(true);
  });

  it('rejects invalid values with a readable error', () => {
    expect(() => parseEnv({ VITE_USE_MSW: 'yes' })).toThrow(/VITE_USE_MSW/);
  });

  it('returns a frozen object', () => {
    expect(Object.isFrozen(parseEnv({}))).toBe(true);
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/config/env.test.ts`
Expected: FAIL — cannot resolve `./env`.

- [ ] **Step 4: Write `src/config/env.ts`**

```ts
import { z } from 'zod';

const booleanString = z.enum(['true', 'false']).transform((value) => value === 'true');

/**
 * Single source of truth for every environment variable the app consumes.
 * Vite loads `.env` / `.env.<mode>` natively (no dotenv) and exposes VITE_*
 * vars on import.meta.env; this module is the ONLY place that reads them.
 */
const envSchema = z.object({
  VITE_APP_NAME: z.string().min(1).default('template-webapp-react-ts7'),
  VITE_API_BASE_URL: z.string().min(1).default('/api'),
  VITE_USE_MSW: booleanString.default(false),
});

/** Exported for unit tests; app code uses the `config` singleton below. */
export function parseEnv(raw: Record<string, unknown>) {
  const parsed = envSchema.safeParse(raw);

  if (!parsed.success) {
    // Fail fast with a readable report instead of crashing deep inside the app.
    const issues = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');
    throw new Error(`Invalid environment configuration:\n${issues}`);
  }

  return Object.freeze(parsed.data);
}

/** Validated, typed, immutable configuration. The only place env is read. */
export const config = parseEnv(import.meta.env);

export type Config = typeof config;
```

`src/config/index.ts`:

```ts
export { config, parseEnv, type Config } from './env';
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/config/env.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 6: Verify and commit**

```bash
npm run typecheck && npm run lint:fix && npm test
git add -A
git commit -m "feat: add Zod-validated typed env config (Vite-native loading)"
```

---

### Task 3: JWT utility (decode + expiry check)

**Files:**
- Create: `src/utils/jwt.util.ts`, `src/utils/jwt.util.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `decodeJwtPayload(token: string): JwtPayload | null` and `isTokenExpired(token: string, skewSeconds?: number): boolean` (default skew 30s). `JwtPayload` = `{ sub?: string; exp?: number; [claim: string]: unknown }`. Used by the HTTP client (Task 6) and MSW handlers (Task 5).

- [ ] **Step 1: Write the failing test** — `src/utils/jwt.util.test.ts`

```ts
import { describe, expect, it } from 'vitest';
import { decodeJwtPayload, isTokenExpired } from './jwt.util';

/** Builds an unsigned JWT-shaped token, mirroring what the MSW handlers issue. */
function makeToken(payload: Record<string, unknown>): string {
  const encode = (value: object) =>
    btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');
  return `${encode({ alg: 'none', typ: 'JWT' })}.${encode(payload)}.mock-signature`;
}

const nowSeconds = () => Math.floor(Date.now() / 1000);

describe('decodeJwtPayload', () => {
  it('decodes the payload segment', () => {
    const token = makeToken({ sub: 'u_1', exp: 1234 });
    expect(decodeJwtPayload(token)).toEqual({ sub: 'u_1', exp: 1234 });
  });

  it('returns null for malformed tokens', () => {
    expect(decodeJwtPayload('not-a-jwt')).toBeNull();
    expect(decodeJwtPayload('a.b')).toBeNull();
    expect(decodeJwtPayload('a.%%%.c')).toBeNull();
  });
});

describe('isTokenExpired', () => {
  it('is false for a token expiring well in the future', () => {
    expect(isTokenExpired(makeToken({ exp: nowSeconds() + 3600 }))).toBe(false);
  });

  it('is true for an expired token', () => {
    expect(isTokenExpired(makeToken({ exp: nowSeconds() - 60 }))).toBe(true);
  });

  it('treats tokens inside the clock-skew window as expired', () => {
    expect(isTokenExpired(makeToken({ exp: nowSeconds() + 10 }), 30)).toBe(true);
  });

  it('treats tokens without exp as expired', () => {
    expect(isTokenExpired(makeToken({ sub: 'u_1' }))).toBe(true);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/jwt.util.test.ts`
Expected: FAIL — cannot resolve `./jwt.util`.

- [ ] **Step 3: Write `src/utils/jwt.util.ts`**

```ts
export interface JwtPayload {
  sub?: string;
  exp?: number;
  [claim: string]: unknown;
}

/**
 * Decodes a JWT payload WITHOUT verifying the signature — signature
 * verification belongs to the server. The client only needs claims (exp)
 * to decide when to refresh proactively.
 */
export function decodeJwtPayload(token: string): JwtPayload | null {
  const segments = token.split('.');
  const payloadSegment = segments[1];
  if (segments.length !== 3 || payloadSegment === undefined) {
    return null;
  }

  try {
    const base64 = payloadSegment.replaceAll('-', '+').replaceAll('_', '/');
    const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), '=');
    return JSON.parse(atob(padded)) as JwtPayload;
  } catch {
    return null;
  }
}

/** A token without a readable exp claim is treated as expired (fail closed). */
export function isTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) {
    return true;
  }
  return payload.exp <= Math.floor(Date.now() / 1000) + skewSeconds;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/jwt.util.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 5: Commit**

```bash
npm run typecheck && npm run lint:fix
git add -A
git commit -m "feat: add JWT decode and expiry utilities"
```

---

### Task 4: Token storage (in-memory access token, persisted refresh token)

**Files:**
- Create: `src/utils/token-storage.util.ts`, `src/utils/token-storage.util.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: `tokenStorage` object: `getAccessToken(): string | null`, `getRefreshToken(): string | null`, `setTokens(accessToken: string, refreshToken: string): void`, `clear(): void`. Used by the HTTP client (Task 6) and auth store (Task 7).

- [ ] **Step 1: Write the failing test** — `src/utils/token-storage.util.test.ts`

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { tokenStorage } from './token-storage.util';

describe('tokenStorage', () => {
  beforeEach(() => {
    tokenStorage.clear();
  });

  it('starts empty', () => {
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('stores and returns both tokens', () => {
    tokenStorage.setTokens('access-1', 'refresh-1');
    expect(tokenStorage.getAccessToken()).toBe('access-1');
    expect(tokenStorage.getRefreshToken()).toBe('refresh-1');
  });

  it('persists only the refresh token to localStorage', () => {
    tokenStorage.setTokens('access-1', 'refresh-1');
    const stored = Object.values({ ...localStorage });
    expect(stored).toContain('refresh-1');
    expect(stored).not.toContain('access-1');
  });

  it('clear removes everything', () => {
    tokenStorage.setTokens('access-1', 'refresh-1');
    tokenStorage.clear();
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
    expect(localStorage.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/utils/token-storage.util.test.ts`
Expected: FAIL — cannot resolve `./token-storage.util`.

- [ ] **Step 3: Write `src/utils/token-storage.util.ts`**

```ts
const REFRESH_TOKEN_KEY = 'template-webapp-react-ts7.refreshToken';

/**
 * Access token lives ONLY in memory — it is short-lived and re-obtainable, so
 * it never touches persistent storage (XSS payloads cannot read a closure).
 * The refresh token is persisted so sessions survive a page reload.
 *
 * NOTE: localStorage is the pragmatic default for a template that must work
 * against a mock API. In production, prefer an httpOnly+Secure cookie set by
 * the backend for the refresh token and delete this persistence.
 */
let accessToken: string | null = null;

export const tokenStorage = {
  getAccessToken(): string | null {
    return accessToken;
  },

  getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(nextAccessToken: string, nextRefreshToken: string): void {
    accessToken = nextAccessToken;
    localStorage.setItem(REFRESH_TOKEN_KEY, nextRefreshToken);
  },

  clear(): void {
    accessToken = null;
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/utils/token-storage.util.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
npm run typecheck && npm run lint:fix
git add -A
git commit -m "feat: add token storage (in-memory access, persisted refresh)"
```

---

### Task 5: Auth types + MSW mock API (handlers, node server, browser worker, test wiring)

**Files:**
- Create: `src/types/auth.types.ts`, `src/mocks/handlers.ts`, `src/mocks/handlers.test.ts`, `src/mocks/server.ts`, `src/mocks/browser.ts`, `src/test/setup.ts`, `public/mockServiceWorker.js` (generated)
- Modify: `vitest.config.ts` (add `setupFiles`), `package.json` (msw worker directory, added by the msw CLI)

**Interfaces:**
- Consumes: `isTokenExpired` from Task 3.
- Produces:
  - Types: `User { id: string; email: string; name: string }`, `LoginRequest { email: string; password: string }`, `AuthTokens { accessToken: string; refreshToken: string }`, `LoginResponse = AuthTokens & { user: User }`.
  - `makeFakeJwt(subject: string, expiresInSeconds: number): string` and constants `DEMO_USER: User`, `DEMO_PASSWORD = 'password123'` from `@/mocks/handlers`.
  - `server` (msw/node `SetupServer`) from `@/mocks/server`; `worker` from `@/mocks/browser`.
  - Mocked endpoints (all under `*/api`): `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`, `GET /auth/me`.
  - Test setup: MSW server lifecycle + storage cleanup runs around every test from now on.

- [ ] **Step 1: Write `src/types/auth.types.ts`**

```ts
export interface User {
  id: string;
  email: string;
  name: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export type LoginResponse = AuthTokens & { user: User };
```

- [ ] **Step 2: Write the failing test** — the handlers are exercised through `msw/node` directly. Create `src/mocks/handlers.test.ts`:

```ts
import { describe, expect, it } from 'vitest';
import { DEMO_PASSWORD, DEMO_USER, makeFakeJwt } from './handlers';
import { server } from './server';
import { decodeJwtPayload } from '@/utils/jwt.util';

const API = 'http://localhost/api';

describe('auth mock handlers', () => {
  it('login returns user + token pair for valid credentials', async () => {
    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DEMO_USER.email, password: DEMO_PASSWORD }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.user).toEqual(DEMO_USER);
    expect(decodeJwtPayload(body.accessToken)?.sub).toBe(DEMO_USER.id);
    expect(decodeJwtPayload(body.refreshToken)?.exp).toBeGreaterThan(Date.now() / 1000);
  });

  it('login rejects bad credentials with 401', async () => {
    const response = await fetch(`${API}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: DEMO_USER.email, password: 'wrong' }),
    });
    expect(response.status).toBe(401);
  });

  it('refresh rotates the token pair for a valid refresh token', async () => {
    const response = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: makeFakeJwt(DEMO_USER.id, 3600) }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.accessToken).toBeTruthy();
    expect(body.refreshToken).toBeTruthy();
  });

  it('refresh rejects an expired refresh token with 401', async () => {
    const response = await fetch(`${API}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: makeFakeJwt(DEMO_USER.id, -60) }),
    });
    expect(response.status).toBe(401);
  });

  it('me returns the user for a valid bearer token and 401 otherwise', async () => {
    const ok = await fetch(`${API}/auth/me`, {
      headers: { Authorization: `Bearer ${makeFakeJwt(DEMO_USER.id, 3600)}` },
    });
    expect(ok.status).toBe(200);
    expect(await ok.json()).toEqual(DEMO_USER);

    const unauthorized = await fetch(`${API}/auth/me`);
    expect(unauthorized.status).toBe(401);
  });

  it('server is importable (lifecycle handled by test setup)', () => {
    expect(server).toBeDefined();
  });
});
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npx vitest run src/mocks/handlers.test.ts`
Expected: FAIL — cannot resolve `./handlers`.

- [ ] **Step 4: Write `src/mocks/handlers.ts`**

```ts
import { HttpResponse, http } from 'msw';
import { isTokenExpired } from '@/utils/jwt.util';
import type { LoginRequest, LoginResponse, User } from '@/types/auth.types';

export const DEMO_USER: User = { id: 'u_1', email: 'demo@example.com', name: 'Demo User' };
export const DEMO_PASSWORD = 'password123';

const ACCESS_TOKEN_TTL_SECONDS = 15 * 60;
const REFRESH_TOKEN_TTL_SECONDS = 7 * 24 * 60 * 60;

const encodeSegment = (value: object): string =>
  btoa(JSON.stringify(value)).replaceAll('+', '-').replaceAll('/', '_').replace(/=+$/, '');

/**
 * Issues an UNSIGNED JWT-shaped token with a real exp claim, so client-side
 * expiry logic behaves exactly as with real tokens. Never use outside mocks.
 */
export function makeFakeJwt(subject: string, expiresInSeconds: number): string {
  const header = encodeSegment({ alg: 'none', typ: 'JWT' });
  const payload = encodeSegment({
    sub: subject,
    exp: Math.floor(Date.now() / 1000) + expiresInSeconds,
  });
  return `${header}.${payload}.mock-signature`;
}

function issueTokenPair(): { accessToken: string; refreshToken: string } {
  return {
    accessToken: makeFakeJwt(DEMO_USER.id, ACCESS_TOKEN_TTL_SECONDS),
    refreshToken: makeFakeJwt(DEMO_USER.id, REFRESH_TOKEN_TTL_SECONDS),
  };
}

// Paths use a leading wildcard so they match the browser's same-origin `/api/...`
// AND the absolute `http://localhost/api/...` base used in unit tests.
export const handlers = [
  http.post('*/api/auth/login', async ({ request }) => {
    const body = (await request.json()) as LoginRequest;
    if (body.email !== DEMO_USER.email || body.password !== DEMO_PASSWORD) {
      return HttpResponse.json({ message: 'Invalid credentials' }, { status: 401 });
    }
    const response: LoginResponse = { user: DEMO_USER, ...issueTokenPair() };
    return HttpResponse.json(response);
  }),

  http.post('*/api/auth/refresh', async ({ request }) => {
    const body = (await request.json()) as { refreshToken?: string };
    if (!body.refreshToken || isTokenExpired(body.refreshToken, 0)) {
      return HttpResponse.json({ message: 'Invalid refresh token' }, { status: 401 });
    }
    // Token rotation: every refresh returns a brand-new pair.
    return HttpResponse.json(issueTokenPair());
  }),

  http.post('*/api/auth/logout', () => new HttpResponse(null, { status: 204 })),

  http.get('*/api/auth/me', ({ request }) => {
    const bearer = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!bearer || isTokenExpired(bearer, 0)) {
      return HttpResponse.json({ message: 'Unauthorized' }, { status: 401 });
    }
    return HttpResponse.json(DEMO_USER);
  }),
];
```

- [ ] **Step 5: Write `src/mocks/server.ts` and `src/mocks/browser.ts`**

`src/mocks/server.ts` (Node — used by Vitest):

```ts
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
```

`src/mocks/browser.ts` (browser — used by `main.tsx` in dev):

```ts
import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

export const worker = setupWorker(...handlers);
```

- [ ] **Step 6: Write `src/test/setup.ts` and register it**

```ts
import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/mocks/server';
import { tokenStorage } from '@/utils/token-storage.util';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
  server.resetHandlers();
  tokenStorage.clear();
  localStorage.clear();
});

afterAll(() => server.close());
```

In `vitest.config.ts`, add to the `test` object:

```ts
    setupFiles: ['src/test/setup.ts'],
```

- [ ] **Step 7: Generate the browser service worker**

```bash
npx msw init public/ --save
```

Expected: creates `public/mockServiceWorker.js` and adds `"msw": { "workerDirectory": ["public"] }` to package.json. Commit the worker file — the template must work out of the box.

- [ ] **Step 8: Run test to verify it passes**

Run: `npx vitest run src/mocks/handlers.test.ts`
Expected: PASS (6 tests).

- [ ] **Step 9: Commit**

```bash
npm run typecheck && npm run lint:fix && npm test
git add -A
git commit -m "feat: add auth types and MSW mock auth API (login/refresh/logout/me)"
```

---

### Task 6: HTTP client with single-flight refresh + typed auth API

**Files:**
- Create: `src/api/http.client.ts`, `src/api/auth.api.ts`, `src/api/http.client.test.ts`

**Interfaces:**
- Consumes: `config` (Task 2), `tokenStorage` (Task 4), `isTokenExpired` (Task 3), MSW test wiring (Task 5).
- Produces:
  - `class HttpError extends Error { readonly status: number; readonly body: unknown }`
  - `httpRequest<T>(path: string, options?: RequestOptions): Promise<T>` where `RequestOptions = Omit<RequestInit, 'body'> & { body?: unknown; skipAuth?: boolean }`
  - `authApi = { login(credentials: LoginRequest): Promise<LoginResponse>, logout(): Promise<void>, me(): Promise<User> }`
  - Used by the auth store (Task 7).

- [ ] **Step 1: Write the failing test** — `src/api/http.client.test.ts`

```ts
import { HttpResponse, http } from 'msw';
import { describe, expect, it } from 'vitest';
import { HttpError, httpRequest } from './http.client';
import { DEMO_USER, makeFakeJwt } from '@/mocks/handlers';
import { server } from '@/mocks/server';
import { tokenStorage } from '@/utils/token-storage.util';
import type { User } from '@/types/auth.types';

describe('httpRequest', () => {
  it('attaches the bearer token to authenticated requests', async () => {
    let seenAuthorization: string | null = null;
    server.use(
      http.get('*/api/echo', ({ request }) => {
        seenAuthorization = request.headers.get('Authorization');
        return HttpResponse.json({ ok: true });
      }),
    );

    tokenStorage.setTokens('my-access-token', 'my-refresh-token');
    await httpRequest<{ ok: boolean }>('/echo');
    expect(seenAuthorization).toBe('Bearer my-access-token');
  });

  it('refreshes once on 401 and retries the original request', async () => {
    // Expired access token + valid refresh token: /auth/me 401s, the client
    // hits /auth/refresh, stores the rotated pair, retries, and succeeds.
    tokenStorage.setTokens(makeFakeJwt(DEMO_USER.id, -60), makeFakeJwt(DEMO_USER.id, 3600));

    const user = await httpRequest<User>('/auth/me');

    expect(user).toEqual(DEMO_USER);
    expect(tokenStorage.getAccessToken()).not.toBe(null);
    expect(tokenStorage.getAccessToken()).not.toContain(makeFakeJwt(DEMO_USER.id, -60));
  });

  it('clears tokens and throws HttpError when refresh fails', async () => {
    tokenStorage.setTokens(makeFakeJwt(DEMO_USER.id, -60), makeFakeJwt(DEMO_USER.id, -60));

    await expect(httpRequest<User>('/auth/me')).rejects.toBeInstanceOf(HttpError);
    expect(tokenStorage.getAccessToken()).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('throws HttpError with status and body for non-401 failures', async () => {
    server.use(http.get('*/api/broken', () => HttpResponse.json({ message: 'boom' }, { status: 500 })));

    const failure = await httpRequest('/broken').catch((error: unknown) => error);

    expect(failure).toBeInstanceOf(HttpError);
    expect((failure as HttpError).status).toBe(500);
    expect((failure as HttpError).body).toEqual({ message: 'boom' });
  });

  it('skipAuth requests never trigger a refresh', async () => {
    let refreshCalls = 0;
    server.use(
      http.post('*/api/auth/refresh', () => {
        refreshCalls += 1;
        return HttpResponse.json({ message: 'nope' }, { status: 401 });
      }),
      http.get('*/api/public', () => HttpResponse.json({ message: 'unauthorized' }, { status: 401 })),
    );

    await expect(httpRequest('/public', { skipAuth: true })).rejects.toBeInstanceOf(HttpError);
    expect(refreshCalls).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/api/http.client.test.ts`
Expected: FAIL — cannot resolve `./http.client`.

- [ ] **Step 3: Write `src/api/http.client.ts`**

```ts
import { config } from '@/config';
import { isTokenExpired } from '@/utils/jwt.util';
import { tokenStorage } from '@/utils/token-storage.util';
import type { AuthTokens } from '@/types/auth.types';

export class HttpError extends Error {
  constructor(
    readonly status: number,
    readonly body: unknown,
  ) {
    super(`HTTP ${status}`);
    this.name = 'HttpError';
  }
}

export type RequestOptions = Omit<RequestInit, 'body'> & {
  body?: unknown;
  /** Skip the Authorization header AND the 401→refresh→retry flow (login, refresh). */
  skipAuth?: boolean;
};

// Single-flight: concurrent 401s share one refresh request instead of racing.
let refreshPromise: Promise<boolean> | null = null;

async function refreshTokens(): Promise<boolean> {
  const refreshToken = tokenStorage.getRefreshToken();
  if (!refreshToken || isTokenExpired(refreshToken)) {
    return false;
  }

  const response = await fetch(`${config.VITE_API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!response.ok) {
    return false;
  }

  const tokens = (await response.json()) as AuthTokens;
  tokenStorage.setTokens(tokens.accessToken, tokens.refreshToken);
  return true;
}

export async function httpRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, skipAuth = false, ...init } = options;

  const execute = async (): Promise<Response> => {
    const headers = new Headers(init.headers);
    headers.set('Content-Type', 'application/json');
    if (!skipAuth) {
      const accessToken = tokenStorage.getAccessToken();
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }
    return fetch(`${config.VITE_API_BASE_URL}${path}`, {
      ...init,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  };

  let response = await execute();

  if (response.status === 401 && !skipAuth) {
    refreshPromise ??= refreshTokens().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;

    if (!refreshed) {
      tokenStorage.clear();
      throw new HttpError(401, { message: 'Session expired' });
    }
    response = await execute();
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => null);
    throw new HttpError(response.status, errorBody);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}
```

- [ ] **Step 4: Write `src/api/auth.api.ts`**

```ts
import { httpRequest } from './http.client';
import type { LoginRequest, LoginResponse, User } from '@/types/auth.types';

export const authApi = {
  /** skipAuth: a login must never trigger the refresh flow. */
  login: (credentials: LoginRequest) =>
    httpRequest<LoginResponse>('/auth/login', { method: 'POST', body: credentials, skipAuth: true }),

  logout: () => httpRequest<void>('/auth/logout', { method: 'POST' }),

  /** Session bootstrap rides on the client's 401→refresh→retry: calling me()
   *  with only a stored refresh token transparently re-authenticates. */
  me: () => httpRequest<User>('/auth/me'),
};
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npx vitest run src/api/http.client.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 6: Commit**

```bash
npm run typecheck && npm run lint:fix && npm test
git add -A
git commit -m "feat: add fetch HTTP client with single-flight token refresh + auth API"
```

---

### Task 7: Auth store (Zustand)

**Files:**
- Create: `src/stores/auth.store.ts`, `src/stores/auth.store.test.ts`

**Interfaces:**
- Consumes: `authApi`, `HttpError` (Task 6), `tokenStorage` (Task 4), `makeFakeJwt`/`DEMO_*` (Task 5, tests only).
- Produces: `useAuthStore` (Zustand hook). State: `user: User | null`, `status: 'idle' | 'loading' | 'authenticated' | 'unauthenticated'`, `error: string | null`. Actions: `login(email: string, password: string): Promise<void>`, `logout(): Promise<void>`, `bootstrap(): Promise<void>`. Used by pages and the route guard (Task 8) and app entry (Task 9).

- [ ] **Step 1: Write the failing test** — `src/stores/auth.store.test.ts`

```ts
import { beforeEach, describe, expect, it } from 'vitest';
import { useAuthStore } from './auth.store';
import { DEMO_PASSWORD, DEMO_USER, makeFakeJwt } from '@/mocks/handlers';
import { tokenStorage } from '@/utils/token-storage.util';

describe('useAuthStore', () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState(), true);
  });

  it('login stores the user and tokens on success', async () => {
    await useAuthStore.getState().login(DEMO_USER.email, DEMO_PASSWORD);

    const { user, status, error } = useAuthStore.getState();
    expect(status).toBe('authenticated');
    expect(user).toEqual(DEMO_USER);
    expect(error).toBeNull();
    expect(tokenStorage.getAccessToken()).not.toBeNull();
    expect(tokenStorage.getRefreshToken()).not.toBeNull();
  });

  it('login surfaces a friendly error for invalid credentials', async () => {
    await useAuthStore.getState().login(DEMO_USER.email, 'wrong-password');

    const { user, status, error } = useAuthStore.getState();
    expect(status).toBe('unauthenticated');
    expect(user).toBeNull();
    expect(error).toBe('Invalid email or password');
    expect(tokenStorage.getAccessToken()).toBeNull();
  });

  it('logout clears the session even if the API call fails', async () => {
    await useAuthStore.getState().login(DEMO_USER.email, DEMO_PASSWORD);
    await useAuthStore.getState().logout();

    expect(useAuthStore.getState().status).toBe('unauthenticated');
    expect(useAuthStore.getState().user).toBeNull();
    expect(tokenStorage.getRefreshToken()).toBeNull();
  });

  it('bootstrap restores the session from a stored refresh token', async () => {
    tokenStorage.setTokens(makeFakeJwt(DEMO_USER.id, -60), makeFakeJwt(DEMO_USER.id, 3600));

    await useAuthStore.getState().bootstrap();

    expect(useAuthStore.getState().status).toBe('authenticated');
    expect(useAuthStore.getState().user).toEqual(DEMO_USER);
  });

  it('bootstrap resolves to unauthenticated when no refresh token exists', async () => {
    await useAuthStore.getState().bootstrap();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/stores/auth.store.test.ts`
Expected: FAIL — cannot resolve `./auth.store`.

- [ ] **Step 3: Write `src/stores/auth.store.ts`**

```ts
import { create } from 'zustand';
import { authApi } from '@/api/auth.api';
import { HttpError } from '@/api/http.client';
import { tokenStorage } from '@/utils/token-storage.util';
import type { User } from '@/types/auth.types';

type AuthStatus = 'idle' | 'loading' | 'authenticated' | 'unauthenticated';

interface AuthState {
  user: User | null;
  status: AuthStatus;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  /** Restore a session after a page reload using the persisted refresh token. */
  bootstrap: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  status: 'idle',
  error: null,

  async login(email, password) {
    set({ status: 'loading', error: null });
    try {
      const { user, accessToken, refreshToken } = await authApi.login({ email, password });
      tokenStorage.setTokens(accessToken, refreshToken);
      set({ user, status: 'authenticated' });
    } catch (error) {
      const message =
        error instanceof HttpError && error.status === 401
          ? 'Invalid email or password'
          : 'Login failed. Please try again.';
      set({ user: null, status: 'unauthenticated', error: message });
    }
  },

  async logout() {
    try {
      await authApi.logout();
    } catch {
      // Best effort — the client-side session is cleared regardless.
    }
    tokenStorage.clear();
    set({ user: null, status: 'unauthenticated', error: null });
  },

  async bootstrap() {
    if (!tokenStorage.getRefreshToken()) {
      set({ status: 'unauthenticated' });
      return;
    }
    set({ status: 'loading' });
    try {
      // me() 401s on the stale access token; the HTTP client refreshes and retries.
      const user = await authApi.me();
      set({ user, status: 'authenticated' });
    } catch {
      tokenStorage.clear();
      set({ user: null, status: 'unauthenticated' });
    }
  },
}));
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npx vitest run src/stores/auth.store.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
npm run typecheck && npm run lint:fix && npm test
git add -A
git commit -m "feat: add Zustand auth store (login, logout, session bootstrap)"
```

---

### Task 8: Router, route guard, and pages

**Files:**
- Create: `src/components/require-auth.component.tsx`, `src/components/require-auth.component.test.tsx`, `src/pages/home.page.tsx`, `src/pages/login.page.tsx`, `src/pages/login.page.test.tsx`, `src/pages/dashboard.page.tsx`, `src/pages/not-found.page.tsx`
- Modify: `src/app.tsx` (replace placeholder with router)

**Interfaces:**
- Consumes: `useAuthStore` (Task 7), `config` (Task 2), `logo.svg` (Task 1), `DEMO_*` (Task 5, tests only).
- Produces: `App` component (BrowserRouter + Routes), `RequireAuth` (renders `<Outlet />` when authenticated, redirects to `/login` otherwise), pages `HomePage`, `LoginPage`, `DashboardPage`, `NotFoundPage`. Routes: `/` public, `/login` public, `/dashboard` protected, `*` → NotFound.

- [ ] **Step 1: Write the failing guard test** — `src/components/require-auth.component.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { RequireAuth } from './require-auth.component';
import { DEMO_USER } from '@/mocks/handlers';
import { useAuthStore } from '@/stores/auth.store';

function renderDashboardRoute() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <Routes>
        <Route path="/login" element={<p>Login page</p>} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<p>Secret dashboard</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('RequireAuth', () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState(), true);
  });

  it('redirects unauthenticated users to /login', () => {
    useAuthStore.setState({ status: 'unauthenticated' });
    renderDashboardRoute();
    expect(screen.getByText('Login page')).toBeInTheDocument();
    expect(screen.queryByText('Secret dashboard')).not.toBeInTheDocument();
  });

  it('shows a loading state while the session bootstraps', () => {
    useAuthStore.setState({ status: 'loading' });
    renderDashboardRoute();
    expect(screen.getByText(/loading session/i)).toBeInTheDocument();
  });

  it('renders the protected route when authenticated', () => {
    useAuthStore.setState({ status: 'authenticated', user: DEMO_USER });
    renderDashboardRoute();
    expect(screen.getByText('Secret dashboard')).toBeInTheDocument();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npx vitest run src/components/require-auth.component.test.tsx`
Expected: FAIL — cannot resolve `./require-auth.component`.

- [ ] **Step 3: Write `src/components/require-auth.component.tsx`**

```tsx
import { Navigate, Outlet, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';

/** Route-group guard: wrap protected <Route>s so children render via <Outlet />. */
export function RequireAuth() {
  const status = useAuthStore((state) => state.status);
  const location = useLocation();

  if (status === 'idle' || status === 'loading') {
    return <p className="p-8 text-slate-500">Loading session…</p>;
  }

  if (status !== 'authenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
```

- [ ] **Step 4: Run guard test to verify it passes**

Run: `npx vitest run src/components/require-auth.component.test.tsx`
Expected: PASS (3 tests).

- [ ] **Step 5: Write the failing login page test** — `src/pages/login.page.test.tsx`

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeEach, describe, expect, it } from 'vitest';
import { LoginPage } from './login.page';
import { DEMO_PASSWORD, DEMO_USER } from '@/mocks/handlers';
import { useAuthStore } from '@/stores/auth.store';

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/dashboard" element={<p>Dashboard destination</p>} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('LoginPage', () => {
  beforeEach(() => {
    useAuthStore.setState(useAuthStore.getInitialState(), true);
  });

  it('logs in with valid credentials and navigates to the dashboard', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.clear(screen.getByLabelText(/email/i));
    await user.type(screen.getByLabelText(/email/i), DEMO_USER.email);
    await user.type(screen.getByLabelText(/password/i), DEMO_PASSWORD);
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Dashboard destination')).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe('authenticated');
  });

  it('shows the store error for invalid credentials', async () => {
    const user = userEvent.setup();
    renderLogin();

    await user.type(screen.getByLabelText(/password/i), 'wrong-password');
    await user.click(screen.getByRole('button', { name: /sign in/i }));

    expect(await screen.findByText('Invalid email or password')).toBeInTheDocument();
    expect(useAuthStore.getState().status).toBe('unauthenticated');
  });
});
```

- [ ] **Step 6: Run test to verify it fails**

Run: `npx vitest run src/pages/login.page.test.tsx`
Expected: FAIL — cannot resolve `./login.page`.

- [ ] **Step 7: Write the pages**

`src/pages/login.page.tsx`:

```tsx
import { useState } from 'react';
import type { FormEvent } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';

// Literal (not imported from @/mocks) so production bundles never pull in MSW.
const DEMO_EMAIL = 'demo@example.com';

export function LoginPage() {
  const login = useAuthStore((state) => state.login);
  const status = useAuthStore((state) => state.status);
  const error = useAuthStore((state) => state.error);
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState(DEMO_EMAIL);
  const [password, setPassword] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await login(email, password);
    if (useAuthStore.getState().status === 'authenticated') {
      const from = (location.state as { from?: string } | null)?.from ?? '/dashboard';
      navigate(from, { replace: true });
    }
  }

  return (
    <main className="mx-auto mt-16 max-w-sm rounded-xl border border-slate-200 p-8 shadow-sm">
      <h1 className="mb-6 text-2xl font-bold">Sign in</h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium">
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </label>
        <label className="flex flex-col gap-1 text-sm font-medium">
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2"
            required
          />
        </label>
        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        <button
          type="submit"
          disabled={status === 'loading'}
          className="rounded-md bg-indigo-600 px-4 py-2 font-semibold text-white disabled:opacity-50"
        >
          {status === 'loading' ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
      <p className="mt-4 text-xs text-slate-500">
        Demo credentials: {DEMO_EMAIL} / password123 (served by MSW in dev)
      </p>
    </main>
  );
}
```

`src/pages/home.page.tsx`:

```tsx
import { Link } from 'react-router';
import logoUrl from '@/assets/logo.svg';
import { config } from '@/config';

export function HomePage() {
  return (
    <main className="mx-auto mt-16 max-w-xl p-8 text-center">
      <img src={logoUrl} alt="Logo" className="mx-auto mb-6 h-16 w-16" />
      <h1 className="mb-2 text-3xl font-bold">{config.VITE_APP_NAME}</h1>
      <p className="mb-8 text-slate-600">
        React 19 + TS7 + Vite template with JWT auth, routing, and state management.
      </p>
      <Link to="/dashboard" className="font-semibold text-indigo-600 underline">
        Go to dashboard (protected)
      </Link>
    </main>
  );
}
```

`src/pages/dashboard.page.tsx`:

```tsx
import { useNavigate } from 'react-router';
import { useAuthStore } from '@/stores/auth.store';

export function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    navigate('/login', { replace: true });
  }

  return (
    <main className="mx-auto mt-16 max-w-xl p-8">
      <h1 className="mb-4 text-2xl font-bold">Dashboard</h1>
      <p className="mb-6 text-slate-600">
        Signed in as <strong>{user?.name}</strong> ({user?.email})
      </p>
      <button
        type="button"
        onClick={handleLogout}
        className="rounded-md bg-slate-800 px-4 py-2 font-semibold text-white"
      >
        Sign out
      </button>
    </main>
  );
}
```

`src/pages/not-found.page.tsx`:

```tsx
import { Link } from 'react-router';

export function NotFoundPage() {
  return (
    <main className="mx-auto mt-16 max-w-xl p-8 text-center">
      <h1 className="mb-2 text-3xl font-bold">404</h1>
      <p className="mb-6 text-slate-600">This page does not exist.</p>
      <Link to="/" className="font-semibold text-indigo-600 underline">
        Back home
      </Link>
    </main>
  );
}
```

- [ ] **Step 8: Replace `src/app.tsx` with the router**

```tsx
import { BrowserRouter, Route, Routes } from 'react-router';
import { RequireAuth } from '@/components/require-auth.component';
import { DashboardPage } from '@/pages/dashboard.page';
import { HomePage } from '@/pages/home.page';
import { LoginPage } from '@/pages/login.page';
import { NotFoundPage } from '@/pages/not-found.page';

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/dashboard" element={<DashboardPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
```

- [ ] **Step 9: Run the full suite to verify everything passes**

Run: `npm test`
Expected: PASS — all test files (env, jwt, token-storage, handlers, http.client, auth.store, require-auth, login.page).

- [ ] **Step 10: Commit**

```bash
npm run typecheck && npm run lint:fix
git add -A
git commit -m "feat: add router, RequireAuth guard, and pages (home/login/dashboard/404)"
```

---

### Task 9: App entry wiring — MSW in dev + session bootstrap

**Files:**
- Modify: `src/main.tsx`

**Interfaces:**
- Consumes: `config` (Task 2), `worker` (Task 5), `useAuthStore` (Task 7), `App` (Task 8).
- Produces: the final entrypoint. Dev with `VITE_USE_MSW=true` → MSW worker starts before render; prod builds dead-code-eliminate the mock import (`import.meta.env.DEV` is statically false).

- [ ] **Step 1: Replace `src/main.tsx`**

```tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from '@/app';
import { config } from '@/config';
import { useAuthStore } from '@/stores/auth.store';
import '@/styles/index.css';

/**
 * Dev-only API mocking. `import.meta.env.DEV` is replaced at build time, so
 * production bundles drop this branch — and the dynamic import — entirely.
 */
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV || !config.VITE_USE_MSW) {
    return;
  }
  const { worker } = await import('@/mocks/browser');
  await worker.start({ onUnhandledRequest: 'bypass' });
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element #root not found');
}

enableMocking().then(() => {
  // Fire-and-forget: RequireAuth renders a loading state until this resolves.
  void useAuthStore.getState().bootstrap();

  createRoot(rootElement).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
```

- [ ] **Step 2: Verify the full pipeline**

```bash
npm run typecheck && npm run lint:fix && npm test && npm run build
```

Expected: all green. Confirm the production bundle excludes the mock API — grep for `mock-signature`, a string that exists ONLY in `src/mocks/handlers.ts` (grepping for "msw" would false-positive on the `VITE_USE_MSW` key baked into the bundle):

```bash
grep -rl "mock-signature" dist/assets/ || echo "MOCKS_NOT_IN_BUNDLE"
```

Expected: `MOCKS_NOT_IN_BUNDLE` (the `dist/mockServiceWorker.js` copied from `public/` is fine/expected; only `dist/assets/` matters). If this fails, some production module imports from `@/mocks/*` — only `src/main.tsx`'s guarded dynamic import and test files may do that.

- [ ] **Step 3: Manual smoke test (dev server)**

```bash
npm run dev
```

In a browser at the printed URL: Home renders with logo → "Go to dashboard" redirects to /login → sign in with `demo@example.com` / `password123` → Dashboard shows the user → reload the page → session survives (bootstrap via refresh token) → Sign out → /dashboard redirects to /login again. Stop the server.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "feat: wire app entry (MSW in dev, session bootstrap on load)"
```

---

### Task 10: README + final verification

**Files:**
- Create: `README.md`

**Interfaces:**
- Consumes: everything above.
- Produces: the template's front door, mirroring template-webserver-ts7's README style.

- [ ] **Step 1: Write `README.md`** with these sections (mirror the tone/format of template-webserver-ts7's README — tables for toolchain and scripts):

1. **Title + one-paragraph summary** — production-grade React 19 + TS7 webapp template: Vite, React Router v7, Zustand, JWT auth with refresh rotation, MSW mock API, Tailwind v4.
2. **Toolchain table** — tsgo (typecheck), Biome (lint+format), Vite (dev/build), Vitest + React Testing Library + MSW (tests), lefthook (hooks), Tailwind v4 (styling).
3. **Requirements** — Node >= 26 (`.nvmrc`, `nvm use`).
4. **Getting started** — `nvm use && npm install && cp .env.example .env.local && npm run dev`, demo credentials `demo@example.com` / `password123`.
5. **Scripts table** — all npm scripts with one-line descriptions.
6. **Environment configuration** — Vite-native `.env` / `.env.<mode>` loading (no dotenv); `src/config/env.ts` validates `import.meta.env` with Zod into a frozen typed `config`; nothing else reads `import.meta.env`; `vite build --mode staging` loads `.env.staging`; only `.env.example` is committed; VITE_* vars are public (never secrets); `DEV_PROXY` / `DEV_PROXY_TARGET` are dev-server-only.
7. **Project structure** — the `src/` tree with one-line comments per folder (config, api, stores, components, pages, mocks, types, utils, assets, test) plus `public/`.
8. **Auth flow** — diagram-in-words: login → tokens (access in memory, refresh in localStorage) → 401 → single-flight refresh + rotation → retry → refresh failure → logout redirect; bootstrap on reload; production note about httpOnly cookies.
9. **Mock API vs real backend** — MSW default (`VITE_USE_MSW=true`); flip to a real backend with `VITE_USE_MSW=false` + `DEV_PROXY=true` + `DEV_PROXY_TARGET=<backend url>`; endpoint contract table (`POST /api/auth/login|refresh|logout`, `GET /api/auth/me`) so the backend knows what to implement.
10. **`public/` vs `src/assets/`** — verbatim vs processed (hashed, image-optimized via vite-plugin-image-optimizer).
11. **File suffix convention** — `*.page.tsx`, `*.component.tsx`, `*.store.ts`, `*.api.ts`, `*.client.ts`, `*.util.ts`, `*.types.ts`, `*.test.ts(x)`.
12. **Code style consistency** — same three layers as the backend template (.vscode settings, extension recommendation, lefthook pre-commit + `lint:ci` backstop).

- [ ] **Step 2: Final full verification**

```bash
npm run typecheck && npm run lint:ci && npm test && npm run build
```

Expected: all pass with zero errors.

- [ ] **Step 3: Commit**

```bash
git add -A
git commit -m "docs: add README"
```
